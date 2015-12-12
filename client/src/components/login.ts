/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m, Template} from "../uikit"
import {ProtoError} from "../watcher"
import {Config} from "../config"

export class LoginController implements UI.Controller {
	component: LoginComponent;
	user: UI.Property<string>;
	pass: UI.Property<string>;
	retype_pass: UI.Property<string>;
	error_message: string;
	querying: boolean;
	constructor(component: LoginComponent) {
		this.component = component;
		this.resetinput();
	}
	private resetinput = () => {
		var user = window.channer.settings.values.user;
		var secret = window.channer.settings.values.secret;
		var pass = window.channer.settings.values.pass;
		if (secret && user && pass) {
			console.log("auto login with:" + user + "/" + secret);
			this.sendlogin(user, secret);
		}
		else {
			console.log("input accout information")
			this.user = m.prop(user || "username");
			this.pass = m.prop("password");
			this.retype_pass = m.prop("retype password");
		}
		m.redraw();
	}
	onlogin = () => {
		var user = this.user();
		var pass = this.pass();
		console.log("login with:" + user + "/" + pass);
		if (!this.retype_pass || this.retype_pass() == pass) {
			this.sendlogin(user, null, pass);
		}
		else {
			this.error_message = "retype password not match";
		}
	}
	sendlogin = (user: string, secret: string, pass?: string) => {
		window.channer.conn.login(user, secret, pass)
		.then((r: ChannerProto.LoginResponse) => {
			console.log("login success:" + r.secret);
			this.querying = false;
			window.channer.settings.values.secret = r.secret;
			window.channer.settings.values.user = user;
			if (pass) {
				window.channer.settings.values.pass = pass;
			}
			window.channer.settings.save();
			m.route(this.component.next_url);
		}, (e: ProtoError) => {
			console.log("login error:" + (e.message || e.payload.type));
			this.querying = false;
			this.error_message = e.message;
			window.channer.settings.values.secret = null;
			window.channer.settings.values.pass = null;
			window.channer.settings.save();
			this.resetinput();
		});
		this.querying = true;
		this.error_message = null;
	}
}
function LoginView(ctrl: LoginController) : UI.Element {
	if (ctrl.querying) {
		return [
			m("div", {class: "common-querying"}, "send request now"),
		] 
	}
	else {
		var elements = [ 
			m("div", ctrl.error_message || "please enter account/password"),
		]
		elements.push(Template.textinput(ctrl.user, "login-input-user", "username"));
		elements.push(Template.textinput(ctrl.pass, "login-input-pass", "password", true));
		if (ctrl.retype_pass) {
			elements.push(Template.textinput(ctrl.retype_pass, "login-input-pass-retype", "retype password", true))
		}
		elements.push(m("button", {
			onclick: ctrl.onlogin,
			class: "login-button", 
		}, "Login"));
		return elements;
	}
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
