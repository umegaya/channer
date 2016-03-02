/// <reference path="../../typings/extern.d.ts"/>

import {m, Util, Pagify, PageComponent, BaseComponent} from "../uikit"
import {HeaderComponent} from "./parts/header"
import {Config} from "../config"
import {ProtoError} from "../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

var BUTTON_CLOSE_COLOR = "#2780f8";
var BUTTON_OPEN_COLOR = "#ed6c63";

class MenuController implements UI.Controller {
    component: MenuComponent;
    enabled: UI.Property<boolean>;
    rotate: UI.Property<number>;
    cover_opac: UI.Property<number>;
    menu_opac: UI.Property<number>;
    container_opac: UI.Property<number>;
    button_color: UI.Property<string>;
    
	constructor(component: MenuComponent) {
        this.component = component;
        this.enabled = m.prop(false);
        this.rotate = m.prop(0);
        this.cover_opac = m.prop(0);
        this.menu_opac = m.prop(0);
        this.container_opac = m.prop(0);
        this.button_color = m.prop(BUTTON_CLOSE_COLOR);
	}
    onbtnclick = (on: boolean, parent_path: string) => {
        if (on) {
            this.enabled(true);
            this.cover_opac(0.9);
            this.menu_opac(1);
            this.rotate(225);
            this.button_color(BUTTON_OPEN_COLOR)
        }
        else {
            this.cover_opac(0);
            this.menu_opac(0);
            this.rotate(0);
            this.container_opac(0);
            this.button_color(BUTTON_CLOSE_COLOR);
            //wait animation end, then route to parent
            setTimeout(() => { Util.route(parent_path); }, 300);
        }        
    }
}
class Route {
    [k:string]: UI.Component;
}
export class MenuComponent extends PageComponent {
    rt: Route;
    setup = (route: Route): Route => {
        var rt: Route = new Route();
        rt["/menus/:parent_path"] = this;
        for (var k in route) {
            var b: BaseComponent = <BaseComponent>route[k]
            var p: PageComponent = b.content;
            var menus: Array<MenuElementComponent> = p.menus();
            for (var kk in menus) {
                var mn: MenuElementComponent = menus[kk];
                var urls: string|Array<string> = mn.pagert();
                if (!urls) { console.log("no route: ignored"); }
                else if (typeof urls === "string") { rt[urls] = mn; }
                else for (var i in urls) { rt[urls[i]] = mn; }
            }
            rt[k] = b;
        }
        this.rt = rt;
        return rt;
    }
    current_menus = (path: string): Array<MenuElementComponent> => {
        for (var k in this.rt) {
            //regex taken from mithriljs 0.2.0
            var matcher = new RegExp(
                "^" + k.replace(/:[^\/]+?\.{3}/g, "(.*?)")
                .replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$"
            );
			if (matcher.test(path)) {
                return (<BaseComponent>this.rt[k]).content.menus();
            }
        }
        return null;
    }
    controller = (): MenuController => {
        return new MenuController(this);
    }
	view = (ctrl: MenuController, route: string) : UI.Element => {
        if (typeof route === "string") {
            //only show button for routing to /menu/:parent_path.
            return m(".menu",  m.e(".main-button", {
                onclick: () => { Util.route("/menus" + route); },
                backgroundColor: ctrl.button_color,
            }, m.e("img.plus", {rotate: ctrl.rotate})));
        }
        //otherwise route contains :parent_path parameter.
        var parent_path = "/" + m.route.param("parent_path");
        var menus: Array<MenuElementComponent> = this.current_menus(parent_path);
        var r: Array<UI.Element> = [];
        var contained: UI.Element;
        var state_class: string = ctrl.enabled() ? ".open" : ".close";
        var cover_class: string = ctrl.enabled() ? "" : ".disable";
        for (var k in menus) {
            var mn = menus[k];
            r.push(
                m.e(".menu-elem.menu-" + k + state_class, {
                    onclick: (function () { 
                        this.onselected(ctrl); 
                    }).bind(mn),
                    opacity: ctrl.menu_opac,
                }, mn.iconview())
            );
        }
        //!important: if virtual element pos is moved during its animation plays, 
        //animation stops. so always put button element at first of .menu.
        //whether .cover element put or not
        r.splice(0, 0, 
            m.e(".main-button", {
                onclick: ctrl.onbtnclick.bind(ctrl, false, parent_path),
                backgroundColor: ctrl.button_color,
            }, m.e("img.plus", {rotate: ctrl.rotate})),
            m.e(".cover" + cover_class, { 
                opacity: ctrl.cover_opac,
                onclick: () => {},
            })
        );
        if (!ctrl.enabled()) {
            //showing open animation
            m.startComputation();
            setTimeout(() => {
                ctrl.onbtnclick(true, null);
                m.endComputation();
            }, 1);
        }
        return [m.component(HeaderComponent), m(".menu", r)];
    }
}
window.channer.components.Menu = new MenuComponent();

export class MenuElementComponent implements UI.Component {
    static button_color: UI.Property<string>;
    static rotate: UI.Property<number>;
    controller = (): any => {
        throw new Error("override this");        
    }
    view = (ctrl?: UI.Controller, ...args: any[]): UI.Element => {
        if (!MenuElementComponent.button_color) {
            MenuElementComponent.button_color = m.prop(BUTTON_OPEN_COLOR);
            MenuElementComponent.rotate = m.prop(225);            
        }
        return [
            m(".menu", m.e(".main-button", {
                onclick: (e: any) => { Util.route(window.channer.settings.values.last_page_url); },
                backgroundColor: MenuElementComponent.button_color,
            }, m.e("img.plus", {rotate: MenuElementComponent.rotate}))),
            this.menuview(ctrl, ...args)
        ]
    }
    menuview = (ctrl?: UI.Controller, ...args: any[]): UI.Element => {
        throw new Error("override this");        
    }
    iconview = (): UI.Element => {
        throw new Error("override this");        
    };
    pageurl = (): string => {
        throw new Error("override this");
    }
    pagert = (): string|Array<string> => {
        return this.pageurl();
    }
    format_iconview(icon: string, text: string): UI.Element {
        return [
            m(".balloon", text),
            m(".bg", m(icon)),
        ];
    }
    onselected = (ctrl: MenuController) => {
        Util.route(this.pageurl());
    }
}
export class TransitMenuElementComponent extends MenuElementComponent {
    icon: string;
    text: string;
    url: string;
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
    pageurl = (): string => {
        return this.url;
    }
    pagert = (): string => {
        return null;
    }
    iconview = () => {
        return this.format_iconview(this.icon, this.text);
    }
}
