/// <reference path="../../typings/extern.d.ts"/>

import {m, Util} from "../uikit"
import {Pagify, PageComponent} from "./base"
import {ModelCollection, ProtoModelCollection, ProtoModelChunk} from "./parts/scroll"
import {MenuElementComponent} from "./menu"
import {Config} from "../config"
import {Handler} from "../proto"
import {ChannelCreateComponent} from "./channel/create"
import {ChannelListComponent} from "./channel/list"
import {ChannelFilterComponent} from "./channel/filter"
import ChannerProto = Proto2TypeScript.ChannerProto;
import Q = require('q');
var _L = window.channer.l10n.translate;
var Tabs = window.channer.parts.Tabs;


const TABS = [{
    label: _L("latest"),
    id: "latest",
}, {
    label: _L("popular"),
    id: "popular",
}];

class ChannelCollection extends ProtoModelCollection<ChannerProto.Model.Channel> {
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
    fetch_request = (offset: Long, limit: number): Q.Promise<Array<ChannerProto.Model.Channel>> => {
        var df: Q.Deferred<Array<ChannerProto.Model.Channel>> = Q.defer<Array<ChannerProto.Model.Channel>>();
        var conn: Handler = window.channer.conn;
        conn.channel_list(this.query, offset, null, null, limit)
        .then((r: ChannerProto.ChannelListResponse) => {
            df.resolve(r.list);
        })
        return df.promise;
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
