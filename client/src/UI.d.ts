/// <reference path="./mithril.d.ts"/>
declare module UI {
	interface Element extends _mithril.MithrilVirtualElement {		
	}
	
	interface Property<T> extends _mithril.MithrilProperty<T> {
	}

	interface Controller extends _mithril.MithrilController {
	}
	
	interface View<T extends Controller> extends _mithril.MithrilView<T> {	
	}
	
	interface Component {
		controller: () => Controller;
		view: View<Controller>;
	}
}
