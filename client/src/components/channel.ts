/// <reference path="../../typings/extern.d.ts"/>

import {m, Util, BaseComponent, ListComponent} from "../uikit"
import {MenuElementComponent, TransitMenuElementComponent} from "./menu"
import {Config} from "../config"

export class ChannelController implements UI.Controller {
	component: ChannelComponent;
	selected: string;
	tab_contents: {
		[x: string]: UI.Component;
	}
	constructor(component: ChannelComponent) {
//        console.log("channel")
		Util.active(this, component);
		this.component = component;
		this.selected = "joins";
		this.tab_contents = {
/*			joins: new ListComponent("joins"),
			topics: new ListComponent("topics"),
			replies: new ListComponent("replies"),
			reactions: new ListComponent("reactions") */
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
			class: "Channel-tab" + (this.selected == name ? "_selected" : ""), 
			onclick: function () { this.onchange(name) },
		}, name);
	}
	activetab = (): UI.Component => {
		return this.tab_contents[this.selected];
	}
	onchange = (name: string) => {
		this.selected = name;
	}
}
function ChannelView(ctrl: ChannelController) : UI.Element {
	return ctrl.component.layout([
		ctrl.tabs(),
		ctrl.activetab(),
	]);
}
export class ChannelComponent extends BaseComponent {
	controller: () => ChannelController;
	view: UI.View<ChannelController>;
    id: string;
    //menu components
    top: TransitMenuElementComponent

	constructor(config: Config) {
        super();
		this.view = ChannelView;
        this.top = new TransitMenuElementComponent(
            this, "img.home", "go to top", "/top"
        );
		this.controller = () => {
            this.id = m.route.param("ch");
			return new ChannelController(this);
		}
	}
    menus = (): Array<MenuElementComponent> => {
        return [
            this.top
        ]
    }
}

window.channer.components.Channel = ChannelComponent
