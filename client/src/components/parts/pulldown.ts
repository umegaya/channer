/// <reference path="../../../typings/extern.d.ts"/>
import {m} from "../../uikit"
import {ListComponent, ModelCollection, ListOptions, locales} from "./scroll"
import ChannerProto = Proto2TypeScript.ChannerProto;
var TextField = window.channer.parts.TextField;
var _L = window.channer.l10n.translate;

export class PulldownOptions {
    label: string;
    value: UI.Property<any>;
    required: boolean;
    onchange: (v: any) => void;
    models: ModelCollection;
    listopts: ListOptions; //internal use. 
}

export class PulldownListOptions {
    infoview: (c: ModelCollection, model: any) => UI.Element;
    onchange: (v: any) => void;
}

function infoview(c: ModelCollection, model: any) {
    return <string>model;
}

class PulldownListComponent extends ListComponent {
    constructor() {
        super((c: ModelCollection, model: any, options: PulldownListOptions): UI.Element => {
            return m(".block", <UI.Attributes>{
                onclick: () => {
                    options.onchange(model)   
                },
            }, (options.infoview || infoview)(c, model));
        });
    }
}

export var PulldownList = new PulldownListComponent();

export class PulldownController implements UI.Controller {
    options: PulldownOptions;
    selecting: boolean;
    constructor(options: PulldownOptions) {
        options.listopts = options.listopts || new ListOptions();
        options.listopts.models = options.models;
        options.listopts.elemopts = options.listopts.elemopts || new PulldownListOptions();
        var onchange = options.listopts.elemopts.onchange || options.onchange;
        options.listopts.elemopts.onchange = (v: any) => {
            this.selecting = false;
            if (!(onchange && onchange(v))) {
                options.value(v);
            }
        }
        this.options = options;
        this.selecting = false;
    }
    onbuttontap = () => {
        this.selecting = true;
    }
}

export var PulldownComponent: UI.Component = {
	controller: (options: PulldownOptions): PulldownController => {
        return new PulldownController(options);
    },
	view: (ctrl: PulldownController) : UI.Element => {
        var tmp: Array<UI.Element> = [];
        if (ctrl.selecting) {
            tmp.push(m.component(PulldownList, ctrl.options.listopts));
        }
        else {
            tmp.push(m.component(TextField, {
                label: ctrl.options.label,
                value: ctrl.options.value,
                required: ctrl.options.required,
                floatingLabel: true,
                events: {
                    onclick: ctrl.onbuttontap,
                }
            }));
        }
        return m(".pulldown", tmp);
    }
}

export class LocalePulldownOptions extends PulldownOptions {
    code: UI.Property<string>;
    constructor(options: any) {
        super();
        this.code = options.value;
        this.label = options.label;
        this.value = m.prop("");
        this.models = options.models;
        this.onchange = options.onchange;
        this.required = options.required;
        this.listopts = options.listopts;
        this.fill();
    }
    setlocalename = (loc: string) => {
        this.value(window.channer.l10n.localeNameFromCode(loc) || "");
    }
    fill = () => {
        this.label = this.label || _L("Priority Locale");
        this.models = this.models || locales;
        this.setlocalename(this.code());
        this.listopts = this.listopts || new ListOptions();
        this.listopts.elemopts = {
            infoview: (c: ModelCollection, model: {key: string, value: string}): UI.Element => {
                return model.value;
            },
            onchange: (model: {key: string, value: string}) => {
                this.code(model.key);
                this.setlocalename(model.key);
                this.onchange(model);
                return true;
            }
        }
        return this;
    }
}
