/// <reference path="../typings/extern.d.ts"/>

import {Handler} from "./proto"
import {Component, Config} from "./main"
import {Timer} from "./timer"
import {m} from "./uikit"

window.channer.bootstrap = function (config: any) {	
	var c : Config = new Config(config);
	var t : Timer = new Timer();
	var h : Handler = new Handler(c.url, t);
	window.channer.onResume.push(h.resume);
	window.channer.onPause.push(h.pause);
	window.channer.conn = h;
	window.channer.timer = t;
	t.start(1000);
	h.resume();
	m.mount(document.body, new Component(c));
}
