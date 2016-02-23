/// <reference path="../../../typings/extern.d.ts"/>

import {m} from "../../uikit"
import {ProtoError} from "../../watcher"
var TextField = window.channer.parts.TextField;

export class TextFieldOptions {
    label: string;
    floatingLabel: boolean;
    value: UI.Property<any>;
    oninput: (val: any) => void;
    onchange: (next: any) => void;
}

class _TextFieldComponent implements UI.Component {
	constructor() {}
    controller = (options?: TextFieldOptions) => {
        return options;
    }
    view = (options: TextFieldOptions): UI.Element => {
        if (!options.hasOwnProperty("floatingLabel")) {
            options.floatingLabel = true;
        }
        if (options.hasOwnProperty("value") && 
            !(typeof options.value === "undefined")) {
            var oninput = options.hasOwnProperty("oninput") ? 
                options.oninput : options.value;
            options.oninput = (v: any) => {
                options.onchange(v);
                oninput(v);
            };
            if (options.value() == options.label) {
                options.value = undefined;
            }
        }
        return m.component(TextField, options);
    }
}

export var TextFieldComponent: _TextFieldComponent = new _TextFieldComponent();
