/// <reference path="../../typings/extern.d.ts"/>

import {m, Util, Pagify, PageComponent} from "../uikit"
import {Config} from "../config"
import {ProtoError} from "../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

export class RescueController implements UI.Controller {
	url: UI.Property<string>;
	remain_time: UI.Property<number>;
	constructor() {
		this.url = m.prop("");
		this.remain_time = m.prop(0);
		this.generate_rescue_url();
	}
	private generate_rescue_url() {
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
	var elems = [m("div", {class: "div-text guide"}, 
        _L("open below url with the device you want to login with same account."))
    ];
	var remain_nano = ctrl.remain_time();
	if (remain_nano > 0) {
		var hours = Math.floor(((remain_nano / 1000000000 * 60 * 60) * 10) / 10);
		elems.push(m("div", {class: "div-text remain"}, 
            _L("url valid during $1 hours.", hours)));
	}
	elems.push([
		m("textarea", {class: "textarea-readonly"}, ctrl.url()),
		m("button", <UI.Attributes>{
			onclick: ctrl.onsend,
			class: "button-send", 
		}, _L("Send")),
	]);
	return m("div", {class: "rescue"}, elems);
}

class RescueComponent extends PageComponent {
    controller = (): RescueController => {
        return new RescueController();        
    }
    view = (ctrl: RescueController): UI.Element => {
        return RescueView(ctrl);
    }
}

window.channer.components.Rescue = Pagify(RescueComponent);
