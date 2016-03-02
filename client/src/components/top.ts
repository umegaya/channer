/// <reference path="../../typings/extern.d.ts"/>

import {m, Util, Pagify, PageComponent, ModelCollection} from "../uikit"
import {MenuElementComponent} from "./menu"
import {Config} from "../config"
import {Handler} from "../proto"
import {ChannelCreateComponent} from "./channel/create"
import {ChannelListComponent} from "./channel/list"
import {ChannelFilterComponent} from "./channel/filter"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;
var Tabs = window.channer.parts.Tabs;


const TABS = [{
    label: _L("latest"),
    id: "latest",
}, {
    label: _L("popular"),
    id: "popular",
}];

class ChannelCollection implements ModelCollection {
    category: string;
    channels: Array<ChannerProto.Model.Channel>;
    constructor(category: string) {
        //TODO: load from local store.
        this.category = category;
        this.channels = [];
        //var conn : Handler = window.channer.conn;
        //TODO: handling notification from server.
		//conn.watcher.subscribe(ChannerProto.Payload.Type.PostNotify, this.onpostnotify);
    }
    map = (fn: (m: ChannerProto.Model.Channel) => void): Array<any> => {
        return this.channels.map(fn);
    }
    empty = (): boolean => {
        return this.channels.length <= 0;
    }
    refresh = () => {
        this.fetch(1);
    }
    fetch = (page: number) => {
        var conn : Handler = window.channer.conn;
        var ret: {
            list: Array<ChannerProto.Model.Channel>;
        } = { list: [] };
        conn.channel_list(this.category).then((r: ChannerProto.ChannelListResponse) => {
            if (r.list.length > 0) {
                //for debug
                for (var i = 1; i < 20; i++) {
                    ret.list.push(r.list[0]);
                    this.channels.push(r.list[0]);
                }
            }
        })
        return () => {
            return ret.list;
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
}
window.channer.components.Top = Pagify(TopComponent);
window.channer.components.ChannelCreate = ChannelCreateComponent;
window.channer.components.ChannelFilter = ChannelFilterComponent;
