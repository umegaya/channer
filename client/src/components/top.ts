/// <reference path="../../typings/extern.d.ts"/>

import {m, Util} from "../uikit"
import {Pagify, PageComponent} from "./base"
import {PropCollectionFactory, PropConditions, PropCollection} from "../input/prop"
import {ModelCollection, ProtoModelCollection, ProtoModelChunk, Boundary, ScrollProperty} from "./parts/scroll"
import {MenuElementComponent} from "./menu"
import {Config} from "../config"
import {Handler} from "../proto"
import {ChannelCreateComponent} from "./menus/create"
import {ChannelFilterComponent, TopicFilterComponent} from "./menus/filter"
import {ChannelListComponent, TopicListComponent} from "./parts/list"
import ChannerProto = Proto2TypeScript.ChannerProto;
import Q = require('q');
var _L = window.channer.l10n.translate;
var Long = window.channer.ProtoBuf.Long;
var Tabs = window.channer.parts.Tabs;

const TABS = [{
    label: _L("channel"),
    after: m("img.channel"),
    id: "channel",
}, {
    label: _L("topic"),
    after: m("img.topic"),
    id: "topic",
}];

PropCollectionFactory.setup("top-models", {
    required: {
        channel_sort_by : {
            init : "latest",
        },
        channel_category : {
            init : "",  
        },
        topic_sort_by: {
            init : "rising",  
        },
        topic_sort_duration: {
            init : "day",
        },
    },
    optional: {},
});

export class LongBoundary implements Boundary {
    id: Long;
    constructor(n: number|Long) {
        this.id = (typeof(n) == "number" ? new Long(<number>n) : <Long>n);
    }
    isZero(): boolean {
        return this.id.equals(Long.UZERO);
    }
    lessThan(b: LongBoundary): boolean {
        return this.id.lessThan(b.id);
    }
    greaterThan(b: LongBoundary): boolean {
        return this.id.greaterThan(b.id);
    }
}

export class ChannelCollection extends ProtoModelCollection<ChannerProto.Model.Channel, LongBoundary> {
    props: PropCollection;
    constructor(props: PropCollection) {
        super();
        this.props = props;
    }
    initkey = () => {
        this.key = "channels/" 
            + this.props.val("channel_sort_by") + "/"
            + this.props.val("channel_category") + "/"
            + window.channer.settings.values.search_locale;
    }
    fetch_request = (offset: LongBoundary, limit: number): Q.Promise<Array<ChannerProto.Model.Channel>> => {
        var df: Q.Deferred<Array<ChannerProto.Model.Channel>> = Q.defer<Array<ChannerProto.Model.Channel>>();
        var conn: Handler = window.channer.conn;
        var sort_by: string = this.props.val("channel_sort_by");
        var category: number = window.channer.category.to_id(
            this.props.val("channel_category")
        )
        conn.channel_list(sort_by, offset && offset.id, null, category, limit)
        .then((r: ChannerProto.ChannelListResponse) => {
            df.resolve(r.list);
        });
        return df.promise;
    }
    update_range = (
        chunk: ProtoModelChunk<ChannerProto.Model.Channel, LongBoundary>, 
        model: ChannerProto.Model.Channel) => {
        var sort_by: string = this.props.val("channel_sort_by");
        if (sort_by == "top") {
            chunk.update_range(new LongBoundary(model.watcher));
        }
        else {
            chunk.update_range(new LongBoundary(model.id));
        }
    }
}

export class ScoreBoundary implements Boundary {
    id: Long;
    score: number;
    constructor(id: Long, score: number) {
        this.id = id;
        this.score = score;
    }
    isZero(): boolean {
        return this.id.equals(Long.UZERO);
    }
    //score < b.score || this.id < b.id
    lessThan(b: ScoreBoundary): boolean {
        return this.score < b.score || this.id.lessThan(b.id);
    }
    //score > b.score || this.id > b.id
    greaterThan(b: ScoreBoundary): boolean {
        return this.score > b.score || this.id.greaterThan(b.id);
    }
}

