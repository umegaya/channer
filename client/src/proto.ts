/// <reference path="../typings/extern.d.ts"/>
/// <reference path="../typings/channer.proto.d.ts"/>
/// <reference path="../typings/webpack-runtime.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>
/// <reference path="../typings/socket.d.ts"/>
/// <reference path="../typings/watcher.d.ts"/>
/// <reference path="../typings/timer.d.ts"/>

import {Socket, Manager} from "./socket"
import {ProtoWatcher, Model} from "./watcher"
import {Timer} from "./timer"
import {Q} from "./uikit"

var ProtoBuf = window.channer.ProtoBuf;
export var Builder : ChannerProto.ProtoBufBuilder 
	= window.channer.ProtoBuf.loadJson(require('channer.proto.json')).build("ChannerProto");

export class Handler {
	watcher: ProtoWatcher;
	latency: number;
	private url: string;
	private socket: Socket;
	private msgid_seed: number;
	private last_ping: number;
	private timer: Timer;
	constructor(url: string, timer: Timer) {
		this.url = url;
		this.msgid_seed = 0;
		this.latency = 0;
		this.last_ping = 0;
		this.timer = timer;
	}
	private new_msgid = (): number => {
		this.msgid_seed++;
		if (this.msgid_seed >= 2000000000) {
			this.msgid_seed = 1;
		}
		return this.msgid_seed;
	}
	private send = (p: ChannerProto.Payload): Q.Promise<Model> => {
		var msgid : number = this.new_msgid();
		p.msgid = msgid;
		this.socket.send(p);
		var df : Q.Deferred<Model> = Q.defer();
		this.watcher.subscribe_response(msgid, (m: Model) => {
			df.resolve(m);
		}, (e: Error) => {
			df.reject(e);
		});
		return df.promise;
	}
	resume = () => {
		console.log("handler start");
		this.watcher = this.watcher || new ProtoWatcher(Builder.Payload.Type, Builder.Payload.decode);
		this.socket = this.socket || Manager.open(this.url, {
			onmessage: this.watcher.watch,
		});
		this.timer.add(this.ontimer);
		this.timer.add(this.watcher.ontimer);
		this.timer.add(Manager.ontimer);
	}
	pause = () => {
		console.log("handler end");
		this.timer.remove(this.ontimer);
		this.timer.remove(this.watcher.ontimer);
		this.timer.remove(Manager.ontimer);
		if (this.socket) {
			this.socket.close();
		}
	}
	ontimer = (nowms: number) => {
		if ((nowms - this.last_ping) > 5000) {
			this.ping(nowms).then((m: ChannerProto.PingResponse) => {
				this.latency = (window.channer.timer.now() - m.walltime);
				console.log("ping latency:" + this.latency);
			}, (e: Error) => {
				console.log("ping error:" + e.message);
			});
			this.last_ping = nowms;
		}
	}
	//protocol sender
	ping = (nowms: number): Q.Promise<Model> => {
		var req = new Builder.PingRequest();
		req.walltime = nowms;
		
		var p = new Builder.Payload();
		p.type = ChannerProto.Payload.Type.PingRequest;
		p.setPingRequest(req);
		return this.send(p);
	}
	post = (topic_id: number, text: string, options?: ChannerProto.Post.Options): Q.Promise<Model> => {
		var post = new Builder.Post();
		post.text = text;
		if (options) {
			post.options = options;
		}

		var req = new Builder.PostRequest();
		req.post = post;
		req.topic_id = topic_id;
		req.walltime = window.channer.timer.now();

		var p = new Builder.Payload();
		p.type = ChannerProto.Payload.Type.PostRequest;
		p.setPostRequest(req);
		return this.send(p);
	}
}
