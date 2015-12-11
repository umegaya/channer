/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m} from "../uikit"
import {Config} from "../config"

export class OrgController implements UI.Controller {
	constructor(config: Config) {
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
		this.controller = function () {
			return new OrgController(config);
		}
	}
}

window.channer.OrgComponent = OrgComponent