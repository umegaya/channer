/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, Template} from "../../uikit"
import {TopComponent} from "../top"
import {MenuElementComponent} from "../menu"
import {Config} from "../../config"
import {Handler, Builder} from "../../proto"
import {ProtoError} from "../../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

export class ChannelLocaleController implements UI.Controller {
	component: ChannelLocaleComponent;
    locale: UI.Property<string>;

	constructor(component: ChannelLocaleComponent) {
		this.component = component;
        this.locale = m.prop("");
	}
    
    onselected = () => {
        
    }
}
function ChannelLocaleView(ctrl: ChannelLocaleController) : UI.Element {
    var settings = window.channer.l10n.localeSettings();
	return m(".locale .block", [
        Template.pulldown(settings.localeDisplayNames.languages, ctrl.locale), 
    ]);
}
export class ChannelLocaleComponent extends MenuElementComponent {
	controller: (args?: any) => ChannelLocaleController;
	view: UI.View<ChannelLocaleController>;

	constructor(parent: TopComponent) {
        super(parent);
		this.view = ChannelLocaleView;
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
