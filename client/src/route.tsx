/// <reference path="../typings/extern.d.ts"/>
import * as React from 'react'
import { render } from 'react-dom'
import { Router, Route, IndexRedirect, hashHistory, browserHistory } from 'react-router'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { TopComponent } from './comps/top'
import { TopicComponent } from './comps/topic'
import { ChannelComponent } from "./comps/channel"
import { LoginComponent} from "./comps/login"

window.channer.router = function () {
    var last_url: string = window.channer.settings.values.last_url;
	var start_url: string = last_url ? ("/login?next=" + last_url) : "/login"; 
    console.log("start_url = " + start_url);
    render(
        <MuiThemeProvider muiTheme={getMuiTheme()}>
            <Router history={hashHistory}>
                <Route path="/">
                    <IndexRedirect to={start_url} />
                    <Route path="/login" component={LoginComponent}/>
                    <Route path="/rescue/:rescue" component={LoginComponent}/>
                    <Route path="/top" component={TopComponent} />
                    <Route path="/top/:tab" component={TopComponent}/>
                    <Route path="/topic/:id" component={TopicComponent}/>
                    <Route path="/channel/:id" component={ChannelComponent}/>
                </Route>
            </Router>
        </MuiThemeProvider>
    , document.getElementById("app"));
}
