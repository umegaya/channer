/// <reference path="../../typings/extern.d.ts"/>

import {m} from "../uikit"
import {Storage, StorageIO, Persistable} from "../storage"

export interface PropCondition {
    init: any;
    fallback?: any;
    check?: any;
}
export class PropConditions {
    required: {
        [k:string]:PropCondition,
    };
    optional: {
        [k:string]:PropCondition,
    }
};
export class PropCollection implements Persistable {
    name: string;
    save_scheduled: any;
    cond: PropConditions;
    props:{[k:string]: UI.Property<any>};
    constructor(name: string, cond: PropConditions) {
        this.props = {};
        this.name = name;
        this.save_scheduled = undefined;
        this.cond = cond;
        this.init();
    }
    init = (clear?: boolean) => {
        var cond = this.cond;
        for (var k in cond.required) {
            var ini = cond.required[k].init;
            this.create_prop(k, ini);
        }
        for (var k in cond.optional) {
            var ini = cond.optional[k].init;
            this.create_prop(k, ini);
        }
        if (clear) {
            window.channer.storage.open("form/" + this.name).then(
                (io: StorageIO) => { return io.rm(); }
            );
        }
        else {
            //trigger redraw
            this.loadprop().then(() => { 
                m.endComputation(); 
            }, (e: Error) => {
            console.log("PropCollection init error by " + e.message);
                m.endComputation();             
            });
        }
    }
    val = (k: string): any => {
        var p : UI.Property<any> = this.props[k];
        if (!p) { return null; }
        return p();
    }
    update = (k: string, v: any) => {
        var p : UI.Property<any> = this.props[k];
        if (!p) { return; }
        p(v);
        this.save();
    }
    clear = () => {
        this.init(true);
    }
    private create_prop = (k: string, v: string|number) => {
        this.props[k] = m.prop(v);
    }
    //storage IO
    save = () => {
        if (!this.save_scheduled) {
            this.save_scheduled = setTimeout(this.saveprop, 1000);
        }
    }
    private saveprop = (): Q.Promise<PropCollection> => {
        console.log("save");
        this.save_scheduled = undefined;
        return window.channer.storage.open("form/" + this.name, {create: true})
            .then(
                (io: StorageIO) => { return io.write(this) },
                (e: Error) => { console.log("save error: " + e.message)});
    }
    private loadprop = (): Q.Promise<PropCollection> => {
        return window.channer.storage.open("form/" + this.name, {create: true})
            .then((io: StorageIO) => { return io.read(this) });  
    }
    //implement persistable
    type = () => {
		return "text/plain";
	}
	read = (blob: string) => {
		console.log("form blob:" + blob)
		if (blob.length > 0) {
			var loaded = JSON.parse(blob);
            for (var k in loaded) {
                if (!this.props[k]) {
                    this.props[k] = m.prop(loaded[k]);
                }
                else {
                    this.props[k](loaded[k]);
                }
            }
		}
	}
	write = (): string => {
        var values: { [k:string]: any } = {}
        for (var k in this.props) {
            values[k] = this.props[k]();
        }
		return JSON.stringify(values);
	}
    //validation
    check = (): {[k:string]:any} => {
        var verified: {[k:string]:string|number} = {};
        var cond = this.cond;
        for (var k in cond.required || {}) {
            var p = this.props[k];
            var c = cond.required[k];
            if (p) {
                var v = p();
                if (!this.valid(v, c)) {
                    return;
                }
                verified[k] = v;
            }
        }
        for (var k in cond.optional || {}) {
            var p = this.props[k];
            var c = cond.optional[k];
            if (p) {
                var v = p();
                if (!this.valid(v, c)) {
                    if (c.fallback == "") {
                        //console.log("fallback is empty str: set it");
                        v = c.fallback;
                    }
                    else {
                        v = c.fallback || c.init;
                    }
                }
                verified[k] = v;
            }
        }
        for (var k in this.props) {
            var val = verified[k];
            if (!val && (val != "")) {
                verified[k] = this.props[k]();
            }
        }
        return verified;
    }
    private valid = (val: any, cond: PropCondition): boolean => {
        if (typeof(val) == "string" && !val) {
            //empty string not valid
            return false;
        }
        if (typeof(cond.check) == "undefined") {
            //if same as initial value, not valid.
            return val != cond.init;
        }
        else if (typeof(cond.check) == "function") {
            return cond.check(val);
        }
        return cond.check != val;
    }
};

export class PropCollectionFactory {
    static map: {
        [k:string]:PropCollection;
    } = {};
    static config: {
        [k:string]:PropConditions;
    } = {};
    static setup = (name: string, cond: PropConditions) => {
        PropCollectionFactory.config[name] = cond;
    }
    static ref = (name: string): PropCollection => {
        var p: PropCollection = PropCollectionFactory.map[name];
        if (!p) {
            var cond: PropConditions = PropCollectionFactory.config[name];
            p = new PropCollection(name, cond);
            PropCollectionFactory.map[name] = p; 
        }
        return p;
    }
}
