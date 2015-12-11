/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class MainController implements UI.Controller {
    selected: string;
    tab_contents: {
        [x: string]: UI.Component;
    };
    constructor(config: Config);
    tabs: () => any;
    tab: (name: string) => any;
    activetab: () => UI.Component;
    onchange: (name: string) => void;
}
export declare class MainComponent implements UI.Component {
    controller: () => MainController;
    view: UI.View<MainController>;
    constructor(config: Config);
}
