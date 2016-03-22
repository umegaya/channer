/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util} from "../../uikit"
import {ModelCollection, categories_wc, locales_wc} from "../parts/scroll"
import {MenuElementComponent} from "../menu"
import {BaseComponent} from "../base"
import {TopComponent} from "../top"
import {PulldownComponent, LocalePulldownOptions} from "../parts/pulldown"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

class ChannelFilterController implements UI.Controller {
	component: ChannelFilter;
    locale: UI.Property<string>;
    category: UI.Property<string>;
    dirty: boolean;

	constructor(component: ChannelFilter) {
		this.component = component;
        this.dirty = false;
        this.locale = m.prop(window.channer.settings.values.search_locale);
        this.category = m.prop(window.channer.settings.values.search_category || "");
	}
    onchange_locale = (locale: {key: string, value: string}) => {
        window.channer.settings.values.search_locale = locale.key;
        window.channer.settings.save();
        this.dirty = true;
    }
    onchange_category = (category: string) => {
        window.channer.settings.values.search_category = category;
        window.channer.settings.save();
        this.dirty = true;
    }
    onunload = () => {
        if (this.dirty) {
            (<TopComponent>(<BaseComponent>window.channer.components.Top).content).onunload();
        }
    }
}
function ChannelFilterView(ctrl: ChannelFilterController) : UI.Element {
    return m(".filter", [
        m.component(PulldownComponent, {
            label: _L("Category"),
            value: ctrl.category,
            models: categories_wc,
            onchange: ctrl.onchange_category,
        }),
        m.component(PulldownComponent, new LocalePulldownOptions({
            label: _L("Priority Locale"),
            value: ctrl.locale,
            models: locales_wc,
            onchange: ctrl.onchange_locale,
        })),
    ]);
}
class ChannelFilter extends MenuElementComponent {
    constructor() {
        super();
	}
    controller = (): ChannelFilterController => {
        return new ChannelFilterController(this);
    }
    menuview = (ctrl: ChannelFilterController): UI.Element => {
    	return ChannelFilterView(ctrl);
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
