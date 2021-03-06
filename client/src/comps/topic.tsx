/// <reference path="../../typings/extern.d.ts"/>
import {PageProp, PageState, PageComponent} from "./common/page"
import {PropCollectionFactory, PropCollection, prop} from "../input/prop"
import {EditComponent} from "./common/edit";
import {PostCollection, PostElementComponent} from "./lists/post"
import {ListComponent, ListScrollState} from "./common/scroll"
import {Handler, Builder} from "../proto"
var _L = window.channer.l10n.translate;
import ChannerProto = Proto2TypeScript.ChannerProto;
var Long = window.channer.ProtoBuf.Long;

//matrial ui
import * as React from 'react'

PropCollectionFactory.setup("topic-page", {
    required: {
        post_sort_by: {
            init : "latest",  
        },
    },
    optional: {},
});

export interface TopicProp extends PageProp {
    topic: ChannerProto.Model.Topic;
}

export interface TopicState extends PageState {
}

export class TopicStaticState {
    settings: PropCollection;
    scroll: ListScrollState;
    posts: PostCollection;
    constructor(topic_id: Long) {
        this.settings = PropCollectionFactory.ref("topic-page");
        this.scroll = new ListScrollState();
        this.posts = new PostCollection(topic_id, this.settings);
    }
}

export class TopicComponent extends PageComponent<TopicProp, TopicState> {
    static state: TopicStaticState = null;
    constructor(props: TopicProp) {
        super(props);
        var id = this.props.params.id;
        this.state = {
            scroll: new ListScrollState(),
            props: PropCollectionFactory.ref("topic-page"), 
        }
        if (!TopicComponent.state) {
            TopicComponent.state = new TopicStaticState(id);
        }
        TopicComponent.state.posts.set_topic_id(id);
    }
    on_send_post = (state: ReactRTE.EditorValue) => {
        console.log("on_send_post: " + state.toString('markdown'));
        var conn: Handler = window.channer.conn;
        conn.post_create(TopicComponent.state.posts.topic_id, state.toString('markdown')).
        then((r: ChannerProto.PostCreateResponse) => {
            console.log("on_send_post success");
        }, (e: Error) => {
            console.log("on_send_post: fail " + e.message);
        });
    }
    render(): UI.Element {
        return <div className="topic">
            <ListComponent
                key={TopicComponent.state.posts.key}
                elementComponent={PostElementComponent}
                models={TopicComponent.state.posts}
                scrollState={TopicComponent.state.scroll}
                noCanvas={true}
            />
            <div className="editor">
                <EditComponent onSend={this.on_send_post}/>
            </div>
        </div>;
            /*
            <div className="editor">
                <EditComponent/>
            </div>
            */
    }
}
