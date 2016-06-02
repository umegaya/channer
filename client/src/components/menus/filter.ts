/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util} from "../../uikit"
import {PropCollectionFactory, PropCollection} from "../../input/prop"
import {ModelCollection, 
    categories_wc, locales_wc, topic_categories, topic_durations
} from "../parts/scroll"
import {MenuElementComponent} from "../menu"
import {BaseComponent} from "../base"
import {TopComponent} from "../top"
import {PulldownComponent, LocalePulldownOptions} from "../parts/pulldown"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

//-------------------------------------------------------------
//base filter controller
export class BaseFilterController implements UI.Controller {
    component: MenuElementComponent;
    id: string;
    dirty: boolean;
    localeDirty: boolean;
    locale: UI.Property<string>;
    props: PropCollection;

	constructor(component: MenuElementComponent, id: string, propName: string) {
        this.component = component;
        this.id = id;
        this.dirty = false;
        this.props = PropCollectionFactory.ref(propName);
        this.locale = m.prop(window.channer.settings.values.search_locale);
	}
    onchange_locale = (locale: {key: string, value: string}) => {
        window.channer.settings.values.search_locale = locale.key;
        window.channer.settings.save();
        this.localeDirty = true;
    }
}


//-------------------------------------------------------------
//channel filter
export class ChannelFilterController extends BaseFilterController {
	constructor(component: ChannelFilter) {
        super(component, "channel", "top-models");
	}
    onchange_category = (category: string) => {
        this.props.update("channel_category", category);
        this.dirty = true;
    }
    onunload = () => {
        this.component.notifyMenuEvent(this, "filter-changed");
    }
}
export function ChannelFilterView(ctrl: ChannelFilterController) : UI.Element {
    var props = ctrl.props.props;
    return m(".filter", [
        m.component(PulldownComponent, {
            label: _L("Category"),
            value: props["channel_category"],
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
export class ChannelFilter extends MenuElementComponent {
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
        return "/menu/filter/channel";
    }
}
export var ChannelFilterComponent: ChannelFilter = new ChannelFilter();



//-------------------------------------------------------------
//topic filter
export class TopicFilterController extends BaseFilterController {
	constructor(component: TopicFilter) {
        super(component, "topic", "top-models");
	}
    onchange_category = (category: string) => {
        this.props.update("topic_sort_by", category);
        this.dirty = true;
    }
    onchange_duration = (duration: string) => {
        this.props.update("topic_sort_duration", duration);
        this.dirty = true;
    }
    onunload = () => {
        this.component.notifyMenuEvent(this, "filter-changed");
    }
}
export function TopicFilterView(ctrl: TopicFilterController) : UI.Element {
    var props = ctrl.props.props;
    return m(".filter", [
        m.component(PulldownComponent, {
            label: _L("Sort By"),
            value: props["topic_sort_by"],
            models: topic_categories,
            onchange: ctrl.onchange_category,
        }),
        m.component(PulldownComponent, {
            label: _L("Sort Duration"),
            value: props["topic_sort_duration"],
            models: topic_durations,
            onchange: ctrl.onchange_duration,
        }),
        m.component(PulldownComponent, new LocalePulldownOptions({
            label: _L("Priority Locale"),
            value: ctrl.locale,
            models: locales_wc,
            onchange: ctrl.onchange_locale,
        })),
    ]);
}
export class TopicFilter extends MenuElementComponent {
    constructor() {
        super();
	}
    controller = (): TopicFilterController => {
        return new TopicFilterController(this);
    }
    menuview = (ctrl: TopicFilterController): UI.Element => {
    	return TopicFilterView(ctrl);
    }
    iconview = (): UI.Element => {
        return this.format_iconview("img.search_topic", _L("filter topic"));
    }
    name = (): string => {
        return "topic filter";
    }
    pageurl = (): string => {
        return "/menu/filter/topic";
    }
}
export var TopicFilterComponent: TopicFilter = new TopicFilter();
