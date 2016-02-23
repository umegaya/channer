/// <reference path="./phonegap.d.ts"/>
/// <reference path="./compat.d.ts"/>
/// <reference path="./channer.proto.d.ts"/>
/// <reference path="./Q/q.d.ts"/>
/// <reference path="./hammerjs/hammerjs.d.ts"/>
/// <reference path="./UI.d.ts"/>
/// <reference path="./mithril.d.ts"/>
/// <reference path="./protobuf.d.ts"/>
/// <reference path="./long/long.d.ts"/>
/// <reference path="./webpack-runtime.d.ts"/>

interface Window {
    channer: ChannerModules;
    m: any; //temporary for loading mithril.animate
    environment: string;
}

/**
 *  ChannerModules is collection of modules that referred by channer 
 *  via global namespace 
 */
interface ChannerModules {
	bootstrap: (c: any/*Config*/) => void;
	conn: any/*Handler*/;
	config: any/*Config*/;
	m: _mithril.MithrilStatic;
    mtransit: (...args:Array<any>) => any;
	ProtoBuf: any;
	timer: any/*Timer*/;
	settings: any/*UserSettings*/;
	push: any/*Push*/;
	rawfs: FileSystem;
	fs: any/*FS*/;
	hash: any;
	storage: any;
	patch: any;
	mobile: boolean;
    l10n: { 
        translate(text: string, ...args:Array<any>): string; 
        translateDate(date: Date): any;
        setuplang(): any;
        localeSettings(): any;
        language: string;
    };
    jsloader_promise: any;
	onResume: Array<() => void>;
	onPause: Array<() => void>;
	onPush: Array<(resp:any) => void>;/*PushReceiver*/
	components: {
		Login: UI.ComponentFactory;
		Rescue: UI.ComponentFactory;
		Top: UI.ComponentFactory;
		Compose: UI.ComponentFactory;
		Topic: UI.ComponentFactory;
		Channel: UI.ComponentFactory;
		Edit: UI.ComponentFactory;
        Menu: UI.ComponentFactory;
        active: {
            component: UI.Component;
            ctrl: UI.Controller;
        }
	}
    parts: {
        Scroll: UI.Component;
        Button: UI.Component;
        TextField: UI.Component;
        Tabs: UI.Component;
        Radio: UI.Component;
    }
    testtmp: any;
}
