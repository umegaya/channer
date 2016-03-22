/// <reference path="../typings/extern.d.ts"/>
import Q = require('q');

class L10nDictionary {
    [k:string]:{
        [k:string]:string;
    };
}

class LocaleSettings {
    [k:string]:string;
}

class L10n {
    static supportedLanguages: {
        [k:string]:LocaleSettings
    };
    //TODO: auto generated this information.
    static normalizeLangCode: {
        [k:string]:[string]
    } = {
        "ja":["ja-JP"],
        "ko":["ko-KP", "ko-KR"],
        "zh_Hant":["zh-Hant-HK", "zh-Hant-MO", "zh-Hant-TW"],
    };
    g: Globalization;
    language: string;
    settings: Array<{key:string, value:string}>;
    supported: Array<string>;
    dict: L10nDictionary;
    constructor(g: Globalization, dict: L10nDictionary) {
        this.g = g;
        this.dict = dict;
        this.settings = null;
        L10n.supportedLanguages = {
            "en": JSON.parse(require("./l10n/lang/en.json")),
            "ja": JSON.parse(require("./l10n/lang/ja.json")),
            "ko": JSON.parse(require("./l10n/lang/ko.json")),
            "zh_Hant": JSON.parse(require("./l10n/lang/zh_Hant.json")),
            "zh_Hans": JSON.parse(require("./l10n/lang/zh_Hans.json")),
        };
        this.supported = JSON.parse(require("./l10n/supported.json"));
        for (var k in this.supported) {
            var v = this.supported[k];
            if (!L10n.supportedLanguages[v]) {
                throw Error("want to support " + v + " but no data");
            }
        }
    }
    setuplang = (): Q.Promise<boolean> => {
        var df: Q.Deferred<boolean> = Q.defer<boolean>();
        this.g.getPreferredLanguage((lang: {value: string}) => {
            var v = lang.value.replace("-", "_"); //sometimes _ is used for sperator
            for (var k in L10n.normalizeLangCode) {
                if (k == lang.value) {
                    this.language = k;
                    break;
                }
                for (var idx in L10n.normalizeLangCode[k]) {
                    if (L10n.normalizeLangCode[k][idx] == lang.value) {
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
            df.resolve(true);
        }, () => {
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
    private ensureInitSetting() {
        if (!this.settings) {
            this.settings = [];
            var data = L10n.supportedLanguages[this.language] || L10n.supportedLanguages["en"];
            var keys: Array<string> = [];
            for (var k in data) {
                if (this.supported.indexOf(k) >= 0) {
                    keys.push(k);
                }
            }
            keys = keys.sort();
            for (var i in keys) {
                var key: string = keys[i];
                this.settings.push({key: key, value: data[key]});
            }
        }        
    }
    localeSettings = (): Array<{key:string, value:string}> => {
        this.ensureInitSetting();
        return this.settings;
    }
    localeNameFromCode = (code: string): string => {
        this.ensureInitSetting();
        if (code == "all") {
            return this.translate("All");
        }
        for (var k in this.settings) {
            if (this.settings[k].key == code) {
                return this.settings[k].value;
            }
        }
        return null;
    }
}
window.channer.l10n = new L10n(navigator.globalization, JSON.parse(require("./l10n/data.json")));
window.channer.jsloader_promise = window.channer.l10n.setuplang();
