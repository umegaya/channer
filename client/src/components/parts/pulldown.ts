/// <reference path="../../../typings/extern.d.ts"/>
import {m} from "../../uikit"
import {ListComponent, ModelCollection} from "./scroll"
import ChannerProto = Proto2TypeScript.ChannerProto;
var TextField = window.channer.parts.TextField;

export class PulldownOptions {
    label: string;
    value: UI.Property<any>;
    required: boolean;
    onchange: (v: any) => void;
    infoview: (c: ModelCollection, model: any) => UI.Element;
}

function infoview(c: ModelCollection, model: any) {
    return <string>model;
}

class PulldownListComponent extends ListComponent {
    constructor() {
        super((c: ModelCollection, model: any, options: PulldownOptions): UI.Element => {
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
        var onchange = options.onchange;
        options.onchange = (v: any) => {
            options.value(v);
            this.selecting = false;
            onchange && onchange(v);
        }
        this.options = options;
        this.selecting = false;
    }
    onbuttontap = () => {
        this.selecting = true;
    }
}

export var PulldownComponent: UI.Component = {
	controller: (models: ModelCollection, 
        options?: any, elem_options?: PulldownOptions): PulldownController => {
        return new PulldownController(elem_options);
    },
	view: (ctrl: PulldownController, models: ModelCollection) : UI.Element => {
        var tmp: Array<UI.Element> = [];
        if (ctrl.selecting) {
            tmp.push(m.component(PulldownList, models, null, ctrl.options));
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
