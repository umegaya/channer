/// <reference path="../typings/extern.d.ts"/>
import Q = require('q');

class L10nDictionary {
    [k:string]:{
        [k:string]:string;
    };
}

var normalizeLangCode: {
    [k:string]:[string]
} = {
    "ja":["ja-JP"],
};

class L10n {
    g: Globalization;
    language: string;
    dict: L10nDictionary;    
    constructor(g: Globalization, dict: L10nDictionary) {
        this.g = g;
        this.dict = dict;
    }
    setuplang = (): Q.Promise<boolean> => {
        var df: Q.Deferred<boolean> = Q.defer<boolean>();
        this.g.getPreferredLanguage((lang: {value: string}) => {
            console.log("lang:" + lang.value);
            for (var k in normalizeLangCode) {
                if (k == lang.value) {
                    this.language = k;
                    break;
                }
                for (var idx in normalizeLangCode[k]) {
                    if (normalizeLangCode[k][idx] == lang.value) {
                        this.language = k;
                        break;            
                    }
                }
                if (this.language) {
                    break;
                }
            }
            if (!this.language) {
                this.language = "en";
            }
            console.log("language = " + this.language);
            df.resolve(true);
        }, () => {
            console.log("fail to get lang");
            df.reject(new Error("fail to get language"));
        });
        return df.promise;
    }
    translate = (text: string, ...args:Array<any>): string => {
        var fmt = text;
        if (this.dict[text] && this.dict[text][this.language]) {
            fmt = this.dict[text][this.language];
        } 
        else if (this.language != "en") {
            console.log("warning: entry not exists for:" + text + "|" + this.dict[text]);
        }
        return fmt.replace(/\$([0-9]+)/, (sub: string, ...captures: any[]):string => {
            return args[parseInt(captures[0], 10) - 1];
        });
    }
    translateDate = (date: Date): Q.Promise<string> => {
        var df: Q.Deferred<string> = Q.defer<string>();
        this.g.dateToString(date, (d: {value : string}) => {
            df.resolve(d.value);
        }, (e: GlobalizationError) => {
            df.reject(e);
        });
        return df.promise;
    }
}

window.channer.l10n = new L10n(navigator.globalization, JSON.parse(require("./l10n/data.json")));
window.channer.jsloader_promise = window.channer.l10n.setuplang();