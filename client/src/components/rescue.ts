/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m, Q} from "../uikit"
import {Config} from "../config"
import {ProtoError} from "../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;

export class RescueController implements UI.Controller {
	component: RescueComponent;
	url: UI.Property<string>;
	remain_time: UI.Property<number>;
	constructor(component: RescueComponent) {
		this.component = component;
		this.url = m.prop("");
		this.remain_time = m.prop(0);
		this.generate_rescue_url();
	}
	generate_rescue_url = () => {
		window.channer.conn.rescue()
		.then((r: ChannerProto.RescueResponse) => {
			console.log("rescue success!:" + r.url + "|" + r.remain);
			this.url(r.url)
			this.remain_time(r.remain);
		}, (e: ProtoError) => {
			console.log("rescue error:" + e.message);
			this.url(e.message)
			this.remain_time(0);
		});
	}
	onsend = () => {
		console.log("TODO: show share menu. android is ok but how to do it with iOS?");
		console.log("currently just move to rescue url for testing")
		m.route(this.url());
	} 
}
function RescueView(ctrl: RescueController) : UI.Element {
	var elems : Array<UI.Element> = [
		m("div", "send below url to device you want to login with same account."),
	];
	var remain_nano = ctrl.remain_time();
	if (remain_nano > 0) {
		var hours = Math.floor((remain_nano / (1000000000 * 60 * 60)) * 10) / 10;
		elems.push(m("div", "url valid during " + hours + " hours."));
	}
	elems.push([
		m("textarea", {
			class: "textarea-url",
		}, ctrl.url()),
		m("button", {
			onclick: ctrl.onsend,
			class: "button-send", 
		}, "Send"),
	]);
	return m("div", {class: "rescue"}, elems);
}
export class RescueComponent implements UI.Component {
	controller: () => RescueController;
	view: UI.View<RescueController>;

	constructor(config: Config) {
		this.view = RescueView;
		this.controller = () => {
			return new RescueController(this);
		}
	}
}

window.channer.RescueComponent = RescueComponent
