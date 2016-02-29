/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, PropConditions, PropCollection} from "../../uikit"
import {TopComponent} from "../top"
import {MenuElementComponent} from "../menu"
import {Config} from "../../config"
import {Handler, Builder} from "../../proto"
import {ProtoError} from "../../watcher"
import {RadioComponent} from "../parts/radio"
import {TextFieldComponent} from "../parts/textfield"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;
var Button = window.channer.parts.Button;

var idlevel_text : { [t:number]:string } = {
    [ChannerProto.Model.Channel.IdentityLevel.Topic]: 
        _L("topic: in each topic, all post by same account will be assigned same identifier."),
    [ChannerProto.Model.Channel.IdentityLevel.Channel]: 
        _L("channel: in this channel, all post by same account will be assigned same identifier."),
    [ChannerProto.Model.Channel.IdentityLevel.Account]: 
        _L("account: all post show its meta account id of submitter, which is unique for all channel."),
    [ChannerProto.Model.Channel.IdentityLevel.None]: 
        _L("none: no identifier is assigned to any post in this channel."),
}
var display_text : { [t:number]:string } = {
    [ChannerProto.Model.Channel.TopicDisplayStyle.Tail]: 
        _L("tail: all post show in time-series order. eg) 2ch, github, and most of forum."),
    [ChannerProto.Model.Channel.TopicDisplayStyle.Tree]: 
        _L("tree: post shows with respecting relation of 'in reply to which post' eg) reddit, 4chan"),
}

var texts = {
    DEFAULT_NAME: _L("channel name"),
    DEFAULT_ANONYMOUS: _L("anonymous signature"),
    DEFAULT_DESCRIPTION: _L("channel description"),
    DEFAULT_STYLE_URL: _L("plugin css URL"),
    DEFAULT_POST_LIMIT: _L("max posts for topic"),
}

var cond: PropConditions = {
    required: {
        name: {
            init: texts.DEFAULT_NAME, 
        },
    },
    optional: {
        anon: {
            init: texts.DEFAULT_ANONYMOUS, 
            fallback: _L("anonymous"), 
        },
        desc: {
            init: texts.DEFAULT_DESCRIPTION, 
            fallback: "",
        },
        style: {
            init: texts.DEFAULT_STYLE_URL, 
            fallback: "",
        },
        postlimit: {
            init: texts.DEFAULT_POST_LIMIT, 
            fallback: "1000",
        },
        idlevel: {
            init: ChannerProto.Model.Channel.IdentityLevel.Channel, 
            check: ChannerProto.Model.Channel.IdentityLevel.Unknown,
        },
        display: {
            init: ChannerProto.Model.Channel.TopicDisplayStyle.Tail,
            check: ChannerProto.Model.Channel.TopicDisplayStyle.Invalid,
        },
    }
}

export class ChannelCreateController implements UI.Controller {
	component: ChannelCreate;
    page: number;

