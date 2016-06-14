/// <reference path="../../typings/extern.d.ts"/>
import {PropCollectionFactory, PropCollection, prop} from "../input/prop"
import {ChannelListView, ChannelCollection} from "./lists/channel"
import {TopicListView, TopicCollection} from "./lists/topic"
import {ListComponent} from "./common/scroll"
import Q = require('q');
var _L = window.channer.l10n.translate;

//matrial ui
import * as React from 'react'
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

export interface TopProp {
    tab: string;    
    params?: any; //URL params
}

export class ScrollState {
    scrollTop: number;
    itemHeights: {[k:number]:number}
    constructor() {
        this.scrollTop = 0;
        this.itemHeights = {};
    }
}

export interface TopState {
    settings: PropCollection;
    topics: TopicCollection;
    channels: ChannelCollection;
    selected: string;
    scrollStates: {[k:string]:ScrollState};
}

export class TopComponent extends React.Component<TopProp, TopState> {
    constructor(props: TopProp) {
        super(props);
        var settings = PropCollectionFactory.ref("top-models"); 
        this.state = {
            selected: this.props.params.tab || "topic",
            settings: settings,
            topics: new TopicCollection(settings),
            channels: new ChannelCollection(settings),
            scrollStates: {
                channel: new ScrollState(),
                topic: new ScrollState(),
            }
        }
    }
    tabContent = ():{[k:string]: UI.Element} => {
        return {
            channel: <ListComponent
                key="channel"
                renderItem={ChannelListView}
                models={this.state.channels}
                scrollState={this.state.scrollStates["channel"]}
            />,
            topic: <ListComponent
                key="topic"
                renderItem={TopicListView}
                models={this.state.topics}
                scrollState={this.state.scrollStates["topic"]}
            />,
        }
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
