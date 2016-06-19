/// <reference path="../../../typings/extern.d.ts"/>
import * as React from 'react'
import { render } from 'react-dom'
import { RouteComponentProps } from 'react-router'

export interface PageProp extends RouteComponentProps<any, any> {
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
        if (options && options.replace) {
            return this.props.history.replace(path);
        } else {
            return this.props.history.push(path);
        }
    }
}
