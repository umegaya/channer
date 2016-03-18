/// <reference path="../../../typings/extern.d.ts"/>
import {m} from "../../uikit"
import ProtoBufModel = Proto2TypeScript.ProtoBufModel;
var Scroll = window.channer.parts.Scroll;
var Long = window.channer.ProtoBuf.Long;

export interface ModelCollection {
    fetch(page: number): () => Array<any>;
    refresh(): void;
}
export class ArrayModelCollection implements ModelCollection {
    source: Array<any>;
    constructor(source: Array<any>) {
        this.source = source;
    }
    fetch = (page: number): () => Array<any> => {
        if (page <= 1) {
            return () => {
                return this.source;
            }
        }
        return () => { return []; }
    }
    refresh = () => {}
}
interface ProtoModel extends ProtoBufModel {
    id: Long;
}
export class ProtoModelChunk<T extends ProtoModel> {
    list: Array<T>;
    initialized: boolean;
    start_id: Long;
    end_id: Long;
    
    constructor() {
        this.list = [];
    }
    push = (coll: ProtoModelCollection<T>, model: T) => {
        this.list.push(model);
        coll.update_range(this, model);
    }
    pushList = (coll: ProtoModelCollection<T>, models: Array<T>) => {
        models.forEach((v: T) => {
            this.push(coll, v);
        });
        this.initialized = true;
    }
}
export class ProtoModelCollection<T extends ProtoModel> implements ModelCollection {
    static FETCH_LIMIT = 20;
    key: string;
    chunks: Array<ProtoModelChunk<T>>;
    constructor() {
        //TODO: load from local store.
        this.chunks = [];
        //var conn : Handler = window.channer.conn;
        //TODO: handling notification from server.
		//conn.watcher.subscribe(ChannerProto.Payload.Type.PostNotify, this.onpostnotify);
    }
    refresh = () => {
        this.chunks = [];
        this.initkey();
    }
    offset_for = (page: number): Long => {
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
                return Long.UZERO;
            }
        }
    }
    initkey = () => {
        throw new Error("override this");
    }    
    fetch = (page: number): () => Array<any> => {
        //console.log("fetch " + this.key + " for " + page);
        var chunk : ProtoModelChunk<T> = this.chunks[page - 1];
        var extra_chunk : ProtoModelChunk<T>;
        if (!chunk || !chunk.initialized) {
            //console.error("client offset for " + this.key + "/" + page + " " +this.offset_for(page));
            var offset = this.offset_for(page), limit = ProtoModelCollection.FETCH_LIMIT;
            if (!offset) {
                limit *= 2; 
                extra_chunk = new ProtoModelChunk<T>();
                this.chunks[page] = extra_chunk;
            }
            else if (offset.equals(Long.UZERO)) {
                //previous query initialize chunk for this page also.
                return () => {
                    return chunk.list;
                }
            }
            chunk = new ProtoModelChunk<T>();
            this.chunks[page - 1] = chunk;
            this.fetch_request(offset, limit).then((list: Array<T>) => {
                if (offset) {
                    chunk.pushList(this, list);
                }
                else {
                    chunk.pushList(this, list.slice(0, ProtoModelCollection.FETCH_LIMIT));
                    extra_chunk.pushList(this, list.slice(
                        ProtoModelCollection.FETCH_LIMIT, ProtoModelCollection.FETCH_LIMIT * 2));
                }
            });
        }
        return () => {
            return chunk.list;
        }
    }
    fetch_request = (offset: Long, limit: number): Q.Promise<Array<T>> => {
        throw new Error("override this");
    }
    update_range = (coll: ProtoModelChunk<T>, model: T) => {
        throw new Error("override this");        
    }
}
export class ListComponent implements UI.Component {
	elemview: (c: ModelCollection, model: any, options?: any) => UI.Element;
	constructor(view: (c: ModelCollection, model: any, options?: any) => UI.Element) {
        this.elemview = view;
	}
    controller = (): any => {
        return null;
    }
    mkoption = (models: ModelCollection, options?: any, elem_options?: any): UI.Attributes => {
        var base = options || {}
        base.name = base.name || "";
        base.class = base.class || (base.name + " listview");
        base.item = base.item || ((model: any) => { 
            return this.elemview(models, model, elem_options); 
        });
        base.maxPreloadPages = base.maxPreloadPages || 1;
        base.pageData = base.pageData || models.fetch;
        return base;
    }
    view = (ctrl: any, models: ModelCollection, options?: any, elem_options?: any): UI.Element => {
        return m(".scroll-container", 
            m.component(Scroll, this.mkoption(models, options, elem_options))
        );
    }
}

export var categories = new ArrayModelCollection(window.channer.category.data);
export var locales = new ArrayModelCollection(window.channer.l10n.localeSettings());