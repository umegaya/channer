/// <reference path="../../typings/extern.d.ts"/>
import {PropCollectionFactory, PropCollection} from "../input/prop"
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
}

export interface TopState {
    settings: PropCollection;
    topics: TopicCollection;
    channels: ChannelCollection;
}

export class TopComponent extends React.Component<TopProp, TopState> {
    constructor(props: TopProp) {
        super(props);
        var settings = PropCollectionFactory.ref("top-models"); 
        this.state = {
            settings: settings,
            topics: new TopicCollection(settings),
            channels: new ChannelCollection(settings),
        }        
    }
    render(): UI.Element {
        return <div className="top"><Tabs>
            <Tab icon={<FontIcon className="material-icons">phone</FontIcon>} label="channels">
                <ListComponent
                    renderItem={ChannelListView}
                    models={this.state.channels}
                />
            </Tab>
            <Tab icon={<FontIcon className="material-icons">favorite</FontIcon>} label="topics">
                <ListComponent
                    renderItem={TopicListView}
                    models={this.state.topics}
                />
            </Tab>
        </Tabs></div>;
    }
}
