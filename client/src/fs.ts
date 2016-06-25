/// <reference path="../typings/extern.d.ts"/>
import * as Promise from "bluebird"


export class FS {
    fs: FileSystem;
    constructor(fs: FileSystem) {
        this.fs = fs;        
    }
    //path need to be relative. otherwise FileNotFound raises
    openfile = (path: string, options?: Flags): Promise<FileEntry> => {
        return new Promise<FileEntry>((resolve: (e: FileEntry) => void, reject: (err: any) => void) => {
            this.fs.root.getFile(path, options, resolve, reject);
        });
    }
    readfile = (entry: FileEntry) : Promise<string> => {
        return new Promise<string>((resolve: (e: string) => void, reject: (err: any) => void) => {
            entry.file(function (file: File) {    
                var reader : FileReader = new FileReader();
                reader.onloadend = function (event : ProgressEvent) {
                    resolve(reader.result);
                }
                reader.readAsText(file);
            }, function (e: FileError) {
                reject(e);
            });
        });
    }
    removefile = (entry: FileEntry) : Promise<boolean> => {
        return new Promise<boolean>((resolve: (e: boolean) => void, reject: (err: any) => void) => {
            entry.remove(function () {
                resolve(true);
            }, reject);
        });
    }
    writefile = (entry: FileEntry) : Promise<FileWriter> => {
        return new Promise<FileWriter>((resolve: (e: FileWriter) => void, reject: (err: any) => void) => {
            entry.createWriter(resolve, reject);
        });
    }
    rename = (src: string, to: string, name?: string): Promise<Entry> => {
        //to should relative to root.
        return new Promise<Entry>((resolve: (e: Entry) => void, reject: (err: any) => void) => {
            return this.opendir(to).then((dir: DirectoryEntry) => {
                this.openfile(src).then(function (file: FileEntry) {
                    file.moveTo(dir, name, resolve, reject);
                }, reject);
            });
        });
    }
    truncate = (entry: FileEntry): Promise<Entry> => {
        return new Promise<Entry>((resolve: (e: Entry) => void, reject: (err: any) => void) => {
            this.writefile(entry).then((w: FileWriter) => {
                try {
                    w.onwriteend = function(e: ProgressEvent) {
                        resolve(entry);
                    };
                    w.truncate(0);
                }
                catch (e) {
                    reject(e);
                }
            }, reject);
        });
    }
    opendir = (path: string, options?: Flags): Promise<DirectoryEntry> => {
        return new Promise<DirectoryEntry>(
        (resolve: (e: DirectoryEntry) => void, reject: (err: any) => void) => {
            this.fs.root.getDirectory(path, options, (e: DirectoryEntry) => {
                resolve(e);
            }, reject);
        });
    }
    download = (url: string, dest: string): Promise<FileEntry> => {
        return new Promise<FileEntry>((resolve: (e: FileEntry) => void, reject: (err: any) => void) => {
            var ft: FileTransfer = new FileTransfer();
            var dldest = this.fs.root.toURL() + dest;
            var p = this.openfile(dest, {create: true}).then((entry: FileEntry) => {
                this.truncate(entry).then((entry: FileEntry) => {
                    ft.download(encodeURI(url), dldest, (entry: FileEntry) => {
                        resolve(entry);
                    }, reject);
                }, reject);
            }, (e: any) =>  {
                console.log("cannot open file:" + e.message);
                reject(e);
            });
        });
    }
    load = (file: FileEntry): Promise<FileEntry> => {
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
    loadjs = (js: FileEntry): Promise<FileEntry> => {
        return new Promise<FileEntry>((resolve: (e: FileEntry) => void, reject: (err: any) => void) => {
            var scriptTag = document.createElement('script');
            scriptTag.onload = function (event : any) {
                console.log("JS loaded:" + js.toURL());
                if (window.channer.jsloader_promise) {
                    console.log("JS set promise. wait this promise finished");
                    window.channer.jsloader_promise.then((ret: any) => {
                        resolve(js);
                    }, reject);
                    window.channer.jsloader_promise = null;
                }
                else {
                    resolve(js);
                }
            }
            scriptTag.onerror = function (event: any) {
                console.log("err:" + js.toURL() + "|" + event.message);
                reject(event);
            }
            scriptTag.type = "text/javascript";
            scriptTag.src = js.toURL();
            document.head.appendChild(scriptTag);
        });
    }
    loadcss = (css: FileEntry): Promise<FileEntry> => {
        return new Promise<FileEntry>((resolve: (e: FileEntry) => void, reject: (err: any) => void) => {
            console.log("loadcss:" + css.toURL());
            var cssTag = document.createElement("link");
            cssTag.onload = function (event: any) {
                resolve(css);
            }
            cssTag.rel = "stylesheet";
            cssTag.type = "text/css";
            cssTag.href = css.toURL();
            var elements = document.head.getElementsByTagName("link");
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].href == css.toURL()) {
                    document.head.replaceChild(cssTag, elements[i]);
                    return;
                }
            }
            document.head.appendChild(cssTag);
        });
    }
    applycss = (name: string, css: string): Promise<boolean> => {
        return new Promise<boolean>((resolve: (e: boolean) => void, reject: (err: any) => void) => {
            var cssTag = document.createElement("style");
            cssTag.onload = function (event: any) {
                resolve(true);
            }
            cssTag.type = "text/css";
            cssTag.innerHTML = css;
            cssTag.title = name;
            var elements = document.head.getElementsByTagName("style");
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].title == name) {
                    document.head.replaceChild(cssTag, elements[i]);
                    return;
                }
            }
            document.head.appendChild(cssTag);
        });
	}
};
