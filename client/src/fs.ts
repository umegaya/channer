/// <reference path="../typings/extern.d.ts"/>
import Q = require('q');

export class FS {
    fs: FileSystem;
    constructor(fs: FileSystem) {
        this.fs = fs;        
    }
    //path need to be relative. otherwise FileNotFound raises
    openfile = (path: string, options?: Flags): Q.Promise<FileEntry> => {
        var df: Q.Deferred<FileEntry> = Q.defer<FileEntry>();
        this.fs.root.getFile(path, options, function (entry: FileEntry) {
            df.resolve(entry);
        }, function (e: any) {
            df.reject(e);
        });
        return df.promise;
    }
    readfile = (entry: FileEntry) : Q.Promise<string> => {
        var df: Q.Deferred<string> = Q.defer<string>();
        entry.file(function (file: File) {    
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
    removefile = (entry: FileEntry) : Q.Promise<boolean> => {
        var df: Q.Deferred<boolean> = Q.defer<boolean>();
        entry.remove(function () {
            df.resolve(true);
        }, function (e: FileError) {
            df.reject(e);
        });
        return df.promise;        
    }
    writefile = (entry: FileEntry) : Q.Promise<FileWriter> => {
        var df: Q.Deferred<FileWriter> = Q.defer<FileWriter>();
        entry.createWriter(function (writer: FileWriter) {
            df.resolve(writer);
        }, function (e: FileError) {
            df.reject(e);
        });
        return df.promise;
    }
    rename = (src: string, to: string, name?: string): Q.Promise<Entry> => {
        var df: Q.Deferred<Entry> = Q.defer<Entry>();
        //to should relative to root.
        return this.opendir(to)
        .then((dir: DirectoryEntry) => {
            this.openfile(src)
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
    truncate = (entry: FileEntry): Q.Promise<Entry> => {
        var df: Q.Deferred<FileEntry> = Q.defer<FileEntry>();
        this.writefile(entry).then((w: FileWriter) => {
            try {
                w.onwriteend = function(e: ProgressEvent) {
                    df.resolve(entry);
                };
                w.truncate(0);
            }
            catch (e) {
                df.reject(e);
            }
        }, (e: any) => {
            console.log("fail to writer:" + e.message);
            df.reject(e);
        });
        return df.promise;
    }
    opendir = (path: string, options?: Flags): Q.Promise<DirectoryEntry> => {
        var df: Q.Deferred<DirectoryEntry> = Q.defer<DirectoryEntry>();
        this.fs.root.getDirectory(path, options, function (entry: DirectoryEntry) {
            df.resolve(entry);
        }, function (e: any) {
            df.reject(e);
        });
        return df.promise;
    }
    download = (url: string, dest: string): Q.Promise<FileEntry> => {
        var df: Q.Deferred<FileEntry> = Q.defer<FileEntry>();
        var ft: FileTransfer = new FileTransfer();
        var dldest = this.fs.root.toURL() + dest;
        var p = this.openfile(dest, {create: true}).then((entry: FileEntry) => {
            this.truncate(entry).then((entry: FileEntry) => {
                ft.download(encodeURI(url), dldest, (entry: FileEntry) => {
                    df.resolve(entry);
                }, (e: FileTransferError) => {
                    df.reject(e);
                });
            }, (e: any) => {
                df.reject(e);
            });
        }, (e: any) =>  {
            console.log("cannot open file:" + e.message);
            df.reject(e);
        });        
        return df.promise;
    }
    load = (file: FileEntry): Q.Promise<FileEntry> => {
        var ext = file.toURL().match(/\.([^\.]+$)/);
        if (!ext || !ext[1]) {
            console.log("invalid file name:" + file.toURL());
        }
        else if (ext[1] == "js") {
            return this.loadjs(file);
        }
        else if (ext[1] == "css") {
            return this.loadcss(file);
        }
        else {
            console.log("unsupported file type:" + file.toURL());
        }
    }
    loadjs = (js: FileEntry): Q.Promise<FileEntry> => {
        console.log("loadjs:" + js.toURL());
        var df: Q.Deferred<FileEntry> = Q.defer<FileEntry>();
        var scriptTag = document.createElement('script');
        scriptTag.onload = function (event : any) {
            df.resolve(js);
        }
        scriptTag.onerror = function (event: any) {
            df.reject(event);
        }
        scriptTag.type = "text/javascript";
        scriptTag.src = js.toURL();
        document.head.appendChild(scriptTag);
        return df.promise;
    }
    loadcss = (css: FileEntry): Q.Promise<FileEntry> => {
        console.log("loadcss:" + css.toURL());
        var df: Q.Deferred<FileEntry> = Q.defer<FileEntry>();
        var cssTag = document.createElement("link");
        cssTag.onload = function (event: any) {
            df.resolve(css);
        }
        cssTag.rel = "stylesheet";
        cssTag.type = "text/css";
        cssTag.href = css.toURL();
        var elements = document.head.getElementsByTagName("link");
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].href == css.toURL()) {
                document.head.replaceChild(cssTag, elements[i]);
                return df.promise;
            }
        }
        document.head.appendChild(cssTag);
        return df.promise;
    }
    applycss = (name: string, css: string): Q.Promise<boolean> => {
        var df: Q.Deferred<boolean> = Q.defer<boolean>();
        var cssTag = document.createElement("style");
        cssTag.onload = function (event: any) {
            df.resolve(true);
        }
        cssTag.type = "text/css";
        cssTag.innerHTML = css;
		cssTag.title = name;
        var elements = document.head.getElementsByTagName("style");
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].title == name) {
                document.head.replaceChild(cssTag, elements[i]);
                return df.promise;
            }
        }
        document.head.appendChild(cssTag);
        return df.promise;
	}
};
