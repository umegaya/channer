/// <reference path="../../typings/extern.d.ts" />
/// <reference path="../../typings/UI.d.ts" />
/// <reference path="../../typings/proto.d.ts" />
export declare class ElementController implements UI.Controller {
    component: ElementComponent;
    constructor(component: ElementComponent);
}
export declare class ElementComponent implements UI.Component {
    parent: ListComponent;
    controller: () => ElementController;
    view: UI.View<ElementController>;
    model: string;
    constructor(parent: ListComponent, model: string);
}
export declare class ListController implements UI.Controller {
    component: ListComponent;
    constructor(component: ListComponent);
    add: (model: string) => void;
    remove: (e: ElementComponent) => void;
    elements: () => ElementComponent[];
}
export declare class ListComponent implements UI.Component {
    controller: () => ListController;
    view: UI.View<ListController>;
    prefix: string;
    elements: Array<ElementComponent>;
    constructor(prefix: string);
    add: (model: string) => void;
    remove: (e: ElementComponent) => void;
}
