/// <reference path="../typings/proto.d.ts" />
import { Model } from "./proto";
export interface Delegate {
    onopen?: () => void;
    onmessage?: (event: any) => void;
    onclose?: (event: any) => void;
    onerror?: (event: any) => void;
}
export declare class Socket {
    url: string;
    ws: WebSocket;
    private state;
    private next_connection;
    private error_streak;
    private pendings;
    d: Delegate;
    constructor(url: string, d: Delegate);
    send: (data: Model) => void;
    close: () => void;
    reconnect_duration: () => number;
    open: () => void;
    private clear_error_streak;
    private add_error_streak;
    private onopen;
    private onmessage;
    private onclose;
    private onerror;
}
export declare class Manager {
    static open(url: string, d: Delegate): Socket;
}
