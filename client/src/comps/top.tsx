/// <reference path="../../typings/extern.d.ts"/>
import {PageProp, PageState, PageComponent} from "./common/page"
import {PropCollectionFactory, PropCollection, prop} from "../input/prop"
import {ChannelElementComponent, ChannelCollection} from "./lists/channel"
import {TopicElementComponent, TopicCollection} from "./lists/topic"
import {ListComponent, ListScrollState} from "./common/scroll"
import {VoteList} from "./common/votes"
import SwipeableViews from "react-swipeable-views"
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
    tabIndex: number;
}

export class TopStaticState {
    settings: PropCollection;
    votes: VoteList;
    topics: TopicCollection;
    channels: ChannelCollection;
    scrollStates: {[k:string]:ListScrollState};
    constructor() {
        this.settings = PropCollectionFactory.ref("top-models");
        this.votes = new VoteList();
        this.scrollStates = {};
        this.refresh_topic();
        this.refresh_channel();
    }
    refresh_topic = (): void => {
        this.topics = new TopicCollection(this.settings, this.votes);
        this.scrollStates["topic"] = new ListScrollState();
    }
    refresh_channel = (): void => {
        this.channels = new ChannelCollection(this.settings);
        this.scrollStates["channel"] = new ListScrollState();        
    }
    initialize(): Promise<any> {
        return this.votes.load();
    }
}

export class TopComponent extends PageComponent<TopProp, TopState> {
    static state: TopStaticState = null;
    static tabToIndex: {[k:string]:number} = {
        topic: 0,
        channel: 1,
    }
    constructor(props: TopProp) {
        super(props);
        this.state = {
            tabIndex: TopComponent.tabToIndex[this.props.params.tab || "topic"] || 0,
        }
        if (!TopComponent.state) {
            TopComponent.state = new TopStaticState();
            //load persistent state
            TopComponent.state.initialize().then(() => {
                this.forceUpdate();
            }, (e: Error) => {
                console.log("state initialize fails:" + e.message);
            })
        }
    }
    tabContent = ():UI.Element => {
        return <SwipeableViews index={this.state.tabIndex} onChangeIndex={this.onchange}>
            <ListComponent
                key={TopComponent.state.topics.key}
                elementComponent={TopicElementComponent}
                models={TopComponent.state.topics}
                scrollState={TopComponent.state.scrollStates["topic"]}
                elementOptions={this.route_to}
            />
            <ListComponent
                key={TopComponent.state.channels.key}
                elementComponent={ChannelElementComponent}
                models={TopComponent.state.channels}
                scrollState={TopComponent.state.scrollStates["channel"]}
                elementOptions={this.route_to}
            />
        </SwipeableViews>
    }
    route_to = (path: string, options: any): () => void => {
        return this.route.bind(this, path, options);
    }
    onchange = (val: number) => {
        this.setState({
            tabIndex: val
        });
    }
    render(): UI.Element {
        return <div className="top">
        <Tabs className="tab" value={this.state.tabIndex} onChange={this.onchange}>
            <Tab label="topics" value={0}/>
            <Tab label="channels" value={1}/>
        </Tabs>
        {this.tabContent()}
        </div>;
    }
}
