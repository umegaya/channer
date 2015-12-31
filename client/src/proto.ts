/// <reference path="../typings/extern.d.ts"/>
/// <reference path="../typings/channer.proto.d.ts"/>
/// <reference path="../typings/webpack-runtime.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>
/// <reference path="../typings/socket.d.ts"/>
/// <reference path="../typings/watcher.d.ts"/>
/// <reference path="../typings/timer.d.ts"/>
/// <reference path="../typings/error.d.ts"/>

import {Socket, Manager} from "./socket"
import {ProtoWatcher, ProtoError, Model} from "./watcher"
import {Timer} from "./timer"
import {Q, m, Util} from "./uikit"
import {errorMessages} from "./error"

import ChannerProto = Proto2TypeScript.ChannerProto;

var ProtoBuf = window.channer.ProtoBuf;
export var Builder : Proto2TypeScript.ChannerProtoBuilder 
	= window.channer.ProtoBuf.loadJson(require('channer.proto.json')).build("ChannerProto");

export class Handler {
	watcher: ProtoWatcher;
	latency: number;
	private url: string;
	private socket: Socket;
	private msgid_seed: number;
	private last_ping: number;
	private last_auth: number;
	private deactivate_limit_ms: number;
	private timer: Timer;
	constructor(url: string, timer: Timer) {
		this.url = url;
		this.msgid_seed = 0;
		this.latency = 0;
		this.last_ping = 0;
		this.last_auth = 0;
		this.deactivate_limit_ms = 0;
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
		this.watcher.subscribe_response(msgid, (model: Model) => {
			df.resolve(model);
		}, (e: Error) => {
			if (e instanceof ProtoError) {
				var pe = <ProtoError>e;
				if (!e.message && pe.payload) {
					e.message = errorMessages[pe.payload.type];
				}
			}
			df.reject(e);
		});
		return df.promise;
	}
	private ontimer = (nowms: number) => {
		if ((nowms - this.last_ping) > window.channer.config.ping_interval_ms) {
			this.ping(nowms).then((m: ChannerProto.PingResponse) => {
				this.latency = (Timer.now() - m.walltime);
				console.log("ping latency:" + this.latency);
			}, (e: ProtoError) => {
				console.log("ping error:" + e.message);
			});
			this.last_ping = nowms;
		}
		if ((nowms - this.last_auth) > window.channer.config.auth_interval_ms) {
			this.reauth();
			this.last_auth = nowms;
		}
	}
	private reauth = () => {
		var current = m.route();
		if (!current.match(/^\/login/)) {
			console.log("re-authenticate current url:" + current);
			Util.route("/login?next=" + current, true);
		}		
	}
	private onopen = () => {
		this.reauth();
	}
	private deactivate_timer = (nowms: number) => {
		if (this.deactivate_limit_ms <= 0) {
			return;
		}
		if (nowms > this.deactivate_limit_ms) {
			this.timer.remove(this.ontimer);
			this.timer.remove(this.watcher.ontimer);
			this.timer.remove(Manager.ontimer);
			if (this.socket) {
				this.socket.close();
			}
			this.stop_deactivate();
		}
		else {
			console.log("left until deactivate:" + (this.deactivate_limit_ms - nowms) + "ms");
		}
	}
	private start_deactivate = () => {
		console.log("start deactivate");
		this.deactivate_limit_ms = Timer.now() + window.channer.config.deactivate_timeout_ms;
		this.timer.add(this.deactivate_timer);
	}
	private stop_deactivate = () => {
		console.log("stop deactivate");
		this.deactivate_limit_ms = 0;
		this.timer.remove(this.deactivate_timer);
	}
	private signature = (user: string, secret: string, walltime: number): string => {
		return (new window.channer.hash.SHA256()).b64(walltime + user + secret);
	}
	resume = () => {
		console.log("handler start");
		this.stop_deactivate();
		this.watcher = this.watcher || new ProtoWatcher(Builder.Payload.Type, Builder.Payload.decode);
		this.socket = this.socket || Manager.open(this.url, {
			onmessage: this.watcher.watch,
			onopen: this.onopen,
		});
		this.timer.add(this.ontimer);
		this.timer.add(this.watcher.ontimer);
		this.timer.add(Manager.ontimer);
	}
	pause = () => {
		console.log("handler end");
		this.start_deactivate();
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
	login = (user: string, secret: string, pass?: string, rescue?: string): Q.Promise<Model> => {
		var p = new Builder.Payload();
		p.type = ChannerProto.Payload.Type.LoginRequest;
		var req = new Builder.LoginRequest();
		var device_id = window.channer.settings.values.device_id;
		if (device_id && device_id.length > 0) {
			req.device_id = device_id;
		}
		req.version = window.channer.config.client_version;
		req.id = window.channer.settings.values.account_id || null;
		req.user = user;
		req.walltime = Timer.now();
		if (secret) {
			req.sign = this.signature(user, secret, req.walltime);
		}
		else {
			req.pass = pass;
		}
		if (rescue) {
			req.rescue = rescue;
		}
		p.setLoginRequest(req);
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
		req.walltime = Timer.now();

		var p = new Builder.Payload();
		p.type = ChannerProto.Payload.Type.PostRequest;
		p.setPostRequest(req);
		return this.send(p);
	}
}
