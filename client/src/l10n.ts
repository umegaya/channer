/// <reference path="../typings/extern.d.ts"/>
import Q = require('q');

class L10nDictionary {
    [k:string]:{
        [k:string]:string;
    };
}

class L10n {
    g: Globalization;
    locale: string;
    dict: L10nDictionary;    
    constructor(g: Globalization, dict: L10nDictionary) {
        this.g = g;
        this.dict = dict;
        this.initialize();
    }
    private setuplocale = (): Q.Promise<boolean> => {
        var df: Q.Deferred<boolean> = Q.defer<boolean>();
        this.g.getLocaleName((locale: {value: string}) => {
            console.log("locale:" + locale.value);
            this.locale = locale.value;
            df.resolve(true);
        }, (e: GlobalizationError) => {
            df.reject(e);            
        });
        return df.promise;
    }
    initialize = () => {
        this.setuplocale();
        while (!this.locale) {
        }
    }
    translate = (text: string, ...args:Array<any>): string => {
        var fmt = text;
        if (this.dict[text] && this.dict[text][this.locale]) {
            fmt = this.dict[text][this.locale];
        } 
        else if (this.locale != "en") {
            console.log("warning: entry not exists for:" + text + "|" + this.dict[text]);
        }
        return fmt.replace(/\$([0-9]+)/, (sub: string, ...captures: any[]):string => {
            return args[parseInt(captures[0], 10) - 1];
        });
    }
}

window.channer.l10n = new L10n(navigator.globalization, JSON.parse(require("./l10n/data.json")));