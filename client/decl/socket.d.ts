declare namespace socket {
    interface Delegate {
        onopen?: () => void;
        onmessage?: (event: any) => void;
        onclose?: (event: any) => void;
        onerror?: (event: any) => void;
    }
    class Socket {
        url: string;
        ws: WebSocket;
        constructor(url: string, d: Delegate);
        send: (data: any) => void;
        close: () => void;
        private static onopen;
        private static onmessage;
        private static onclose;
        private static onerror;
    }
    class Manager {
        static open(url: string, d: Delegate): Socket;
        static close(s: Socket): void;
    }
}
