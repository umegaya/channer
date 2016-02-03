/// <reference path="../../typings/extern.d.ts"/>

import {m, Util, Template, BaseComponent, ModelCollection} from "../uikit"
import {MenuElementComponent} from "./menu"
import {Config} from "../config"
import {Handler} from "../proto"
import {ChannelCreateComponent} from "./channel/create"
import {ChannelListComponent} from "./channel/list"
import {ChannelFilterComponent} from "./channel/filter"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

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
    map = (fn: (m: ChannerProto.Model.Channel) => void) => {
        return this.channels.map(fn);
    }
    empty = (): boolean => {
        return this.channels.length <= 0;
    }
    refresh = () => {
        var conn : Handler = window.channer.conn;
        conn.channel_list(this.category).then((r: ChannerProto.ChannelListResponse) => {
            this.channels = r.list;
        })
    }
}
export class TopController implements UI.Controller {
	component: TopComponent
    active: UI.Property<string>;
    
	constructor(component: TopComponent) {
		Util.active(this, component);
		this.component = component;
        this.active = m.prop(component.start);
	}
}
function TopView(ctrl: TopController) : UI.Element {
    var elems = [Template.tab(ctrl.active, {
        "latest":_L("latest"),
        "popular": _L("popular"), 
    })];
    var active = ctrl.active();
    var contents = ctrl.component.map[active];
    if (contents) {
        elems.push(m.component(ctrl.component.map[active]));
    }
    return ctrl.component.layout(m(".top", elems));
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
    map: { [k:string]:UI.Component; };
    //menu components
    create: ChannelCreateComponent;
    filter: ChannelFilterComponent;
    
	constructor(config: Config) {
        super();
		this.view = TopView;
        this.models = {
            latest: new ChannelCollection("latest"),
            popular: new ChannelCollection("popular"),
        }
        this.create = new ChannelCreateComponent(this);
        this.filter = new ChannelFilterComponent(this);
        this.latest = new ChannelListComponent(
            "latest", this.models.latest
        );
        this.popular = new ChannelListComponent(
            "popular", this.models.popular
        );
        this.map = {
            "latest": this.latest,
            "popular": this.popular,
        }
		this.controller = () => {
            this.start = m.route.param("tab") || "latest";
			return new TopController(this);
		}
	}
    menus = (): Array<MenuElementComponent> => {
        return [
            this.filter,
            this.create,
            this.filter,
        ]
    }
    oncreate = (ch: ChannerProto.Model.Channel) => {
        this.latest.refresh();
        this.popular.refresh();
    }
}

window.channer.components.Top = TopComponent;
