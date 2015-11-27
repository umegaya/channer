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
    d: Delegate;
    constructor(url: string, d: Delegate);
    send: (data: Model) => void;
    close: () => void;
    onopen: () => void;
    private onmessage;
    private onclose;
    private onerror;
}
export declare class Manager {
    static open(url: string, d: Delegate): Socket;
    static close(s: Socket): void;
}
