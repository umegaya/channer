/// <reference path="../typings/extern.d.ts"/>

import {Handler} from "./proto"
export var m : _mithril.MithrilStatic = window.channer.m;

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
                        console.log("fallback is empty str: set it");
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
	static route(dest: string, route_only?: boolean) {
		if (!route_only) {
			window.channer.settings.values.last_url = dest;
			window.channer.settings.save();
		}
		m.route(dest);
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
}
export interface Router {
    (rootElement: Element, defaultRoute: string, 
        routes: _mithril.MithrilRoutes<UI.Controller>): void;
}
export class Template {
	static textinput(bind: UI.Property<string>, 
        options: UI.Attributes, initval: string, secure?:boolean) {
		var value = bind();
		var has_input = (value != initval); 
     	return m("input", {
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
			style: { color: has_input ? "#000000" : "#999999" },
			type: (secure && has_input) ? "password" : "text",
			value: value,
        	class: options.class,
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
                style: { "background-color": active ? "#9999FF" : "#FFFFFF"},
                value: sel[0],
                onclick: m.withAttr("value", prop),
            }, sel[1]));
        }
        return m("div", options, elems);
    }
    static tab(
        active: UI.Property<string>, 
        tabs: [string]
    ): UI.Element {
        var a : string = active();
        var elems: Array<UI.Element> = [];
        for (var i in tabs) {
            var k = tabs[i];
            var activeness = (k == a) ? "active" : "not-active";
            elems.push(m("div", {
                value: k,
                class: "div-tab-element " + activeness + " " + k,
                onclick: m.withAttr("value", active),
            }, k));
        }
        return m("div", {class: "div-tab"}, elems);
    } 
    static header(): Array<UI.Element> {
        var elements : Array<UI.Element> = [];
        var c : Handler = window.channer.conn;
        var rd = c.reconnect_duration();
        var connecting = c.connecting();
        var err = c.last_error;
        if (c.querying) {
            //TODO: replace to cool GIF anim
            elements.push(m("div", {class: "div-query"}, "sending request now"));
        }
        //TODO: custom header message from current active component
        //otherwise show system network status
        if (rd > 0) {
            //TODO: tap to reconnection
            elements.push(m("div", {class: "div-wait-reconnect"}, 
                "reconnect within " + rd + " second"));            
        }
        else if (connecting) {
            elements.push(m("div", {class: "div-reconnecting"}, "reconnecting"));
        }
        else {
            if (err) {
                //TODO: tap to remove message
                elements.push(m("div", {class: "div-request-error"}, err)); 
            }
            elements.push(m("div", {class: "div-latency"}, c.latency + "ms"));
        }
        return elements;
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
        return m("div", {class: this.name + "-list"}, models.empty() ?
            m("div", {class: "div-text"}, "no " + this.name + " elements") :  
            models.map((m: any) => {
                return this.elemview(models, m);
            })
        );
    }
}
