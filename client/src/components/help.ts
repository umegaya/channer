/// <reference path="../../typings/extern.d.ts"/>

import {m, Util} from "../uikit"
import {Config} from "../config"
import ChannerProto = Proto2TypeScript.ChannerProto;

var helptexts = JSON.parse(require('./helptexts.json'));

export class HelpController implements UI.Controller {
	component: HelpComponent;
	constructor(component: HelpComponent) {
		Util.active(this, component);
		this.component = component;
	}
}
function HelpView(ctrl: HelpController) : UI.Element {
	var elements = [
		m("div", {class:"div-title"}, ctrl.component.title),
		m("div", {class:"div-helptext"}, helptexts[ctrl.component.title]),
	]
	return m("div", {class: "help"}, elements);
}
export class HelpComponent implements UI.Component {
	controller: () => HelpController;
	view: UI.View<HelpController>;
	title: string;

	constructor(config: Config) {
		this.view = HelpView;
		this.controller = () => {
			this.title = m.route.param("title");
			return new HelpController(this);
		}
	}
}
