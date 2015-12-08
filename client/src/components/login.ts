/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m} from "../uikit"
import {Config} from "../config"

export class LoginController implements UI.Controller {
	constructor(config: Config) {
	}
}
function LoginView(ctrl: LoginController) : UI.Element {
	return [ m("div", "please enter account/password") ]
}
export class LoginComponent implements UI.Component {
	controller: () => LoginController;
	view: UI.View<LoginController>;

	constructor(config: Config) {
		this.view = LoginView;
		this.controller = function () {
			return new LoginController(config);
		}
	}
}

window.channer.LoginComponent = LoginComponent
