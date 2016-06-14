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
    return model.title + "/" + model.point + "," + model.vote + "/" + model.locale + "/" + model.content + " " + model.content;
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
            var texts = get_title_text(model);
            styler.set_texts(texts);
            return styler.height();
        }
    }
}

export function TopicListView(
    c: ModelCollection, 
    model: ChannerProto.Model.Topic
): UI.Element {
    var copied = model.body.slice();
    var body = Builder.Model.Topic.Body.decode(copied);
    var index = model.id.modulo(10).toNumber() + 1;
    var p = model.point.toString();
    //TODO: replace it to actual check
    var imageComponentOrEmpty: UI.Element;
    if (styler.has_image(model.id.modulo(100).toNumber() < 50)) {
        imageComponentOrEmpty = 
            <Image style={styler.img()} src={"http://lorempixel.com/360/420/cats/" + index + "/"} />        
    }
    //apply text metrics
    var texts = get_title_text(model);
    styler.set_texts(texts);
    return <Group>
        <Image style={styler.bg()} src={""}/>
        <Text style={styler.point()}>{p}</Text>
        <Text style={styler.point_unit(p)}>pt</Text>
        
        {imageComponentOrEmpty}
        
        <Text style={styler.title()}>{texts}</Text>
        
        <Text style={styler.channel_name()}>{body.channel_name + "/" + model.locale}</Text>
        
        <Text style={styler.icon(0, 0)}>⏰</Text>
        <Text style={styler.attr_text(0, 0)}>{Util.datebyuuid(model.id, true)}</Text>
        
        <Text style={styler.icon(50, 0)}>✍</Text>
        <Text style={styler.attr_text(50, 0)}>{model.comment.toString()}</Text>
        
        <Text style={styler.icon(25, 0)}>👍</Text>
        <Text style={styler.attr_text(25, 0)}>{Util.upvote_percent(model) + "%"}</Text>
    </Group>;
    /*
        <Text style={styler.icon(0, 3)}>👭</Text>
        <Text style={styler.attr_text(0, 3)}>{body.name}</Text>
    */
}

