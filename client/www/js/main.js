/// <reference path="../decl/UI.d.ts"/>
/// <reference path="../decl/proto.d.ts"/>
/// <reference path="../decl/socket.d.ts"/>
/// <reference path="../decl/channer.proto.d.ts"/>
var main;
(function (main) {
    var Config = (function () {
        function Config() {
        }
        return Config;
    })();
    main.Config = Config;
    var Controller = (function () {
        function Controller(config) {
            var _this = this;
            this.onunload = function (evt) {
                socket.Manager.close(_this.s);
            };
            this.finish_input = function () {
                console.log("finish input:" + _this.input_text());
                /*
                var msg = {text:""};//proto.channer.MsgBuilder.new();
                msg.text = this.input_text();
                this.s.send(msg);
                this.messages.push(msg);
                this.input_text("");
                */
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
            return m('div', msg.text);
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
