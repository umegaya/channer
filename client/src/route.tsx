/// <reference path="../typings/extern.d.ts"/>
import * as React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, hashHistory } from 'react-router'
import { TopComponent } from './comps/top'

window.channer.router = function () {
    render(
        <Router history={hashHistory}>
            <Route path="/" component={TopComponent} />
        </Router>
    , document.getElementById("app"));
}
