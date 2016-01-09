/// <reference path="../typings/extern.d.ts"/>
import {Model} from "./watcher"

class SocketMap {
	[x: string]:Socket;
}
var sm: SocketMap = new SocketMap();

export interface Delegate {
	onopen?: () => void;
	onmessage?: (event:any) => void;
	onclose?: (event:any) => void;
	onerror?: (event:any) => void;
}
const enum SocketState {
	DISCONNECT = 1,
	CONNECTING = 2,
	CONNECTED = 3,
}
export class Socket {
	url: string;
	ws: WebSocket;
	private state: SocketState;
	private next_connection: Date;
	private error_streak: number;
	private pendings: Array<Model>;
	d: Delegate;
	static default_d: Delegate = {
		onopen: function () {},
		onmessage: function (event:any) {},
		onclose: function (event:any) {},
		onerror: function (event:any) {},
	}
	constructor(url: string, d?: Delegate) {
		this.url = url;
		this.d = {};
		this.error_streak = 0;
		this.state = SocketState.DISCONNECT;
		this.set_delegate(d || {});
	}
	set_delegate = (d: Delegate) => {
		this.d.onopen = d.onopen || Socket.default_d.onopen;
		this.d.onmessage = d.onmessage || Socket.default_d.onmessage;
		this.d.onclose = d.onclose || Socket.default_d.onclose;
		this.d.onerror = d.onerror || Socket.default_d.onerror;
	}
	send = (data: Model) => {
		if (this.state == SocketState.DISCONNECT) {
			this.open();
		}
		if (this.state == SocketState.CONNECTING) {
			this.pendings.push(data);
			return;
		}
		this.ws.send(data.toArrayBuffer());
	}
	close = (cleanup?:boolean) => {
		if (this.ws != null) {
			this.ws.close();
		}
		if (cleanup) {
			delete sm[this.url];
		}
	}
	reconnect_duration = (nowms: number): number => {
		if (!this.next_connection) {
			return null;
		}
		var diff_msec = this.next_connection.getTime() - nowms;
		return Math.ceil(diff_msec / 1000);
	}
	//don't call from outside of this module. only exposed for below setInterval callback.
	open = () => {
		if (this.state == SocketState.DISCONNECT) {
			this.ws = new WebSocket(this.url);
			this.ws.binaryType = "arraybuffer";
			this.ws.onopen = this.onopen;
			this.ws.onmessage = this.onmessage;
			this.ws.onclose = this.onclose;
			this.ws.onerror = this.onerror;
			this.pendings = [];
			this.state = SocketState.CONNECTING;
		}
	}
	private clear_error_streak = () => {
		this.next_connection = null;
		this.error_streak = 0;		
	}
	private set_reconnect_duration = (dt: number) => {
		var t = this.next_connection || new Date();
		t.setTime(t.getTime() + dt);
		this.next_connection = t;		
	}
	private add_error_streak = () => {
		this.error_streak++;
		this.set_reconnect_duration(1000 * Math.min(300, Math.pow(2, this.error_streak - 1)));
	}
	private onopen = () => {
		this.state = SocketState.CONNECTED;
		for (var i = 0; i < this.pendings.length; i++) {
			this.send(this.pendings[i]);
		}
		this.pendings = [];
		this.next_connection = null;
		this.error_streak = 0;
		this.d.onopen();
	}
	private onmessage = (event:any) => {
		this.d.onmessage(event);
	}
	private onclose = (event:any) => {
		this.state = SocketState.DISCONNECT;
		this.ws = null;
		this.add_error_streak();
		this.d.onclose(event);
	}
	private onerror = (event:any) => {
		this.state = SocketState.DISCONNECT;
		this.ws = null;
		this.add_error_streak();
		this.d.onerror(event);
	}
}
export class Manager {
	static open(url: string, d: Delegate): Socket {
		var s = sm[url];
		if (!s) {
			s = new Socket(url);
			sm[url] = s;
		}
		s.set_delegate(d);
		return s;
	}
	static ontimer(nowms: number) {
		for (var k in sm) {
			var s = sm[k];
			var dur = s.reconnect_duration(nowms);
			if (dur) {
				console.log(k + " reconnect duraction:" + dur);
			}
			if (dur && dur <= 0) {
				s.open();
			}
		}		
	}
}
