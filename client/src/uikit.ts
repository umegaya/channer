/// <reference path="../typings/extern.d.ts"/>

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
	static textinput(bind: UI.Property<string>, klass: string, initval: string, secure?:boolean) {
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
			class: klass,
		})	
	}
}
