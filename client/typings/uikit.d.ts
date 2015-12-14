/// <reference path="../typings/extern.d.ts" />
/// <reference path="../typings/UI.d.ts" />
export declare var m: any;
export declare var Q: any;
export declare class Util {
    static route(dest: string, route_only?: boolean): void;
    static restart_app(): void;
}
export declare class Template {
    static textinput(bind: UI.Property<string>, klass: string, initval: string, secure?: boolean): any;
}
