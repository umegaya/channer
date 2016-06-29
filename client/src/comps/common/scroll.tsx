/// <reference path="../../../typings/extern.d.ts"/>
import * as React from 'react'
import ProtoBufModel = Proto2TypeScript.ProtoBufModel;
import * as Promise from "bluebird"
import {init_metrics, vw, vh, h} from "./styler"
import {Surface, ListView, Text, Group, ScrollState} from "react-canvas"
var Scroll = window.channer.parts.Scroll;
var Long = window.channer.ProtoBuf.Long;
var _L = window.channer.l10n.translate;

export interface ModelCollection {
    key: string;
    length(): number;
    get(index: number, 
        resolve?: (c: ModelCollection) => void, reject?: (e: any) => void, 
        refresh?:boolean): any;
    item_height(index: number): number;
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
    get = (index: number, 
        resolve?: (c: ModelCollection) => void, reject?: (e: any) => void, 
        refresh?: boolean): any => {
        return this.source[index];
    }
    length = (): number => {
        return this.source.length;
    }
    item_height(index: number): number {
        return vh(15);
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
export class LongBoundary implements Boundary {
    id: Long;
    constructor(n: number|Long) {
        this.id = (typeof(n) == "number" ? new Long(n as number) : n as Long);
    }
    isZero = (): boolean => {
        return this.id.equals(Long.UZERO);
    }
    lessThan = (b: LongBoundary): boolean => {
        return this.id.lessThan(b.id);
    }
    greaterThan = (b: LongBoundary): boolean => {
        return this.id.greaterThan(b.id);
    }
}
export class ScoreBoundary implements Boundary {
    id: Long;
    score: number;
    constructor(id: Long, score: number) {
        this.id = id;
        this.score = score;
    }
    isZero = (): boolean => {
        return this.id.equals(Long.UZERO);
    }
    //score < b.score || this.id < b.id
    lessThan = (b: ScoreBoundary): boolean => {
        return this.score < b.score || this.id.lessThan(b.id);
    }
    //score > b.score || this.id > b.id
    greaterThan = (b: ScoreBoundary): boolean => {
        return this.score > b.score || this.id.greaterThan(b.id);
    }
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
    defers: Array<Promise<ModelCollection>>;
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
    get = (index: number, 
        resolve?: (c: ModelCollection) => void, reject?: (e: any) => void, 
        refresh?:boolean): T => {
        var page_index = Math.floor(index / ProtoModelCollection.FETCH_LIMIT);
        var chunk = this.chunks[page_index];
        //console.log("get " + index + " " + page_index + " " + (!!chunk));
        if (!chunk || refresh) {
            //for each page_index, only first time chunk is missing, fetch is called. 
            //then fetch set chunk to this.chunks[page_index].
            if (resolve) {
                this.fetch(page_index + 1).then(resolve, reject);
            }
            return null;
        }
        var index_in_page = index % ProtoModelCollection.FETCH_LIMIT;
        return chunk.list[index_in_page];
    }
    length = (): number => {
        //console.log("length: n_models = " + this.n_models);
        return this.finished ? this.n_models : (this.n_models + ProtoModelCollection.FETCH_LIMIT);
    }
    make_rejecter = (reject: (err: any) => void, page: number): (err: any) => void => {
        return (err: any) => {
            this.defers[page - 1] = null;
            reject(err);
        }
    }
    fetch = (page: number): Promise<ModelCollection> => {
        var chunk : ProtoModelChunk<T, B> = this.chunks[page - 1];
        //console.log("fetch for " + page + " " + (chunk == null));
        if (!chunk || !chunk.initialized) {
            if (this.defers[page - 1]) {
                //console.log("fetch for " + page + " returns promiss");
                return this.defers[page - 1];
            }
            chunk = new ProtoModelChunk<T, B>();
            this.chunks[page - 1] = chunk;
            this.defers[page - 1] = new Promise<ModelCollection>(
            (resolve: (e: ModelCollection) => void, reject: (err: any) => void) => {
                //console.error("client offset for " + page + " " +this.offset_for(page));
                var offset = this.offset_for(page), limit = ProtoModelCollection.FETCH_LIMIT;
                reject = this.make_rejecter(reject, page);
                if (offset && offset.isZero()) {
                    //console.error("query for previous page has not returned yet " + page);
                    //query for previous page has not returned yet.
                    //wait for previous query finished, then call fetch again.
                    var p = this.defers[page - 2];
                    return p.then((c: ModelCollection) => {
                        offset = this.offset_for(page);
                        //console.log("prev page fetched " + page + " " + offset);
                        this.fetchraw(page, offset, limit,resolve, reject);
                    }, reject);
                }
                this.fetchraw(page, offset, limit, resolve, reject);
            });
            return this.defers[page - 1];
        } else {
            //already chunk initialized. return immediately.
            return Promise.resolve(this);
        }
    }
    private fetchraw = (page: number, offset: B, limit: number, 
        resolve: (e: ModelCollection) => void, reject: (err: any) => void) => {
        //console.log("featchraw:" + page);
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
            resolve(this);
        }, reject);
    }
    fetch_request = (offset: B, limit: number): Promise<Array<T>> => {
        throw new Error("override this");
    }
    update_range = (coll: ProtoModelChunk<T, B>, model: T) => {
        throw new Error("override this");        
    }
    item_height = (index: number) => {
        return vh(15);
    }
}

