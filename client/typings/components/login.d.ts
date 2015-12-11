/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class LoginController implements UI.Controller {
    component: LoginComponent;
    user: UI.Property<string>;
    pass: UI.Property<string>;
    constructor(component: LoginComponent);
    private clearinput;
    onlogin: () => void;
}
export declare class LoginComponent implements UI.Component {
    controller: () => LoginController;
    view: UI.View<LoginController>;
    next_url: string;
    constructor(config: Config, next_url?: string);
}
