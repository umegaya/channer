/// <reference path="../../typings/extern.d.ts"/>

import {m, Util} from "../uikit"
import {Pagify, PageComponent, BaseComponent} from "./base"
import {HeaderComponent} from "./parts/header"
import {Config} from "../config"
import {ProtoError} from "../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

var BUTTON_CLOSE_COLOR = "#2780f8";
var BUTTON_OPEN_COLOR = "#ed6c63";

export class MenuController implements UI.Controller {
    enabled: UI.Property<boolean>;
    initialized: boolean;
    rotate: UI.Property<number>;
    menu_opac: UI.Property<number>;
    button_color: UI.Property<string>;
    
	constructor() {
        this.enabled = m.prop(false);
        this.initialized = false;
        this.rotate = m.prop(0);
        this.menu_opac = m.prop(0);
        this.button_color = m.prop(BUTTON_CLOSE_COLOR);
	}
    tryopen() {
        if (!this.initialized) {
            //showing open animation
            m.startComputation();
            setTimeout(() => {
                this.onbtnclick(true, null);
                m.endComputation();
            }, 1);          
            this.initialized = true; 
        }   
    }
    onbtnclick = (open: boolean, parent_path: string) => {
        this.switch(open);
        if (open) {
            this.menu_opac(1);
        }
        else {
            this.menu_opac(0);
            //wait animation end, then route to parent
            setTimeout(() => { Util.route(parent_path); }, 300);
        }        
    }
    switch(open: boolean) {
        this.enabled(open);
        if (open) {
            this.button_color(BUTTON_OPEN_COLOR);
            this.rotate(225);
        }
        else {
            this.button_color(BUTTON_CLOSE_COLOR);
            this.rotate(0);
        }
    }
    createbutton(onclick: (e: any) => void): UI.Element {
        return m.e(".main-button", {
            onclick: onclick,
            backgroundColor: this.button_color,
        }, m.e("img.plus", {rotate: this.rotate}))
    }
}
export class Route {
    [k:string]: UI.Component;
}
export class MenuComponent extends PageComponent {
    rt: Route;
    setup = (route: Route): Route => {
        var rt: Route = new Route();
        rt["/menus/:parent_path..."] = this;
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
        return new MenuController();
    }
	view = (ctrl: MenuController, route: string) : UI.Element => {
        if (typeof route === "string") {
            //only show button for routing to /menu/:parent_path.
            //TODO: if only one menu, should we route to the menu directly?
            return m(".menu", ctrl.createbutton(() => { Util.route("/menus" + route); }));
        }
        //otherwise route contains :parent_path parameter.
        var parent_path = "/" + m.route.param("parent_path");
        var menus: Array<MenuElementComponent> = this.current_menus(parent_path);
        var r: Array<UI.Element> = [];
        var state_class: string = ctrl.enabled() ? ".open" : ".close";
        //!important: if virtual element pos is moved during its animation plays, 
        //animation stops. so always put button element at first of .menu.
        //whether .cover element put or not
        r.push(ctrl.createbutton(ctrl.onbtnclick.bind(ctrl, false, parent_path)));
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
        ctrl.tryopen();
        return [m.component(HeaderComponent), m(".menu", r)];
    }
}
window.channer.components.Menu = new MenuComponent();

export class MenuElementComponent implements UI.Component {
    static _factory: MenuController;
    static factory():  MenuController {
        if (!MenuElementComponent._factory) {
            MenuElementComponent._factory = new MenuController();
            MenuElementComponent._factory.switch(true);
        }
        return MenuElementComponent._factory;
    }
    controller = (): any => {
        throw new Error("override this");        
    }
    view = (ctrl?: UI.Controller, ...args: any[]): UI.Element => {
        return [
            m.component(HeaderComponent),
            //menu button in menu element alway start with opened state. 
            m(".menu", MenuElementComponent.factory().createbutton(
                (e: any) => { 
                    MenuElementComponent.factory().switch(false);
                    setTimeout(() => { 
                        Util.route(window.channer.settings.values.last_page_url);
                    }, 300);
                }
            )),
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
        MenuElementComponent.factory().switch(true);
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