export class ListScrollState extends ScrollState {
    fetchError: Error;
    getMaxScrollTop():number {
        if (this.fetchError) {
            return this.maxScrollTop;
        } else {
            return Number.MAX_VALUE;
        }
    }
}

export interface ListProp {
    elementComponent: React.ComponentClass<any>;
    models: ModelCollection;
    scrollState?: ListScrollState;
    elementOptions?: any;
}

export interface ListState {
    size: ClientRect;
    showRefresh: boolean;
    itemStyle: any;
    textStyle: any;
    listStyle: any;
}

export class ListComponent extends React.Component<ListProp, ListState> {
    size: ClientRect;
    constructor(props: ListProp) {
        super(props);
        var sz = document.getElementById('app').getBoundingClientRect();
        init_metrics(sz.width, sz.height);
        this.state = {
            size: sz,
            showRefresh: false,
            itemStyle: {
                top: 0,
                left: 0,
                width: sz.width,
                height: this.props.models.item_height(null),
                backgroundColor: "#ffffff",
            },
            textStyle: {
                top: vh(4),
                left: vw(1),
                width: sz.width,
                height: vh(12),
                fontSize: h(2),
                textAlign: "center",
                lineHeight: h(2) + vh(0.5),
            },
            listStyle: {
                top: 0,
                left: 0,
                width: window.innerWidth,
                height: window.innerHeight,
                scrollHeight: 2000000,
                backgroundColor: "#aaaaaa",
            }
        };
    }
    getItem = (index: number, refresh?:boolean): any => {
        return this.props.models.get(index, (c: ModelCollection) => { 
            this.props.scrollState.fetchError = null;
            console.log("index updated:" + index);
            this.forceUpdate();
        }, (e: any) => {
            this.props.scrollState.fetchError = e as Error;
            console.log("index updated error:" + e.message);
            this.forceUpdate();
        }, refresh);
    }
    renderItem = (index: number, scrollTop: number): UI.Element => {
        var model = this.getItem(index);
        //console.log("renderItem:" + index + "|" + !!model);
        if (!model) {
            var e = this.props.scrollState.fetchError;
            if (e) {
                return <Group style={this.state.itemStyle} key={index} onClick={() => {
                    this.getItem(index, true);
                }}>
                    <Text style={this.state.textStyle}>{"error: " + e.message + ". tap to refresh"}</Text>
                </Group>
            } else {
                return <Group style={this.state.itemStyle} key={index}>
                    <Text style={this.state.textStyle}>loading new records..</Text>
                </Group>;
            }
        }
        return React.createElement(this.props.elementComponent, {
            key: index,
            model: model, 
            c: this.props.models,
            elemOpts: this.props.elementOptions,
        });
    }
    onRefresh = (event: string, refreshEndNotifier?: () => void) => {
        if (event == "start" && refreshEndNotifier) {
            this.props.models.refresh();
            setTimeout(refreshEndNotifier, 1000);
        }
        else if (event == "activate") {
            this.state.showRefresh = true;
        }
        else if (event == "deactivate") {
            this.state.showRefresh = false;            
        }
    }
    render(): UI.Element {
        return <Surface 
            top={0} left={0} width={this.state.size.width} height={this.state.size.height}>
            <ListView
                style={this.state.listStyle}
                numberOfItemsGetter={this.props.models.length}
                itemHeightGetter={this.props.models.item_height}
                scrollState={this.props.scrollState}
                itemGetter={this.renderItem} 
                onRefresh={this.onRefresh}/>
        </Surface>
    }
}
