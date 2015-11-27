/// <reference path="../typings/extern.d.ts" />
/// <reference path="../typings/channer.proto.d.ts" />
/// <reference path="../typings/webpack-runtime.d.ts" />
export interface Model {
    toArrayBuffer(): ArrayBuffer;
    toBase64(): string;
    toString(): string;
}
export interface Builder {
    new (): any;
    decode(buffer: ArrayBuffer): any;
    decode64(buffer: string): any;
}
export declare var ChannerProto: any;
