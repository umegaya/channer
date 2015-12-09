/// <reference path="../typings/extern.d.ts"/>

import {Handler} from "./proto"
import {Config} from "./config"
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
	window.channer.config = c;
	t.start(c.timer_resolution_ms);
	h.resume();
	m.route.mode = "hash"; //prevent from refreshing page when route changes.
	//setup client router
	m.route(document.body, "/login", {
		"/login":				new window.channer.LoginComponent(c),
		"/:org/": 				new window.channer.MainComponent(c),
		"/:org/topic": 			new window.channer.ComposeComponent(c),
		"/:org/topic/:id": 		new window.channer.TopicComponent(c),
	});
}
