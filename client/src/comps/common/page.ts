/// <reference path="../../../typings/extern.d.ts"/>
import * as React from 'react'
import { render } from 'react-dom'
import { RouteComponentProps, InjectedRouter } from 'react-router'

export interface PageProp extends RouteComponentProps<any, any> {
    router: InjectedRouter;
}

export interface PageState {
}

export class PageComponent<P extends PageProp, S extends PageState> extends React.Component<P, S> {
    constructor(props: P) {
        super(props);
    }
    route = (path: string, options?: {
        replace: boolean;
    }): void => {
        //250ms delay to show ripple
        setTimeout(() => {
            if (options && options.replace) {
                return this.props.router.replace(path);
            } else {
                return this.props.router.push(path);
            }
        }, 250);
    }
}
