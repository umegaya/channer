/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m} from "../uikit"
import {Config} from "../config"

export class OrgController implements UI.Controller {
	component: OrgComponent
	constructor(component: OrgComponent) {
		this.component = component;
	}
}
function OrgView(ctrl: OrgController) : UI.Element {
	console.log("orgview")
	return [m("div")]
}
export class OrgComponent implements UI.Component {
	controller: () => OrgController;
	view: UI.View<OrgController>;

	constructor(config: Config) {
		this.view = OrgView;
		this.controller = () => {
			return new OrgController(this);
		}
	}
}

window.channer.OrgComponent = OrgComponent