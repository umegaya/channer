/// <reference path="../typings/extern.d.ts"/>
/// <reference path="../typings/UI.d.ts"/>
export var m : any = window.channer.m;
export var Q : any = window.channer.Q;

export class Template {
	static textinput(bind: UI.Property<string>, klass: string, initval: string) {
		var value = bind();
		return m("input", {
			onchange: m.withAttr("value", bind),
			onfocus: function () { 
				var v = bind()
				if (v == initval) { bind(""); } 
			},
			onblur: function () { 
				var v = bind()
				if (v == "") { bind(initval); } 
			},
			style: { color: (value.length > 0 && value != initval) ? "#000000" : "#999999"},
			value: value,
			class: klass,
		})	
	}
}
