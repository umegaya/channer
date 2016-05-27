/// <reference path="../../typings/extern.d.ts"/>

import {m, Util} from "../uikit"
import {Pagify, PageComponent} from "./base"
import {PropCollectionFactory, PropConditions, PropCollection} from "../input/prop"
import {ModelCollection, ProtoModelCollection, ProtoModelChunk} from "./parts/scroll"
import {MenuElementComponent} from "./menu"
import {Config} from "../config"
import {Handler} from "../proto"
import {ChannelCreateComponent} from "./menus/create"
import {ChannelFilterComponent, TopicFilterComponent} from "./menus/filter"
import {ChannelListComponent, TopicListComponent} from "./parts/list"
import ChannerProto = Proto2TypeScript.ChannerProto;
import Q = require('q');
var _L = window.channer.l10n.translate;
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

export class ChannelCollection extends ProtoModelCollection<ChannerProto.Model.Channel> {
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
    fetch_request = (offset: Long, limit: number): Q.Promise<Array<ChannerProto.Model.Channel>> => {
        var df: Q.Deferred<Array<ChannerProto.Model.Channel>> = Q.defer<Array<ChannerProto.Model.Channel>>();
        var conn: Handler = window.channer.conn;
        var sort_by: string = this.props.val("channel_sort_by");
        var category: number = window.channer.category.to_id(
            this.props.val("channel_category")
        )
        conn.channel_list(sort_by, offset, null, category, limit)
        .then((r: ChannerProto.ChannelListResponse) => {
            df.resolve(r.list);
        });
        return df.promise;
    }
    update_range = (
        chunk: ProtoModelChunk<ChannerProto.Model.Channel>, 
        model: ChannerProto.Model.Channel) => {
        var sort_by: string = this.props.val("channel_sort_by");
        if (sort_by == "top") {
            chunk.update_range(model.watcher);
        }
        else {
            chunk.update_range(model.id);
        }
    }
}

export class TopicCollection extends ProtoModelCollection<ChannerProto.Model.Topic> {
    props: PropCollection;
    constructor(props: PropCollection) {
        super();
        this.props = props;
    }
    initkey = () => {
        this.key = "topics/" + this.props.val("topic_sort_by") + "/"
            + this.props.val("topic_sort_duration") + "/" 
            + window.channer.settings.values.search_locale;
    }
    fetch_request = (offset: Long, limit: number): Q.Promise<Array<ChannerProto.Model.Topic>> => {
        var df: Q.Deferred<Array<ChannerProto.Model.Topic>> = Q.defer<Array<ChannerProto.Model.Topic>>();
        var conn: Handler = window.channer.conn;
        var bucket: string = this.props.val("topic_sort_by");
        var query: string = this.props.val("topic_sort_duration");
        conn.topic_list(bucket, query, offset, null, limit)
        .then((r: ChannerProto.TopicListResponse) => {
            df.resolve(r.list);
        })
        return df.promise;
    }
    update_range = (
        chunk: ProtoModelChunk<ChannerProto.Model.Topic>, 
        model: ChannerProto.Model.Topic) => {
        var bucket: string = this.props.val("topic_sort_by");
        if (bucket == "hot" || bucket == "rising") {
            chunk.update_range(model.point);
        }
        else if (bucket == "flame") {
            chunk.update_range(model.vote);
        }
    }
}

export class TopController implements UI.Controller {
    active: UI.Property<number>;
    start: string;
    component: TopComponent;
    static factory: Array<(s: TopComponent) => UI.Element> = [
        (s: TopComponent) => {
            return m.component(ChannelListComponent, {
                key: s.models.channels.key,
                models: s.models.channels,
                name: "channels",
            });
        },
        (s: TopComponent) => {
            return m.component(TopicListComponent, {
                key: s.models.topics.key,
                models: s.models.topics, 
                name: "topics",
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
    content(): UI.Element {
        //console.log("tab: active = " + this.active());
        return TopController.factory[this.active()](this.component);
    }
}
function TopView(ctrl: TopController) : UI.Element {
    return m(".top", [ 
        ctrl.content(),
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
        }),
    ]);
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
        this.models.refresh();
    }
}
window.channer.components.Top = Pagify(TopComponent);
window.channer.components.ChannelCreate = ChannelCreateComponent;
window.channer.components.ChannelFilter = ChannelFilterComponent;
window.channer.components.TopicFilter = TopicFilterComponent;
