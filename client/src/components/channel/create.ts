/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, Template} from "../../uikit"
import {Config} from "../../config"
import ChannerProto = Proto2TypeScript.ChannerProto;

export class ChannelCreateController implements UI.Controller {
	component: ChannelComponent;
    name: UI.Property<string>;
    anon: UI.Property<string>;
    desc: UI.Property<string>;
    idlevel: UI.Property<number>;
    display: UI.Property<number>;
    postlimit: UI.Property<string>;

	constructor(component: ChannelComponent) {
		this.component = component;
        this.name = m.prop("");
        this.anon = m.prop("");
        this.desc = m.prop("");
        this.postlimit = m.prop("");
        this.idlevel = m.prop(0);
        this.display = m.prop(0);
	}
    onsend = () => {
                
    }
    sendready = ():boolean => {
        return this.name().length > 0;
    }
}
var idlevel = {
    [ChannerProto.Model.Channel.IdentityLevel.Topic]: 
        "in each topic, all post by same person will be assigned same identifier.",
    [ChannerProto.Model.Channel.IdentityLevel.Channel]: 
        "in this channel, all post by same person will be assigned same identifier.",
    [ChannerProto.Model.Channel.IdentityLevel.Account]: 
        "all post show its account id of submitter.",
    [ChannerProto.Model.Channel.IdentityLevel.None]: 
        "no identifier is assigned to any post in this channel.",
}
var display = {
    [ChannerProto.Model.Channel.TopicDisplayStyle.Tail]: 
        "all post show in time-series order. eg) 2ch, github, and most of forum.",
    [ChannerProto.Model.Channel.TopicDisplayStyle.Tree]: 
        "post shows with respecting graph structure defined by 'in reply to which post' eg) reddit, 4chan",
}
function ChannelCreateView(ctrl: ChannelCreateController) : UI.Element {
	var elements = Template.header(); 
    elements.push(Template.textinput(ctrl.name, "input-name", "channel name"));
    elements.push(Template.textinput(ctrl.anon, "input-name", "anonymous name"));
    elements.push(m("div", {class: "div-explain"}, "choose identity level"));
    elements.push(Template.radio({
        [ChannerProto.Model.Channel.IdentityLevel.Topic]: "topic",
        [ChannerProto.Model.Channel.IdentityLevel.Channel]: "channel",
        [ChannerProto.Model.Channel.IdentityLevel.Account]: "account",
        [ChannerProto.Model.Channel.IdentityLevel.None]: "none",
    }, ctrl.idlevel));
    if (ctrl.idlevel() != ChannerProto.Model.Channel.IdentityLevel.None) {
        elements.push(m("div", {class: "div-explain"}, idlevel[ctrl.idlevel()]));
    }
    elements.push(m("div", {class: "div-explain"}, "choose display style"));
    elements.push(Template.radio({
        [ChannerProto.Model.Channel.TopicDisplayStyle.Tail]: "tail",
        [ChannerProto.Model.Channel.TopicDisplayStyle.Tree]: "tree",
    }, ctrl.display));
    if (ctrl.display() != ChannerProto.Model.Channel.TopicDisplayStyle.Unknown) {
        elements.push(m("div", {class: "div-display-explain"}), display[ctrl.display()]);
    }
    elements.push(Template.textinput(ctrl.postlimit, "input-number", "post limit"));
    elements.push(Template.textinput(ctrl.name, "input-url", "additional style"));
    elements.push(m("textarea", {class: "textarea-desc"}, ctrl.desc()));
    elements.push(m("button", {
        onclick: ctrl.onsend,
        class: ctrl.sendready() ? "button-send" : "button-send-disabled", 
    }, "Create"));
	return m("div", {class: "create"}, elements);
}
export class ChannelComponent implements UI.Component {
	controller: () => ChannelCreateController;
	view: UI.View<ChannelCreateController>;

	constructor(config: Config) {
		this.view = ChannelCreateView;
		this.controller = () => {
			return new ChannelCreateController(this);
		}
	}
}
