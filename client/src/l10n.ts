/// <reference path="../typings/extern.d.ts"/>

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
            "en": require("./l10n/lang/en.json"),
            "ja": require("./l10n/lang/ja.json"),
            "ko": require("./l10n/lang/ko.json"),
            "zh_Hant": require("./l10n/lang/zh_Hant.json"),
            "zh_Hans": require("./l10n/lang/zh_Hans.json"),
        };
        this.supported = require("./l10n/supported.json");
        for (var k in this.supported) {
            var v = this.supported[k];
            if (!L10n.supportedLanguages[v]) {
                throw Error("want to support " + v + " but no data");
            }
        }
    }
    setuplang = (): Promise<boolean> => {
        return new Promise<boolean>((resolve: (e: boolean) => void, reject: (err: any) => void) => {
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
                resolve(true);
            }, () => {
                reject(new Error("fail to get language"));
            });
        })
    }
    translate = (text: string, ...args:Array<any>): string => {
        var fmt = text;
        if (this.dict[text] && this.dict[text][this.language]) {
            fmt = this.dict[text][this.language];
        } 
        else if (this.language != "en") {
            console.log("l10n: warning: entry not exists for:" + text + "|" + this.dict[text]);
        }
        return fmt.replace(/\$([0-9]+)/, (sub: string, ...captures: any[]):string => {
            return args[parseInt(captures[0], 10) - 1];
        });
    }
    translateDate = (date: Date): Promise<string> => {
        return new Promise<string>((resolve: (e: string) => void, reject: (err: any) => void) => {
            this.g.dateToString(date, (d: {value : string}) => {
                resolve(d.value);
            }, reject);
        });
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
window.channer.l10n = new L10n(navigator.globalization, require("./l10n/data.json"));
window.channer.jsloader_promise = window.channer.l10n.setuplang();
