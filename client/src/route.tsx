/// <reference path="../typings/extern.d.ts"/>
import * as React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, hashHistory } from 'react-router'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { TopComponent } from './comps/top'
// enable materil UI interaction
var injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

window.channer.router = function () {
    render(
        <MuiThemeProvider muiTheme={getMuiTheme()}>
            <Router history={hashHistory}>
                <Route path="/" component={TopComponent} />
            </Router>
        </MuiThemeProvider>
    , document.getElementById("app"));
}
