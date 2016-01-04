/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class RescueController implements UI.Controller {
    component: RescueComponent;
    url: UI.Property<string>;
    remain_time: UI.Property<number>;
    constructor(component: RescueComponent);
    generate_rescue_url: () => void;
    onsend: () => void;
}
export declare class RescueComponent implements UI.Component {
    controller: () => RescueController;
    view: UI.View<RescueController>;
    constructor(config: Config);
}
