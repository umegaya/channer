/// <reference path="../../../typings/extern.d.ts"/>
import {m} from "../../uikit"
import ProtoBufModel = Proto2TypeScript.ProtoBufModel;
var Scroll = window.channer.parts.Scroll;
var Long = window.channer.ProtoBuf.Long;
var _L = window.channer.l10n.translate;

export interface ModelCollection {
    key: string;
    fetch(page: number): () => Array<any>;
    refresh(): void;
    initkey(): void;
}
export class ArrayModelCollection implements ModelCollection {
    source: Array<any>;
    key: string;
    constructor(source: Array<any>, key: string) {
        this.source = source;
        this.key = key;
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
    initkey = () => {}
}
export interface ProtoModel extends ProtoBufModel {
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
    update_range = (score: number|Long) => {
        if (this.start_id == null || this.start_id.lessThan(score)) { /* this.start_id < score */
            this.start_id = typeof(score) == "number" ? new Long(score) : score;
        }
        if (this.end_id == null || this.end_id.greaterThan(score)) { /* this.end_id > score */
            this.end_id = typeof(score) == "number" ? new Long(score) : score;
        }
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
export class ListOptions {
    name: string;
    class: string;
    item: (model: any) => UI.Element;
    maxPreloadPages: number;
    pageData: (page: number) => (() => any);
    models: ModelCollection;
    elemopts: any;
}
export class ListComponent implements UI.Component {
	elemview: (c: ModelCollection, model: any, options?: any) => UI.Element;
	constructor(view: (c: ModelCollection, model: any, options?: any) => UI.Element) {
        this.elemview = view;
	}
    controller = (options: ListOptions): any => {
        return options;
    }
    mkoption = (options: ListOptions): UI.Attributes => {
        var base : ListOptions = options;
        base.name = base.name || "";
        base.class = base.class || (base.name + " listview");
        base.item = base.item || ((model: any) => { 
            return this.elemview(options.models, model, options.elemopts); 
        });
        base.maxPreloadPages = base.maxPreloadPages || 1;
        base.pageData = base.pageData || options.models.fetch;
        return base;
    }
    view = (options: ListOptions): UI.Element => {
        return m(".scroll-container", 
            m.component(Scroll, this.mkoption(options))
        );
    }
}

export var categories = new ArrayModelCollection(window.channer.category.data, "categories");
var data_with_wc = window.channer.category.data.concat();
data_with_wc.splice(0, 0, _L("All"))
export var categories_wc = new ArrayModelCollection(data_with_wc, "categories_wc");

var locales_data = window.channer.l10n.localeSettings();
export var locales = new ArrayModelCollection(locales_data, "locales_data");
var locales_with_wc = locales_data.concat();
locales_with_wc.splice(0, 0, {key: "all", value: _L("All")})
export var locales_wc = new ArrayModelCollection(locales_with_wc, "locales_with_wc");

export var topic_categories = new ArrayModelCollection([
    "rising", "hot", "flame",  
], "topic_categories");

export var topic_durations = new ArrayModelCollection([
    "hour", "day", "week", "alltime",  
], "topic_durations");
