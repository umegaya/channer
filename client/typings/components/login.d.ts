/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class LoginController implements UI.Controller {
    component: LoginComponent;
    user: UI.Property<string>;
    mail: UI.Property<string>;
    retype: UI.Property<string>;
    error_message: string;
    querying: boolean;
    constructor(component: LoginComponent);
    private resetinput;
    onlogin: () => void;
    sendlogin: (user: string, mail: string, secret?: string) => void;
    sanitized_mail_address: () => string;
    sendlogin_ready: () => boolean;
}
export declare class LoginComponent implements UI.Component {
    controller: () => LoginController;
    view: UI.View<LoginController>;
    next_url: string;
    rescue: string;
    constructor(config: Config, next_url: string);
}
