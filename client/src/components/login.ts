/// <reference path="../../typings/extern.d.ts"/>

import {m, Template, Util} from "../uikit"
import {ProtoError} from "../watcher"
import {Config} from "../config"
import ChannerProto = Proto2TypeScript.ChannerProto;

export class LoginController implements UI.Controller {
	static DEFAULT_USER_NAME = "username";
	static DEFAULT_MAIL_ADDR = "mail address";
	component: LoginComponent;
	user: UI.Property<string>;
	mail: UI.Property<string>;
	retype: UI.Property<string>;
	error_message: string;
	querying: boolean;
	constructor(component: LoginComponent) {
		Util.active(this, component);
		this.component = component;
		this.resetinput();
	}
	private resetinput = () => {
		var user = window.channer.settings.values.user;
		var secret = window.channer.settings.values.secret;
		var mail = window.channer.settings.values.mail;
		//note that mail is empty string, its treated as falsy value 
		console.log("user/secret/mail " + user + "|" + secret + "|" + mail);
		if (this.component.rescue) {
			console.log("rescue login with:" + this.component.rescue);
			this.sendlogin("dummy", "");
		}
		else if (secret && user) {
			console.log("auto login with:" + user + "/" + secret);
			this.sendlogin(user, mail, secret);
		}
		else if (!user) {
			this.user = m.prop(user || LoginController.DEFAULT_USER_NAME);
			this.mail = m.prop(mail || LoginController.DEFAULT_MAIL_ADDR);
		}
		else {
			console.log("auto login with:" + user + "&" + mail);
			this.sendlogin(user, mail);
		}
	}
	onlogin = () => {
		var user = this.user();
		var mail = this.sanitized_mail_address();
		console.log("login with:" + user + "/" + mail);
		this.sendlogin(user, mail);
	}
	sendlogin = (user: string, mail: string, secret?: string) => {
		var pass = window.channer.settings.values.pass;
		window.channer.conn.login(user, mail, secret, pass, this.component.rescue)
		.then((r: ChannerProto.LoginResponse) => {
			console.log("login success!:" + r.secret + "|" + r.id);
			this.querying = false;
			window.channer.settings.values.secret = r.secret;
			window.channer.settings.values.mail = r.mail || mail;
			window.channer.settings.values.account_id = r.id;
			window.channer.settings.values.user = r.user || user;
			if (r.pass) {
				window.channer.settings.values.pass = r.pass;
			}
			window.channer.settings.save();
			console.log("login success redirect to:" + this.component.next_url);
			Util.route(this.component.next_url);
		}, (e: ProtoError) => {
			console.log("login error:" + e.message);
			this.querying = false;
			if (e.payload.type == ChannerProto.Error.Type.Login_OutdatedVersion) {
				console.log("reload app for updating client:" + window.channer.config.client_version);
				Util.restart_app();
			}
			else {
				this.error_message = e.message;
				window.channer.settings.values.secret = null;
				window.channer.settings.save();
				this.resetinput();
			}
		});
		this.querying = true;
		this.error_message = null;
	}
	sanitized_mail_address = (): string => {
		var mail = this.mail();
		if (!mail.match(/[^@]+@[^@]+/)) {
			mail = "";
		}
		return mail;		
	}
	sendlogin_ready = (): boolean => {
		var user: string = this.user();
		return (user != LoginController.DEFAULT_USER_NAME && user.length > 0);
	}
}
function LoginView(ctrl: LoginController) : UI.Element {
	var elements : Array<UI.Element>;
	if (ctrl.querying) {
		elements = [
			m("div", {class: "div-querying"}, "sending request now"),
		]
	}
	else {
		var title_class = ctrl.error_message ? "div-title-error" : "div-title"; 
		elements = [ 
			m("div", {class: title_class}, ctrl.error_message || "please enter username"),
		]
		elements.push(Template.textinput(ctrl.user, "input-user", "username"));
		elements.push(Template.textinput(ctrl.mail, "input-mail", "mail address"));
		elements.push(m("button", {
			onclick: ctrl.onlogin,
			class: ctrl.sendlogin_ready() ? 
				"button-login" : 
				"button-login-disabled", 
		}, "Login"));
	}
	return m("div", {class: "login"}, elements);
}
export class LoginComponent implements UI.Component {
	controller: () => LoginController;
	view: UI.View<LoginController>;
	next_url: string;
	rescue: string;

	constructor(config: Config) {
		this.view = LoginView;
		this.controller = () => {
			this.next_url = m.route.param("next") || "/channel";
			this.rescue = m.route.param("rescue");
			return new LoginController(this);
		}
	}
}

window.channer.components.Login = LoginComponent
