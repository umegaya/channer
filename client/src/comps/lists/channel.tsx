import * as React from 'react'
import {PropCollectionFactory, PropConditions, PropCollection} from "../../input/prop"
import {ModelCollection, ProtoModelCollection, ProtoModelChunk, LongBoundary} from "../common/scroll"
import {Surface, ListView, Text, Group, Image, Gradient} from "react-canvas"
import {Handler, Builder} from "../../proto"
import {Util} from "../../uikit"
import {ChannelListStyler} from "../stylers/channel"
import ChannerProto = Proto2TypeScript.ChannerProto;
import Q = require('q');
var _L = window.channer.l10n.translate;
var Long = window.channer.ProtoBuf.Long;

export class ChannelCollection extends ProtoModelCollection<ChannerProto.Model.Channel, LongBoundary> {
    props: PropCollection;
    constructor(props: PropCollection) {
        super();
        this.props = props;
    }
    initkey = () => {
        this.key = "channels/" 
            + this.props.val("channel_sort_by") + "/"
            + this.props.val("channel_category") + "/"
            + window.channer.settings.values.search_locale;
    }
    fetch_request = (offset: LongBoundary, limit: number): Q.Promise<Array<ChannerProto.Model.Channel>> => {
        var df: Q.Deferred<Array<ChannerProto.Model.Channel>> = Q.defer<Array<ChannerProto.Model.Channel>>();
        var conn: Handler = window.channer.conn;
        var sort_by: string = this.props.val("channel_sort_by");
        var category: number = window.channer.category.to_id(
            this.props.val("channel_category")
        )
        conn.channel_list(sort_by, offset && offset.id, null, category, limit)
        .then((r: ChannerProto.ChannelListResponse) => {
            df.resolve(r.list);
        });
        return df.promise;
    }
    update_range = (
        chunk: ProtoModelChunk<ChannerProto.Model.Channel, LongBoundary>, 
        model: ChannerProto.Model.Channel) => {
        var sort_by: string = this.props.val("channel_sort_by");
        if (sort_by == "top") {
            chunk.update_range(new LongBoundary(model.watcher));
        }
        else {
            chunk.update_range(new LongBoundary(model.id));
        }
    }
}

var styler = new ChannelListStyler();

var idlevel_text : { [t:number]:string } = {
    [ChannerProto.Model.Channel.IdentityLevel.Topic]: _L("topic"),
    [ChannerProto.Model.Channel.IdentityLevel.Channel]: _L("channel"),
    [ChannerProto.Model.Channel.IdentityLevel.Account]: _L("account"),
    [ChannerProto.Model.Channel.IdentityLevel.None]: _L("none"),
}

var clock = require('../../img/clock.png');
var user = require('../../img/user.png');

export interface ChannelElementProp {
    c?: ModelCollection;
    model: ChannerProto.Model.Channel;
    elemOpts: (path: string) => (() => void);
}

export interface ChannelElementState {

}

export class ChannelElementComponent extends React.Component<ChannelElementProp, ChannelElementState> {
    render(): UI.Element {
        var model = this.props.model;
        var copied = model.options.slice();
        var options = Builder.Model.Channel.Options.decode(copied);
        var index = model.id.modulo(10).toNumber() + 1;
        //TODO: if no image is set, generate or give default graphics according to its ID
        return <Group style={styler.bg()} onClick={this.props.elemOpts("/channel/" + model.id.toString())}>
            <Image style={styler.img()} src={"http://lorempixel.com/360/420/cats/" + index + "/"} />
            <Text style={styler.name()}>{model.name + "/" + model.locale + "," + model.category}</Text>
            <Text style={styler.desc()}>{model.description || _L("no description")}</Text>
            <Image style={styler.icon(0)} src={clock} />
            <Text style={styler.attr_text(0)}>{Util.datebyuuid(model.id, true)}</Text>
            <Image style={styler.icon(25)} src={user} />
            <Text style={styler.attr_text(25)}>11111</Text>
        </Group>;
    }
}