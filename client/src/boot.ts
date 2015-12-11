/// <reference path="../typings/extern.d.ts"/>

import {Handler} from "./proto"
import {Config, UserSettings} from "./config"
import {Timer} from "./timer"
import {m} from "./uikit"
import {Push, PushReceiver} from "./push"
import {Storage, StorageIO} from "./storage"

window.channer.bootstrap = function (config: any) {	
	//create system modules
	var c : Config = new Config(config);
	var t : Timer = new Timer();
	var h : Handler = new Handler(c.url, t);
	var s : Storage = new Storage(c, window.channer.fs);
	var p : Push = new Push(c.push_settings, {
		onregister: (resp: PhonegapPluginPush.RegistrationEventResponse) => {
			console.log("push: onregister:" + resp.registrationId);
		},
		onnotify: (resp: PhonegapPluginPush.NotificationEventResponse) => {
			window.channer.onPush.forEach(function (f: PushReceiver){ f(resp); })
		},
		onerror: (resp: Error) => {
			console.log("push: onerror:" + resp.message);	
		},
	});
	//store system modules to global namespace
	window.channer.conn = h;
	window.channer.timer = t;
	window.channer.config = c;
	window.channer.push = p;
	window.channer.storage = s;
	//build bootstrap chain
	s.open(c.user_settings_path, {create: true})
	.then((io: StorageIO) => {
		var u : UserSettings = new UserSettings(io);
		return io.read(u)
	})
	.then((u: UserSettings) => {
		window.channer.settings = u;
		return p.start();
	})
	.then((resp: PhonegapPluginPush.RegistrationEventResponse) => {
		console.log("step3");
		window.channer.settings.device_id = resp.registrationId;
		return window.channer.settings.save();
	})
	.then((u: UserSettings) => {
		console.log("step4");
		window.channer.onResume.push(h.resume);
		window.channer.onPause.push(h.pause);
		//startup timer and network
		t.start(c.timer_resolution_ms);
		h.resume();
		m.route.mode = "hash"; //prevent from refreshing page when route changes.
		//setup client router
		m.route(document.body, "/login", {
			"/login":					new window.channer.LoginComponent(c),
			"/org":						new window.channer.OrgComponent(c),
			"/org/:org/": 				new window.channer.MainComponent(c),
			"/org/:org/topic": 			new window.channer.ComposeComponent(c),
			"/org/:org/topic/:id": 		new window.channer.TopicComponent(c),
		});
	}, (e: Error) => {
		console.log("bootstrap error: " + e.message);
		throw e;
	});
}
