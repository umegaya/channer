/// <reference path="../typings/phonegap.d.ts"/>
/// <reference path="../typings/q/Q.d.ts"/>

import q = require('q');
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
	write = (f: Persistable): Q.Promise<Persistable> => {
		var df : Q.Deferred<Persistable> = q.defer<Persistable>();
		this.fs.writefile(this.entry).then((w: FileWriter) => {
			try {
				var blob = new Blob([f.write()], {type:f.type()});
				w.onwriteend = function(e: ProgressEvent) {
					w.onwriteend = null;
					w.truncate(w.position);
					df.resolve(f);
				};
				w.write(blob);
			}
			catch (e) {
				df.reject(e);
			}
		}, (e: Error) => {
			df.reject(e);
		})
		return df.promise;
	}
	read = (f: Persistable): Q.Promise<Persistable> => {
		var df : Q.Deferred<Persistable> = q.defer<Persistable>();
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
		var df : Q.Deferred<StorageIO> = q.defer<StorageIO>();
		this.fs.openfile(path, options).then((e: FileEntry) => {
			df.resolve(new StorageIO(e, this.fs));
		}, (e: Error) => {
			df.reject(e);
		});
		return df.promise;
	}
}
