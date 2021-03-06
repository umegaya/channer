/// <reference path="../typings/extern.d.ts"/>
import {Handler} from "./proto"
import {Config, UserSettings, UserSettingsValues} from "./config"
import {Timer} from "./timer"
import {Util} from "./uikit"
import {Push, PushReceiver} from "./push"
import {Storage, StorageIO, Database} from "./storage"

//for debug. remove user setting
var truncate_settings = window.environment.match(/test/);

var errRaiser = (): any => {
	throw new Error("errRaiser!!");
}

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
	var d : Database = new Database("channer");
	var setting_io : StorageIO = null;
	//store system modules to global namespace
	window.channer.conn = h;
	window.channer.timer = t;
	window.channer.config = c;
	window.channer.push = p;
	window.channer.storage = s;
	window.channer.database = d;
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
        return p.start(window.channer.app);  
	}, (e: Error) => {
		console.log("user setting broken. remove all");
		setting_io.rm();
        return errRaiser();
	})
	.then((resp: PhonegapPluginPush.RegistrationEventResponse) => {
		window.channer.settings.values.device_id = resp.registrationId;
		return window.channer.settings.save();
	})
	.then(() => {
		return window.channer.database.initialize((db: Database, oldv: number) => {
			console.log("database oldv = " + oldv);
			switch (oldv) {
			case 0:
				console.log("database initialize: ver 0");
				db.open("settings", { keyPath: "key" }, true);
				db.open("votes", { keyPath: "id" }, true);
			}
		}, truncate_settings);
	})
	.then((db: Database) => {
		return window.channer.fs.applycss("base", require("./css/main.styl"));
	})
	.then(() => {
		window.channer.onResume.push(h.resume);
		window.channer.onPause.push(h.pause);
		//startup timer and network
		t.start(c.timer_resolution_ms);
		h.resume();
		//setup client router
		window.channer.router();
		return null;
	})
	.done(null, (e: Error) => {
		console.log("bootstrap error: " + e.message);
		throw e;
	});
}
