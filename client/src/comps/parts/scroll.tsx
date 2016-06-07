/// <reference path="../../../typings/extern.d.ts"/>
import * as React from 'react'
import ProtoBufModel = Proto2TypeScript.ProtoBufModel;
import Q = require('q');
var Scroll = window.channer.parts.Scroll;
var Long = window.channer.ProtoBuf.Long;
var _L = window.channer.l10n.translate;

export interface ModelCollection {
    key: string;
    length(): number;
    get(index: number, fetchCB: (c: ModelCollection) => void): any;
    refresh(): void;
}
// ArrayModelCollection : constant scroll data model.
export class ArrayModelCollection implements ModelCollection {
    source: Array<any>;
    key: string;
    constructor(source: Array<any>, key: string) {
        this.source = source;
        this.key = key;
    }
    get(index: number, fetchCB: (c: ModelCollection) => void): any {
        return this.source[index];
    }
    length(): number {
        return this.source.length;
    }
    refresh = () => {}
}

//ProtoModelCollection : scroll which shows model data retrieved from server.
export interface ProtoModel extends ProtoBufModel {
    id: Long;
}
export interface Boundary {
    lessThan(c: Boundary): boolean;
    greaterThan(c: Boundary): boolean;
    isZero(): boolean;
}
export class ProtoModelChunk<T extends ProtoModel, B extends Boundary> {
    list: Array<T>;
    initialized: boolean;
    start_id: B;
    end_id: B;
    
    constructor() {
        this.list = [];
    }
    push = (coll: ProtoModelCollection<T, B>, model: T) => {
        this.list.push(model);
        coll.update_range(this, model);
    }
    pushList = (coll: ProtoModelCollection<T, B>, models: Array<T>) => {
        models.forEach((v: T) => {
            this.push(coll, v);
        });
        this.initialized = true;
    }
    update_range = (b: B) => {
        if (this.start_id == null || this.start_id.lessThan(b)) { /* this.start_id < b */
            this.start_id = b;
        }
        if (this.end_id == null || this.end_id.greaterThan(b)) { /* this.end_id > b */
            this.end_id = b;
        }
    }
}
export class ProtoModelCollection<T extends ProtoModel, B extends Boundary> implements ModelCollection {
    static FETCH_LIMIT = 20;
    key: string;
    n_models: number;
    finished: boolean;
    chunks: Array<ProtoModelChunk<T, B>>;
    defers: Array<Q.Deferred<ModelCollection>>;
    constructor() {
        //TODO: load from local store?
        this.chunks = [];
        this.defers = [];
        this.n_models = 0;
    }
    refresh = () => {
        this.chunks = [];
    }
    offset_for = (page: number): B => {
        if (page < 2) {
            return null;
        }
        else if (!this.chunks[page - 2]) {
            throw new Error("invalid state: chunk not exist for " + (page - 1));
        }
        else {
            var c = this.chunks[page - 2];
            if (c.end_id) {
                return c.end_id;
            }
            else {
                //still query ongoing
                return Long.UZERO;
            }
        }
    }
    get = (index: number, fetchCB: (c: ModelCollection) => void): T => {
        var page_index = Math.floor(index / ProtoModelCollection.FETCH_LIMIT);
        //console.log("get " + index + " " + page_index);
        var chunk = this.chunks[page_index];
        if (!chunk) {
            this.fetch(page_index + 1).then(fetchCB);
            return null;
        }
        var index_in_page = index % ProtoModelCollection.FETCH_LIMIT;
        return chunk.list[index_in_page];
    }
    length(): number {
        //console.log("length: n_models = " + this.n_models);
        return this.finished ? this.n_models : 10000;
    }
    fetch = (page: number): Q.Promise<ModelCollection> => {
		var df : Q.Deferred<ProtoModelCollection<T,B>> = Q.defer<ProtoModelCollection<T,B>>();
        //console.log("fetch for " + page);
        var chunk : ProtoModelChunk<T, B> = this.chunks[page - 1];
        if (!chunk || !chunk.initialized) {
            if (this.defers[page - 1]) {
                //console.log("fetch for " + page + " returns promiss");
                return this.defers[page - 1].promise;
            }
            chunk = new ProtoModelChunk<T, B>();
            this.chunks[page - 1] = chunk;
            this.defers[page - 1] = df;
            //console.error("client offset for " + page + " " +this.offset_for(page));
            var offset = this.offset_for(page), limit = ProtoModelCollection.FETCH_LIMIT;
            if (offset && offset.isZero()) {
                //console.error("query for previous page has not returned yet " + page);
                //query for previous page has not returned yet.
                //wait for previous query finished, then call fetch again.
                var p = this.defers[page - 2].promise;
                p.then((c: ModelCollection) => {
                    offset = this.offset_for(page);
                    //console.log("prev page fetched " + page + " " + offset);
                    this.fetchraw(page, offset, limit);
                }, (e: Error) => { df.reject(e); });
                return df.promise;
            }
            this.fetchraw(page, offset, limit);
            return df.promise;
        }
        setTimeout(() => {
            df.resolve(this);
        }, 1);
        return df.promise;
    }
    private fetchraw = (page: number, offset: B, limit: number) => {
        var chunk = this.chunks[page - 1];
        var df = this.defers[page - 1];
        this.fetch_request(offset, limit).then((list: Array<T>) => {
            //console.log("fetch_request finsihed " + page);
            this.defers[page - 1] = null;
            chunk.pushList(this, list);
            if (chunk.list.length > 0) {
                this.n_models += chunk.list.length;
            } 
            else {
                this.finished = true;    
            }
            df.resolve(this);
        }, (e: Error) => { df.reject(e); });
    }
    fetch_request = (offset: B, limit: number): Q.Promise<Array<T>> => {
        throw new Error("override this");
    }
    update_range = (coll: ProtoModelChunk<T, B>, model: T) => {
        throw new Error("override this");        
    }
}

export interface ListProp {
    renderItem: (c: ModelCollection, model: any, options?: any) => UI.Element;
    models: ModelCollection;
    elementOptions?: any;
}

export interface ListState {
    lastIndex: number;
}

export class ListComponent extends React.Component<ListProp, ListState> {
    renderItem = (index: number, key: string): UI.Element => {
        //console.log("renderItem " + index + " " + key);
        var model = this.props.models.get(index, (c: ModelCollection) => { 
            //console.log("index updated:" + index);
            this.forceUpdate();
        });
        if (!model) {
            return <div className="block" key={index}>loading new records...</div>;
        }
        return this.props.renderItem(this.props.models, model, this.props.elementOptions);
    }
    render(): UI.Element {
        return <window.channer.rparts.List
            itemRenderer={this.renderItem}
            length={this.props.models.length()}
            type='variable'
            pageSize={ProtoModelCollection.FETCH_LIMIT}
            threshold={600}
            useTranslate3d={true}
        />;
    }
}
