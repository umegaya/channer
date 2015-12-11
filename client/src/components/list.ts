/// <reference path="../../typings/extern.d.ts"/>
/// <reference path="../../typings/UI.d.ts"/>
/// <reference path="../../typings/proto.d.ts"/>

import {m} from "../uikit"
import {Config} from "../config"

export class ElementController implements UI.Controller {
	component: ElementComponent;
	constructor(component: ElementComponent) {
		this.component = component;
	}
}
function ElementView(ctrl: ElementController) : UI.Element {
	return m("div", {
		class: ctrl.component.parent.prefix+"-element"
	}, ctrl.component.model);
}
export class ElementComponent implements UI.Component {
	parent: ListComponent;
	controller: () => ElementController;
	view: UI.View<ElementController>;
	model: string;

	constructor(parent: ListComponent, model: string) {
		this.view = ElementView;
		this.parent = parent;
		this.model = model;
		this.controller = function () {
			return new ElementController(this);
		}
	}
}


export class ListController implements UI.Controller {
	component: ListComponent;
	constructor(component: ListComponent) {
		this.component = component;
	}
	add = (model: string) => {
		this.component.add(model);
	}
	remove = (e: ElementComponent) => {
		this.component.remove(e);
	}
	elements = (): Array<ElementComponent> => {
		return this.component.elements;
	}
}
function ListView(ctrl: ListController) : UI.Element {
	return [
		m("div", {class: ctrl.component.prefix + "-container"}, ctrl.elements())
	]
}
export class ListComponent implements UI.Component {
	controller: () => ListController;
	view: UI.View<ListController>;
	prefix: string;
	elements: Array<ElementComponent>;

	constructor(prefix: string) {
		this.view = ListView;
		this.prefix = prefix;
		this.elements = new Array<ElementComponent>();	
		this.controller = function () {
			return new ListController(this);
		}
	}
	
	add = (model: string) => {
		this.elements.push(new ElementComponent(this, model));
	}
	
	remove = (e: ElementComponent) => {
		var idx = this.elements.indexOf(e);
		if (idx >= 0) {
			this.elements.splice(idx, 1);
		}
	}
}

/*
export interface ListElementComponent extends UI.Component {
	constructor(parent: UI.Component, data: any): ListElementComponent;
}

export class ListController<T extends ListElementComponent> extends UI.Controller {
	elements: Array<T>;
	constructor(config: Config) {
		super();
		this.elements = new Array<T>();
	}
	create = (data: any): T => {
		return new T(this, data);		
	}
	add = (data: any) => {
		this.elements.push(this.create(data));
	}
	remove = (e: T) => {
		var idx = this.elements.indexOf(e);
		if (idx >= 0) {
			this.elements.splice(idx, 1);
		}
	}
}
function ListView<T extends ListElementComponent>(ctrl: ListController<T>) : UI.Element {
	return m("div", {class: "list-container"}, ctrl.elements);
}
export class ListComponent<T extends ListElementComponent> implements UI.Component {
	controller: () => ListController<T>;
	view: UI.View<ListController<T>>;

	constructor(config: Config) {
		this.view = ListView;
		this.controller = function () {
			return new ListController<T>(config);
		}
	}
}
*/