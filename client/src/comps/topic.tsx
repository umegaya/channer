/// <reference path="../../typings/extern.d.ts"/>
import {PageProp, PageState, PageComponent} from "./common/page"
import {PropCollectionFactory, PropCollection, prop} from "../input/prop"
import {ListComponent, ListScrollState} from "./common/scroll"
var _L = window.channer.l10n.translate;
import ChannerProto = Proto2TypeScript.ChannerProto;

//matrial ui
import * as React from 'react'

/*PropCollectionFactory.setup("topic-page", {
    required: {
        topic_sort_by: {
            init : "rising",  
        },
        topic_sort_duration: {
            init : "day",
        },
    },
    optional: {},
});*/

export interface TopicProp extends PageProp {
    topic: ChannerProto.Model.Topic;
}

export interface TopicState extends PageState {
    scroll: ListScrollState;
    //props: PropCollection;
}

export class TopicComponent extends PageComponent<TopicProp, TopicState> {
    constructor(props: TopicProp) {
        super(props);
        this.state = {
            scroll: new ListScrollState(),
            //props: PropCollectionFactory.ref("topic-page"), 
        }
    }
    render(): UI.Element {
        return <div className="topic">
            {"topic of " + this.props.topic.id.toString()}
        </div>;
    }
}
