/// <reference path="../typings/extern.d.ts" />
/// <reference path="../typings/channer.proto.d.ts" />
/// <reference path="../typings/webpack-runtime.d.ts" />
/// <reference path="../typings/q/Q.d.ts" />
/// <reference path="../typings/socket.d.ts" />
/// <reference path="../typings/watcher.d.ts" />
/// <reference path="../typings/timer.d.ts" />
import { ProtoWatcher, Model } from "./watcher";
import { Timer } from "./timer";
export declare var Builder: ChannerProto.ProtoBufBuilder;
export declare class Handler {
    watcher: ProtoWatcher;
    latency: number;
    private url;
    private socket;
    private msgid_seed;
    private last_ping;
    private deactivate_limit_ms;
    private timer;
    constructor(url: string, timer: Timer);
    private new_msgid;
    private send;
    private ontimer;
    private deactivate_timer;
    private start_deactivate;
    private stop_deactivate;
    resume: () => void;
    pause: () => void;
    ping: (nowms: number) => Q.Promise<Model>;
    login: (user: string, pass: string) => Q.Promise<Model>;
    post: (topic_id: number, text: string, options?: ChannerProto.Post.Options) => Q.Promise<Model>;
}
