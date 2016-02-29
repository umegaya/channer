/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, Template} from "../../uikit"
import {Config} from "../../config"
import {Handler, Builder} from "../../proto"
import {ProtoError} from "../../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

export class HeaderController implements UI.Controller {
}
export var HeaderComponent: UI.Component = {
	controller: (): HeaderController => {
        return new HeaderController();
    },
	view: () : UI.Element => {
        var elements : Array<UI.Element> = [];
        var c : Handler = window.channer.conn;
        var rd = c.reconnect_duration();
        var err = c.last_error;
        var msgs: UI.Element;
        var attrs : any = {
            class: "container full-length",
        };
        if (rd && rd > 0) {
            //TODO: tap to reconnection
            var tmp: Array<UI.Element> = [
                m("div", {class: "msg wait-reconnect"},
                    _L("reconnect within $1 second", rd)),
            ];
            if (c.reconnect_enabled()) {
                tmp.push(m("div", {class: "connect"}, _L("do it now")));
                attrs.onclick = () => { c.reconnect_now(); };
            }
            msgs = tmp;
        }
        else if (c.connected()) {
            if (c.querying) {
                //TODO: replace to cool CSS anim
                msgs = m("div", {class: "msg"}, _L("sending request now"));
            }
            else if (err && err.message) {
                msgs = [
                    m("div", {class: "msg"}, err.message), 
                    m("div", {class: "x"}, _L("dismiss"))
                ];
                attrs.onclick = () => { c.last_error = null; };
            }
            else {
                msgs = m("div", {class: "msg"});
            }
            attrs.class = "container";
            return m("div", {class: "header"}, 
                m("div", {class: "stats"}, [
                    m("div", attrs, msgs), 
                    m("div", {class: "latency"}, c.latency + "ms")
                ])
            );
        }
        else if (c.connecting() || (rd && rd <= 0)) {
            msgs = m("div", {class: "msg"}, _L("reconnecting"));
        }
        return m("div", {class: "header"}, 
            m("div", {class: "stats"}, m("div", attrs, msgs)));
    }
}
