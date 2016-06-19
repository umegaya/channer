/// <reference path="../../typings/extern.d.ts"/>
import {PageProp, PageState, PageComponent} from "./common/page"
import {PropCollectionFactory, PropCollection, prop} from "../input/prop"
import {ListComponent, ListScrollState} from "./common/scroll"
var _L = window.channer.l10n.translate;
import ChannerProto = Proto2TypeScript.ChannerProto;

//matrial ui
import * as React from 'react'

PropCollectionFactory.setup("channel-page", {
    required: {
        topic_sort_by: {
            init : "rising",  
        },
        topic_sort_duration: {
            init : "day",
        },
    },
    optional: {},
});

export interface ChannelProp extends PageProp {
    channel: ChannerProto.Model.Channel;
}

export interface ChannelState extends PageState {
    scroll: ListScrollState;
    props: PropCollection;
}

export class ChannelComponent extends PageComponent<ChannelProp, ChannelState> {
    constructor(props: ChannelProp) {
        super(props);
        this.state = {
            scroll: new ListScrollState(),
            props: PropCollectionFactory.ref("channel-page"), 
        }
    }
    render(): UI.Element {
        return <div className="channel">
            {"channel of " + this.props.channel.id.toString()}
        </div>;
    }
}
