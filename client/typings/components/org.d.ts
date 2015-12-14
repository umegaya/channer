/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class OrgController implements UI.Controller {
    component: OrgComponent;
    constructor(component: OrgComponent);
}
export declare class OrgComponent implements UI.Component {
    controller: () => OrgController;
    view: UI.View<OrgController>;
    constructor(config: Config);
}
