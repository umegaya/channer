/// <reference path="../typings/extern.d.ts"/>
/// <reference path="../typings/phonegap.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>

import q = require('q');

export interface PushDelegate {
	onregister?(response: PhonegapPluginPush.RegistrationEventResponse): any;
	onnotify?(response: PhonegapPluginPush.NotificationEventResponse): any;
	onerror?(response: Error): any;
}
export class Push {
	static default_d: PushDelegate = {
		onregister: (response: PhonegapPluginPush.RegistrationEventResponse) => {},
		onnotify: (response: PhonegapPluginPush.NotificationEventResponse) => {},
		onerror: (response: Error) => {},
	};
	private pn: PhonegapPluginPush.PushNotification;
	private config: any;
	private delegate: PushDelegate;
	constructor(config: any, delegate?: PushDelegate) {
		this.config = config;
		this.delegate = delegate;
	}
	start = (): Q.Promise<PhonegapPluginPush.RegistrationEventResponse> => {
		var df = q.defer<PhonegapPluginPush.RegistrationEventResponse>();
		if (window.channer.mobile) {
			var d = this.delegate || {};
			this.pn = PushNotification.init(this.config);
			this.pn.on("registration", (r: PhonegapPluginPush.RegistrationEventResponse) => {
				d.onregister && d.onregister(r);
				df.resolve(r);	
			});
			this.pn.on("notification", d.onnotify || Push.default_d.onnotify);
			this.pn.on("error", (e: Error) => {
				d.onerror && d.onerror(e);
				df.reject(e);
			});
		}
		else {
			setTimeout(function () {
				df.resolve({ registrationId: "" });
			}, 10)
		}
		return df.promise;
	}
}
export interface PushReceiver {
	(response: PhonegapPluginPush.NotificationEventResponse): any;
}
