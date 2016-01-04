/// <reference path="../typings/extern.d.ts" />
/// <reference path="../typings/channer.proto.d.ts" />
/// <reference path="../typings/webpack-runtime.d.ts" />
/// <reference path="../typings/q/Q.d.ts" />
/// <reference path="../typings/socket.d.ts" />
/// <reference path="../typings/watcher.d.ts" />
/// <reference path="../typings/timer.d.ts" />
/// <reference path="../typings/error.d.ts" />
import { ProtoWatcher, Model } from "./watcher";
import { Timer } from "./timer";
import ChannerProto = Proto2TypeScript.ChannerProto;
export declare var Builder: Proto2TypeScript.ChannerProtoBuilder;
export declare class Handler {
    watcher: ProtoWatcher;
    latency: number;
    private url;
    private socket;
    private msgid_seed;
    private last_ping;
    private last_auth;
    private deactivate_limit_ms;
    private timer;
    constructor(url: string, timer: Timer);
    private new_msgid;
    private redraw;
    private send;
    private ontimer;
    private reauth;
    private onopen;
    private deactivate_timer;
    private start_deactivate;
    private stop_deactivate;
    private signature;
    resume: () => void;
    pause: () => void;
    ping: (nowms: number) => Q.Promise<Model>;
    login: (user: string, mail: string, secret: string, pass?: string, rescue?: string) => Q.Promise<Model>;
    rescue: () => Q.Promise<Model>;
    post: (topic_id: number, text: string, options?: ChannerProto.Post.Options) => Q.Promise<Model>;
}
