/// <reference path="../typings/phonegap.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>
/// <reference path="../typings/extern.d.ts"/>
/// <reference path="../typings/webpack-runtime.d.ts"/>
import q = require('q');

class Version {
    name: string;
    hash: string;
    updated: boolean;
}
class Versions {
    [x: number]: Version;
}
class Config {
    versions: Versions; 
    appconfig: any;
}

function readfile(entry: FileEntry): Q.Promise<string> {
    var df: Q.Deferred<string> = q.defer<string>();
    entry.file(function (file) {    
        var reader : FileReader = new FileReader();
        reader.onloadend = function (event : ProgressEvent) {
            df.resolve(reader.result);
        }
        reader.readAsText(file);
    }, function (e: FileError) {
        df.reject(e);
    });
    return df.promise;
}

function opendir(root: DirectoryEntry, path: string): Q.Promise<DirectoryEntry> {
    var df: Q.Deferred<DirectoryEntry> = q.defer<DirectoryEntry>();
    root.getDirectory(path, null, function (entry: DirectoryEntry) {
        df.resolve(entry);
    }, function (e: any) {
        df.reject(e);
    });
    return df.promise;
}

function openfile(root: DirectoryEntry, path: string): Q.Promise<FileEntry> {
    var df: Q.Deferred<FileEntry> = q.defer<FileEntry>();
    root.getFile(path, null, function (entry: FileEntry) {
        df.resolve(entry);
    }, function (e: any) {
        df.reject(e);
    });
    return df.promise;
}

function mvfile(root: DirectoryEntry, src: string, to: string, name?: string): Q.Promise<Entry> {
    var df: Q.Deferred<Entry> = q.defer<Entry>();
    //to should relative to root.
    return opendir(root, to)
    .then(function (dir: DirectoryEntry) {
        openfile(root, src)
        .then(function (file: FileEntry) {
            file.moveTo(dir, name, function (entry: Entry) {
                df.resolve(entry);
            }, function (e: any) {
                df.reject(e);
            })
        }, function (e: any) {
            df.reject(e);
        })
        return df.promise;
    });
}

function download(url: string, dest: string): Q.Promise<FileEntry> {
    var df: Q.Deferred<FileEntry> = q.defer<FileEntry>();
	var ft: FileTransfer = new FileTransfer();
    ft.download(encodeURI(url), dest, function(entry: FileEntry) {
        df.resolve(entry);
    }, function (e: FileTransferError) {
    console.log("dl6:" + JSON.stringify(e));
        df.reject(e);
    });
    return df.promise;
}

function loadjs(js: FileEntry, timeout: number): Q.Promise<FileEntry> {
    console.log("loadjs:" + js.toURL());
    var df: Q.Deferred<FileEntry> = q.defer<FileEntry>();
    var scriptTag = document.createElement('script');
    scriptTag.onload = function (event : any) {
        df.resolve(js);
    }
    scriptTag.type = "text/javascript";
    scriptTag.src = js.toURL();
    document.body.appendChild(scriptTag);
    return df.promise;
}

function loadScripts(vs: Versions, baseUrl: string, fsRoot: DirectoryEntry): Q.Promise<any> {
    //create assets directory if not exists
    var rootDir : string = fsRoot.toURL();
    var df: Q.Deferred<DirectoryEntry> = q.defer<DirectoryEntry>();
    //no rootDir needed. otherwise FileNotFound error raise
    fsRoot.getDirectory('assets', {create:true}, function (entry: DirectoryEntry) {
        df.resolve(entry);
    }, function (e: FileError) {
        df.reject(e);
    });
    return df.promise.then(function () {
        var loaders : Q.Promise<FileEntry>[] = [];
        for (var i in vs) {
            var ent = vs[i];
            var name: string = ent.name;
            var dest: string = 'assets/' + name + '.js';
            if (vs[i].updated) {
                var src: string = baseUrl + '/assets/' + name + "." + ent.hash + ".js";
                console.log("download:" + src + " => " + rootDir + dest);
                loaders.push(download(src, rootDir + dest));
            }
            else {
                console.log("load:" + dest);
                loaders.push(openfile(fsRoot, dest))
            }
        }
        return q.all(loaders)
        .then(function (entries : Array<FileEntry>) {
            if (entries.length > 0) {
                //setup sequencial js loader (because halfway loaded js may cause error)
                var promise : Q.Promise<any> = loadjs(entries[0], 3000);
                    console.log("create promise chain:" + 0 + "|" + entries[0].toURL());
                //for working with messy spec of javascript closure...
                function _loadnext(ent: FileEntry) {
                    return function (loadedjs: FileEntry) {
                        console.log("js loaded:" + loadedjs.toURL() + " next:" + ent.toURL());
                        return loadjs(ent, 3000);
                    }                   
                }
                for (var i = 1; i < entries.length; i++) {
                    var ent = entries[i];
                    var idx = i;
                    console.log("create promise chain:" + idx + "|" + ent.toURL());
                    promise = promise.then(_loadnext(ent));
                }
                return promise;
            }
            return true;
        });
    });
}

function applyPatch(baseUrl: string, fsRoot: DirectoryEntry) : Q.Promise<any> {
    var rootDir : string = fsRoot.toURL();
    var next : Config;
    var prev : Config;
    var apply : Versions = [];
    return download(baseUrl + '/assets/config.json', rootDir + 'config.json.next')
    .then(readfile)
    .then(function (nextData: string) {
        var df: Q.Deferred<FileEntry> = q.defer<FileEntry>();
        next = JSON.parse(nextData);
        //create if not exists current config.json.
        //no rootDir needed. otherwise FileNotFound error raise
        fsRoot.getFile('config.json', {create:true}, function (entry: FileEntry) {
            df.resolve(entry)
        }, function (e: FileError) {
            df.reject(e);
        });
        return df.promise;
    })
    .then(readfile)
    .then(function (prevData: string) {
        prev = JSON.parse(prevData.length > 0 ? prevData : "{}");
        //compare prev/next versions and if differ, marked as updated
        for (var k in next.versions) {
            var nv: Version = next.versions[k];
            if (prev.versions) {
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
        return loadScripts(next.versions, baseUrl, fsRoot);
    }, function (e: any) {
        console.log("error occurs:"+ e.stack);
        //all files are marked as updated
        for (var k in next.versions) {
            next.versions[k].updated = true;
        }
        return loadScripts(next.versions, baseUrl, fsRoot);
    })
    .then(function () {
        return mvfile(fsRoot, 'config.json.next', '/', 'config.json');
    })
    .then(function () {
        return next.appconfig;
    })
}

window.channer = window.channer || {}
window.channer.patch = function (loaderURL: string, onfinished: (config: any) => any): any {
    document.addEventListener("deviceready", function () {
        window.requestFileSystem(window.PERSISTENT, 0, function(fileSystem: FileSystem) {
            console.log("start patch " + loaderURL);
            window.channer.fs = fileSystem;
            applyPatch(loaderURL, fileSystem.root)
            .then(function (config: any) {
                console.log("end patch");
                onfinished(config);
            }, function (e: any) {
                console.log("error patch:" + e.stack);
            });
        }, function(e: any) {
            console.log("error patch:" + e.stack);
        });
    }, false);
}
