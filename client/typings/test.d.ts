/// <reference path="../typings/UI.d.ts" />
/// <reference path="../typings/proto.d.ts" />
import { Config } from "./config";
export declare class Controller implements UI.Controller {
    input_text: UI.Property<string>;
    messages: Array<ChannerProto.Post>;
    constructor(config: Config);
    onunload: (evt: Event) => any;
    onpostnotify: (data: ChannerProto.Post) => void;
    finish_input: () => void;
}
export declare class Component implements UI.Component {
    controller: () => Controller;
    view: UI.View<Controller>;
    constructor(config: Config);
}
