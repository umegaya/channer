/// <reference path="../typings/extern.d.ts"/>
import {StorageIO, Persistable} from "./storage";
import Q = require('q');

export class Config {
	url: string;
	client_version: string;
	user_settings_path: string;
	response_timeout_ms: number;
	ping_interval_ms: number;
	auth_interval_ms: number;
	deactivate_timeout_ms: number;
	timer_resolution_ms: number;
	push_settings: any;
	constructor(src: any) {
		this.url = src.url;
		this.client_version = src.client_version;
		this.user_settings_path = "user_settings.json";
		this.response_timeout_ms = src.response_timeout_ms || 5000;
		this.ping_interval_ms = src.ping_interval_ms || this.response_timeout_ms;
		this.auth_interval_ms = src.auth_interval_ms || 3600000; //1h
		this.deactivate_timeout_ms = src.deactivate_timeout_ms || 5000;
		this.timer_resolution_ms = src.timer_resolution_ms || 1000;
		this.push_settings = src.push_settings || {
			"android": { "senderID": "1234567890" },
            "ios": {"alert": "true", "badge": "true", "sound": "true"}, 
            "windows": {},
		}
	}
}

export class UserSettingsValues {
	user: string;
	account_id: string;
	pass: string;
	device_id: string;
	secret: string;	
	last_url: string;
    last_page_url: string;
	mail: string;
	private secure_random = (): string => {
		var array = new Uint8Array(16);
		window.crypto.getRandomValues(array);
		var hex = "0123456789abcdef";
		var str = "";
		for (var i = 0; i < array.length; i++) {
			var byte = array[i];
			var hi = Math.floor(byte / 16);
			var lo = Math.floor(byte % 16);
			str += (hex.charAt(hi) + hex.charAt(lo));
		}
		return str;
	}
	init = () => {
		if (!this.pass) {
			this.pass = this.secure_random();
			console.log("password = " + this.pass);
		}
	}
}

export class UserSettings implements Persistable {
	io: StorageIO;
	values: UserSettingsValues;
	
	constructor(io: StorageIO) {
		this.io = io;
		this.values = new UserSettingsValues();
	}
	save = (): Q.Promise<Persistable> => {
		return this.io.write(this);
	}
	type = () => {
		return "text/plain";
	}
	read = (blob: string) => {
		console.log("blob:" + blob)
		if (blob.length > 0) {
			var loaded = JSON.parse(blob);
			this.values.user = loaded.user;
			this.values.pass = loaded.pass;
			this.values.account_id = loaded.account_id;
			this.values.secret = loaded.secret;
			this.values.device_id = loaded.device_id;
			this.values.last_url = loaded.last_url;
			this.values.last_page_url = loaded.last_page_url;
			this.values.mail = loaded.mail;
		}
	}
	write = (): string => {
		return JSON.stringify(this.values);
	}
}
