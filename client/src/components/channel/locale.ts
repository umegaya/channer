/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, Template} from "../../uikit"
import {TopComponent} from "../top"
import {ScrollComponent} from "../parts/scroll"
import {MenuElementComponent} from "../menu"
import {Config} from "../../config"
import {Handler, Builder} from "../../proto"
import {ProtoError} from "../../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;
var scroller = window.channer.parts.Scroll;

export class ChannelLocaleController implements UI.Controller {
	component: ChannelLocaleComponent;
    locale: UI.Property<string>;
    settings: Array<{key:string, value:any}>;

	constructor(component: ChannelLocaleComponent) {
		this.component = component;
        this.locale = m.prop("");
        this.settings = window.channer.l10n.localeSettings();
	}
    onselected = () => {
        
    }
    pagedata = (page: number): UI.Property<Array<{key:string, value:any}>> => {
        console.log("pagedata: for: " + page);
        return m.prop(this.settings.slice(page * 10, page * 10 + 9));
    }
    renderer = (data: {key:string, value:any}, opts: any): UI.Element => {
        return m("div", data.value);
    }
}
function ChannelLocaleView(ctrl: ChannelLocaleController) : UI.Element {
	return m(".locale .block", [
        m(".pulldown", m.component(scroller, {
            pageData: ctrl.pagedata,
            item: ctrl.renderer,
        }))
    ]);
}
export class ChannelLocaleComponent extends MenuElementComponent {
	controller: (args?: any) => ChannelLocaleController;
	view: UI.View<ChannelLocaleController>;
    scroll: ScrollComponent;

	constructor(parent: TopComponent) {
        super(parent);
		this.view = ChannelLocaleView;
        this.scroll = new ScrollComponent();
		this.controller = () => {
			return new ChannelLocaleController(this);
		}
	}
    iconview = (): UI.Element => {
        return [
            m(".balloon", "change locale"),
            m(".bg", m(".locale", window.channer.l10n.language)),
        ];
    }
    name = (): string => {
        return "change Locale";
    }
}
