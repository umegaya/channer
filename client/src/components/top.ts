/// <reference path="../../typings/extern.d.ts"/>

import {m, Util, Template, ModelCollection} from "../uikit"
import {Config} from "../config"
import {Handler} from "../proto"
import {ChannelCreateComponent} from "./channel/create"
import {ChannelListComponent} from "./channel/list"
import ChannerProto = Proto2TypeScript.ChannerProto;

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
    create: ChannelCreateComponent;
    latest: ChannelListComponent;
    popular: ChannelListComponent;
    map: { [k:string]:UI.Component }
    
	constructor(component: TopComponent) {
		Util.active(this, component);
		this.component = component;
        this.active = m.prop(component.start);
        this.create = new ChannelCreateComponent();
        this.latest = new ChannelListComponent(
            "latest", this.component.models.latest
        );
        this.popular = new ChannelListComponent(
            "popular", this.component.models.popular
        );
        this.map = {
            "create": this.create,
            "latest": this.latest,
            "popular": this.popular,
        }
	}
}
function TopView(ctrl: TopController) : UI.Element {
    var elems = Template.header();
    elems.push(Template.tab(ctrl.active, ["latest", "popular", "create"]));
    var active = ctrl.active();
    var contents = ctrl.map[active];
    if (contents) {
        elems.push(m.component(ctrl.map[active]));
    }
    return m("div", {class: "top"}, elems);
}
export class TopComponent implements UI.Component {
	controller: () => TopController;
	view: UI.View<TopController>;
    start: string;
    models: {
        latest: ChannelCollection;
        popular: ChannelCollection;
    }

	constructor(config: Config) {
		this.view = TopView;
        this.models = {
            latest: new ChannelCollection("latest"),
            popular: new ChannelCollection("popular"),
        }
		this.controller = () => {
            this.start = m.route.param("tab") || "latest";
			return new TopController(this);
		}
	}
}

window.channer.components.Top = TopComponent;
