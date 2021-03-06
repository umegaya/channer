/// <reference path="../typings/extern.d.ts"/>
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

export interface ProtoErrorModel {
	type: number;
}
export class ProtoError extends Error {
	payload: ProtoErrorModel;
    message: string;
	constructor(m: ProtoErrorModel, message?: string) {
        super(message);
		this.payload = m;
        this.message = message;
	}
}
class ProtoMap {
	[x: number]:string;
}
class ProtoSubscribersMap {
	[x: number]:Array<(m: Model) => any>;
	call = (type: number, m: Model) => {
		for (var i in this[type]) {
			try {
				this[type][i](m);
			}
			catch (e) {
				console.log("ProtoSubscribersMap.call:exception " + JSON.stringify(e.message));
			}
		}
	}
}
class ProtoRPCCallersMap {
	[x: number]:[number, (m: Model) => any, (e: ProtoError) => any];
}
export interface ProtoPayloadModel {
	type: number;
	msgid?: number;
	error?: ProtoErrorModel;
	[x: string]:any;
}
export class ProtoWatcher {
	private parser: (data: any) => ProtoPayloadModel;
	private protomap: ProtoMap;	
	private callers: ProtoRPCCallersMap;
	private subscribers: ProtoSubscribersMap;
	private response_timeout: number;
	//TODO: actually types should be one of enum declaration (equivalent to {[x: string]: number}).
	//but no conversion rule between enum and above type. how we declare method signature?
	constructor(types: any, parser: (data: any) => ProtoPayloadModel, response_timeout?: number) {
		this.parser = parser;
		this.protomap = new ProtoMap();
		this.callers = new ProtoRPCCallersMap();
		this.subscribers = new ProtoSubscribersMap();
		this.response_timeout = response_timeout || 5000; //5sec
		for (var t in types) {
			//snakize
			this.protomap[types[t]] = t.replace(/([A-Z])/g, function(_: string, m1: string, offset: number) {
				return offset > 0 ? ("_" + m1.toLowerCase()) : m1.toLowerCase();
			});
			this.subscribers[types[t]] = [];
		}
	}
	subscribe = (type: number, callback: (m: Model) => any) => {
		this.subscribers[type].push(callback);
	}
	unsubscribe = (type: number, callback: (m: Model) => any) => {
		var idx = this.subscribers[type].indexOf(callback);	
		if (idx >= 0) {
			this.subscribers[type].splice(idx, 1);
		}
	}
	subscribe_response = (msgid: number, callback: (m: Model) => any, error: (e: ProtoError) => any) => {
		this.callers[msgid] = [(new Date()).getTime() + this.response_timeout, callback, error];
	}
	ontimer = (now: number) => {
		for (var k in this.callers) {
			var c = this.callers[k];
			if (!c) {
				console.log("c removed:" + k);
				delete this.callers[k];
				continue;
			}
			if (c[0] < now) {
				try {
					c[2](new ProtoError({
						type: 1, //Timeout TODO: how generalize it?
					}));
				} catch (e) {
					console.log("emit error error:" + e.message);
				}
				delete this.callers[k];
			}
		}
	}
	watch = (event: any) => {
		var payload : ProtoPayloadModel = this.parser(event.data);
		var m : Model = <Model>payload[this.protomap[payload.type]];
		if (payload.msgid) {
			var c = this.callers[payload.msgid];
			if (c) {
				if (window.channer.chaos && Math.random() < 0.1) {
					console.warn("monkey do the job:" + payload.type);
					return;
				}
				var [at, f, e] = c;
				delete this.callers[payload.msgid];
				if (at) {
					if (payload.error) {
						e(new ProtoError(payload.error));	
					}
					else {
						f(m);
					}
				}
			}
		}
		else {
			this.subscribers.call(payload.type, m);
		}
	}
}
