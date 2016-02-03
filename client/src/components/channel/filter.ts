/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, Template} from "../../uikit"
import {TopComponent} from "../top"
import {MenuElementComponent} from "../menu"
import {Config} from "../../config"
import {Handler, Builder} from "../../proto"
import {ProtoError} from "../../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

export class ChannelFilterController implements UI.Controller {
	component: ChannelFilterComponent;

	constructor(component: ChannelFilterComponent) {
		this.component = component;
	}
}
function ChannelFilterView(ctrl: ChannelFilterController) : UI.Element {
	return m(".filter");
}
export class ChannelFilterComponent extends MenuElementComponent {
	controller: (args?: any) => ChannelFilterController;
	view: UI.View<ChannelFilterController>;

	constructor(parent: TopComponent) {
        super(parent);
		this.view = ChannelFilterView;
		this.controller = () => {
			return new ChannelFilterController(this);
		}
	}
    iconview = (): UI.Element => {
        return this.format_iconview("img.search_channel", _L("filter channel"));
    }
    name = (): string => {
        return "channel filter";
    }
}
