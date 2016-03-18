/// <reference path="../../typings/extern.d.ts"/>

import {m, Util} from "../uikit"
import {Pagify, PageComponent} from "./base"
import {ModelCollection} from "./parts/scroll"
import {MenuElementComponent} from "./menu"
import {Config} from "../config"
import {Handler} from "../proto"
import {ChannelCreateComponent} from "./channel/create"
import {ChannelListComponent} from "./channel/list"
import {ChannelFilterComponent} from "./channel/filter"
import ChannerProto = Proto2TypeScript.ChannerProto;
import ProtoBufModel = Proto2TypeScript.ProtoBufModel;
var Long = window.channer.ProtoBuf.Long;
var _L = window.channer.l10n.translate;
var Tabs = window.channer.parts.Tabs;


const TABS = [{
    label: _L("latest"),
    id: "latest",
}, {
    label: _L("popular"),
    id: "popular",
}];

interface ProtoModel extends ProtoBufModel {
    id: Long;
}
class ProtoModelChunk<T extends ProtoModel> {
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
class ProtoModelCollection<T extends ProtoModel> implements ModelCollection {
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
        throw new Error("override this");
    }
    update_range = (coll: ProtoModelChunk<T>, model: T) => {
        throw new Error("override this");        
    }
}
class ChannelCollection extends ProtoModelCollection<ChannerProto.Model.Channel> {
    static FETCH_LIMIT = 20;
    query: string;
    constructor(query: string) {
        super();
        //TODO: load from local store.
        this.query = query;
        //var conn : Handler = window.channer.conn;
        //TODO: handling notification from server.
		//conn.watcher.subscribe(ChannerProto.Payload.Type.PostNotify, this.onpostnotify);
    }
    initkey = () => {
        this.key = this.query + "/" 
            + window.channer.settings.values.search_locale + ","
            + window.channer.settings.values.search_category;
    }
    //TODO: refactor: move entire logic to base class. only actual fetch call overridden. (conn.channel_list)
    fetch = (page: number): () => Array<any> => {
        //console.log("fetch " + this.key + " for " + page);
        var conn : Handler = window.channer.conn;
        var chunk : ProtoModelChunk<ChannerProto.Model.Channel> = this.chunks[page - 1];
        var extra_chunk : ProtoModelChunk<ChannerProto.Model.Channel>;
        if (!chunk || !chunk.initialized) {
            //console.error("client offset for " + this.key + "/" + page + " " +this.offset_for(page));
            var offset = this.offset_for(page), limit = ChannelCollection.FETCH_LIMIT;
            if (!offset) {
                limit *= 2; 
                extra_chunk = new ProtoModelChunk<ChannerProto.Model.Channel>();
                this.chunks[page] = extra_chunk;
            }
            else if (offset.equals(Long.UZERO)) {
                //previous query initialize chunk for this page also.
                return () => {
                    return chunk.list;
                }
            }
            chunk = new ProtoModelChunk<ChannerProto.Model.Channel>();
            this.chunks[page - 1] = chunk;
            conn.channel_list(this.query, offset, null, null, limit)
            .then((r: ChannerProto.ChannelListResponse) => {
                if (offset) {
                    chunk.pushList(this, r.list);
                }
                else {
                    chunk.pushList(this, r.list.slice(0, ChannelCollection.FETCH_LIMIT));
                    extra_chunk.pushList(this, r.list.slice(
                        ChannelCollection.FETCH_LIMIT, ChannelCollection.FETCH_LIMIT * 2));
                }
            });
        }
        return () => {
            return chunk.list;
        }
    }
    update_range = (
        chunk: ProtoModelChunk<ChannerProto.Model.Channel>, 
        model: ChannerProto.Model.Channel) => {
        var id = model.id;
        if (this.query == "popular") {
            //TODO: replace id to suitable "range key".
            if (chunk.end_id == null || chunk.end_id.lessThan(id)) { /* this.start_id < id */
                chunk.end_id = id; 
            }
            if (chunk.start_id == null || chunk.start_id.greaterThan(id)) { /* this.end_id > id */
                chunk.start_id = id;
            }            
        }
        else {
            if (chunk.start_id == null || chunk.start_id.lessThan(id)) { /* this.start_id < id */
                chunk.start_id = id; 
            }
            if (chunk.end_id == null || chunk.end_id.greaterThan(id)) { /* this.end_id > id */
                chunk.end_id = id;
            }
        }
    }
}
class TopController implements UI.Controller {
    active: UI.Property<number>;
    start: string;
    component: TopComponent;
    static factory: Array<(s: TopComponent) => UI.Element> = [
        (s: TopComponent) => {
            return m.component(ChannelListComponent, s.models.latest, {
                name: "latest",
            });
        },
        (s: TopComponent) => {
            return m.component(ChannelListComponent, s.models.popular, {
                name: "popular",
            });
        },
    ];
	constructor(component: TopComponent) {
        this.active = m.prop(0);
        this.component = component;
        this.start = m.route.param("tab") || "latest";
        TABS.map((tab, idx) => {
            if (tab.id == this.start) {
                this.active(Number(idx));
            }
        });
	}
    content(): UI.Element {
        //console.log("tab: active = " + this.active());
        return TopController.factory[this.active()](this.component);
    }
}
function TopView(ctrl: TopController) : UI.Element {
    return m(".top", [ 
        m.component(Tabs, {
            buttons: TABS,
            autofit: true,
            selectedTab: ctrl.active(),
            activeSelected: true,
            getState: (state: { index: number }) => {
                ctrl.active(state.index);
            }
        }),
        ctrl.content()
    ]);
}
export class TopComponent extends PageComponent {
    models: {
        latest: ChannelCollection;
        popular: ChannelCollection;
    };
    constructor() {
        super();
        this.models = {
            latest: new ChannelCollection("latest"),
            popular: new ChannelCollection("popular"),
        }
    }
    controller = (): TopController => {
        if (!this.models.latest.key) {
            this.models.latest.initkey();
            this.models.popular.initkey();
        }
        return new TopController(this);
    }
    view = (ctrl: TopController): UI.Element => {
    	return TopView(ctrl);
    }
    menus = (): Array<MenuElementComponent> => {
        return [
            ChannelFilterComponent,
            ChannelCreateComponent,
        ];
    }
    onunload = () => {
        this.models.latest.refresh();
        this.models.popular.refresh();
    }
}
window.channer.components.Top = Pagify(TopComponent);
window.channer.components.ChannelCreate = ChannelCreateComponent;
window.channer.components.ChannelFilter = ChannelFilterComponent;
