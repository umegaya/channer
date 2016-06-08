/// <reference path="../../typings/extern.d.ts"/>

import {m} from "../uikit"
import {Pagify, PageComponent} from "./base"
import {Config} from "../config"

export class TopicController implements UI.Controller {
	component: TopicComponent;
	constructor(component: TopicComponent) {
		this.component = component;
	}
}
function TopicView(ctrl: TopicController) : UI.Element {
	return m(".topic")
}
export class TopicComponent extends PageComponent {
	controller: () => TopicController;
	view: UI.View<TopicController>;

	constructor() {
        super();
		this.view = TopicView;
		this.controller = () => {
			return new TopicController(this);
		}
	}
}
window.channer.parts.Topic = new TopicComponent();
window.channer.components.Topic = Pagify(TopicComponent);
