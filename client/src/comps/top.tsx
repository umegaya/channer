/// <reference path="../../typings/extern.d.ts"/>
import * as React from 'react'
import {PropCollectionFactory, PropConditions, PropCollection} from "../input/prop"
import {ModelCollection, ProtoModelCollection, ProtoModelChunk, Boundary, 
    ListComponent, ListProp} from "./parts/scroll"
import {Config} from "../config"
import {Handler, Builder} from "../proto"
import {Util} from "../uikit"
import {img, vw, vh, h} from "./canvas_styler"
import ChannerProto = Proto2TypeScript.ChannerProto;
import Q = require('q');
var _L = window.channer.l10n.translate;
var Long = window.channer.ProtoBuf.Long;
var Tabs = window.channer.parts.Tabs;
var Group = window.channer.canvas.Group, 
    Image = window.channer.canvas.Image,
    Text = window.channer.canvas.Text,
    Gradient = window.channer.canvas.Gradient;

PropCollectionFactory.setup("top-models", {
    required: {
        channel_sort_by : {
            init : "latest",
        },
        channel_category : {
            init : _L("All"),
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
        this.id = (typeof(n) == "number" ? new Long(n as number) : n as Long);
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

var idlevel_text : { [t:number]:string } = {
    [ChannerProto.Model.Channel.IdentityLevel.Topic]: _L("topic"),
    [ChannerProto.Model.Channel.IdentityLevel.Channel]: _L("channel"),
    [ChannerProto.Model.Channel.IdentityLevel.Account]: _L("account"),
    [ChannerProto.Model.Channel.IdentityLevel.None]: _L("none"),
}

class ChannelInfoStyler {
    name(): any {
        return {
            top: vh(1),
            left: vw(1),
            height: vh(3.5),
            width: vw(98),
            fontSize: h(2),
            lineHeight: h(2) + vh(0.5),
        }
    }
    desc(): any {
        return {
            top: vh(4),
            left: vw(1),
            height: vh(2.5),
            width: vw(98),
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }
    }
    img(wofs: number): any {
        return {
            top: vh(7),
            left: vw(1 + wofs),
            width: vh(2.5),
            height: vh(2.5),
            backgroundColor: '#ddd',
            //borderColor: '#999',
            //borderWidth: 1
        }
    }
    attr_text(wofs: number): any {
        return {
            top: vh(7),
            left: vw(1 + wofs) + vh(2.5),
            width: vw(20),
            height: vh(2.5),
            fontSize: h(3),
            lineHeight: h(3) + vh(0.5),            
        }        
    }
}

var styler = new ChannelInfoStyler();

function ChannelInfoView(
    c: ModelCollection, 
    model: ChannerProto.Model.Channel
): UI.Element {
    var copied = model.options.slice();
    var options = Builder.Model.Channel.Options.decode(copied);
/* <div className="block" key={model.id.toString()}>
        <div className="title-h2 name">
            {model.name + "/" + model.locale + "," + model.category}
        </div>
        <div className="desc">
            {model.description || _L("no description")}
        </div>
        <div className="attributes">
            <div className="attr">
                <img className="clock"/>
                <div className="date">{Util.datebyuuid(model.id, true)}</div>
            </div>
            <div className="attr">
                <img className="user"/>
                <div className="user">{11111}</div>
            </div>
            <div className="attr">
                <img className="star"/>
                <div className="star">{33333}</div>
            </div>
            <div className="attr">
                <div className={"idlevel idlevel-" + options.identity}>
                {idlevel_text[options.identity]}
                </div>
            </div>
        </div>
    </div>; */
    var clock = img("clock");//require("../img/clock.svg");
    var user = img("user");//require("../img/user.svg");
    var star = img("star");//require("../img/star.svg");
    return <Group>
        <Text style={styler.name()}>{model.name + "/" + model.locale + "," + model.category}</Text>
        <Text style={styler.desc()}>{model.description || _L("no description")}</Text>
        <Image style={styler.img(0)} src={clock}/>
        <Text style={styler.attr_text(0)}>{Util.datebyuuid(model.id, true)}</Text>
        <Image style={styler.img(25)} src={user}/>
        <Text style={styler.attr_text(25)}>11111</Text>
        <Image style={styler.img(50)} src={star}/>
        <Text style={styler.attr_text(50)}>33333</Text>
    </Group>;
}


export interface TopProp {
    tab: string;    
}

export interface TopState {
    settings: PropCollection;
    topics: TopicCollection;
    channels: ChannelCollection;
}

export class TopComponent extends React.Component<TopProp, TopState> {
    constructor(props: TopProp) {
        super(props);
        var settings = PropCollectionFactory.ref("top-models"); 
        this.state = {
            settings: settings,
            topics: new TopicCollection(settings),
            channels: new ChannelCollection(settings),
        }        
    }
    render(): UI.Element {
        return <div className="top"><ListComponent
            renderItem={ChannelInfoView}
            models={this.state.channels}
        /></div>;
    }
}
