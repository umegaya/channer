/// <reference path="../typings/phonegap.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>
import q = require('q');

export class FS {
    fs: FileSystem;
    constructor(fs: FileSystem) {
        this.fs = fs;        
    }
    openfile = (path: string, options?: Flags): Q.Promise<FileEntry> => {
        var df: Q.Deferred<FileEntry> = q.defer<FileEntry>();
        this.fs.root.getFile(path, options, function (entry: FileEntry) {
            df.resolve(entry);
        }, function (e: any) {
            df.reject(e);
        });
        return df.promise;
    }
    readfile = (entry: FileEntry) : Q.Promise<string> => {
        var df: Q.Deferred<string> = q.defer<string>();
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
        var df: Q.Deferred<boolean> = q.defer<boolean>();
        entry.remove(function () {
            df.resolve(true);
        }, function (e: FileError) {
            df.reject(e);
        });
        return df.promise;        
    }
    writefile = (entry: FileEntry) : Q.Promise<FileWriter> => {
        var df: Q.Deferred<FileWriter> = q.defer<FileWriter>();
        entry.createWriter(function (writer: FileWriter) {
            df.resolve(writer);
        }, function (e: FileError) {
            df.reject(e);
        });
        return df.promise;   
    }
    rename = (src: string, to: string, name?: string): Q.Promise<Entry> => {
        var df: Q.Deferred<Entry> = q.defer<Entry>();
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
    opendir = (path: string, options?: Flags): Q.Promise<DirectoryEntry> => {
        var df: Q.Deferred<DirectoryEntry> = q.defer<DirectoryEntry>();
        this.fs.root.getDirectory(path, options, function (entry: DirectoryEntry) {
            df.resolve(entry);
        }, function (e: any) {
            df.reject(e);
        });
        return df.promise;
    }
    download = (url: string, dest: string): Q.Promise<FileEntry> => {
        var df: Q.Deferred<FileEntry> = q.defer<FileEntry>();
        var ft: FileTransfer = new FileTransfer();
        ft.download(encodeURI(url), this.fs.root.toURL() + dest, function(entry: FileEntry) {
            df.resolve(entry);
        }, function (e: FileTransferError) {
            df.reject(e);
        });
        return df.promise;
    }
    load = (js: FileEntry): Q.Promise<FileEntry> => {
        console.log("loadjs:" + js.toURL());
        var df: Q.Deferred<FileEntry> = q.defer<FileEntry>();
        var scriptTag = document.createElement('script');
        scriptTag.onload = function (event : any) {
            df.resolve(js);
        }
        scriptTag.type = "text/javascript";
        scriptTag.src = js.toURL();
        document.head.appendChild(scriptTag);
        return df.promise;
    }
};
