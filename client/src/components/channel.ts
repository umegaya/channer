/// <reference path="../../typings/extern.d.ts"/>

import {m, Util} from "../uikit"
import {Config} from "../config"

export class ChannelController implements UI.Controller {
	component: ChannelComponent
	constructor(component: ChannelComponent) {
		Util.active(this, component);
		this.component = component;
	}
}
function ChannelView(ctrl: ChannelController) : UI.Element {
	console.log("Channelview")
	return m("div", {class: "channel-list"})
}
export class ChannelComponent implements UI.Component {
	controller: () => ChannelController;
	view: UI.View<ChannelController>;

	constructor(config: Config) {
		this.view = ChannelView;
		this.controller = () => {
			return new ChannelController(this);
		}
	}
}

window.channer.components.Channel = ChannelComponent;