/// <reference path="../../typings/extern.d.ts"/>

import {m, Util} from "../uikit"
import {Config} from "../config"
import ChannerProto = Proto2TypeScript.ChannerProto;

export interface InputObservableController extends UI.Controller {
	oninput(text: string, 
		ok: (resp: ChannerProto.PostResponse) => any, 
		err: (e: Error) => any): any;
}
export class EditController implements UI.Controller {
	component: EditComponent;
	input_text: UI.Property<string>;
	observer: InputObservableController;
	constructor(component: EditComponent) {
		Util.active(this, component);
		this.component = component;
		this.input_text = m.prop("");
	}
	oninput = () => {
		var text = this.input_text();
		if (this.observer) {
			this.observer.oninput(text, (resp: ChannerProto.PostResponse) => {
				console.log("input success:" + resp.posted_at.walltime);
			}, (e: Error) => {
				console.log("input error:" + e.message);
			});
		}
		this.input_text("");
	}
}
function EditView(ctrl: EditController) : UI.Element {
	return [
		m("input", {
			onchange: m.withAttr("value", ctrl.input_text), 
			value: ctrl.input_text(),
			class: "edit-input",
		}),
		m("button", {
			onclick: ctrl.oninput,
			class: "edit-button", 
		}, "Add"),
	];
}
export class EditComponent implements UI.Component {
	controller: () => EditController;
	view: UI.View<EditController>;

	constructor(config: Config) {
		this.view = EditView;
		this.controller = () => {
			return new EditController(this);
		}
	}
}

window.channer.components.Edit = EditComponent
