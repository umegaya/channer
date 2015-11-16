/// <reference path="../decl/UI.d.ts" />
/// <reference path="../decl/proto.d.ts" />
/// <reference path="../decl/socket.d.ts" />
/// <reference path="../decl/channer.proto.d.ts" />
declare namespace main {
    class Config {
        url: string;
    }
    class Controller implements UI.Controller {
        s: socket.Socket;
        input_text: UI.Property<string>;
        messages: Array<channer.Msg>;
        constructor(config: Config);
        onunload: (evt: Event) => any;
        finish_input: () => void;
        onopen: () => any;
        onmessage: (event: any) => any;
        onclose: (event: any) => any;
        onerror: (event: any) => any;
    }
    class Component implements UI.Component {
        controller: () => Controller;
        view: UI.View<Controller>;
        constructor(config: Config);
    }
}
