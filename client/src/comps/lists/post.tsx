import * as React from 'react'
import {PropCollectionFactory, PropConditions, PropCollection} from "../../input/prop"
import {ModelCollection, ProtoModelCollection, ProtoModelChunk, LongBoundary} from "../common/scroll"
import {Surface, ListView, Text, Group, Image} from "react-canvas"
import {Handler, Builder} from "../../proto"
import {Util} from "../../uikit"
import {PostListStyler} from "../stylers/post"
import {VoteList} from "../common/votes"
import * as hljs from "highlight.js"
import ChannerProto = Proto2TypeScript.ChannerProto;
import * as Promise from "bluebird"
var Markdown = window.channer.parts.Markdown;
var _L = window.channer.l10n.translate;
var Long = window.channer.ProtoBuf.Long;

var styler = new PostListStyler();

export class PostCollection extends ProtoModelCollection<ChannerProto.Model.Post, LongBoundary> {
    static NULL_OFFSET = new LongBoundary(Long.UZERO);
    topic_id: Long;
    props: PropCollection;
    votes: VoteList;
    constructor(topic_id: Long, props: PropCollection) {
        super();
        this.props = props;
        this.votes = VoteList.instance();
        this.topic_id = topic_id;
        this.votes.load();
        this.initkey();
    }
    sort_by = (): string => {
        return this.props.val("post_sort_by");
    }
    initkey = () => {
        this.key = "posts/" + this.topic_id.toString() + "/" + this.props.val("post_sort_by");
    }
    set_topic_id = (id: Long) => {
        if (this.topic_id != id) {
            this.refresh();
            this.topic_id = id;
        }
    }
    fetch_request = (offset: LongBoundary, limit: number): Promise<ChannerProto.Model.Post[]> => {
        return new Promise<ChannerProto.Model.Post[]>(
        (resolve: (e: ChannerProto.Model.Post[]) => void, reject: (err: any) => void) => {
            var conn: Handler = window.channer.conn;
            var query: string = this.sort_by();
            conn.post_list(this.topic_id, query, offset && offset.id, limit)
            .then((r: ChannerProto.PostListResponse) => {
                resolve(r.list); 
            }, reject);
        });
    }
    update_range = (
        chunk: ProtoModelChunk<ChannerProto.Model.Post, LongBoundary>, 
        model: ChannerProto.Model.Post) => {
        chunk.update_range(new LongBoundary(model.id));
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

export interface PostElementProp {
    c?: PostCollection;
    model: ChannerProto.Model.Post;
    elemOpts: (path: string) => (() => void);
}

export interface PostElementState {
    vote: number; //1, -1, 0
}

export class PostElementComponent extends React.Component<PostElementProp, PostElementState> {
    constructor(props: PostElementProp) {
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
    options(): any {
        return {
            breaks: true,
            highlight: function (str: string, lang: string) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(lang, str).value;
                    } catch (__) {}
                }
                return ''; // use external default escaping
            },
            linkify: true,
        }
    }
    render(): UI.Element {
        var model = this.props.model;
        var id = model.id;
        var copied = model.body.slice();
        var body = Builder.Model.Post.Body.decode(copied);
        var up = (model.vote + model.point) / 2, down = (model.vote - model.point) / 2;
        styler.set_model(model);
        return <div className="post" id={model.id.toString()}>
            <div className="date"><img className="clock"/><div>{Util.datebyuuid(model.id, true)}</div></div>
            <div className="content"><Markdown source={model.content} options={this.options()}/></div>
            <div title={model.content}/>
        </div>
        /*
        return <Group style={styler.bg()}>                    
            <Text style={styler.title()}>{model.content}</Text>
        </Group>;
        */
    }
}
