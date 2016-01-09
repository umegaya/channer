import {m} from "./uikit"
import {Config} from "./config"
import ChannerProto = Proto2TypeScript.ChannerProto;

export class Controller implements UI.Controller {
	input_text: UI.Property<string>;
	messages: Array<ChannerProto.Post>;

	constructor(config: Config) {
		this.input_text = m.prop("");
		this.messages = new Array<ChannerProto.Post>();
		var conn = window.channer.conn;
		conn.watcher.subscribe(ChannerProto.Payload.Type.PostNotify, this.onpostnotify);
	}
	onunload = (evt: Event): any => {
		console.log("onunload");
		var conn = window.channer.conn;
		conn.watcher.unsubscribe(ChannerProto.Payload.Type.PostNotify, this.onpostnotify);
	}
	onpostnotify = (data: ChannerProto.Post) => {
		console.log("onpostnotify:" + data.text);
		this.messages.push(data);
		m.redraw();
	}
	finish_input = () => {
		//TODO: parse input_text, generate options
		window.channer.conn.post(100, this.input_text())
		.then(function (m: ChannerProto.PostResponse) {
			console.log("sent message finished");
		}, function (e: Error) {
			console.log("sent message error:" + e.message);			
		});
		this.input_text("");
	}
}
function View(ctrl: Controller) : UI.Element {
	var msgs = ctrl.messages.map(function (msg: ChannerProto.Post) {
		return m("div", msg.text);
	});
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
