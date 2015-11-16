/// <reference path="../decl/UI.d.ts"/>
/// <reference path="../decl/proto.d.ts"/>
/// <reference path="../decl/socket.d.ts"/>
/// <reference path="../decl/channer.proto.d.ts"/>

namespace main {
	export class Config {
		url: string;
	}
	export class Controller implements UI.Controller {
		s: socket.Socket;
		input_text: UI.Property<string>;
		messages: Array<channer.Msg>;

		constructor(config: Config) {
			this.input_text = m.prop("");
			this.messages = new Array<channer.Msg>();
			this.s = socket.Manager.open(config.url, {
				onopen: this.onopen,
				onmessage: this.onmessage,
				onclose: this.onclose,
				onerror: this.onerror,
			});
		}
		onunload = (evt: Event): any => {
			socket.Manager.close(this.s);
		}
		finish_input = () => {
			console.log("finish input:" + this.input_text());
			/*
			var msg = {text:""};//proto.channer.MsgBuilder.new();
			msg.text = this.input_text();
			this.s.send(msg);
			this.messages.push(msg);
			this.input_text("");
			*/
		}
		onopen = () => void {
		}
		onmessage = (event: any) => void {
		}
		onclose = (event: any) => void {
		}
		onerror = (event: any) => void {
		}
	}
	function View(ctrl: Controller) : UI.Element {
		var msgs = ctrl.messages.map(function (msg: channer.Msg) {
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
}
