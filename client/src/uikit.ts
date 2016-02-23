/// <reference path="../typings/extern.d.ts"/>

import {Handler} from "./proto"
import {MenuComponent, MenuElementComponent} from "./components/menu"
import {ScrollComponent} from "./components/parts/scroll"
import {Storage, StorageIO, Persistable} from "./storage"
import Q = require('q');
export var m : _mithril.MithrilStatic = window.channer.m;
var _L = window.channer.l10n.translate;
var _LD = window.channer.l10n.translateDate;
var Scroll = window.channer.parts.Scroll;

interface PropCondition {
    init: any;
    fallback?: any;
    check?: any;
}
export class PropConditions {
    required: {
        [k:string]:PropCondition,
    };
    optional: {
        [k:string]:PropCondition,
    }
};
export class PropCollection implements Persistable {
    name: string;
    save_scheduled: any;
    cond: PropConditions;
    props:{[k:string]: UI.Property<any>};
    constructor(name: string, cond: PropConditions) {
        this.props = {};
        this.name = name;
        this.save_scheduled = undefined;
        this.cond = cond;
        this.init();
    }
    init = (clear?: boolean) => {
        var cond = this.cond;
        for (var k in cond.required) {
            var ini = cond.required[k].init;
            this.create_prop(k, ini);
        }
        for (var k in cond.optional) {
            var ini = cond.optional[k].init;
            this.create_prop(k, ini);
        }
        if (clear) {
            window.channer.storage.open("form/" + this.name).then(
                (io: StorageIO) => { return io.rm(); }
            );
        }
        else {
            //trigger redraw
            this.loadprop().then(() => { 
                m.endComputation(); 
            }, (e: Error) => {
            console.log("PropCollection init error by " + e.message);
                m.endComputation();             
            });
        }
    }
    clear = () => {
        this.init(true);
    }
    private create_prop = (k: string, v: string|number) => {
        this.props[k] = m.prop(v);
    }
    //storage IO
    save = () => {
        if (!this.save_scheduled) {
            this.save_scheduled = setTimeout(this.saveprop, 1000);
        }
    }
    private saveprop = (): Q.Promise<PropCollection> => {
        console.log("save");
        this.save_scheduled = undefined;
        return window.channer.storage.open("form/" + this.name, {create: true})
            .then(
                (io: StorageIO) => { return io.write(this) },
                (e: Error) => { console.log("save error: " + e.message)});
    }
    private loadprop = (): Q.Promise<PropCollection> => {
        return window.channer.storage.open("form/" + this.name, {create: true})
            .then((io: StorageIO) => { return io.read(this) });  
    }
    //implement persistable
    type = () => {
		return "text/plain";
	}
	read = (blob: string) => {
		console.log("form blob:" + blob)
		if (blob.length > 0) {
			var loaded = JSON.parse(blob);
            for (var k in loaded) {
                if (!this.props[k]) {
                    this.props[k] = m.prop(loaded[k]);
                }
                else {
                    this.props[k](loaded[k]);
                }
            }
		}
	}
	write = (): string => {
        var values: { [k:string]: any } = {}
        for (var k in this.props) {
            values[k] = this.props[k]();
        }
		return JSON.stringify(values);
	}
    //validation
    check = (): {[k:string]:any} => {
        var verified: {[k:string]:string|number} = {};
        var cond = this.cond;
        for (var k in cond.required || {}) {
            var p = this.props[k];
            var c = cond.required[k];
            if (p) {
                var v = p();
                if (!this.validate(v, c)) {
                    return;
                }
                verified[k] = v;
            }
        }
        for (var k in cond.optional || {}) {
            var p = this.props[k];
            var c = cond.optional[k];
            if (p) {
                var v = p();
                if (!this.validate(v, c)) {
                    if (c.fallback == "") {
                        //console.log("fallback is empty str: set it");
                        v = c.fallback;
                    }
                    else {
                        v = c.fallback || c.init;
                    }
                }
                verified[k] = v;
            }
        }
        for (var k in this.props) {
            var val = verified[k];
            if (!val && (val != "")) {
                verified[k] = this.props[k]();
            }
        }
        return verified;
    }
    private validate = (val: any, cond: PropCondition): boolean => {
        if (typeof(val) == "string" && !val) {
            return false;
        }
        if (typeof(cond.check) == "undefined") {
            return val != cond.init;
        }
        else if (typeof(cond.check) == "function") {
            return cond.check(val);
        }
        return cond.check != val;
    }
};
export class Util {
	static active(ctrl: UI.Controller, component: UI.Component) {
        var current = window.channer.components.active;
		current.component = component;
		current.ctrl = ctrl;
	}
	static route(dest: string, params?: any, options?: {
            route_only?: boolean; 
            replace_history?: boolean; 
    }) {
        options = options || {};
		if (!options.route_only) {
			window.channer.settings.values.last_url = dest;
			window.channer.settings.save();
		}
		m.route(dest, params, options.replace_history);
	}
	static restart_app() {
		document.location.pathname = "/";
		document.location.reload();
	}
    static hexdump(b: Uint8Array) {
		var hex = "0123456789abcdef";
		var str = "";
		for (var i = 0; i < b.length; i++) {
			var byte = b[i];
			var hi = Math.floor(byte / 16);
			var lo = Math.floor(byte % 16);
			str += (hex.charAt(hi) + hex.charAt(lo));
		}
		return str;
    }
    static epoc: Date = new Date(2015, 0, 1, 0, 0, 0);//2015/01/01 00:00:00
    static uuid2date(uuid: Long): Date {
        //shift 15bit => convert to msec (1 == 10us)
        var date: Date = new Date(
            Util.epoc.getTime() + uuid.divide(32768).divide(100).toNumber()
        );
        return date;
    }
    static long2date(long: Long): Date {
        //long date has nano seconds (1000000000 ns == 1s) precision.
        var date: Date = new Date(
            Util.epoc.getTime() + long.divide(1000000).toNumber()
        );
        return date;
    }
}
export interface Router {
    (rootElement: Element, defaultRoute: string, 
        routes: _mithril.MithrilRoutes<UI.Controller>): void;
}
export class Template {
    static date(d: Date, duration?:boolean) {
        var str: string;
        if (duration) {
            var diff: number = ((new Date()).getTime() - d.getTime());
            if (diff < 1000) {
                str = _L("just now")
            }
            //TODO: correctly handle singular/plural form, 
            //like a second/2 seconds
            else if (diff < 60000) {
                str = _L("$1 seconds", Math.floor(diff / 1000));
            }
            else if (diff < 3600000) {
                str = _L("$1 minutes", Math.floor(diff / 60000));
            }
            else if (diff < 86400000) {
                str = _L("$1 hours", Math.floor(diff / 3600000));
            }
            else {
                str = _L("$1 days", Math.floor(diff / 86400000));
            }
        }
        else {
            str = d.getHours() + ":" + d.getMinutes();
        }
        return m("div", {class: "date"}, str);
    }
    static datebyuuid(uuid: any, duration?:boolean) {
        return Template.date(Util.uuid2date(<Long>uuid), duration);
    }
    static datebylong(long: any, duration?:boolean) {
        return Template.date(Util.long2date(<Long>long), duration);
    }
    static header(): UI.Element {
        var elements : Array<UI.Element> = [];
        var c : Handler = window.channer.conn;
        var rd = c.reconnect_duration();
        var err = c.last_error;
        var msgs: UI.Element;
        var attrs : any = {
            class: "container full-length",
        };
        if (rd && rd > 0) {
            //TODO: tap to reconnection
            var tmp: Array<UI.Element> = [
                m("div", {class: "msg wait-reconnect"},
                    _L("reconnect within $1 second", rd)),
            ];
            if (c.reconnect_enabled()) {
                tmp.push(m("div", {class: "connect"}, _L("do it now")));
                attrs.onclick = () => { c.reconnect_now(); };
            }
            msgs = tmp;
        }
        else if (c.connected()) {
            if (c.querying) {
                //TODO: replace to cool CSS anim
                msgs = m("div", {class: "msg"}, _L("sending request now"));
            }
            else if (err && err.message) {
                msgs = [
                    m("div", {class: "msg"}, err.message), 
                    m("div", {class: "x"}, _L("dismiss"))
                ];
                attrs.onclick = () => { c.last_error = null; };
            }
            else {
                msgs = m("div", {class: "msg"});
            }
            attrs.class = "container";
            return m("div", {class: "header"}, 
                m("div", {class: "stats"}, [
                    m("div", attrs, msgs), 
                    m("div", {class: "latency"}, c.latency + "ms")
                ])
            );
        }
        else if (c.connecting() || rd <= 0) {
            msgs = m("div", {class: "msg"}, _L("reconnecting"));
        }
        return m("div", {class: "header"}, 
            m("div", {class: "stats"}, m("div", attrs, msgs)));
    }
}

