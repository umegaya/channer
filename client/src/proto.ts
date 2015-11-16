/// <reference path="../typings/protobuf.d.ts"/>
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

export var ChannerProto = dcodeIO.ProtoBuf.channer(require('channer.proto.json')).build();
