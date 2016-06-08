/// <reference path="../../typings/extern.d.ts"/>

import {m} from "../uikit"
import {Pagify, PageComponent} from "./base"
import {ListComponent} from "./parts/scroll"
import {MenuElementComponent, TransitMenuElementComponent} from "./menu"
import {Config} from "../config"

export class ChannelController implements UI.Controller {
	component: ChannelComponent;
	selected: string;
	tab_contents: {
		[x: string]: UI.Component;
	}
	constructor(component: ChannelComponent, opts: ChannelOptions) {
//        console.log("channel")
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
		return m("a", <UI.Attributes>{
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
	return m(".channel", [
		ctrl.tabs(),
		ctrl.activetab(),
	]);
}
export class ChannelOptions {
	id: string;
}
export class ChannelComponent extends PageComponent {
    //menu components
    top: TransitMenuElementComponent

	constructor() {
        super();
		this.view = ChannelView;
        this.top = new TransitMenuElementComponent(
            "img.home", "go to top", "/top"
        );
	}
    view = (ctrl: ChannelController): UI.Element => {
        return ChannelView(ctrl);
    }
    controller = (opts: ChannelOptions): ChannelController => {
        return new ChannelController(this, opts);
    }
    menus = (): Array<MenuElementComponent> => {
        return [
            this.top
        ]
    }
}

window.channer.parts.Channel = new ChannelComponent();
window.channer.components.Channel = Pagify(ChannelComponent);
