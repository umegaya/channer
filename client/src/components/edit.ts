/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m, Q} from "../uikit"
import {Config} from "../config"

export interface InputObservableController extends UI.Controller {
	oninput(text: string): Q.Promise<ChannerProto.PostResponse>;
}
export class EditController implements UI.Controller {
	component: EditComponent;
	input_text: UI.Property<string>;
	observer: InputObservableController;
	constructor(component: EditComponent) {
		this.component = component;
		this.input_text = m.prop("");
	}
	oninput = () => {
		var text = this.input_text();
		if (this.observer) {
			this.observer.oninput(text).then(function (resp: ChannerProto.PostResponse) {
				console.log("input success:" + resp.posted_at.walltime);
			}, function (e: Error) {
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

window.channer.EditComponent = EditComponent
