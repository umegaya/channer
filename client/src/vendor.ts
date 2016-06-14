/// <reference path="../typings/extern.d.ts"/>
import * as React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, hashHistory } from 'react-router'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
// enable materil UI interaction
var injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

window.channer.ProtoBuf = require('protobufjs');
window.channer.m = require('mithril');
//window.m must exist for initializing some of mithril plugin
window.m = window.channer.m;
//window.channer.mtransit = require('mithril-transition');
//(require('mithril.bindings'))(window.channer.m);
//require('mithril.animate');
//window.m = undefined;
//load hammerjs
window.channer.Hammer = require('hammerjs');
//js hash function
window.channer.hash = require('jshashes');
//UI parts from polythene and mithril-infinite
//window.channer.parts.Scroll = require('mithril-infinite');
//these 2 are not for importing UI parts, 
//but for apply correct theme to show polythene component correctly
//require('polythene/theme/theme');
//require('polythene/layout/theme/theme');
//importing necessary polythene components.
//window.channer.parts.Button = require('polythene/button/button');
//window.channer.parts.TextField = require('polythene/textfield/textfield');
//window.channer.parts.Tabs = require('polythene/tabs/tabs');
//window.channer.parts.Radio = require('polythene/radio-button/radio-button');

//utility method for member ByteBuffer of protobuf data structure.  
window.channer.ProtoBuf.ByteBuffer.prototype.slice = 
function (offset?: number, limit?:number): Uint8Array {
    offset = offset || this.offset;
    limit = limit || this.limit;
    if (offset > limit) {
        return null;
    } 
    var copied : Uint8Array = new Uint8Array(limit - offset);
    for (var i = offset; i < limit; i++) {
        //console.log("copied:" + (i - offset) + "|" + this.view[i]);
        copied[i - offset] = this.view[i];
    }
    return copied;
}

