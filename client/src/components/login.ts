/// <reference path="../../typings/extern.d.ts"/>

import {m, Template, BaseComponent, Util} from "../uikit"
import {ProtoError} from "../watcher"
import {Config} from "../config"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

export class LoginController implements UI.Controller {
	static DEFAULT_USER_NAME = _L("user name");
	static DEFAULT_MAIL_ADDR = _L("mail address (optional)");
	component: LoginComponent;
	user: UI.Property<string>;
	mail: UI.Property<string>;
	retype: UI.Property<string>;
	error_message: string;
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
			window.channer.settings.values.secret = r.secret;
			window.channer.settings.values.mail = r.mail || mail;
			window.channer.settings.values.account_id = r.id;
			window.channer.settings.values.user = r.user || user;
			if (r.pass) {
				window.channer.settings.values.pass = r.pass;
			}
			window.channer.settings.save();
			console.log("login success redirect to:" + this.component.next_url);
			Util.route(this.component.next_url, null, {
                replace_history: true,
            });
		}, (e: ProtoError) => {
			console.log("login error:" + e.message);
			if (e.payload.type == ChannerProto.Error.Type.Login_OutdatedVersion) {
				console.log("reload app for updating client:" + window.channer.config.client_version);
				Util.restart_app();
			}
			else {
                if (window.environment.match(/dev/) && 
                    e.payload.type == ChannerProto.Error.Type.Login_DatabaseError) {
                    //maybe database initialized. reset user to open login form again.
                    window.channer.settings.values.user = null;
                    window.channer.settings.values.account_id = null;
                }
                window.channer.settings.values.secret = null;
				window.channer.settings.save();
				this.resetinput();
			}
		});
	}
	sanitized_mail_address = (): string => {
		var mail = this.mail();
		if (!mail.match(/[^@]+@[^@]+/)) {
			mail = "";
		}
		return mail;		
	}
	sendready = (): boolean => {
		var user: string = this.user();
		return (user != LoginController.DEFAULT_USER_NAME && user.length > 0);
	}
}
function LoginView(ctrl: LoginController) : UI.Element {
    if (ctrl.user) { //when auto login, ctrl.user/mail not initialized.
        return ctrl.component.layout(m(".login", [
            m(".logo", "channer"),
            m(".block", 
                Template.textinput(ctrl.user, {
                    class:"input-text user"
                }, LoginController.DEFAULT_USER_NAME)
            ),
            m(".block",
                Template.textinput(ctrl.mail, {
                    class: "input-text mail" 
                }, LoginController.DEFAULT_MAIL_ADDR)
            ),
            m(".block", m("button", {
                onclick: ctrl.onlogin,
                class: ctrl.sendready() ? "enabled" : "disabled",
                disabled: !ctrl.sendready(), 
            }, _L("Login"))),
        ]));
    }
    return ctrl.component.layout();
}
export class LoginComponent extends BaseComponent {
	controller: () => LoginController;
    view: UI.View<LoginController>;
	next_url: string;
	rescue: string;

	constructor(config: Config) {
        super();
		this.view = LoginView;
		this.controller = () => {
			this.next_url = m.route.param("next") || "/top";
			this.rescue = m.route.param("rescue");
			return new LoginController(this);
		}
	}
}

window.channer.components.Login = LoginComponent
