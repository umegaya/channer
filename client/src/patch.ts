/// <reference path="../typings/extern.d.ts"/>
import {FS} from "./fs";
import * as Promise from "bluebird"

class Version {
    name: string;
    hash: string;
    ext: string;
    updated: boolean;
}
class Versions {
    [x: number]: Version;
}
class Config {
    versions: Versions; 
    appconfig: any;
}

class Patcher {
    fs: FS;
    download_always: boolean;
    constructor(fs: FS, debug?: boolean) {
        this.fs = fs;
        this.download_always = debug;
    }
    update = (baseUrl: string, vs: Versions): Promise<any> => {
        //create assets directory if not exists
        return new Promise<any>((resolve: (e: any) => void, reject: (err: any) => void) => {
            //no rootDir needed. otherwise FileNotFound error raise
            return this.fs.opendir('assets', {create:true})
            .then(() => {
                var loaders : Promise<FileEntry>[] = [];
                for (var i in vs) {
                    var ent = vs[i];
                    var name: string = ent.name;
                    var ext: string = ent.ext;
                    var dest: string = 'assets/' + name + "." + ext;
                    if (vs[i].updated) {
                        var src: string = baseUrl + "/assets/" + name + "." + ent.hash + "." + ent.ext;
                        console.log("download:" + src + " => " + dest);
                        loaders.push(this.fs.download(src, dest));
                    }
                    else {
                        //console.log("load:" + dest);
                        loaders.push(this.fs.openfile(dest));
                    }
                }
                return Promise.all(loaders).then((entries : Array<FileEntry>) => {
                    entries.splice(0, 2); //prevent commons.js and patch.js from loading
                    if (entries.length > 0) {
                        //setup sequencial js loader (because halfway loaded js may cause error)
                        var promise : Promise<FileEntry> = this.fs.load(entries[0]);
                        //for working with messy spec of javascript closure...
                        var _loadnext = (ent: FileEntry) => {
                            return (loadedjs: FileEntry): Promise<FileEntry> => {
                                return this.fs.load(ent);
                            }                   
                        }
                        for (var i = 1; i < entries.length; i++) {
                            var ent = entries[i];
                            var idx = i;
                            promise = promise.then(_loadnext(ent));
                        }
                        promise.then(resolve);
                    } else {
                        resolve(this);
                    }
                });
            });
        });
    }
    patch = (baseUrl: string) : Promise<any> => {
        var next : Config;
        var prev : Config;
        var apply : Versions = [];
        return this.fs.openfile('config.json.next')
        .then(this.fs.readfile)
        .then((nextData: string) => {
            next = JSON.parse(nextData);
            //create if not exists current config.json.
            //no rootDir needed. otherwise FileNotFound error raise
            return this.fs.openfile('config.json', {create:true});
        })
        .then(this.fs.readfile)
        .then((prevData: string) => {
            prev = JSON.parse(prevData.length > 0 ? prevData : "{}");
            //compare prev/next versions and if differ, marked as updated
            for (var k in next.versions) {
                var nv: Version = next.versions[k];
                if (prev.versions && (!this.download_always)) {
                    for (var j in prev.versions) {
                        var pv: Version = prev.versions[j];
                        if (nv.name == pv.name && nv.hash != pv.hash) {
                            nv.updated = true;
                            break;
                        }
                    }
                }
                else {
                    nv.updated = true;
                }    
            }
            console.log("start update");
            return this.update(baseUrl, next.versions);
        }, (e: any) => {
            console.log("error occurs:"+ e.stack);
            //all files are marked as updated
            for (var k in next.versions) {
                next.versions[k].updated = true;
            }
            return this.update(baseUrl, next.versions);
        })
        .then(() => {
            console.log("rename configjson");
            return this.fs.rename('config.json.next', '/', 'config.json');
        })
        .then(() => {
            return next.appconfig;
        })
    }
};

window.channer.patch = function (loaderURL: string, onfinished: (config: any) => any, 
    onerror: (error: any) => any, debug?: boolean): any {
    console.log("start patch " + loaderURL);
    window.channer.fs = new FS(window.channer.rawfs);
    var patcher = new Patcher(window.channer.fs, debug);
    patcher.patch(loaderURL).then(function (config: any) {
        if (!config.url) {
            config.url = loaderURL.replace(/[0-9]+$/, "8888").replace(/^http/, "ws") + "/ws";
        }
        console.log("end patch: endpoint = " + config.url);
        onfinished(config);
    }, function (e: any) {
        console.log("error patch:" + JSON.stringify(e));
        alert("pause");
        onerror(e);
    });
}
