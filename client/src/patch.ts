/// <reference path="../typings/extern.d.ts"/>
import {FS} from "./fs";
import Q = require('q');

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
    update = (baseUrl: string, vs: Versions): Q.Promise<any> => {
        //create assets directory if not exists
        var df: Q.Deferred<DirectoryEntry> = Q.defer<DirectoryEntry>();
        //no rootDir needed. otherwise FileNotFound error raise
        return this.fs.opendir('assets', {create:true})
        .then(() => {
            var loaders : Q.Promise<FileEntry>[] = [];
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
                    console.log("load:" + dest);
                    loaders.push(this.fs.openfile(dest));
                }
            }
            return Q.all(loaders).then((entries : Array<FileEntry>) => {
                entries.shift(); //prevent patch.js from loading
                if (entries.length > 0) {
                    //setup sequencial js loader (because halfway loaded js may cause error)
                    var promise : Q.Promise<any> = this.fs.load(entries[0]);
                    //for working with messy spec of javascript closure...
                    var _loadnext = (ent: FileEntry) => {
                        return (loadedjs: FileEntry) => {
                            return this.fs.load(ent);
                        }                   
                    }
                    for (var i = 1; i < entries.length; i++) {
                        var ent = entries[i];
                        var idx = i;
                        promise = promise.then(_loadnext(ent));
                    }
                    return promise;
                }
                return true;
            });
        });
    }
    patch = (baseUrl: string) : Q.Promise<any> => {
        var next : Config;
        var prev : Config;
        var apply : Versions = [];
        return this.fs.openfile('config.json.next')
        .then(this.fs.readfile)
        .then((nextData: string) => {
            var df: Q.Deferred<FileEntry> = Q.defer<FileEntry>();
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
            config.url = loaderURL.replace(/[0-9]+$/, "8888").replace(/^http/, "wss") + "/ws";
        }
        console.log("end patch: endpoint = " + config.url);
        onfinished(config);
    }, function (e: any) {
        console.log("error patch:" + JSON.stringify(e));
        alert("pause");
        onerror(e);
    });
}
