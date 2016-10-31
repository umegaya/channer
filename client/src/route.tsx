/// <reference path="../typings/extern.d.ts"/>
import * as React from 'react'
import { render } from 'react-dom'
import { Router, Route, hashHistory, browserHistory } from 'react-router'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { TopComponent } from './comps/top'
import { TopicComponent } from './comps/topic'
import { ChannelComponent } from "./comps/channel"
import { LoginComponent} from "./comps/login"

window.channer.router = function () {
    var last_url: string = window.channer.settings.values.last_url;
	var start_url: string = last_url ? ("/login?next=" + last_url) : "/login"; 
    render(
        <MuiThemeProvider muiTheme={getMuiTheme()}>
            <Router history={hashHistory}>
                <Route path="/" component={TopComponent} />
                <Route path="/login" component={LoginComponent} />
                <Route path="/rescue/:rescue" component={LoginComponent} />
                <Route path="/top/:tab" component={TopComponent} />
                <Route path="/topic/:id" component={TopicComponent} />
                <Route path="/channel/:id" component={ChannelComponent} />
            </Router>
        </MuiThemeProvider>
    , document.getElementById("app"));
}
