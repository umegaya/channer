/// <reference path="../typings/extern.d.ts"/>

import {Handler} from "./proto"
import {MenuComponent, MenuElementComponent} from "./components/menu"
export var m : _mithril.MithrilStatic = window.channer.m;
var _L = window.channer.l10n.translate;
var _LD = window.channer.l10n.translateDate;

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
export class PropCollection {
    cond: PropConditions;
    props:{[k:string]: UI.Property<any>};
    constructor(cond: PropConditions) {
        this.props = {};
        this.cond = cond;
        for (var k in cond.required) {
            var ini = cond.required[k].init;
            this.create_prop(k, ini);
        }
        for (var k in cond.optional) {
            var ini = cond.optional[k].init;
            this.create_prop(k, ini);
        }
    }
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
    private create_prop = (k: string, v: string|number) => {
        this.props[k] = m.prop(v);
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
	static textinput(bind: UI.Property<string>, 
        options: UI.Attributes, initval: string, textarea?:boolean) {
		var value = bind();
		var has_input = (value != initval); 
     	return m(textarea ? "textarea": "input", {
			oninput: m.withAttr("value", bind),
			onfocus: function () { 
				var v = bind();
				if (v == initval) { 
					bind(""); 
					m.redraw();
				} 
			},
			onblur: function () { 
				var v = bind();
				if (v == "") { 
					bind(initval); 
					m.redraw();
				} 
			},
			type: (options.secure && has_input) ? "password" : "text",
			value: value,
        	class: options.class + " " + (has_input ? "active" : "not-active"),
		});
	}
    static radio(options: UI.Attributes, name: string,
        selects: [[number, string]], prop: UI.Property<number>): UI.Element {
        var elems: Array<UI.Element> = [];
        var current = prop();
        for (var k in selects) {
            var sel = selects[k];
            var active = (sel[0] == current);
            elems.push(m("button", { 
                class: sel[1] + " " + (active ? "active" : "not-active"),
                value: sel[0],
                onclick: m.withAttr("value", prop),
            }, sel[1]));
        }
        return m("div", options, elems);
    }
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
    static tab(
        active: UI.Property<string>, 
        tabs: {[k:string]:string}
    ): UI.Element {
        var a : string = active();
        var elems: Array<UI.Element> = [];
        for (var k in tabs) {
            var v = tabs[k];
            var activeness = (k == a) ? "active" : "not-active";
            elems.push(m("div", {
                value: k,
                class: "tab-element " + activeness + " " + k,
                onclick: m.withAttr("value", active),
            }, m("div", {class: "label"}, v)));
        }
        return m("div", {class: "tab"}, elems);
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
    refresh(): void;
    empty():boolean;
}
export class ListComponent implements UI.Component {
	elemview: (c: ModelCollection, m: any) => UI.Element;
    models: ModelCollection;
    name: string;

	constructor(name: string, 
        models: ModelCollection, 
        view: (c: ModelCollection, m: any) => UI.Element) {
        this.elemview = view;
        this.name = name;
        this.models = models;
        models.refresh();
	}
    controller = (): any => {
        return this.models;
    }
    view = (models: ModelCollection): UI.Element => {
        return m("div", {class: this.name + " listview"}, models.empty() ?
            m("div", {class: "text"}, _L("no elements")) :  
            models.map((m: any) => {
                return this.elemview(models, m);
            })
        );
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
