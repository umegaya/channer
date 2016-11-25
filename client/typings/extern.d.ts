/// <reference path="./phonegap.d.ts"/>
/// <reference path="./compat.d.ts"/>
/// <reference path="./channer.proto.d.ts"/>
/// <reference path="./bluebird/bluebird.d.ts"/>
/// <reference path="./hammerjs/hammerjs.d.ts"/>
/// <reference path="./UI.d.ts"/>
/// <reference path="./react/react.d.ts"/>
/// <reference path="./react/react-dom.d.ts"/>
/// <reference path="./react/react-canvas.d.ts"/>
/// <reference path="./react-router/history.d.ts"/>
/// <reference path="./react-router/react-router.d.ts"/>
/// <reference path="./material-ui/material-ui.d.ts"/>
/// <reference path="./highlightjs/highlightjs.d.ts"/>
/// <reference path="./react-swipeable-views/react-swipeable-views.d.ts"/>
/// <reference path="./protobuf.d.ts"/>
/// <reference path="./long/long.d.ts"/>
/// <reference path="./webpack-runtime.d.ts"/>
/// <reference path="./immutable/immutable.d.ts"/>
/// <reference path="./draft-js/draft-js.d.ts"/>
/// <reference path="./draft-js/react-rte.d.ts"/>

interface Window {
    channer: ChannerModules;
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
    Hammer: HammerStatic;
	ProtoBuf: any;
    MarkdownParser: any;
	timer: any/*Timer*/;
	settings: any/*UserSettings*/;
	push: any/*Push*/;
	rawfs: FileSystem;
	fs: any/*FS*/;
	hash: any;
	storage: any;
    database: any;
	patch: any;
	app: boolean;
    chaos: boolean;
    category: {
        data: Array<any>;
        to_id: (cat: string) => number;
        from_id: (id: number) => string;
    };
    router: () => void;
    l10n: { 
        translate(text: string, ...args:Array<any>): string; 
        translateDate(date: Date): any;
        setuplang(): any;
        localeSettings(): any;
        localeNameFromCode(code: string): string;
        language: string;
    };
    jsloader_promise: any;
	onResume: Array<() => void>;
	onPause: Array<() => void>;
	onPush: Array<(resp:any) => void>;/*PushReceiver*/
	components: {
		Login: UI.Component;
		Rescue: UI.Component;
		Top: UI.Component;
		Topic: UI.Component;
		Channel: UI.Component;
        Menu: UI.Component;
        //menu
        ChannelCreate: UI.Component;
        ChannelFilter: UI.Component;
        TopicFilter: UI.Component;
	}
    parts: {
        Scroll: UI.Component;
        Markdown: UI.Component;
        RichTextEditor: ReactRTE.Editor;
        Button: UI.Component;
        TextField: UI.Component;
        Tabs: UI.Component;
        Radio: UI.Component;
        Channel: UI.Component;
        Topic: UI.Component;
    }
}

//SyntacticEvent wrapper
interface HTMLElemEvent<T extends HTMLElement> extends SyntheticEvent {
    target: T;
}
