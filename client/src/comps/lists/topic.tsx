import * as React from 'react'
import {PropCollectionFactory, PropConditions, PropCollection} from "../../input/prop"
import {ModelCollection, ProtoModelCollection, ProtoModelChunk, ScoreBoundary} from "../common/scroll"
import {Surface, ListView, Text, Group, Image} from "react-canvas"
import {Handler, Builder} from "../../proto"
import {Util} from "../../uikit"
import {TopicListStyler} from "../stylers/topic"
import {VoteList} from "../common/votes"
import ChannerProto = Proto2TypeScript.ChannerProto;
import * as Promise from "bluebird"
var _L = window.channer.l10n.translate;
var Long = window.channer.ProtoBuf.Long;

var styler = new TopicListStyler();

export class TopicCollection extends ProtoModelCollection<ChannerProto.Model.Topic, ScoreBoundary> {
    static NULL_OFFSET = new ScoreBoundary(Long.UZERO, 0);
    props: PropCollection;
    votes: VoteList;
    constructor(props: PropCollection, votes: VoteList) {
        super();
        this.props = props;
        this.votes = votes;
        this.initkey();
    }
    sort_by = (): string => {
        return this.props.val("topic_sort_by");
    }
    initkey = () => {
        this.key = "topics/" + this.props.val("topic_sort_by") + "/"
            + this.props.val("topic_sort_duration") + "/" 
            + window.channer.settings.values.search_locale;
    }
    fetch_request = (offset: ScoreBoundary, limit: number): Promise<Array<ChannerProto.Model.Topic>> => {
        return new Promise<Array<ChannerProto.Model.Topic>>(
        (resolve: (e: Array<ChannerProto.Model.Topic>) => void, reject: (err: any) => void) => {
            var conn: Handler = window.channer.conn;
            var bucket: string = this.props.val("topic_sort_by");
            var query: string = this.props.val("topic_sort_duration");
            offset = offset || TopicCollection.NULL_OFFSET;
            conn.topic_list(bucket, query, offset.score, offset.id, null, limit)
            .then((r: ChannerProto.TopicListResponse) => {
                resolve(r.list); 
            }, reject);
        });
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
        styler.set_model(model);
        return styler.height();
    }
}

var clock = require('../../img/clock.png');
var post = require('../../img/post.png');
var upvote = require('../../img/upvote.png');
var upvote_inactive = require('../../img/upvote-inactive.png');
var downvote = require('../../img/downvote.png');
var downvote_inactive = require('../../img/downvote-inactive.png');
var channel = require('../../img/channel.png');

export interface TopicElementProp {
    c?: TopicCollection;
    model: ChannerProto.Model.Topic;
    elemOpts: (path: string) => (() => void);
}

export interface TopicElementState {
    vote: number; //1, -1, 0
}

export class TopicElementComponent extends React.Component<TopicElementProp, TopicElementState> {
    constructor(props: TopicElementProp) {
        super(props);
        this.state = {
            vote: props.c.votes.get(props.model.id.toString()),
        }
    }
    vote_handler(v: number): void {
        if (!this.props.c.votes.loaded()) {
            return;
        }
        if (this.state.vote == v) {
            v = 0;
            this.props.c.votes.rm(this.props.model.id.toString());
        } else {
            this.props.c.votes.add(this.props.model.id.toString(), v);
        }
        //TODO: send deferred vote request (because sometimes user on/off vote very fast)
        this.setState({
            vote: v,
        });
    }
    render(): UI.Element {
        var model = this.props.model;
        var id = model.id;
        var copied = model.body.slice();
        var body = Builder.Model.Topic.Body.decode(copied);
        var p = (model.point * 1000 + this.state.vote).toString();
        var imageComponentOrEmpty: UI.Element;
        var up = (model.vote + model.point) / 2, down = (model.vote - model.point) / 2;
        styler.set_model(model);
        if (styler.image_url()) {
            imageComponentOrEmpty = <Image style={styler.img()} src={styler.image_url()} />        
        }
        var upvoteElement: UI.Element = this.state.vote > 0 ? 
            <Group style={styler.vote_group(0)} onClick={this.vote_handler.bind(this, 1)}>
                <Image style={styler.vote_icon(0, 1)} src={upvote}/>
                <Text style={styler.vote_text(0, this.state.vote)}>{(up + 1).toString()}</Text>
            </Group> : 
            <Group style={styler.vote_group(0)} onClick={this.vote_handler.bind(this, 1)}>
                <Image style={styler.vote_icon(0, 1)} src={upvote_inactive}/>
                <Text style={styler.vote_text(0, 0)}>{up.toString()}</Text>
            </Group>;
        var downvoteElement: UI.Element = this.state.vote < 0 ? 
            <Group style={styler.vote_group(20)} onClick={this.vote_handler.bind(this, -1)}>
                <Image style={styler.vote_icon(20, -1)} src={downvote}/>
                <Text style={styler.vote_text(20, this.state.vote)}>{(down + 1).toString()}</Text>
            </Group> : 
            <Group style={styler.vote_group(20)} onClick={this.vote_handler.bind(this, -1)}>
                <Image style={styler.vote_icon(20, -1)} src={downvote_inactive}/>
                <Text style={styler.vote_text(20, 0)}>{down.toString()}</Text>
            </Group>;
        //apply text metrics
        return <Group style={styler.bg()} onClick={this.props.elemOpts("/topic/" + model.id.toString())}>                    
            {upvoteElement}
            {downvoteElement}   

            <Text style={styler.title()}>{styler.get_title_text()}</Text>
            
            {imageComponentOrEmpty}

            <Text style={styler.point(this.state.vote)}>{p}</Text>
            <Text style={styler.point_unit(p, this.state.vote)}>pt</Text>

            <Image style={styler.icon(0)} src={clock} />       
            <Text style={styler.attr_text(0)}>{Util.datebyuuid(model.id, true)}</Text>
            <Image style={styler.icon(25)} src={post} />
            <Text style={styler.attr_text(25)}>{model.comment.toString()}</Text>     
            <Image style={styler.icon(45)} src={channel} />
            <Text style={styler.attr_text(45, 50)}>{body.channel_name + "/" + model.locale}</Text>
        </Group>;
        /* <Text style={styler.channel_name()}>{body.channel_name + "/" + model.locale}</Text>
            <Image style={styler.icon(25, 0)} src={upvote} />
            <Text style={styler.attr_text(25, 0)}>{Util.upvote_percent(model) + "%"}</Text>
            
        */
    }
}
