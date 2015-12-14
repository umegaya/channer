/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
import { Config } from "../config";
export interface InputObservableController extends UI.Controller {
    oninput(text: string): Q.Promise<ChannerProto.PostResponse>;
}
export declare class EditController implements UI.Controller {
    component: EditComponent;
    input_text: UI.Property<string>;
    observer: InputObservableController;
    constructor(component: EditComponent);
    oninput: () => void;
}
export declare class EditComponent implements UI.Component {
    controller: () => EditController;
    view: UI.View<EditController>;
    constructor(config: Config);
}
