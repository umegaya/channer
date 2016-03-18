/// <reference path="../../typings/extern.d.ts"/>

import {m} from "../uikit"
import {MenuComponent, MenuElementComponent} from "./menu"
import {HeaderComponent} from "./parts/header"

export class BaseComponent implements UI.Component {
    static transit = window.channer.mtransit({
        anim: (last: Element, next: Element, dir: string, 
            cblast: () => void, cbnext: () => void) => {
            last.addEventListener('animationend', cblast);
            next.addEventListener('animationend', () => {
                next.classList.remove('transition-in', 'transition-out');
                cbnext();
            });
            last.classList.add('transition-out');
            next.classList.add('transition-in');
        } 
    });
    checked: boolean;
    hasmenu: boolean;
    content: PageComponent;
    constructor(c: PageComponent) {
        this.content = c;
    }
    view = (): UI.Element => {
        if (!this.checked) {
            if (this.content.menus() != null) {
                this.hasmenu = true;
            }
            this.checked = true;
        }
        var tmp: [any] = [m.component(HeaderComponent)];
        if (this.hasmenu) {
            tmp.push(m.component(window.channer.components.Menu, m.route()));
        }
        tmp.push(m.component(this.content));
        return m(".screen", tmp);/*<UI.Attributes>{
            config: BaseComponent.transit, key: m.route()
        }, tmp);        */
    }
}

export class PageComponent implements UI.PageComponent {
    static current_url: string;
    view = (ctrl?: any, ...args: any[]): UI.Element => {
        throw new Error("override this");
    }
    menus = (): Array<MenuElementComponent> => {
        return null;
    }
}
export interface PageFactory {
    new(): PageComponent;
}

export function Pagify(pf: PageFactory): BaseComponent {
    return new BaseComponent(new pf());
}