export interface ModelCollection {
    map(fn: (m: any) => UI.Element): Array<any>;
    fetch(page: number): void;
    refresh(): void;
    empty():boolean;
}
export class ListComponent implements UI.Component {
	elemview: (c: ModelCollection, model: any) => UI.Element;
    models: ModelCollection;
    name: string;

	constructor(name: string, 
        models: ModelCollection, 
        view: (c: ModelCollection, model: any) => UI.Element) {
        this.elemview = view;
        this.name = name;
        this.models = models;
	}
    controller = (): any => {
        return this.models;
    }
    view = (models: ModelCollection): UI.Element => {
        return m(".scroll-container", m.component(Scroll, {
            class: this.name + " listview",
            item: (model: any) => { return this.elemview(this.models, model); },
            pageData: this.models.fetch
        }));
    }
    refresh = () => {
        this.models.refresh();
    }
}
export class BaseComponent implements UI.Component {
    static transit = window.channer.mtransit({
        anim: (last: Element, next: Element, dir: string, 
            cblast: () => void, cbnext: () => void) => {
            last.addEventListener('animationend', cblast);
            next.addEventListener('animationend', () => {
                next.classList.remove('transition-in', 'transition-out');
                cbnext();
            });
            last.classList.add('transition-out');
            next.classList.add('transition-in');
        } 
    });
    mc: MenuComponent;
    checked: boolean;
    name: string;
    constructor() {
    }
    controller = (): any => {
        throw new Error("override this");
    }
    view = (ctrl: UI.Controller): UI.Element => {
        throw new Error("override this");
    }
    menus = (): Array<MenuElementComponent> => {
        return null;
    }
    layout = (contents?: UI.Element): UI.Element => {
        if (!this.checked && !this.mc) {
            var menus = this.menus();
            if (menus != null) {
                this.mc = new MenuComponent(menus);
            }
            this.checked = true;
        }
        var tmp: [any] = [Template.header()];
        if (this.mc) {
            tmp.push(this.mc);
        }
        if (contents) {
            tmp.push(contents);
        }
        return m(".screen", <UI.Attributes>{
            config: BaseComponent.transit, key: m.route()
        }, tmp);
    }
}
