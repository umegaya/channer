/// <reference path="../../typings/extern.d.ts"/>

import {m, Util, PageComponent} from "../uikit"
import {Config} from "../config"
import {ProtoError} from "../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

var BUTTON_CLOSE_COLOR = "#2780f8";
var BUTTON_OPEN_COLOR = "#ed6c63";

class MenuController implements UI.Controller {
    enabled: UI.Property<boolean>;
    opened: MenuElementComponent;
    rotate: UI.Property<number>;
    cover_opac: UI.Property<number>;
    menu_opac: UI.Property<number>;
    container_opac: UI.Property<number>;
    button_color: UI.Property<string>;
    
	constructor() {
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
    on_menu_selected(c: MenuElementComponent) {
        this.container_opac(1);
    }
}
function MenuView(ctrl: MenuController, parent: PageComponent) : UI.Element {
    var menus: Array<MenuElementComponent> = parent.menus();
    var r: Array<UI.Element> = [];
    var contained: UI.Element;
    var state_class: string = ctrl.enabled() ? ".open" : ".close";
    var ct_state_class: string = ".none";
    var cover_class: string = ctrl.enabled() ? "" : ".disable";
    if (ctrl.opened) {
        if (ctrl.enabled()) {
            ctrl.cover_opac(1);
            ctrl.menu_opac(0);
            ct_state_class = "";
        }
        state_class = ".none";
        contained = m.component(ctrl.opened, parent);
    }
    r.push(m.e(".main-container" + ct_state_class, {
        opacity: ctrl.container_opac
    }, contained));
    for (var k in menus) {
        var mn = menus[k];
        r.push(
            m.e(".menu-elem.menu-" + k + state_class, {
                onclick: (function () { this.onselected(ctrl); }).bind(mn),
                opacity: ctrl.menu_opac,
            }, mn.iconview())
        );
    }
    //!important: if virtual element pos is moved during its animation plays, 
    //animation stops. so always put button element at first of .menu.
    //whether .cover element put or not
    r.splice(0, 0, 
        m.e(".main-button", {
            onclick: ctrl.onbtnclick,
            backgroundColor: ctrl.button_color,
        }, m.e("img.plus", {rotate: ctrl.rotate})),
        m.e(".cover" + cover_class, { 
            opacity: ctrl.cover_opac,
            onclick: () => {},
        })
    );
    return m(".menu", r);
}
export var MenuComponent: UI.Component = {
    controller: (menus?: Array<MenuElementComponent>) => {
        return new MenuController();
    },
	view: MenuView,
}
export class MenuElementComponent implements UI.Component {
    controller = (): any => {
        throw new Error("override this");        
    }
    view = (ctrl?: UI.Controller, ...args: any[]): UI.Element => {
        throw new Error("override this");        
    }
    iconview = (): UI.Element => {
        throw new Error("override this");        
    };
    format_iconview(icon: string, text: string): UI.Element {
        return [
            m(".balloon", text),
            m(".bg", m(icon)),
        ];
    }
    onselected = (ctrl: MenuController) => {
        ctrl.opened = this; 
        ctrl.on_menu_selected(this);     
    }
}
export class TransitMenuElementComponent extends MenuElementComponent {
    icon: string;
    text: string;
    url: string
    constructor(icon: string, text: string, url: string) {
        super();
        this.icon = icon;
        this.text = text;
        this.url = url;
    }
    controller = (options?: { icon: string, text: string, url: string}) => {
        return options;
    }
    view = (ctrl?: { icon: string, text: string, url: string}) => {
        return m("div");
    }
    iconview = () => {
        return this.format_iconview(this.icon, this.text);
    }
    onselected = (ctrl: MenuController) => {
        Util.route(this.url);
    }
}
