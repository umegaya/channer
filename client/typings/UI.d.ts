/// <reference path="../typings/react/react.d.ts"/>
declare namespace UI {
	interface Element extends JSX.Element {		
	}
	
	interface Property<T> {
		(prop?: T): T;
	}
	
	interface Component extends __React.ComponentClass<any> {
	}
    
    interface PageComponent extends Component {
        menus: Array<Component>;
    }
    
	interface ComponentFactory {
		new (...args: any[]): Component;
	}
}
