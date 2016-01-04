/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m, Template, Util} from "../uikit"
import {ProtoError} from "../watcher"
import {Config} from "../config"
import ChannerProto = Proto2TypeScript.ChannerProto;

export class LoginController implements UI.Controller {
	component: LoginComponent;
	user: UI.Property<string>;
	mail: UI.Property<string>;
	retype: UI.Property<string>;
	error_message: string;
	querying: boolean;
	constructor(component: LoginComponent) {
		this.component = component;
		this.resetinput();
	}
	private resetinput = () => {
		var user = window.channer.settings.values.user;
		var secret = window.channer.settings.values.secret;
		var mail = window.channer.settings.values.mail;
		console.log("user/secret/mail " + user + "|" + secret + "|" + mail);
		if (secret && user) {
			console.log("auto login with:" + user + "/" + secret);
			this.sendlogin(user, mail, secret);
		}
		else if (!user || !mail) {
			this.user = m.prop(user || "username");
			this.mail = m.prop(mail || "mail address");
		}
		else {
			console.log("auto login with:" + user + "&" + mail);
			this.sendlogin(user, mail);
		}
		m.redraw();
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
			window.channer.settings.values.mail = mail;
			window.channer.settings.values.account_id = r.id;
			window.channer.settings.values.user = user;
			window.channer.settings.save();
			console.log("login success redirect to:" + this.component.next_url);
			Util.route(this.component.next_url);
		}, (e: ProtoError) => {
			console.log("login error:" + e.message);
			this.querying = false;
			this.error_message = e.message;
			window.channer.settings.values.secret = null;
			window.channer.settings.save();
			if (e.payload.type == ChannerProto.Error.Type.Login_OutdatedVersion) {
				console.log("reload app for updating client:" + window.channer.config.client_version);
				Util.restart_app();
			}
			else {
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
		return this.user().length > 0;
	}
}
function LoginView(ctrl: LoginController) : UI.Element {
	var elements : Array<UI.Element>;
	if (ctrl.querying) {
		elements = [
			m("div", {class: "querying"}, "send request now"),
		]
	}
	else {
		elements = [ 
			m("div", ctrl.error_message || "please enter username"),
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

	constructor(config: Config, next_url: string) {
		this.view = LoginView;
		this.controller = () => {
			this.next_url = m.route.param("next") || "/channel";
			this.rescue = m.route.param("rescue");
			return new LoginController(this);
		}
	}
}

window.channer.LoginComponent = LoginComponent
