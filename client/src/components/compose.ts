import {m, Util} from "../uikit"
import {Config} from "../config"

export class ComposeController implements UI.Controller {
	component: ComposeComponent;
	constructor(component: ComposeComponent) {
		Util.active(this, component);
		this.component = component;
	}
}
function ComposeView(ctrl: ComposeController) : UI.Element {
	return m("div")
}
export class ComposeComponent implements UI.Component {
	controller: () => ComposeController;
	view: UI.View<ComposeController>;

	constructor(config: Config) {
		this.view = ComposeView;
		this.controller = () => {
			return new ComposeController(this);
		}
	}
}

window.channer.components.Compose = ComposeComponent
