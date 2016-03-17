/// <reference path="../../typings/extern.d.ts"/>

import {m, Pagify, PageComponent, Util} from "../uikit"
import {ProtoError} from "../watcher"
import {Config} from "../config"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;
var Button = window.channer.parts.Button;
var TextField = window.channer.parts.TextField;

class LoginController implements UI.Controller {
	static DEFAULT_USER_NAME = _L("user name");
	static DEFAULT_MAIL_ADDR = _L("mail address (optional)");
	user: UI.Property<string>;
	mail: UI.Property<string>;
	retype: UI.Property<string>;
	error_message: string;
	next_url: string;
	rescue: string;
	constructor() {
        this.next_url = m.route.param("next") || "/top";
        this.rescue = m.route.param("rescue");
		this.resetinput();
	}
	onlogin = () => {
		var user = this.user();
		var mail = this.sanitized_mail_address();
		console.log("login with:" + user + "/" + mail);
		this.sendlogin(user, mail);
	}
	sendready(): boolean {
		var user: string = this.user();
		return (user != LoginController.DEFAULT_USER_NAME && user.length > 0);
	}
	private resetinput() {
		var user = window.channer.settings.values.user;
		var secret = window.channer.settings.values.secret;
		var mail = window.channer.settings.values.mail;
		//note that mail is empty string, its treated as falsy value 
		console.log("user/secret/mail " + user + "|" + secret + "|" + mail);
		if (this.rescue) {
			console.log("rescue login with:" + this.rescue);
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
	private sendlogin(user: string, mail: string, secret?: string) {
		var pass = window.channer.settings.values.pass;
		window.channer.conn.login(user, mail, secret, pass, this.rescue)
		.then((r: ChannerProto.LoginResponse) => {
			console.log("login success!:" + r.secret + "|" + r.id);
			window.channer.settings.values.secret = r.secret;
			window.channer.settings.values.mail = r.mail || mail;
			window.channer.settings.values.account_id = r.id.toString();
			window.channer.settings.values.user = r.user || user;
			if (r.pass) {
				window.channer.settings.values.pass = r.pass;
			}
			window.channer.settings.save();
			console.log("login success redirect to:" + this.next_url);
			Util.route(this.next_url, null, {
                replace_history: true,
            });
		}, (e: ProtoError) => {
			console.log("login error:" + e.message + "|" + m.route());
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
	private sanitized_mail_address = (): string => {
		var mail = this.mail();
		if (!mail.match(/[^@]+@[^@]+/)) {
			mail = "";
		}
		return mail;		
	}
}
function LoginView(ctrl: LoginController) : UI.Element {
    if (ctrl.user) { //when auto login, ctrl.user/mail not initialized.
        return m(".login.form.fullWidth", [
            m(".logo", m(".title", "channer")),
            m.component(TextField, {
                label: LoginController.DEFAULT_USER_NAME,
                required: true,
                autofocus: true,
                oninput: ctrl.user,
            }),
            m.component(TextField, {
                label: LoginController.DEFAULT_MAIL_ADDR,
                type: 'email',
                oninput: ctrl.mail,
            }),
            m.component(Button, {
                class: "send-login",
                label: _L("Login"),
                disabled: !ctrl.sendready(), 
                events: {
                    onclick: ctrl.onlogin,
                }
            }),
        ]);
    }
    return m("div");
}
class LoginComponent extends PageComponent {
    controller = (): LoginController => {
        return new LoginController();        
    }
    view = (ctrl: LoginController): UI.Element => {
        return LoginView(ctrl);
    }
}

window.channer.components.Login = Pagify(LoginComponent);
