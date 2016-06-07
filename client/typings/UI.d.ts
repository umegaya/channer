/// <reference path="../typings/mithril.d.ts"/>
/// <reference path="../typings/react/react.d.ts"/>
declare namespace UI {
	interface Element extends JSX.Element {		
	}
	
	interface Property<T> extends _mithril.MithrilProperty<T> {
	}

	interface Controller extends _mithril.MithrilController {
	}
	
	interface View<T extends Controller> extends _mithril.MithrilView<T> {	
	}
    
    interface Attributes extends _mithril.MithrilAttributes {
        id?: string;
        secure?: string;
    }
    	
	interface Component {
		controller?: (args?:any) => Controller;
		view: (ctrl: Controller, ...args: any[]) => Element;
	}
    
    interface PageComponent extends Component {
        menus: () => Array<Component>;
    }
    
	interface ComponentFactory {
		new (...args: any[]): Component;
	}
}