export class TopicCollection extends ProtoModelCollection<ChannerProto.Model.Topic, ScoreBoundary> {
    static NULL_OFFSET = new ScoreBoundary(Long.UZERO, 0);
    props: PropCollection;
    constructor(props: PropCollection) {
        super();
        this.props = props;
    }
    sort_by = (): string => {
        return this.props.val("topic_sort_by");
    }
    initkey = () => {
        this.key = "topics/" + this.props.val("topic_sort_by") + "/"
            + this.props.val("topic_sort_duration") + "/" 
            + window.channer.settings.values.search_locale;
    }
    fetch_request = (offset: ScoreBoundary, limit: number): Q.Promise<Array<ChannerProto.Model.Topic>> => {
        var df: Q.Deferred<Array<ChannerProto.Model.Topic>> = Q.defer<Array<ChannerProto.Model.Topic>>();
        var conn: Handler = window.channer.conn;
        var bucket: string = this.props.val("topic_sort_by");
        var query: string = this.props.val("topic_sort_duration");
        offset = offset || TopicCollection.NULL_OFFSET;
        conn.topic_list(bucket, query, offset.score, offset.id, null, limit)
        .then((r: ChannerProto.TopicListResponse) => {
            df.resolve(r.list);
        })
        return df.promise;
    }
    update_range = (
        chunk: ProtoModelChunk<ChannerProto.Model.Topic, ScoreBoundary>, 
        model: ChannerProto.Model.Topic) => {
        var bucket: string = this.props.val("topic_sort_by");
        if (bucket == "hot" || bucket == "rising") {
            chunk.update_range(new ScoreBoundary(model.id, model.point));
        }
        else if (bucket == "flame") {
            chunk.update_range(new ScoreBoundary(model.id, model.vote));
        }
    }
}

export class TopController implements UI.Controller {
    active: UI.Property<number>;
    start: string;
    id: string;
    component: TopComponent;
    static scrollProps: Array<UI.Property<ScrollProperty>> = [
        m.prop(new ScrollProperty()),
        m.prop(new ScrollProperty()),
    ];
    static factory: Array<(s: TopComponent) => UI.Element> = [
        (s: TopComponent) => {
            return m.component(ChannelListComponent, {
                key: s.models.channels.key,
                models: s.models.channels,
                name: "channels",
                scrollProp: TopController.scrollProps[0],
            });
        },
        (s: TopComponent) => {
            return m.component(TopicListComponent, {
                key: s.models.topics.key,
                models: s.models.topics, 
                name: "topics",
                scrollProp: TopController.scrollProps[1],
            });
        },
    ];
	constructor(component: TopComponent) {
        this.active = m.prop(0);
        this.component = component;
        this.start = m.route.param("tab") || "latest";
        TABS.map((tab, idx) => {
            if (tab.id == this.start) {
                this.active(Number(idx));
            }
        });
	}
    tabContent(): UI.Element {
        return TopController.factory[this.active()](this.component);
    }
}
function TopView(ctrl: TopController) : UI.Element {
	var elements : Array<UI.Element> = []; 
    elements.push(
        ctrl.tabContent(),
        m.component(Tabs, {
            menu: true,
            buttons: TABS,
            autofit: true,
            hideIndicator: true,
            selectedTab: ctrl.active(),
            activeSelected: true,
            getState: (state: { index: number }) => {
                Util.route("/top/" + TABS[state.index].id, null, {
                    replace_history: true,
                });
            }
        }));
    return m(".top", elements);
}
export class TopModelCollections {
    initialized: boolean;
    props: PropCollection;
    channels: ChannelCollection;
    topics: TopicCollection;
    constructor() {
        this.initialized = false;
    }
    iter = (fn: (coll: ModelCollection) => void) => {
        fn(this.channels);
        fn(this.topics);       
    }
    initialize = (): void => {
        if (!this.initialized) {
            this.props = PropCollectionFactory.ref("top-models"); 
            this.channels = new ChannelCollection(this.props);
            this.topics = new TopicCollection(this.props);
            this.iter(coll => { coll.initkey(); });
            this.initialized = true;
        }
    }
    refresh = (): void => {
        this.iter(coll => { coll.refresh(); });
    }
}
export class TopComponent extends PageComponent {
    models: TopModelCollections;
    constructor() {
        super();
        this.models = new TopModelCollections();
    }
    controller = (): TopController => {
        this.models.initialize();
        return new TopController(this);
    }
    view = (ctrl: TopController): UI.Element => {
    	return TopView(ctrl);
    }
    menus = (): Array<MenuElementComponent> => {
        return [
            ChannelFilterComponent,
            ChannelCreateComponent,
            TopicFilterComponent,
        ];
    }
    onunload = () => {
        console.log("top refreshed");
        this.models.refresh();
    }
}
window.channer.components.Top = Pagify(TopComponent);
window.channer.components.ChannelCreate = ChannelCreateComponent;
window.channer.components.ChannelFilter = ChannelFilterComponent;
window.channer.components.TopicFilter = TopicFilterComponent;
