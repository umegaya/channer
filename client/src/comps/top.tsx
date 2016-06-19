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
    settings: PropCollection;
    topics: TopicCollection;
    channels: ChannelCollection;
    selected: string;
    scrollStates: {[k:string]:ListScrollState};
}

export class TopComponent extends PageComponent<TopProp, TopState> {
    constructor(props: TopProp) {
        super(props);
        var settings = PropCollectionFactory.ref("top-models"); 
        this.state = {
            selected: this.props.params.tab || "topic",
            settings: settings,
            topics: new TopicCollection(settings),
            channels: new ChannelCollection(settings),
            scrollStates: {
                channel: new ListScrollState(),
                topic: new ListScrollState(),
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
                elementOptions={this.route_to}
            />,
            topic: <ListComponent
                key="topic"
                renderItem={TopicListView}
                models={this.state.topics}
                scrollState={this.state.scrollStates["topic"]}
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
