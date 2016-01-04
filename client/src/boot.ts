/// <reference path="../typings/extern.d.ts"/>

import {Handler} from "./proto"
import {Config, UserSettings, UserSettingsValues} from "./config"
import {Timer} from "./timer"
import {m, Util} from "./uikit"
import {Push, PushReceiver} from "./push"
import {Storage, StorageIO} from "./storage"

//for debug. remove user setting
var truncate_settings = false;

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
	var setting_io : StorageIO = null;
	//store system modules to global namespace
	window.channer.conn = h;
	window.channer.timer = t;
	window.channer.config = c;
	window.channer.push = p;
	window.channer.storage = s;
	//build bootstrap chain
	s.open(c.user_settings_path, {create: true})
	.then((io: StorageIO) => {
		setting_io = io;
		var u : UserSettings = new UserSettings(io);
		return setting_io.read(u)
	})
	.then((u: UserSettings) => {
		u.values.init();
		window.channer.settings = u;
		if (truncate_settings) {
			window.channer.settings.values = new UserSettingsValues();
		}
		return p.start();
	}, (e: Error) => {
		console.log("user setting broken. remove all");
		setting_io.rm();
		throw e;
		return p.start(); //never reach here. to make compiler feel good. :<
	})
	.then((resp: PhonegapPluginPush.RegistrationEventResponse) => {
		window.channer.settings.values.device_id = resp.registrationId;
		return window.channer.settings.save();
	})
	
	.then((u: UserSettings) => {
		return window.channer.fs.applycss("base", require("./styles/base.styl"));
	})
	.then(() => {
		window.channer.onResume.push(h.resume);
		window.channer.onPause.push(h.pause);
		//startup timer and network
		t.start(c.timer_resolution_ms);
		h.resume();
		m.route.mode = "hash"; //prevent from refreshing page when route changes.
		//setup client router
		var last_url = window.channer.settings.last_url;
		var start_url = last_url ? ("/login?next=" + last_url) : "/login"; 
		m.route(document.body, start_url, {
			"/login":					new window.channer.LoginComponent(c),
			"/channel":					new window.channer.ChannelComponent(c),
			"/channel/:ch/": 			new window.channer.MainComponent(c),
			"/channel/:ch/topic": 		new window.channer.ComposeComponent(c),
			"/channel/:ch/topic/:id": 	new window.channer.TopicComponent(c),
		});
	}, (e: Error) => {
		console.log("bootstrap error: " + e.message);
		throw e;
	})
	.done(null, (e: Error) => {
		console.log("bootstrap error: " + e.message);
		throw e;
	});
}
