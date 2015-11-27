/// <reference path="../typings/extern.d.ts"/>
/// <reference path="../typings/channer.proto.d.ts"/>
/// <reference path="../typings/webpack-runtime.d.ts"/>

export interface Model {
	toArrayBuffer(): ArrayBuffer;
	toBase64(): string;
	toString(): string;
}
export interface Builder {
	new() : any;
	decode(buffer: ArrayBuffer) : any;
	decode64(buffer: string) : any;
}

var ProtoBuf = window.channer.ProtoBuf;
export var ChannerProto = window.channer.ProtoBuf.loadJson(require('channer.proto.json')).build("ChannerProto");
