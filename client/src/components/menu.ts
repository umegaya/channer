/// <reference path="../../typings/extern.d.ts"/>

import {m, Util, Template} from "../uikit"
import {Config} from "../config"
import {ProtoError} from "../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

var BUTTON_CLOSE_COLOR = "#2780f8";
var BUTTON_OPEN_COLOR = "#ed6c63";

export class MenuController implements UI.Controller {
	component: MenuComponent;
    menus: Array<MenuElementComponent>;
    enabled: UI.Property<boolean>;
    opened: UI.Component;
    rotate: UI.Property<number>;
    cover_opac: UI.Property<number>;
    menu_opac: UI.Property<number>;
    container_opac: UI.Property<number>;
    
    button_color: UI.Property<string>;
	constructor(component: MenuComponent, menus: Array<MenuElementComponent>) {
		this.component = component;
        this.menus = menus;
        this.enabled = m.prop(false);
        this.opened = null;
        this.rotate = m.prop(0);
        this.cover_opac = m.prop(0);
        this.menu_opac = m.prop(0);
        this.container_opac = m.prop(0);
        this.button_color = m.prop(BUTTON_CLOSE_COLOR);
	}
    
    onbtnclick = () => {
        if (this.enabled(!this.enabled())) {
            this.cover_opac(0.9);
            this.menu_opac(1);
            this.rotate(225);
            this.button_color(BUTTON_OPEN_COLOR)
            this.opened = null;
        }
        else {
            this.cover_opac(0);
            this.menu_opac(0);
            this.rotate(0);
            this.container_opac(0);
            this.button_color(BUTTON_CLOSE_COLOR)
        }        
    }
}
function MenuView(ctrl: MenuController) : UI.Element {
    var r: Array<UI.Element> = [];
    var contained: UI.Element;
    var state_class: string = ctrl.enabled() ? ".open" : ".close";
    var ct_state_class: string = ".none";
    if (ctrl.opened) {
        if (ctrl.enabled()) {
            ctrl.cover_opac(1);
            ctrl.menu_opac(0);
            ct_state_class = "";
        }
        state_class = ".none";
        contained = m.component(ctrl.opened);
    }
    r.push(m.e(".container" + ct_state_class, {
        opacity: ctrl.container_opac
    }, contained));
    for (var k in ctrl.menus) {
        var mn = ctrl.menus[k];
        r.push(
            m.e(".menu-elem.menu-" + k + state_class, {
                onclick: (function () { this.onselected(ctrl) }).bind(mn),
                opacity: ctrl.menu_opac,
            }, mn.iconview())
        );
    }
    //!important: if virtual element pos is moved during its animation plays, 
    //animation stops. so always put button element at first of .menu.
    //whether .cover element put or not
    r.splice(0, 0, 
        m.e(".button", {
            onclick: ctrl.onbtnclick,
            backgroundColor: ctrl.button_color,
        }, m.e("img.plus", {rotate: ctrl.rotate})),
        m.e(".cover", { opacity: ctrl.cover_opac })
    );
    return m(".menu", r);
}
export class MenuComponent implements UI.Component {
	controller: () => MenuController;
	view: UI.View<MenuController>;

	constructor(menus: Array<MenuElementComponent>) {
		this.view = MenuView;
		this.controller = () => {
			return new MenuController(this, menus);
		}
	}
}

export class MenuElementComponent implements UI.Component {
    private pt: UI.Component;
    opened: boolean;
    constructor(parent: UI.Component) {
        this.pt = parent;
        this.opened = false;
    }
    parent<T extends UI.Component>(): T {
        return <T>this.pt;
    }
    controller = (): any => {
        throw new Error("override this");
    }
    view = (ctrl: UI.Controller): UI.Element => {
        throw new Error("override this");
    }
    iconview = (): UI.Element => {
        throw new Error("override this");   
    }
    format_iconview = (icon: string, text: string): UI.Element => {
        return [
            m(".balloon", text),
            m(".bg", m(icon)),
        ];
    }
    name = (): string => {
        throw new Error("override this");
    }
    onselected = (ctrl: MenuController) => {
        ctrl.opened = this; 
        ctrl.container_opac(1);     
    }
}

export class TransitMenuElementComponent extends MenuElementComponent {
    icon: string;
    text: string;
    url: string
    constructor(parent: UI.Component, icon: string, text: string, url: string) {
        super(parent);
        this.icon = icon;
        this.text = text;
        this.url = url;
    }
    iconview = (): UI.Element => {
        return this.format_iconview(this.icon, this.text);
    }
    onselected = (ctrl: MenuController) => {
        Util.route(this.url);
    }
}

window.channer.components.Menu = MenuComponent
