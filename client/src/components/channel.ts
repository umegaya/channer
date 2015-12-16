/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m} from "../uikit"
import {Config} from "../config"

export class ChannelController implements UI.Controller {
	component: ChannelComponent
	constructor(component: ChannelComponent) {
		this.component = component;
	}
}
function ChannelView(ctrl: ChannelController) : UI.Element {
	console.log("Channelview")
	return [m("div")]
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

window.channer.ChannelComponent = ChannelComponent