/// <reference path="../typings/extern.d.ts"/>
import Q = require('q');
import {Config} from "./config"
import {FS} from "./fs"

export interface Persistable {
	type(): string;
	read(blob: string|ArrayBuffer): any;
	write(): string|ArrayBuffer;
}

export class StorageIO {
	entry: FileEntry;
	fs: FS;
	constructor(entry: FileEntry, fs: FS) {
		this.entry = entry;
		this.fs = fs;
	}
    private writeblob = (blob: Blob, 
        onsuccess?: () => void, onerror?: (e: Error) => void) => {
		var df : Q.Deferred<Persistable> = Q.defer<Persistable>();
		this.fs.writefile(this.entry).then((w: FileWriter) => {
			try {
				w.onwriteend = function(e: ProgressEvent) {
					w.onwriteend = null;
					w.truncate(w.position);
					onsuccess && onsuccess();
				};
				w.write(blob);
			}
			catch (e) {
				onerror && onerror(e);
			}
		}, (e: Error) => {
			onerror && onerror(e);
		});
    }
	write = (f: Persistable): Q.Promise<Persistable> => {
		var df : Q.Deferred<Persistable> = Q.defer<Persistable>();
		var blob = new Blob([f.write()], {type:f.type()});
        this.writeblob(blob, () => { df.resolve(f); }, (e: Error) => { df.reject(e)});
		return df.promise;
	}
    truncate = () => {
        var blob = new Blob([], {type: "text/plain"});
        this.writeblob(blob);
    }
	read = (f: Persistable): Q.Promise<Persistable> => {
		var df : Q.Deferred<Persistable> = Q.defer<Persistable>();
		this.fs.readfile(this.entry).then((r: string) => {
			try {
				f.read(r);
				df.resolve(f);
			}
			catch (e) {
				df.reject(e);
			}
		}, (e: Error) => {
			df.reject(e);
		})
		return df.promise;
	}
	rm = (): Q.Promise<boolean> => {
		return this.fs.removefile(this.entry)
	}
}

export class Storage {
	fs: FS;
	constructor(config: Config, fs: FS) {
		this.fs = fs;
	}
	open = (path: string, options?: Flags): Q.Promise<StorageIO> => {
        var dirs: Array<string> = path.split("/");
        if (dirs.length > 1) {
            var dir = dirs[0];
            var p: Q.Promise<DirectoryEntry> = this.fs.opendir(dir, {create: true});
            for (var i = 1; i < (dirs.length - 1); i++) {
                p = p.then(() => {
                    dir = dir + "/" + dirs[i];
                    return this.fs.opendir(dir, {create: true});
                });
            }
            return p.then(() => {
                return this.openfile(path, options);
            });
        }
        return this.openfile(path, options);
    }
    openfile = (path: string, options?: Flags): Q.Promise<StorageIO> => {
		var df : Q.Deferred<StorageIO> = Q.defer<StorageIO>();
		this.fs.openfile(path, options).then((e: FileEntry) => {
			df.resolve(new StorageIO(e, this.fs));
		}, (e: Error) => {
			df.reject(e);
		});
		return df.promise;
	}
}
