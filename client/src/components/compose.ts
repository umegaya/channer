/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m} from "../uikit"
import {Config} from "../config"

export class ComposeController implements UI.Controller {
	constructor(config: Config) {
	}
}
function ComposeView(ctrl: ComposeController) : UI.Element {
	return m("div")
}
export class ComposeComponent implements UI.Component {
	controller: () => ComposeController;
	view: UI.View<ComposeController>;

	constructor(config: Config) {
		this.view = ComposeView;
		this.controller = function () {
			return new ComposeController(config);
		}
	}
}

window.channer.ComposeComponent = ComposeComponent