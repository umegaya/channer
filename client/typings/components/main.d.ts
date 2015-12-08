/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class MainController implements UI.Controller {
    constructor(config: Config);
}
export declare class MainComponent implements UI.Component {
    controller: () => MainController;
    view: UI.View<MainController>;
    constructor(config: Config);
}
