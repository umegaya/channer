/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class LoginController implements UI.Controller {
    constructor(config: Config);
}
export declare class LoginComponent implements UI.Component {
    controller: () => LoginController;
    view: UI.View<LoginController>;
    constructor(config: Config);
}
