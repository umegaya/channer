/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, Template, PropConditions, PropCollection} from "../../uikit"
import {Config} from "../../config"
import {Handler, Builder} from "../../proto"
import {ProtoError} from "../../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

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
	component: ChannelCreateComponent;
    input: PropCollection;
    show_advanced: boolean;

	constructor(component: ChannelCreateComponent) {
		this.component = component;
        this.input = new PropCollection(cond);
        this.show_advanced = false;
	}
    onsend = () => {
        var conn: Handler = window.channer.conn;
        var vals = this.input.check();
        if (vals) {
            var options = new Builder.Model.Channel.Options();
            options.anonymous_name = vals["anon"];
            options.identity = vals["idlevel"];
            options.topic_post_limit = parseInt(vals["postlimit"], 10);
            options.topic_display_style = vals["display"];
            conn.channel_create(vals["name"], vals["desc"], vals["style"], options)
            .then((r: ChannerProto.ChannelCreateResponse) => {
                console.log("new channel create:" + r.channel.id);
                Util.route("/channel/" + r.channel.id);
            }, (e: ProtoError) => {
                console.log("error:" + e.message);
            });
        }
    }
    on_advanced_settings = () => {
        this.show_advanced = !this.show_advanced;
    }
    sendready = ():boolean => {
        return !!this.input.check();
    }
}
function ChannelCreateView(ctrl: ChannelCreateController) : UI.Element {
	var elements : Array<UI.Element> = []; 
    var props = ctrl.input.props;
    if (!ctrl.show_advanced) {
        elements.push(m("div", {class: "padding"}));
    }
    elements.push(m("div", {class: "block"}, [
        m("div", {class: "title-h1"}, [
            m("div", _L("Create new channel")),
            m("a", {
                onclick: ctrl.on_advanced_settings,
                class: "enabled",
            }, (ctrl.show_advanced ? "-" : "+") + _L("detail"))
        ]),
        Template.textinput(props["name"], 
            {class: "input-text name"}, texts.DEFAULT_NAME),
        Template.textinput(props["desc"], 
            {class: "input-text desc"}, texts.DEFAULT_DESCRIPTION, true)
    ]));
    if (ctrl.show_advanced) {
        //idlevel radiobox
        var idlevel = props["idlevel"];
        var idlevel_block = [m("div", {class: "title"}, _L("identity level"))];
        idlevel_block.push(Template.radio({
            class: "radio-options",
        }, "id-level", [
            [ChannerProto.Model.Channel.IdentityLevel.None, "none"],
            [ChannerProto.Model.Channel.IdentityLevel.Topic, "topic"],
            [ChannerProto.Model.Channel.IdentityLevel.Channel, "channel"],
            [ChannerProto.Model.Channel.IdentityLevel.Account, "account"],
        ], idlevel));
        var idl = idlevel();
        if (idl != ChannerProto.Model.Channel.IdentityLevel.Unknown) {
            idlevel_block.push(m("div", {class: "explaination"}, idlevel_text[idl]));
        }
        elements.push(m("div", {class: "block id-level"}, idlevel_block));

        //disp radiobox
        var disp = props["display"];
        var disp_block = [m("div", {class: "title"}, _L("display style"))];
        disp_block.push(Template.radio({
            class: "radio-options",
        }, "display-style", [
            [ChannerProto.Model.Channel.TopicDisplayStyle.Tail, "tail"],
            [ChannerProto.Model.Channel.TopicDisplayStyle.Tree, "tree"],
        ], disp));
        var d = disp();
        if (d != ChannerProto.Model.Channel.TopicDisplayStyle.Invalid) {
            disp_block.push(m("div", {class: "explaination"}, display_text[d]));
        }
        elements.push(m("div", {class: "block display-style"}, disp_block));

        //anon signature
        elements.push(m("div", {class: "block"}, [
            Template.textinput(props["anon"], 
                {class: "input-text anon"}, texts.DEFAULT_ANONYMOUS)
        ]));
        //postlimit, styl, textarea
        elements.push(m("div", {class: "block"}, [
            Template.textinput(props["postlimit"], 
                {class: "input-text postlimit"}, texts.DEFAULT_POST_LIMIT)
        ]));
        elements.push(m("div", {class: "block"}, [
            Template.textinput(props["style"], 
                {class: "input-text style"}, texts.DEFAULT_STYLE_URL)
        ]));
    }
    //send button
    elements.push(m("div", {class: "block send"}, [
        m("button", {
            onclick: ctrl.onsend,
            class: "send " + (ctrl.sendready() ? "enabled" : "disabled"),
            disabled: !ctrl.sendready(), 
        }, _L("Create"))
    ]));
	return m("div", {class: "create"}, elements);
}
export class ChannelCreateComponent implements UI.Component {
	controller: () => ChannelCreateController;
	view: UI.View<ChannelCreateController>;

	constructor() {
		this.view = ChannelCreateView;
		this.controller = () => {
			return new ChannelCreateController(this);
		}
	}
}
