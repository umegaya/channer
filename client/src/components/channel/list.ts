/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, ListComponent, ModelCollection} from "../../uikit"
import {Handler, Builder} from "../../proto"
import {Model, ProtoError} from "../../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;

function ChannelInfoView(
    c: ModelCollection, 
    model: ChannerProto.Model.Channel
): UI.Element {
    var copied = model.options.slice();
    var options = Builder.Model.Channel.Options.decode(copied);
    var elems: Array<UI.Element> = [];
    elems.push(m("div", {class: "div-title name"}, model.name));
    elems.push(m("div", {class: "div-image idlevel-" + options.identity}));
    elems.push(m("div", {class: "div-text desc"}, model.description));
    return m("div", {
        class: "div-container",
        value: "/channel/" + model.id,
        onclick: m.withAttr("value", m.route),
    }, elems);
}
export class ChannelListComponent extends ListComponent {
    constructor(name: string, models: ModelCollection) {
        super(name, models, ChannelInfoView);
    }
}
