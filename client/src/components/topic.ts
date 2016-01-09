/// <reference path="../../typings/extern.d.ts"/>

import {m, Util} from "../uikit"
import {Config} from "../config"

export class TopicController implements UI.Controller {
	component: TopicComponent;
	constructor(component: TopicComponent) {
		Util.active(this, component);
		this.component = component;
	}
}
function TopicView(ctrl: TopicController) : UI.Element {
	return m("div")
}
export class TopicComponent implements UI.Component {
	controller: () => TopicController;
	view: UI.View<TopicController>;

	constructor(config: Config) {
		this.view = TopicView;
		this.controller = () => {
			return new TopicController(this);
		}
	}
}

window.channer.components.Topic = TopicComponent
