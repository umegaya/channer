/// <reference path="../typings/q/Q.d.ts"/>
import {StorageIO, Persistable} from "./storage"

export class Config {
	url: string;
	user_settings_path: string;
	response_timeout_ms: number;
	ping_interval_ms: number;
	deactivate_timeout_ms: number;
	timer_resolution_ms: number;
	push_settings: any;
	constructor(src: any) {
		this.url = src.url;
		this.user_settings_path = "user_settings.json";
		this.response_timeout_ms = src.response_timeout_ms || 5000;
		this.ping_interval_ms = src.ping_interval_ms || this.response_timeout_ms;
		this.deactivate_timeout_ms = src.deactivate_timeout_ms || 60000;
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
	pass: string;
	device_id: string;
	secret: string;	
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
			this.values.secret = loaded.secret;
			this.values.device_id = loaded.device_id;
		}
	}
	write = (): string => {
		return JSON.stringify(this.values);
	}
}
