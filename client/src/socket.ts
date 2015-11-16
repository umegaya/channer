/// <reference path="../typings/proto.d.ts"/>

import {Model} from "./proto"

export interface Delegate {
	onopen?: () => void;
	onmessage?: (event:any) => void;
	onclose?: (event:any) => void;
	onerror?: (event:any) => void;
}
export class Socket {
	url: string;
	ws: WebSocket;
	d: Delegate;
	constructor(url: string, d: Delegate) {
		this.url = url;
		this.d = d;
		this.ws = new WebSocket(url);
		this.ws.binaryType = "arraybuffer";
		this.ws.onopen = this.onopen;
		this.ws.onmessage = this.onmessage;
		this.ws.onclose = this.onclose;
		this.ws.onerror = this.onerror;
	}
	send = (data: Model) => {
		this.ws.send(data.toArrayBuffer());
	}
	close = () => {
		this.ws.close();
	}
	onopen = () => {
		this.d.onopen();
	}
	private onmessage = (event:any) => {
		this.d.onmessage(event);
	}
	private onclose = (event:any) => {
		this.d.onclose(event);
	}
	private onerror = (event:any) => {
		this.d.onerror(event);
	}
}
class SocketMap {
	[x: string]:Socket;
}
var sm: SocketMap = new SocketMap();
export class Manager {
	static open(url: string, d: Delegate): Socket {
		var s = new Socket(url, d);
		sm[url] = s;
		return s;
	}
	static close(s: Socket) {
		sm[s.url] = null;
		s.close();
	}
}
