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
	private url: string;
	private socket: Socket;
	private msgid_seed: number;
	private timer: Timer;
	constructor(url: string, timer: Timer) {
		this.url = url;
		this.msgid_seed = 0;
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
		this.watcher.subscribe_response(msgid, function (m: Model) {
			df.resolve(m)
		});
		return df.promise;
	}
	start = () => {
		this.watcher = new ProtoWatcher(Builder.Payload.Type, Builder.Payload.decode);
		this.socket = Manager.open(this.url, {
			onmessage: this.watcher.watch,
		});
		this.timer.add(this.watcher.ontimer);
		this.timer.add(Manager.ontimer);
	}
	stop = () => {
		this.timer.remove(this.watcher.ontimer);
		this.timer.remove(Manager.ontimer);
		if (this.socket) {
			this.socket.close();
		}
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
