import * as React from 'react'
import {PropCollectionFactory, PropConditions, PropCollection} from "../../input/prop"
import {ModelCollection, ProtoModelCollection, ProtoModelChunk, ScoreBoundary} from "../common/scroll"
import {Surface, ListView, Text, Group, Image} from "react-canvas"
import {Handler, Builder} from "../../proto"
import {Util} from "../../uikit"
import {TopicListStyler} from "../stylers/topic"
import {vh} from "../common/styler"
import ChannerProto = Proto2TypeScript.ChannerProto;
import Q = require('q');
var _L = window.channer.l10n.translate;
var Long = window.channer.ProtoBuf.Long;

var styler = new TopicListStyler();

function get_title_text(model: ChannerProto.Model.Topic): string {
    return model.title + "/" + model.point + "," + model.vote + "/" + model.locale + "/" + model.content;
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
    item_height = (index: number): number => {
        var model = this.get(index);
        if (!model) {
            return vh(20);
        } 
        else {
            styler.set_model(model);
            return styler.height();
        }
    }
}

var clock = require('../../img/clock.png');
var post = require('../../img/post.png');
var upvote = require('../../img/upvote.png');

export interface TopicElementProp {
    c?: ModelCollection;
    model: ChannerProto.Model.Topic;
    elemOpts: (path: string) => (() => void);
}

export interface TopicElementState {

}

export class TopicElementComponent extends React.Component<TopicElementProp, TopicElementState> {
    render(): UI.Element {
        var model = this.props.model;
        var copied = model.body.slice();
        var body = Builder.Model.Topic.Body.decode(copied);
        var p = model.point.toString();
        var imageComponentOrEmpty: UI.Element;
        styler.set_model(model);
        if (styler.image_url()) {
            imageComponentOrEmpty = <Image style={styler.img()} src={styler.image_url()} />        
        }
        //apply text metrics
        return <Group style={styler.bg()} onClick={this.props.elemOpts("/topic/" + model.id.toString())}>
            <Text style={styler.point()}>{p}</Text>
            <Text style={styler.point_unit(p)}>pt</Text>
                    
            <Text style={styler.title()}>{styler.get_title_text()}</Text>
            
            <Text style={styler.channel_name()}>{body.channel_name + "/" + model.locale}</Text>
            
            {imageComponentOrEmpty}

            <Image style={styler.icon(0, 0)} src={clock} />       
            <Text style={styler.attr_text(0, 0)}>{Util.datebyuuid(model.id, true)}</Text>
            
            <Image style={styler.icon(25, 0)} src={upvote} />
            <Text style={styler.attr_text(25, 0)}>{Util.upvote_percent(model) + "%"}</Text>

            <Image style={styler.icon(50, 0)} src={post} />
            <Text style={styler.attr_text(50, 0)}>{model.comment.toString()}</Text>        
        </Group>;
    }
}
