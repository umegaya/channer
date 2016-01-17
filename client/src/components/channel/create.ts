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

	constructor(component: ChannelCreateComponent) {
		this.component = component;
        this.input = new PropCollection(cond);
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
    sendready = ():boolean => {
        return !!this.input.check();
    }
}
function ChannelCreateView(ctrl: ChannelCreateController) : UI.Element {
	var elements : Array<UI.Element> = []; 
    var props = ctrl.input.props;
    elements.push(Template.textinput(props["name"], 
        {class: "input-text name"}, texts.DEFAULT_NAME));
    elements.push(Template.textinput(props["anon"], 
        {class: "input-text anon"}, texts.DEFAULT_ANONYMOUS));
    elements.push(m("div", {class: "div-title id-level"}, _L("choose identity level")));
    //idlevel radiobox
    var idlevel = props["idlevel"];
    elements.push(Template.radio({
        class: "radio-options id-level",
    }, "id-level", [
        [ChannerProto.Model.Channel.IdentityLevel.None, "none"],
        [ChannerProto.Model.Channel.IdentityLevel.Topic, "topic"],
        [ChannerProto.Model.Channel.IdentityLevel.Channel, "channel"],
        [ChannerProto.Model.Channel.IdentityLevel.Account, "account"],
    ], idlevel));
    var idl = idlevel();
    if (idl != ChannerProto.Model.Channel.IdentityLevel.Unknown) {
        elements.push(m("div", {class: "div-text id-level"}, idlevel_text[idl]));
    }
    //disp radiobox
    var disp = props["display"];
    elements.push(m("div", {class: "div-title display-style"}, _L("choose display style")));
    elements.push(Template.radio({
        id: "display-style",
        class: "radio-options display-style",
    }, "display-style", [
        [ChannerProto.Model.Channel.TopicDisplayStyle.Tail, "tail"],
        [ChannerProto.Model.Channel.TopicDisplayStyle.Tree, "tree"],
    ], disp));
    var d = disp();
    if (d != ChannerProto.Model.Channel.TopicDisplayStyle.Invalid) {
        elements.push(m("div", {
            class: "div-text display-style"
        }, display_text[d]));
    }
    //postlimit, styl, textarea
    elements.push(Template.textinput(props["postlimit"], 
        {class: "input-text postlimit"}, texts.DEFAULT_POST_LIMIT));
    elements.push(Template.textinput(props["style"], 
        {class: "input-text style"}, texts.DEFAULT_STYLE_URL));
    elements.push(m("textarea", {class: "textarea"}, props["desc"]()));
    //send button
    elements.push(m("button", {
        onclick: ctrl.onsend,
        class: ctrl.sendready() ? "button-send" : "button-send-disabled", 
    }, _L("Create")));
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
