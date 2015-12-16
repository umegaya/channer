/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class ChannelController implements UI.Controller {
    component: ChannelComponent;
    constructor(component: ChannelComponent);
}
export declare class ChannelComponent implements UI.Component {
    controller: () => ChannelController;
    view: UI.View<ChannelController>;
    constructor(config: Config);
}
