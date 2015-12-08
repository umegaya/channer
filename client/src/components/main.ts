/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m} from "../uikit"
import {Config} from "../config"

export class MainController implements UI.Controller {
	constructor(config: Config) {
	}
}
function MainView(ctrl: MainController) : UI.Element {
	return m("div")
}
export class MainComponent implements UI.Component {
	controller: () => MainController;
	view: UI.View<MainController>;

	constructor(config: Config) {
		this.view = MainView;
		this.controller = function () {
			return new MainController(config);
		}
	}
}

window.channer.MainComponent = MainComponent
