/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m} from "../uikit"
import {Config} from "../config"

export class EditController implements UI.Controller {
	constructor(config: Config) {
	}
}
function EditView(ctrl: EditController) : UI.Element {
	return m("div")
}
export class EditComponent implements UI.Component {
	controller: () => EditController;
	view: UI.View<EditController>;

	constructor(config: Config) {
		this.view = EditView;
		this.controller = function () {
			return new EditController(config);
		}
	}
}

window.channer.EditComponent = EditComponent
