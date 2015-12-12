/// <reference path="../typings/extern.d.ts" />
/// <reference path="../typings/phonegap.d.ts" />
/// <reference path="../typings/q/Q.d.ts" />
import q = require('q');
export interface PushDelegate {
    onregister?(response: PhonegapPluginPush.RegistrationEventResponse): any;
    onnotify?(response: PhonegapPluginPush.NotificationEventResponse): any;
    onerror?(response: Error): any;
}
export declare class Push {
    static default_d: PushDelegate;
    private pn;
    private config;
    private delegate;
    constructor(config: any, delegate?: PushDelegate);
    start: () => q.Promise<PhonegapPluginPush.RegistrationEventResponse>;
}
export interface PushReceiver {
    (response: PhonegapPluginPush.NotificationEventResponse): any;
}
