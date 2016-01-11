/// <reference path="../typings/extern.d.ts"/>

import {Handler} from "./proto"
export var m : any = window.channer.m;

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
}
export class Template {
	static textinput(bind: UI.Property<string>, 
        options: {class?:string, id?:string}, initval: string, secure?:boolean) {
		var value = bind();
		var has_input = (value != initval); 
		return m("input", {
			onchange: m.withAttr("value", bind),
			onfocus: function () { 
				var v = bind()
				if (v == initval) { 
					bind(""); 
					m.redraw();
				} 
			},
			onblur: function () { 
				var v = bind()
				if (v == "") { 
					bind(initval); 
					m.redraw();
				} 
			},
			style: { color: has_input ? "#000000" : "#999999" },
			type: (secure && has_input) ? "password" : "text",
			value: value,
            id: options.id, 
			class: options.class,
		})	
	}
    static radio(options: { [key:number]:string }, prop: UI.Property<number>): UI.Element {
        for (var k in options) {
            
        }
        return m("div", {class: "radio"});
    }
    static header(): Array<UI.Element> {
        var elements : Array<UI.Element> = [];
        var c : Handler = window.channer.conn;
        var rd = c.reconnect_duration();
        if (c.querying) {
            elements.push(m("div", {class: "div-query"}, "sending request now"));
        }
        if (rd > 0) {
            elements.push(m("div", {class: "div-reconnection"}, 
                "reconnect within " + rd + " second"));            
        }
        else {
            elements.push(m("div", {class: "div-latency"}, c.latency + "ms"));
        }
        return elements;
    }
}
