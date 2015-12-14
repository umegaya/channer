/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class TopicController implements UI.Controller {
    component: TopicComponent;
    constructor(component: TopicComponent);
}
export declare class TopicComponent implements UI.Component {
    controller: () => TopicController;
    view: UI.View<TopicController>;
    constructor(config: Config);
}
