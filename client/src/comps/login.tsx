/// <reference path="../../typings/extern.d.ts"/>
import {PageProp, PageState, PageComponent} from "./common/page"
import {ProtoError} from "../watcher"
import {Util} from "../uikit"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

//ui
import * as React from 'react'
import FlatButton from "material-ui/FlatButton"
import TextField from 'material-ui/TextField'

export interface LoginProp extends PageProp {
    rescue: string;
}

export interface LoginState extends PageState {
    user: string;
    mail: string;
}

export class LoginComponent extends PageComponent<LoginProp, LoginState> {    
    static DEFAULT_USER_NAME = _L("user name");
	static DEFAULT_MAIL_ADDR = _L("mail address (optional)");
    user: string;
    mail: string;
	error_message: string;
	constructor(props: LoginProp) {
        super(props);
		this.state = {
			user: window.channer.settings.values.user || "",
			mail: window.channer.settings.values.mail || "",
		}
		this.resetinput();
	}
	private resetinput = () => {
		var secret = window.channer.settings.values.secret;
		//note that mail is empty string, its treated as falsy value 
		console.log("user/secret/mail " + this.state.user + "|" + secret + "|" + this.state.mail);
		if (this.props.rescue) {
			console.log("rescue login with:" + this.props.rescue);
            this.state.user = this.state.user || "dummy";
			this.sendlogin();
		}
		else if (secret && this.state.user.length > 0) {
			console.log("auto login with:" + this.state.user + "/" + secret);
			this.sendlogin(secret);
		}
		else if (this.state.user.length > 0) {
			console.log("auto login with:" + this.state.user + "&" + this.state.mail);
			this.sendlogin();
		}
	}
	private on_send_login = () => {
		console.log("login with:" + this.state.user + "/" + this.state.mail);
		this.sendlogin();
	}
	private sendlogin = (secret?: string) => {
		var pass = window.channer.settings.values.pass;
        var mail = this.sanitized_mail_address();
        var user = this.state.user;
		window.channer.conn.login(user, mail, secret, pass, this.props.rescue)
		.then((r: ChannerProto.LoginResponse) => {
			console.log("login success!:" + r.secret + "|" + r.id + "|" + user + "|" + mail);
			window.channer.settings.values.secret = r.secret;
			window.channer.settings.values.mail = r.mail || mail;
			window.channer.settings.values.account_id = r.id.toString();
			window.channer.settings.values.user = r.user || user;
			if (r.pass) {
				window.channer.settings.values.pass = r.pass;
			}
			window.channer.settings.save();
			console.log("login success redirect to:" + this.props.location.query["next"]);
			this.route(this.props.location.query["next"] || "/top", {
                replace: true,
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
	private sanitized_mail_address = (): string => {
		var mail = this.state.mail;
		if (!mail.match(/[^@]+@[^@]+/)) {
			mail = "";
		}
		return mail;		
	}
	private sendready = (): boolean => {
		var user: string = this.state.user;
		return (user != LoginComponent.DEFAULT_USER_NAME && user.length > 0);
	}
    private on_input_user = (ev: HTMLElemEvent<HTMLInputElement>) : void => {
        var state : LoginState = this.state;
        state.user = ev.target.value;
        this.setState(state);
    }
    private on_input_mail = (ev: HTMLElemEvent<HTMLInputElement>) : void => {
        var state : LoginState = this.state;
        state.mail = ev.target.value;
        this.setState(state);
    }
    render(): UI.Element {
        return <div className="login form fullWidth">
            <div className="bg"/>
            <div className="logo">
                <div className="title">channer</div>
            </div>
            <TextField className="user text" value={this.state.user} hintText={LoginComponent.DEFAULT_USER_NAME} onChange={this.on_input_user}/>
            <TextField className="mail text" value={this.state.mail} hintText={LoginComponent.DEFAULT_MAIL_ADDR} onChange={this.on_input_mail}/>
			<div className="send">
				<FlatButton label={_L("Login")} onClick={this.on_send_login} disabled={this.state.user.length <= 0}/>
			</div>
        </div>;
    }
}
