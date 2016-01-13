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
        var conn : Handler = window.channer.conn;
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

export class ChannelController implements UI.Controller {
	component: ChannelComponent
    active: UI.Property<string>;
    create: ChannelCreateComponent;
    latest: ChannelListComponent;
    popular: ChannelListComponent;
    map: { [k:string]:UI.Component }
    
	constructor(component: ChannelComponent) {
		Util.active(this, component);
		this.component = component;
        this.active = m.prop("latest");
        this.create = new ChannelCreateComponent();
        this.latest = new ChannelListComponent(
            "latest", this.component.models.latest
        );
        this.popular = new ChannelListComponent(
            "popular", this.component.models.popular
        );
        this.map = {
            "+": this.create,
            "latest": this.latest,
            "popular": this.popular,
        }
	}
}
function ChannelView(ctrl: ChannelController) : UI.Element {
    var elems = Template.header();
    elems.push(Template.tab(ctrl.active, ["latest", "popular", "+"]));
    var active = ctrl.active();
    var contents = ctrl.map[active];
    if (contents) {
        elems.push(m.component(ctrl.map[active]));
    }
    return m("div", {class: "channel-list"}, elems);
}
export class ChannelComponent implements UI.Component {
	controller: () => ChannelController;
	view: UI.View<ChannelController>;
    models: {
        latest: ChannelCollection;
        popular: ChannelCollection;
    }

	constructor(config: Config) {
		this.view = ChannelView;
        this.models = {
            latest: new ChannelCollection("latest"),
            popular: new ChannelCollection("popular"),
        }
		this.controller = () => {
			return new ChannelController(this);
		}
	}
}

window.channer.components.Channel = ChannelComponent;
