/// <reference path="../typings/extern.d.ts"/>
import * as React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, hashHistory } from 'react-router'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { TopComponent } from './comps/top'
import { TopicComponent } from './comps/topic'
import { ChannelComponent } from "./comps/channel"

window.channer.router = function () {
    render(
        <MuiThemeProvider muiTheme={getMuiTheme()}>
            <Router history={hashHistory}>
                <Route path="/" component={TopComponent} />
                <Route path="/topic/:topic_id" component={TopicComponent} />
                <Route path="/channel/:channel_id" component={ChannelComponent} />
            </Router>
        </MuiThemeProvider>
    , document.getElementById("app"));
}
