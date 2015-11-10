/// <reference path="../decl/UI.d.ts"/>
/// <reference path="../decl/socket.d.ts"/>

namespace main {
	export class Config {
		url: string;
	}
	export class Message {
		text: string;
		attr: any;
		
		constructor(text:string, attr:any) {
			this.text = text;
			this.attr = attr;
		}
		to_e = () : UI.Element => {
			return m("div", this.text)			
		}
	}
	export class Controller implements UI.Controller {
		s: socket.Socket;
		input_text: UI.Property<string>;
		messages: Array<Message>;

		constructor(config: Config) {
			this.input_text = m.prop("");
			this.messages = new Array<Message>();
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
			this.messages.push(new Message(this.input_text(), null));
			this.input_text("");
		}
		onopen = () => void {
		}
		onmessage = (event:any) => void {
		}
		onclose = (event:any) => void {
		}
		onerror = (event:any) => void {
		}
	}
	function View(ctrl: Controller) : UI.Element {
		var msgs = ctrl.messages.map(function (msg:Message) {
			return msg.to_e();
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

m.mount(document.body, new main.Component({
	url: "ws://localhost:8888/ws"
}))
