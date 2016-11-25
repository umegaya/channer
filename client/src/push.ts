/// <reference path="../typings/extern.d.ts"/>
import * as Promise from "bluebird"

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
	start = (mobile: boolean): Promise<PhonegapPluginPush.RegistrationEventResponse> => {
		return new Promise<PhonegapPluginPush.RegistrationEventResponse>(
		(resolve: (e: PhonegapPluginPush.RegistrationEventResponse) => void, reject: (err: any) => void) => {
			if (mobile) {
				var d = this.delegate || {};
				this.pn = PushNotification.init(this.config);
				this.pn.on("registration", (r: PhonegapPluginPush.RegistrationEventResponse) => {
					d.onregister && d.onregister(r);
					resolve(r);	
				});
				this.pn.on("notification", d.onnotify || Push.default_d.onnotify);
				this.pn.on("error", (e: Error) => {
					d.onerror && d.onerror(e);
					reject(e);
				});
			}
			else {
				resolve({ registrationId: "" });
			}
		});
	}
}
export interface PushReceiver {
	(response: PhonegapPluginPush.NotificationEventResponse): any;
}
