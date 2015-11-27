/// <reference path="../typings/UI.d.ts"/>
/// <reference path="../typings/proto.d.ts"/>
/// <reference path="../typings/socket.d.ts"/>
/// <reference path="../typings/boot.d.ts"/>

import {Socket, Manager} from "./socket"
import {ChannerProto} from "./proto"
import {m} from "./uikit"

export class Config {
	url: string;
	constructor(src: any) {
		this.url = src.url;
	}
}
export class Controller implements UI.Controller {
	s: Socket;
	input_text: UI.Property<string>;
	messages: Array<ChannerProto.Msg>;

	constructor(config: Config) {
		this.input_text = m.prop("");
		this.messages = new Array<ChannerProto.Msg>();
		this.s = Manager.open(config.url, {
			onopen: this.onopen,
			onmessage: this.onmessage,
			onclose: this.onclose,
			onerror: this.onerror,
		});
	}
	onunload = (evt: Event): any => {
		Manager.close(this.s);
	}
	finish_input = () => {
		var msg = new ChannerProto.Msg();
		msg.text = this.input_text();
		this.s.send(msg);
		this.messages.push(msg);
		this.input_text("");
	}
	onopen = () => {
	}
	onmessage = (event: any) => {
	}
	onclose = (event: any) => {
	}
	onerror = (event: any) => {
	}
}
function View(ctrl: Controller) : UI.Element {
	var msgs = ctrl.messages.map(function (msg: ChannerProto.Msg) {
		return m('div', msg.text);
	})
	return [
		m("div", msgs),
		m("input", {onchange: m.withAttr("value", ctrl.input_text), value: ctrl.input_text()}),
		m("button", {onclick: ctrl.finish_input}, "Add"),
	];
}
export class Component implements UI.Component {
	controller: () => Controller;
	view: UI.View<Controller>;

	constructor(config: Config) {
		this.view = View;
		this.controller = function () {
			return new Controller(config);
		}
	}
}
