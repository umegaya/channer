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
//load hammerjs
window.channer.Hammer = require('hammerjs');
//js hash function
window.channer.hash = require('jshashes');
window.channer.parts.Button = require('material-ui/RaisedButton');
window.channer.parts.TextField = require('material-ui/TextField');
window.channer.parts.Scroll = require('react-list');
window.channer.parts.Markdown = require('react-markdown-it');
/* 
    refer default for work around with following react error
    ```
    Element type is invalid: expected a string (for built-in components) or 
    a class/function (for composite components) but got: object. 
    Check the render method of `EditComponent`
    ```
*/
window.channer.parts.RichTextEditor = require('react-rte').default;

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

