/// <reference path="../../../typings/extern.d.ts"/>

import {m, Util, Template} from "../../uikit"
import {Config} from "../../config"
import {Handler, Builder} from "../../proto"
import {ProtoError} from "../../watcher"
import ChannerProto = Proto2TypeScript.ChannerProto;

export class ScrollOptions {
    items: Array<any>;
    
}
export class ScrollController implements UI.Controller {
	component: ScrollComponent;
    options: ScrollOptions;
	constructor(component: ScrollComponent, options: ScrollOptions) {
		this.component = component;
        this.options = options;
        window.addEventListener("scroll", this.component.onscroll);
	}
    onunload = (event: any) => {
        window.removeEventListener("scroll", this.component.onscroll);
    }
}
export class ScrollComponent implements UI.Component {
    pageY: number;
    pageHeight: number;
	constructor() {
        this.pageY = 0;
        this.pageHeight = window.innerHeight;
    }
	controller = (options?: ScrollOptions): ScrollController => {
        return new ScrollController(this, options);
    }
	view = (ctrl: ScrollController) : UI.Element => {
        var pageY = this.pageY;
        var begin = pageY / 5 | 0;
        // Add 2 so that the top and bottom of the page are filled with
        // next/prev item, not just whitespace if item not in full view
        var end = begin + (this.pageHeight / 5 | 0);
        var offset = pageY % 5;
        console.log("b/e " + begin + "|" + end + "|" + pageY + "|" + offset);
        return m(".list", {
                style: {
                    height: ctrl.options.items.length * 5 + "vh", 
                    position: "relative", 
                    top: -offset + "vh"
                }
            }, [
                m("ul", {
                    style: {
                        top: this.pageY + "vh",
                    }
                }, [
                    ctrl.options.items.slice(begin, end).map(function(item) {
                        return m("li", {
                            style: {
                                height: "5vh",
                            }
                        }, item.value);
                    })
                ])
            ]
        );
    }
    onscroll = (e: any) => {
        this.pageY = Math.max(e.pageY || window.pageYOffset, 0);
        this.pageHeight = window.innerHeight;
        console.log("onsroll:" + window.pageYOffset + "|" + this.pageY);
        m.redraw(); //notify view
    }
}
