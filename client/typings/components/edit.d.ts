/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export declare class EditController implements UI.Controller {
    constructor(config: Config);
}
export declare class EditComponent implements UI.Component {
    controller: () => EditController;
    view: UI.View<EditController>;
    constructor(config: Config);
}
