/// <reference path="../typings/UI.d.ts" />
/// <reference path="../typings/proto.d.ts" />
/// <reference path="../typings/socket.d.ts" />
/// <reference path="../typings/boot.d.ts" />
import { Socket } from "./socket";
export declare class Config {
    url: string;
    constructor(src: any);
}
export declare class Controller implements UI.Controller {
    s: Socket;
    input_text: UI.Property<string>;
    messages: Array<ChannerProto.Post>;
    constructor(config: Config);
    onunload: (evt: Event) => any;
    finish_input: () => void;
    onopen: () => void;
    onmessage: (event: any) => void;
    onclose: (event: any) => void;
    onerror: (event: any) => void;
}
export declare class Component implements UI.Component {
    controller: () => Controller;
    view: UI.View<Controller>;
    constructor(config: Config);
}
