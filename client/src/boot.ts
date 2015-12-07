/// <reference path="../typings/extern.d.ts"/>

import {Handler} from "./proto"
import {Component, Config} from "./main"
import {Timer} from "./timer"
import {m} from "./uikit"

window.channer.bootstrap = function (config: any) {	
	var c : Config = new Config(config);
	var t : Timer = new Timer();
	var h : Handler = new Handler(c.url, t);
	window.channer.onResume.push(h.start);
	window.channer.onPause.push(h.stop);
	window.channer.conn = h;
	window.channer.timer = t;
	t.start(1000);
	h.start();
	m.mount(document.body, new Component(c));
}
