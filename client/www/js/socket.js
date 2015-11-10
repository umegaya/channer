var socket;
(function (socket) {
    var Socket = (function () {
        function Socket(url, d) {
            var _this = this;
            this.send = function (data) {
                _this.ws.send(data);
            };
            this.close = function () {
                _this.ws.close();
            };
            this.url = url;
            this.ws = new WebSocket(url);
            this.ws.onopen = d.onopen || Socket.onopen;
            this.ws.onmessage = d.onmessage || Socket.onmessage;
            this.ws.onclose = d.onclose || Socket.onclose;
            this.ws.onerror = d.onerror || Socket.onerror;
        }
        Socket.onopen = function () { return void {}; };
        Socket.onmessage = function (event) { return void {}; };
        Socket.onclose = function (event) { return void {}; };
        Socket.onerror = function (event) { return void {}; };
        return Socket;
    })();
    socket.Socket = Socket;
    var SocketMap = (function () {
        function SocketMap() {
        }
        return SocketMap;
    })();
    var sm = new SocketMap();
    var Manager = (function () {
        function Manager() {
        }
        Manager.open = function (url, d) {
            var s = new Socket(url, d);
            sm[url] = s;
            return s;
        };
        Manager.close = function (s) {
            sm[s.url] = null;
            s.close();
        };
        return Manager;
    })();
    socket.Manager = Manager;
})(socket || (socket = {}));
