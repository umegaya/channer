/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m} from "../uikit"
import {Config} from "../config"
import {ListComponent} from "./list"

export class MainController implements UI.Controller {
	component: MainComponent;
	selected: string;
	tab_contents: {
		[x: string]: UI.Component;
	}
	constructor(component: MainComponent) {
		this.component = component;
		this.selected = "joins";
		this.tab_contents = {
			joins: new ListComponent("joins"),
			topics: new ListComponent("topics"),
			replies: new ListComponent("replies"),
			reactions: new ListComponent("reactions")
		};
	}
	tabs = () => {
		return m("ul", [
			m("li", [this.tab("joins")]),
			m("li", [this.tab("topics")]),
			m("li", [this.tab("replies")]),
			m("li", [this.tab("reactions")]),
		]);
	}
	tab = (name: string) => {
		return m("a", {
			class: "main-tab" + (this.selected == name ? "_selected" : ""), 
			onclick: function () { this.onchange(name) },
		}, name);
	}
	activetab = (): UI.Component => {
		return this.tab_contents[this.selected] || m("div", "error!");
	}
	onchange = (name: string) => {
		this.selected = name;
	}
}
function MainView(ctrl: MainController) : UI.Element {
	return [
		ctrl.tabs(),
		ctrl.activetab(),
	];
}
export class MainComponent implements UI.Component {
	controller: () => MainController;
	view: UI.View<MainController>;

	constructor(config: Config) {
		this.view = MainView;
		this.controller = () => {
			return new MainController(this);
		}
	}
}

window.channer.MainComponent = MainComponent
