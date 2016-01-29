/// <reference path="../../typings/extern.d.ts"/>

import {m, Util, Template} from "../uikit"
import {Config} from "../config"
import {ProtoError} from "../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

export class MenuController implements UI.Controller {
	component: MenuComponent;
    menus: Array<UI.Component>;
    opened: boolean;
	constructor(component: MenuComponent, menus: Array<UI.Component>) {
		this.component = component;
        this.menus = menus;
        this.opened = false;
	}
}
function MenuView(ctrl: MenuController) : UI.Element {
    var menus: Array<UI.Element> = [];
    for (var k in this.menus) {
        menus.push(m("div", {class: "menu-" + k}, this.menus[k]));
    }
    return m("div", {class: "menus"}, menus);
}
export class MenuComponent implements UI.Component {
	controller: () => MenuController;
	view: UI.View<MenuController>;

	constructor(menus: Array<UI.Component>) {
		this.view = MenuView;
		this.controller = () => {
			return new MenuController(this, menus);
		}
	}
}

window.channer.components.Menu = MenuComponent
