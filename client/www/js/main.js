/// <reference path="../decl/UI.d.ts"/>
/// <reference path="../decl/socket.d.ts"/>
var main;
(function (main) {
    var Config = (function () {
        function Config() {
        }
        return Config;
    })();
    main.Config = Config;
    var Message = (function () {
        function Message(text, attr) {
            var _this = this;
            this.to_e = function () {
                return m("div", _this.text);
            };
            this.text = text;
            this.attr = attr;
        }
        return Message;
    })();
    main.Message = Message;
    var Controller = (function () {
        function Controller(config) {
            var _this = this;
            this.onunload = function (evt) {
                socket.Manager.close(_this.s);
            };
            this.finish_input = function () {
                _this.messages.push(new Message(_this.input_text(), null));
                _this.input_text("");
            };
            this.onopen = function () { return void {}; };
            this.onmessage = function (event) { return void {}; };
            this.onclose = function (event) { return void {}; };
            this.onerror = function (event) { return void {}; };
            this.input_text = m.prop("");
            this.messages = new Array();
            this.s = socket.Manager.open(config.url, {
                onopen: this.onopen,
                onmessage: this.onmessage,
                onclose: this.onclose,
                onerror: this.onerror
            });
        }
        return Controller;
    })();
    main.Controller = Controller;
    function View(ctrl) {
        var msgs = ctrl.messages.map(function (msg) {
            return msg.to_e();
        });
        return [
            m("div", msgs),
            m("input", { onchange: m.withAttr("value", ctrl.input_text), value: ctrl.input_text() }),
            m("button", { onclick: ctrl.finish_input }, "Add"),
        ];
    }
    var Component = (function () {
        function Component(config) {
            this.view = View;
            this.controller = function () {
                return new Controller(config);
            };
        }
        return Component;
    })();
    main.Component = Component;
})(main || (main = {}));
m.mount(document.body, new main.Component({
    url: "ws://localhost:8888/ws"
}));