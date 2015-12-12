/// <reference path="../typings/extern.d.ts"/>
/// <reference path="../typings/UI.d.ts"/>
export var m : any = window.channer.m;
export var Q : any = window.channer.Q;

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
