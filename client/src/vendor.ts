/// <reference path="../typings/extern.d.ts"/>
window.channer.ProtoBuf = require('protobufjs');
window.channer.m = require('mithril');
window.channer.mtransit = require('mithril-transition');
window.channer.hash = require('jshashes');

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

