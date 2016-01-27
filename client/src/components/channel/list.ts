/// <reference path="../../../typings/extern.d.ts"/>

import {m, Template, Util, ListComponent, ModelCollection} from "../../uikit"
import {Handler, Builder} from "../../proto"
import {Model, ProtoError} from "../../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

var idlevel_text : { [t:number]:string } = {
    [ChannerProto.Model.Channel.IdentityLevel.Topic]: _L("topic"),
    [ChannerProto.Model.Channel.IdentityLevel.Channel]: _L("channel"),
    [ChannerProto.Model.Channel.IdentityLevel.Account]: _L("account"),
    [ChannerProto.Model.Channel.IdentityLevel.None]: _L("none"),
}

function ChannelInfoView(
    c: ModelCollection, 
    model: ChannerProto.Model.Channel
): UI.Element {
    var copied = model.options.slice();
    var options = Builder.Model.Channel.Options.decode(copied);
    var elems: Array<UI.Element> = [];
    elems.push(m("div", {class: "title-h2"}, model.name));
    elems.push(m("div", {class: "attributes"}, [
        m("div", {class: "attr"}, [
            m("img", {class: "clock"}),
            Template.datebyuuid(model.id, true)
        ]),
        m("div", {class: "attr"}, [
            m("img", {class: "user"}),
            m("div", {class: "user"}, 11111),
        ]),
        m("div", {class: "attr"}, [
            m("img", {class: "star"}),
            m("div", {class: "star"}, 33333),
        ]),
        m("div", {class: "attr"}, 
            m("div", {
                class: "idlevel idlevel-" + options.identity
            }, idlevel_text[options.identity])
        ),
    ]));
    elems.push(m("div", {class: "desc"}, model.description));
    return m("div", {
        class: "block",
        id: "channel-" + model.id,
        value: "/channel/" + model.id,
        onclick: m.withAttr("value", m.route),
    }, elems);
}
export class ChannelListComponent extends ListComponent {
    constructor(name: string, models: ModelCollection) {
        super(name, models, ChannelInfoView);
    }
}
