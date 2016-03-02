/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, Template} from "../../uikit"
import {TopComponent} from "../top"
import {MenuElementComponent} from "../menu"
import {LocaleListComponent, LocaleCollection} from "./locale"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

class ChannelFilterController implements UI.Controller {
	component: ChannelFilter;
    select_locale: UI.Property<boolean>;
    select_category: UI.Property<boolean>;

	constructor(component: ChannelFilter) {
		this.component = component;
        this.select_locale = m.prop(false);
        this.select_category = m.prop(false);
	}
    onlocale = (locale: string) => {
        
    }
    oncategory = (category: string) => {
        
    }
}
class ChannelFilter extends MenuElementComponent {
    constructor() {
        super();
	}
    controller = (): ChannelFilterController => {
        return new ChannelFilterController(this);
    }
    menuview = (ctrl: ChannelFilterController): UI.Element => {
    	return m(".filter");
    }
    iconview = (): UI.Element => {
        return this.format_iconview("img.search_channel", _L("filter channel"));
    }
    name = (): string => {
        return "channel filter";
    }
    pageurl = (): string => {
        return "/menu/filter";
    }
}
export var ChannelFilterComponent: ChannelFilter = new ChannelFilter();