	constructor(component: ChannelCreate) {
		this.component = component;
        this.page = 0;
	}
    onsend(oncreate: (ch: ChannerProto.Model.Channel) => void) {
        var conn: Handler = window.channer.conn;
        var vals = this.component.input.check();
        if (vals) {
            var options = new Builder.Model.Channel.Options();
            options.anonymous_name = vals["anon"];
            options.identity = vals["idlevel"];
            options.topic_post_limit = parseInt(vals["postlimit"], 10);
            options.topic_display_style = vals["display"];
            conn.channel_create(vals["name"], vals["desc"], vals["style"], options)
            .then((r: ChannerProto.ChannelCreateResponse) => {
                console.log("new channel create:" + r.channel.id);
                this.component.input.clear(); //cleanup input data
                oncreate(r.channel);
                Util.route("/channel/" + r.channel.id);
            }, (e: ProtoError) => {
                console.log("error:" + e.message);
            });
        }
    }
    onnext = () => {
        if (this.page < 2) {
            this.page++;
        }
    }
    onback = () => {
        if (this.page > 0) {
            this.page--;
        }
    }
    onchange = (v: any) => {
        this.component.input.save();
    }
    sendready():boolean {
        return !!this.component.input.check();
    }
}
function sendbutton(ctrl: ChannelCreateController, parent: TopComponent): UI.Element {
    return m.component(Button, {
        class: "send",
        label: _L("Create"),
        disabled: !ctrl.sendready(), 
        events: {
            onclick: ctrl.onsend.bind(ctrl, parent.oncreate),
        }
    });
}
function backbutton(ctrl: ChannelCreateController, parent: TopComponent): UI.Element {
    return m.component(Button, {
        class: "prev",
        label: _L("Back"),
        events: {
            onclick: ctrl.onback,
        }
    });    
}
function nextbutton(
    ctrl: ChannelCreateController, parent: TopComponent, label: string
): UI.Element {
    return m.component(Button, {
        class: "next",
        label: label,
        events: {
            onclick: ctrl.onnext,
        }
    });    
}
function ChannelCreateView(
    ctrl: ChannelCreateController, parent: TopComponent) : UI.Element {
	var elements : Array<UI.Element> = []; 
    var buttons: Array<UI.Element> = [];
    var props = ctrl.component.input.props;
    switch (ctrl.page) {
    case 0:
        elements.push(m(".form", [
            m.component(TextFieldComponent, {
                label: texts.DEFAULT_NAME,
                required: true,
                autofocus: true,
                value: props["name"],
                onchange: ctrl.onchange,
            }),
            m.component(TextFieldComponent, {
                label: texts.DEFAULT_DESCRIPTION,
                multiline: true,
                rows: 3,
                value: props["desc"],
                onchange: ctrl.onchange,
            })
        ]));
        buttons.push(sendbutton(ctrl, parent));
        buttons.push(nextbutton(ctrl, parent, _L("Detail")));
        break;
    case 1:
        //idlevel radiobox
        var idlevel = props["idlevel"];
        var idlevel_block = [m(".title", _L("identity level"))];
        idlevel_block.push(m.component(RadioComponent, {
            name: "id-level",
            elements: {
                //none: ChannerProto.Model.Channel.IdentityLevel.None,
                topic: ChannerProto.Model.Channel.IdentityLevel.Topic,
                channel: ChannerProto.Model.Channel.IdentityLevel.Channel,
                account: ChannerProto.Model.Channel.IdentityLevel.Account,
            },
            prop: idlevel,
            onchange: ctrl.onchange,
        }));
        var idl = idlevel();
        if (idl != ChannerProto.Model.Channel.IdentityLevel.Unknown) {
            idlevel_block.push(m("div", {class: "explaination"}, idlevel_text[idl]));
        }

        //disp radiobox
        var disp = props["display"];
        var disp_block = [m(".title", _L("display style"))];
        disp_block.push(m.component(RadioComponent, {
            name: "radio-options",
            elements: {
                tail: ChannerProto.Model.Channel.TopicDisplayStyle.Tail,
                tree: ChannerProto.Model.Channel.TopicDisplayStyle.Tree,
            },
            prop: disp,
            onchange: ctrl.onchange,
        }));    
        var d = disp();
        if (d != ChannerProto.Model.Channel.TopicDisplayStyle.Invalid) {
            disp_block.push(m("div", {class: "explaination"}, display_text[d]));
        }
        elements.push(m(".form", [
            m(".block.id-level", idlevel_block),
            m(".block.display-style", disp_block)
        ]));
        buttons.push(backbutton(ctrl, parent));
        buttons.push(nextbutton(ctrl, parent, _L("Next")));
        break;
    case 2:
        //anon signature
        elements.push(m(".form", [
            m.component(TextFieldComponent, {
                label: texts.DEFAULT_ANONYMOUS,
                value: props["anon"],
                onchange: ctrl.onchange,
            }),
            m.component(TextFieldComponent, {
                label: texts.DEFAULT_POST_LIMIT,
                value: props["postlimit"],
                onchange: ctrl.onchange,
            }),
            m.component(TextFieldComponent, {
                label: texts.DEFAULT_STYLE_URL,
                value: props["style"],
                onchange: ctrl.onchange,
            })
        ]));
        buttons.push(backbutton(ctrl, parent));
        buttons.push(sendbutton(ctrl, parent));
    }
    //send button
    elements.push(m(".buttons", buttons));
    return m(".create", elements);
}
class ChannelCreate extends MenuElementComponent {
    input: PropCollection;

	constructor() {
        super();
	}
    controller = (): ChannelCreateController => {
        if (!this.input) {
            this.input = new PropCollection("channel-create", cond);
        }
        return new ChannelCreateController(this);
    }
    view = (ctrl: ChannelCreateController, parent: TopComponent): UI.Element => {
        return ChannelCreateView(ctrl, parent);
    }
    iconview = (): UI.Element => {
        return this.format_iconview("img.create_channel", _L("create channel"));
    }
    name = (): string => {
        return "channel create";
    }
}

export var ChannelCreateComponent: ChannelCreate = new ChannelCreate();
