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
    elems.push(m(".title-h2.name", model.name));
    elems.push(m(".attributes", [
        m(".attr", [
            m("img.clock"),
            Template.datebyuuid(model.id, true)
        ]),
        m(".attr", [
            m("img.user"),
            m(".user", 11111),
        ]),
        m(".attr", [
            m("img.star"),
            m(".star", 33333),
        ]),
        m(".attr", 
            m(".idlevel.idlevel-" + options.identity, idlevel_text[options.identity])
        ),
    ]));
    elems.push(m(".desc", model.description || _L("no description")));
    return m(".block", {
        id: "channel-" + model.id,
        href: "/channel/" + model.id,
        onclick: m.withAttr("href", Util.route),
    }, elems);
}
export class ChannelListComponent extends ListComponent {
    constructor(name: string, models: ModelCollection) {
        super(name, models, ChannelInfoView);
    }
}
