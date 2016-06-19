/// <reference path="../../typings/extern.d.ts"/>
import {PageProp, PageState, PageComponent} from "./common/page"
import {PropCollectionFactory, PropCollection, prop} from "../input/prop"
import {ChannelListView, ChannelCollection} from "./lists/channel"
import {TopicListView, TopicCollection} from "./lists/topic"
import {ListComponent, ListScrollState} from "./common/scroll"
import Q = require('q');
var _L = window.channer.l10n.translate;

//matrial ui
import * as React from 'react'
import { withRouter } from 'react-router'
import {Tabs, Tab} from "material-ui/Tabs"
import FontIcon from 'material-ui/FontIcon';

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

export interface TopProp extends PageProp {
    tab: string;    
}

export interface TopState extends PageState {
    selected: string;
}

export class TopStaticState {
    settings: PropCollection;
    topics: TopicCollection;
    channels: ChannelCollection;
    scrollStates: {[k:string]:ListScrollState};
    constructor() {
        this.settings = PropCollectionFactory.ref("top-models");
        this.scrollStates = {};
        this.refresh_topic();
        this.refresh_channel();
    }
    refresh_topic = (): void => {
        this.topics = new TopicCollection(this.settings);
        this.scrollStates["topic"] = new ListScrollState();
    }
    refresh_channel = (): void => {
        this.channels = new ChannelCollection(this.settings);
        this.scrollStates["channel"] = new ListScrollState();        
    }
}

export class TopComponent extends PageComponent<TopProp, TopState> {
    static state: TopStaticState = null;
    constructor(props: TopProp) {
        super(props);
        this.state = {
            selected: this.props.params.tab || "topic",
        }
        if (!TopComponent.state) {
            TopComponent.state = new TopStaticState();
        }
    }
    tabContent = ():{[k:string]: UI.Element} => {
        return {
            channel: <ListComponent
                key="channel"
                renderItem={ChannelListView}
                models={TopComponent.state.channels}
                scrollState={TopComponent.state.scrollStates["channel"]}
                elementOptions={this.route_to}
            />,
            topic: <ListComponent
                key="topic"
                renderItem={TopicListView}
                models={TopComponent.state.topics}
                scrollState={TopComponent.state.scrollStates["topic"]}
                elementOptions={this.route_to}
            />,
        }
    }
    route_to = (path: string, options: any): () => void => {
        return this.route.bind(this, path, options);
    }
    onchange = (val: string) => {
        this.state.selected = val;
        this.forceUpdate();
    }
    render(): UI.Element {
        return <div className="top">
        <Tabs value={this.state.selected} onChange={this.onchange}>
            <Tab label="channels" value="channel"/>
            <Tab label="topics" value="topic"/>
        </Tabs>
        {this.tabContent()[this.state.selected]}
        </div>;
    }
}
