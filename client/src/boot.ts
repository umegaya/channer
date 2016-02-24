/// <reference path="../typings/extern.d.ts"/>
import {Handler} from "./proto"
import {Config, UserSettings, UserSettingsValues} from "./config"
import {Timer} from "./timer"
import {m, Util, Router} from "./uikit"
import {Push, PushReceiver} from "./push"
import {Storage, StorageIO} from "./storage"
import {HelpComponent} from "./components/help"

//for debug. remove user setting
var truncate_settings = window.environment.match(/test/);

window.channer.bootstrap = function (config: any) {	
    console.log("bootstrap");
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
		if (truncate_settings) {
			console.log("truncate settings: env = " + window.environment);
			u.values = new UserSettingsValues();
		}
		u.values.init();
		window.channer.settings = u;
        return p.start(window.channer.mobile);  
	}, (e: Error) => {
		console.log("user setting broken. remove all");
		setting_io.rm();
		throw e;
		//never reach here. to make compiler feel good. :<
        return p.start(window.channer.mobile);  
	})
	.then((resp: PhonegapPluginPush.RegistrationEventResponse) => {
		window.channer.settings.values.device_id = resp.registrationId;
		return window.channer.settings.save();
	})
	.then(() => {
		return window.channer.fs.applycss("base", require("./css/main.styl"));
	})
	.then(() => {
		window.channer.onResume.push(h.resume);
		window.channer.onPause.push(h.pause);
		//startup timer and network
		t.start(c.timer_resolution_ms);
		h.resume();
		m.route.mode = "hash"; //prevent from refreshing page when route changes.
		//setup client router
		var last_url: string = window.channer.settings.values.last_url;
		var start_url: string = last_url ? ("/login?next=" + last_url) : "/login"; 
        //typescript wrongly resolve m.route signature here. so explicit cast required.
		(<Router>m.route)(document.body, start_url, {
			"/login":            window.channer.components.Login,
			"/rescue":           window.channer.components.Rescue,
			"/rescue/:rescue":   window.channer.components.Login,
            "/top":              window.channer.components.Top,
			"/top/:tab":         window.channer.components.Top,
			"/channel/:ch":      window.channer.components.Channel,
			"/channel/:ch/:tab": window.channer.components.Channel,
			"/topic/:id":        window.channer.components.Topic,
		});
	})
	.done(null, (e: Error) => {
		console.log("bootstrap error: " + e.message);
		throw e;
	});
}
