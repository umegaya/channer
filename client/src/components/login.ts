/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m, Template} from "../uikit"
import {Config} from "../config"

export class LoginController implements UI.Controller {
	component: LoginComponent;
	user: UI.Property<string>;
	pass: UI.Property<string>;
	constructor(component: LoginComponent) {
		this.component = component;
		this.clearinput();
	}
	private clearinput = () => {
		this.user = m.prop("username");
		this.pass = m.prop("password");
	}
	onlogin = () => {
		var user = this.user();
		var pass = this.pass();
		console.log("login with:" + user + "/" + pass);
		window.channer.conn.login(user, pass)
		.then((r: ChannerProto.LoginResponse) => {
			console.log("login success");
			m.route(this.component.next_url);
		}, (e: Error) => {
			console.log("login error:" + e.message);
			this.clearinput();
		});
	}
}
function LoginView(ctrl: LoginController) : UI.Element {
	return [ 
		m("div", "please enter account/password"),
		Template.textinput(ctrl.user, "login-input-user", "username"),
		Template.textinput(ctrl.pass, "login-input-pass", "password"),
		m("button", {
			onclick: ctrl.onlogin,
			class: "login-button", 
		}, "Login"),
	]
}
export class LoginComponent implements UI.Component {
	controller: () => LoginController;
	view: UI.View<LoginController>;
	next_url: string;

	constructor(config: Config, next_url?: string) {
		this.view = LoginView;
		this.next_url = next_url || "/org";
		this.controller = function () {
			return new LoginController(this);
		}
	}
}

window.channer.LoginComponent = LoginComponent
