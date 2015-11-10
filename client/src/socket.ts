module socket {
	export interface Delegate {
		onopen?: () => void;
		onmessage?: (event:any) => void;
		onclose?: (event:any) => void;
		onerror?: (event:any) => void;
	}
	export class Socket {
		url: string;
		private ws: WebSocket;
		constructor(url: string, d: Delegate) {
			this.url = url;
			this.ws = new WebSocket(url);
			this.ws.onopen = d.onopen || Socket.onopen;
			this.ws.onmessage = d.onmessage || Socket.onmessage;
			this.ws.onclose = d.onclose || Socket.onclose;
			this.ws.onerror = d.onerror || Socket.onerror;
		}
		send = (data: any) => {
			this.ws.send(data);
		}
		close = () => {
			this.ws.close();
		}
		private static onopen = () => void {
		}
		private static onmessage = (event:any) => void {
		}
		private static onclose = (event:any) => void {
		}
		private static onerror =(event:any) => void {
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
}
