/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class ComposeController implements UI.Controller {
    component: ComposeComponent;
    constructor(component: ComposeComponent);
}
export declare class ComposeComponent implements UI.Component {
    controller: () => ComposeController;
    view: UI.View<ComposeController>;
    constructor(config: Config);
}
