/// <reference path="../../../typings/extern.d.ts"/>

import {m} from "../../uikit"
import {ProtoError} from "../../watcher"
var Radio = window.channer.parts.Radio;

export class RadioOptions {
    name: string;
    elements: { [k:string]:any };
    prop: UI.Property<any>;
    onchange: (next: any) => void;
}
export var RadioComponent: UI.Component = {
    view: (ctrl: any, options: RadioOptions): UI.Element => {
        var ret: Array<UI.Element> = [];
        for (var k in options.elements) {
            ret.push(m.component(Radio, {
                name: options.name,
                label: k,
                checked: options.prop() == options.elements[k],
                value: options.elements[k],
                getState: (state: { checked: boolean, value: any }) => {
                    if (options.prop() != state.value) {
                        if (options.onchange) {
                            options.onchange(state.value);
                        }
                        options.prop(state.value);
                    }
                }
            }))
        }
        return m(".radio", ret);
    }
}
