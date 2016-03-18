/// <reference path="../../../typings/extern.d.ts"/>
import {m} from "../../uikit"
var Scroll = window.channer.parts.Scroll;

export interface ModelCollection {
    fetch(page: number): () => Array<any>;
    refresh(): void;
}
export class ArrayModelCollection implements ModelCollection {
    source: Array<any>;
    constructor(source: Array<any>) {
        this.source = source;
    }
    fetch = (page: number): () => Array<any> => {
        if (page <= 1) {
            return () => {
                return this.source;
            }
        }
        return () => { return []; }
    }
    refresh = () => {}
}
export class ListComponent implements UI.Component {
	elemview: (c: ModelCollection, model: any, options?: any) => UI.Element;
	constructor(view: (c: ModelCollection, model: any, options?: any) => UI.Element) {
        this.elemview = view;
	}
    controller = (): any => {
        return null;
    }
    mkoption = (models: ModelCollection, options?: any, elem_options?: any): UI.Attributes => {
        var base = options || {}
        base.name = base.name || "";
        base.class = base.class || (base.name + " listview");
        base.item = base.item || ((model: any) => { 
            return this.elemview(models, model, elem_options); 
        });
        base.maxPreloadPages = base.maxPreloadPages || 1;
        base.pageData = base.pageData || models.fetch;
        return base;
    }
    view = (ctrl: any, models: ModelCollection, options?: any, elem_options?: any): UI.Element => {
        return m(".scroll-container", 
            m.component(Scroll, this.mkoption(models, options, elem_options))
        );
    }
}

export var categories = new ArrayModelCollection(window.channer.category.data);
export var locales = new ArrayModelCollection(window.channer.l10n.localeSettings());