/// <reference path="../typings/extern.d.ts"/>
import {Socket, Manager} from "./socket"
import {ProtoWatcher, ProtoError, Model} from "./watcher"
import {Timer} from "./timer"
import {m, Util} from "./uikit"
import {errorMessages} from "./error"
import Q = require('q');

import ChannerProto = Proto2TypeScript.ChannerProto;

var ProtoBuf = window.channer.ProtoBuf;
//TODO: recover original value more respectively
var proto_def = (<string>require('channer.proto.json')).replace(/Long/g, "fixed64");
export var Builder : Proto2TypeScript.ChannerProtoBuilder 
	= window.channer.ProtoBuf.loadJson(proto_def).build("ChannerProto");

export class Handler {
	watcher: ProtoWatcher;
	latency: number;
    querying: ChannerProto.Payload.Type;
    last_error: Error;
	private url: string;
	private socket: Socket;
	private msgid_seed: number;
	private last_ping: number;
	private last_auth: number;
	private deactivate_limit_ms: number;
	private timer: Timer;
    private reconnect_attempt: number;
    private reconnect_wait: number;
	constructor(url: string, timer: Timer) {
		this.url = url;
		this.msgid_seed = 0;
		this.latency = 0;
		this.last_ping = 0;
		this.last_auth = 0;
		this.deactivate_limit_ms = 0;
		this.timer = timer;
        this.querying = ChannerProto.Payload.Type.Unknown;
        this.reconnect_attempt = 0;
        this.reconnect_wait = 0;
	}
	private new_msgid = (): number => {
		this.msgid_seed++;
		if (this.msgid_seed >= 2000000000) {
			this.msgid_seed = 1;
		}
		return this.msgid_seed;
	}
	private redraw = () => {
        m.startComputation()
		setTimeout(() => {
            this.querying = ChannerProto.Payload.Type.Unknown;
			m.endComputation();
		}, 1);
	}
    private debug_close = (error_count: number) => {
        this.socket.debug_close(error_count);
    }
	private send = (p: ChannerProto.Payload, e?: ChannerProto.Error.Type, no_redraw?:boolean): Q.Promise<Model> => {
		var df : Q.Deferred<Model> = Q.defer<Model>();
		if (!no_redraw) {
			df.promise.done(this.redraw, this.redraw);
		}
		if (e) {
			//return error with same manner when error caused by server
			setTimeout(() => {
                this.last_error = new ProtoError({ type: e }, errorMessages[e]);
				df.reject(this.last_error);
			}, 1);
			return df.promise;
		}
		var msgid : number = this.new_msgid();
		p.msgid = msgid;
        try {
    		this.socket.send(p);
        }
        catch (e) {
            console.error("socket send error:" + e.message);
			setTimeout(() => {
                this.last_error = new ProtoError(
                    { type: ChannerProto.Error.Type.InvalidPayload }, 
                    errorMessages[ChannerProto.Error.Type.InvalidPayload]);
				df.reject(this.last_error);
			}, 1);
			return df.promise;
        }
        this.querying = p.type;
        try {
            this.watcher.subscribe_response(msgid, (model: Model) => {
                df.resolve(model);
            }, (e: Error) => {
                this.last_error = e;
                if (e instanceof ProtoError) {
                    var pe = <ProtoError>e;
                    if (!e.message && pe.payload) {
                        e.message = errorMessages[pe.payload.type];
                    }
                }
                df.reject(e);
            });
        }
        catch (e) {
            console.error("subscribe_response error: " + e.message);
        }
		return df.promise;
	}
	private ontimer = (nowms: number) => {
        if (this.socket.next_connection || !this.socket.connected()) {
            this.redraw();
        }
		else if ((nowms - this.last_ping) > window.channer.config.ping_interval_ms) {
			this.ping(nowms).then((m: ChannerProto.PingResponse) => {
				this.latency = (Timer.now() - m.walltime);
				//console.log("ping latency:" + this.latency);
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
		if (!current.match(/^\/(login|rescue)/)) {
			console.log("re-authenticate current url:" + current);
			Util.route("/login?next=" + encodeURIComponent(current), null, {
                route_only: true,
                replace_history: true,
            });
		}		
	}
	private onopen = () => {
		this.reauth();
	}
    private onclose = () => {
        this.redraw();
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
	private signature = (user: Long, secret: string, walltime: number): string => {
		return (new window.channer.hash.SHA256()).b64(walltime + user.toString() + secret);
	}
    reconnect_duration = (): number => {
        return this.socket.reconnect_duration();
    }
    connected = (): boolean => {
        return this.socket.connected();
    }
	has_query = (): boolean => {
		return this.querying != ChannerProto.Payload.Type.Unknown && 
			this.querying != ChannerProto.Payload.Type.PingRequest;
	}
    connecting = (): boolean => {
        return this.socket.connecting();
    }
    reconnect_enabled = (): boolean => {
        return Timer.now() > this.reconnect_wait;
    }
    reconnect_now = () => {
        this.socket.set_reconnect_duration(0);
        this.reconnect_attempt++;
        this.reconnect_wait = Timer.now() + (3000 * this.reconnect_attempt);
    }
	resume = () => {
		console.log("handler start");
		this.stop_deactivate();
		this.watcher = this.watcher || new ProtoWatcher(Builder.Payload.Type, Builder.Payload.decode);
		this.socket = this.socket || Manager.open(this.url, {
			onmessage: this.watcher.watch,
			onopen: this.onopen,
            onclose: this.onclose,
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
	login = (user: string, mail: string, secret: string, pass?: string, rescue?: string): Q.Promise<Model> => {
		var req = new Builder.LoginRequest();
		var device_id = window.channer.settings.values.device_id;
		if (device_id && device_id.length > 0) {
			req.device_id = device_id;
		}
        else if (window.channer.mobile) {
            req.device_id = device.uuid;
        }
        req.device_type = device.platform;
		req.version = window.channer.config.client_version;
		req.id = window.channer.settings.values.account_id || null;
		req.user = user;
		req.mail = mail;
		req.walltime = Timer.now();
		if (secret) {
			if (!req.id) {
				return this.send(null, ChannerProto.Error.Type.Login_BrokenClientData);
			}
			req.sign = this.signature(req.id, secret, req.walltime);
		}
		else {
			req.pass = pass;
		}
		if (rescue) {
			req.rescue = rescue;
		}
		var p = new Builder.Payload();
		p.type = ChannerProto.Payload.Type.LoginRequest;
		p.login_request = req;
		return this.send(p);		
	}
	rescue = (): Q.Promise<Model> => {
		var req = new Builder.RescueRequest();
		req.account = window.channer.settings.values.account_id;
		if (!req.account) {
			return this.send(null, ChannerProto.Error.Type.Rescue_InvalidAuth);
		}
		var secret = window.channer.settings.values.secret;
		req.walltime = Timer.now();
		req.sign = this.signature(req.account, secret, req.walltime);
		var p = new Builder.Payload();
		p.type = ChannerProto.Payload.Type.RescueRequest;
		p.rescue_request = req;
		return this.send(p);
	}
    channel_create = (name: string, category: string, locale?: string, 
        desc?: string, style?: string, 
        options?: ChannerProto.Model.Channel.Options): Q.Promise<Model> => {
        var req = new Builder.ChannelCreateRequest();
        req.name = name;
        req.description = desc;
        req.style = style;
        req.options = options;
        req.category = window.channer.category.to_id(category);
        req.locale = locale || window.channer.l10n.language;
        var p = new Builder.Payload();
        p.type = ChannerProto.Payload.Type.ChannelCreateRequest;
        p.channel_create_request = req;
        return this.send(p);
    }
    channel_list = (query: string, offset_id: Long, locale?: string, 
        category?: number, limit?: number): Q.Promise<Model> => {
        var p = new Builder.Payload();
        p.type = ChannerProto.Payload.Type.ChannelListRequest;
        var req = new Builder.ChannelListRequest();
        var map : {
            [k:string]:ChannerProto.ChannelListRequest.QueryType
        } = {
            "latest": ChannerProto.ChannelListRequest.QueryType.New,
            "popular": ChannerProto.ChannelListRequest.QueryType.Popular,
        }
        req.query = map[query];
        req.locale = locale || window.channer.settings.values.search_locale;
        if (!req.locale || req.locale == "all") {
            req.locale = "";
        }
        req.category = category;
        req.limit = limit || null;
        req.offset_id = offset_id || null;
        p.channel_list_request = req;
        return this.send(p);
    }
    topic_list = (bucket: string, query: string, offset_score?: number, offset_id?: Long, locale?: string, 
		limit?: number): Q.Promise<Model> => {
        var p = new Builder.Payload();
        p.type = ChannerProto.Payload.Type.TopicListRequest;
        var req = new Builder.TopicListRequest();
        var qmap : {
            [k:string]:ChannerProto.TopicListRequest.QueryType
        } = {
            "hour": ChannerProto.TopicListRequest.QueryType.Hour,
            "day": ChannerProto.TopicListRequest.QueryType.Day,
            "week": ChannerProto.TopicListRequest.QueryType.Week,
            "alltime": ChannerProto.TopicListRequest.QueryType.AllTime,
        }
		var bmap : {
			[k:string]:ChannerProto.TopicListRequest.BucketType
        } = {
            "hot": ChannerProto.TopicListRequest.BucketType.Hot,
            "flame": ChannerProto.TopicListRequest.BucketType.Flame,
            "rising": ChannerProto.TopicListRequest.BucketType.Rising,
        }
		req.query = qmap[query];
		req.bucket = bmap[bucket];
        req.locale = locale || window.channer.settings.values.search_locale;
        req.limit = limit || null;
        req.offset_id = offset_id || null;
		req.offset_score = offset_score || null;
        p.topic_list_request = req;
        return this.send(p);
    }
	post = (topic_id: Long, text: string, options?: ChannerProto.Post.Options): Q.Promise<Model> => {
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
		p.post_request = req;
		return this.send(p);
	}
}
