/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class LoginController implements UI.Controller {
    component: LoginComponent;
    user: UI.Property<string>;
    pass: UI.Property<string>;
    retype: UI.Property<string>;
    error_message: string;
    querying: boolean;
    constructor(component: LoginComponent);
    private resetinput;
    onlogin: () => void;
    sendlogin: (user: string, secret: string, pass?: string) => void;
}
export declare class LoginComponent implements UI.Component {
    controller: () => LoginController;
    view: UI.View<LoginController>;
    next_url: string;
    rescue: string;
    constructor(config: Config, next_url: string);
}
