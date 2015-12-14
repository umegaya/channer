/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m} from "../uikit"
import {Config} from "../config"

export class TopicController implements UI.Controller {
	component: TopicComponent;
	constructor(component: TopicComponent) {
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

window.channer.TopicComponent = TopicComponent
