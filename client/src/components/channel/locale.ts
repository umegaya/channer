/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, Template, ListComponent, ModelCollection} from "../../uikit"
import {Handler, Builder} from "../../proto"
import {MenuElementComponent} from "../menu"
import {TopComponent} from "../top"
import ChannerProto = Proto2TypeScript.ChannerProto;
var _L = window.channer.l10n.translate;

export class LocaleCollection implements ModelCollection {
    locales: Array<{key:string, value:any}>;
    constructor() {
        this.locales = window.channer.l10n.localeSettings();
    }
    map = (fn: (m: {key:string, value:any}) => void): Array<any> => {
        return this.locales.map(fn);
    }
    empty = (): boolean => {
        return this.locales.length <= 0;
    }
    refresh = () => {
        this.fetch(1);
    }
    fetch = (page: number) => {
        console.error("fetch:" + page);
        return m.prop(this.locales.slice((page - 1) * 10, (page - 1) * 10 + 5));
    }
}
//TODO: if supported languages become so-many, use ListComponent
export class LocaleListComponent extends ListComponent {
    constructor() {
        super((
            c: ModelCollection, 
            model: {key:string, value:any}
        ): UI.Element => {
            return m(".block", { "data-value": model.key }, model.value);    
        });
    }
}
