/// <reference path="../../typings/extern.d.ts"/>

import {m, Util, Template, BaseComponent, ModelCollection} from "../uikit"
import {MenuElementComponent} from "./menu"
import {Config} from "../config"
import {Handler} from "../proto"
import {ChannelCreateComponent} from "./channel/create"
import {ChannelListComponent} from "./channel/list"
import {ChannelLocaleComponent} from "./channel/locale"
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
        this.channels = new Array<ChannerProto.Model.Channel>();
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
        console.error("fetch");
        var conn : Handler = window.channer.conn;
        var ret: {
            list: Array<ChannerProto.Model.Channel>;
        } = { list: [] };
        conn.channel_list(this.category).then((r: ChannerProto.ChannelListResponse) => {
            //for debug
            for (var i = 1; i < 20; i++) {
                ret.list.push(r.list[0]);
                this.channels.push(r.list[0]);
            }
        })
        return () => {
            return ret.list;
        }
    }
}
export class TopController implements UI.Controller {
	component: TopComponent
    active: UI.Property<number>;
    
	constructor(component: TopComponent) {
		Util.active(this, component);
		this.component = component;
        this.active = m.prop(0);
        TABS.map((tab, idx) => {
            if (tab.id == component.start) {
                this.active(Number(idx));
            }
        });
	}
}
function TopView(ctrl: TopController) : UI.Element {
    return ctrl.component.layout(m(".top", [ 
        m.component(Tabs, {
            buttons: TABS,
            autofit: true,
            selectedTab: ctrl.active(),
            activeSelected: true,
            getState: (state: { index: number }) => {
                ctrl.active(state.index);
            }
        }),
        m.component(ctrl.component.map[ctrl.active()])
    ]));
}
export class TopComponent extends BaseComponent {
	controller: () => TopController;
	view: UI.View<TopController>;
    start: string;
    models: {
        latest: ChannelCollection;
        popular: ChannelCollection;
    };
    //tab contents
    latest: ChannelListComponent;
    popular: ChannelListComponent;
    map: [UI.Component];
    //menu components
    create: ChannelCreateComponent;
    filter: ChannelFilterComponent;
    locale: ChannelLocaleComponent;
    
	constructor(config: Config) {
        super();
		this.view = TopView;
        this.models = {
            latest: new ChannelCollection("latest"),
            popular: new ChannelCollection("popular"),
        }
        this.latest = new ChannelListComponent(
            "latest", this.models.latest
        );
        this.popular = new ChannelListComponent(
            "popular", this.models.popular
        );
        this.map = [
            this.latest,
            this.popular,
        ]
        console.error("topcomponent: ctor");
        this.create = new ChannelCreateComponent(this);
        this.filter = new ChannelFilterComponent(this);
        this.locale = new ChannelLocaleComponent(this);
		this.controller = () => {
            this.start = m.route.param("tab") || "latest";
			return new TopController(this);
		}
	}
    menus = (): Array<MenuElementComponent> => {
        return [
            this.locale,
            this.filter,
            this.create,
        ]
    }
    oncreate = (ch: ChannerProto.Model.Channel) => {
        this.latest.refresh();
        this.popular.refresh();
    }
}

window.channer.components.Top = TopComponent;
