/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, Template, ModelCollection, categories, locales} from "../../uikit"
import {MenuElementComponent} from "../menu"
import {BaseComponent} from "../../uikit"
import {TopComponent} from "../top"
import {PulldownComponent} from "../parts/pulldown"
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
        this.locale = m.prop(this.current_locale());
        this.category = m.prop(window.channer.settings.values.search_category || "");
	}
    current_locale = (): string => {
        return window.channer.l10n.localeNameFromCode(
            window.channer.settings.values.search_locale
        ) || "";
    }
    onchange_locale = (locale: {key: string, value: string}) => {
        window.channer.settings.values.search_locale = locale.key;
        window.channer.settings.save();
        this.locale(this.current_locale());
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
        m.component(PulldownComponent, categories, null, {
            label: _L("Category"),
            value: ctrl.category,
            onchange: ctrl.onchange_category,
        }),
        m.component(PulldownComponent, locales, null, {
            label: _L("Priority Locale"),
            value: ctrl.locale,
            onchange: ctrl.onchange_locale,
            infoview: (c: ModelCollection, model: {key: string, value: string}): UI.Element => {
                return model.value;
            }
        }),        
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
