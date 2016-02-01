/// <reference path="../../typings/extern.d.ts"/>

import {m, Util, Template} from "../uikit"
import {Config} from "../config"
import {ProtoError} from "../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

export class MenuController implements UI.Controller {
	component: MenuComponent;
    menus: Array<UI.Component>;
    opened: UI.Property<boolean>;
    rotate: UI.Property<number>;
	constructor(component: MenuComponent, menus: Array<UI.Component>) {
		this.component = component;
        this.menus = menus;
        this.opened = m.prop(false);
        this.rotate = m.prop(0);
	}
}
function MenuView(ctrl: MenuController) : UI.Element {
    var menus: Array<UI.Element> = [m.e("img.plus", {rotate: ctrl.rotate})];
    if (ctrl.opened()) {
        for (var k in this.menus) {
            menus.push(m(".menu-" + k, this.menus[k]));
        }
    }
    return m(".menus", {
        onclick: () => { 
            if (ctrl.opened(!ctrl.opened())) {
                ctrl.rotate(225);
            }
            else {
                ctrl.rotate(0);
            }
        },
    }, menus);
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
