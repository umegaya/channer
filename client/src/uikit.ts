/// <reference path="../typings/extern.d.ts"/>

export var m : _mithril.MithrilStatic = window.channer.m;
var _L = window.channer.l10n.translate;
var _LD = window.channer.l10n.translateDate;

export class Util {
	static route(dest: string, params?: any, options?: {
            route_only?: boolean; 
            replace_history?: boolean; 
    }) {
        options = options || {};
		if (!options.route_only) {
            if (!dest) {
                console.error("invalid dest from");
            }
			window.channer.settings.values.last_url = dest;
            console.log("last_page_url check:" + 
                (dest.indexOf("/menu") < 0 && dest.indexOf("menu=on") < 0) + "|" + 
                (window.channer.settings.values.last_page_url != dest) + "|" + 
                dest + "|" + 
                window.channer.settings.values.last_page_url);
            
            if ((dest.indexOf("/menu") < 0 && dest.indexOf("menu=on") < 0) &&
                (window.channer.settings.values.last_page_url != dest)) {
                console.log("lastpageurl:" + dest);
                window.channer.settings.values.last_page_url = dest;
            }
			window.channer.settings.save();
		}
		m.route(dest, params, options.replace_history);
	}
	static restart_app() {
		document.location.pathname = "/";
		document.location.reload();
	}
    static hexdump(b: Uint8Array) {
		var hex = "0123456789abcdef";
		var str = "";
		for (var i = 0; i < b.length; i++) {
			var byte = b[i];
			var hi = Math.floor(byte / 16);
			var lo = Math.floor(byte % 16);
			str += (hex.charAt(hi) + hex.charAt(lo));
		}
		return str;
    }
    static epoc: Date = new Date(2015, 0, 1, 0, 0, 0);//2015/01/01 00:00:00
    static uuid2date(uuid: Long): Date {
        //shift 15bit => convert to msec (1 == 10us)
        var date: Date = new Date(
            Util.epoc.getTime() + uuid.divide(32768).divide(100).toNumber()
        );
        return date;
    }
    static long2date(long: Long): Date {
        //long date has nano seconds (1000000000 ns == 1s) precision.
        var date: Date = new Date(
            Util.epoc.getTime() + long.divide(1000000).toNumber()
        );
        return date;
    }
    static date(d: Date, duration?:boolean) {
        var str: string;
        if (duration) {
            var diff: number = ((new Date()).getTime() - d.getTime());
            if (diff < 1000) {
                str = _L("just now")
            }
            //TODO: correctly handle singular/plural form, 
            //like a second/2 seconds
            else if (diff < 60000) {
                str = _L("$1 seconds", Math.floor(diff / 1000));
            }
            else if (diff < 3600000) {
                str = _L("$1 minutes", Math.floor(diff / 60000));
            }
            else if (diff < 86400000) {
                str = _L("$1 hours", Math.floor(diff / 3600000));
            }
            else {
                str = _L("$1 days", Math.floor(diff / 86400000));
            }
        }
        else {
            str = d.getHours() + ":" + d.getMinutes();
        }
        return m("div", {class: "date"}, str);
    }
    static datebyuuid(uuid: any, duration?:boolean) {
        return Util.date(Util.uuid2date(<Long>uuid), duration);
    }
    static datebylong(long: any, duration?:boolean) {
        return Util.date(Util.long2date(<Long>long), duration);
    }
}
