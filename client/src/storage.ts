/// <reference path="../typings/extern.d.ts"/>
import {Config} from "./config"
import {FS} from "./fs"
import * as Promise from "bluebird"

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
	write = (f: Persistable): Promise<Persistable> => {
		return new Promise<Persistable>((resolve: () => void, reject: (ev: Error) => void) => {
			var blob = new Blob([f.write()], {type:f.type()});
			this.writeblob(blob, resolve, reject);
			return f;
		});
	}
    truncate = () => {
        var blob = new Blob([], {type: "text/plain"});
        this.writeblob(blob);
    }
	read = (f: Persistable): Promise<Persistable> => {
		return new Promise<Persistable>(
		(resolve: (ev: Persistable) => void, reject: (ev: Error) => void) => {
			this.fs.readfile(this.entry).then((r: string) => {
				try {
					f.read(r);
					resolve(f);
				}
				catch (e) {
					reject(e);
				}
			}, (e: Error) => {
				reject(e);
			})
		});
	}
	rm = (): Promise<boolean> => {
		return this.fs.removefile(this.entry)
	}
}

export class Storage {
	fs: FS;
	constructor(config: Config, fs: FS) {
		this.fs = fs;
	}
	open = (path: string, options?: Flags): Promise<StorageIO> => {
        var dirs: Array<string> = path.split("/");
        if (dirs.length > 1) {
            var dir = dirs[0];
            var p: Promise<DirectoryEntry> = this.fs.opendir(dir, {create: true});
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
    openfile = (path: string, options?: Flags): Promise<StorageIO> => {
		return this.fs.openfile(path, options).then((e: FileEntry) => {
			return new StorageIO(e, this.fs);
		});
	}
}

export interface Cursor extends IDBCursor {
	value: any;
}

export class Txn {
	db: IDBDatabase;
	txn: IDBTransaction;
	mode: string;
	tables: Table[];
	stmts: ((txn: Txn, val?: any)=>void)[];
	stmtidx: number;
	constructor(db: IDBDatabase, tables: Table[], mode?: string)  {
		this.db = db;
		this.tables = tables;
		this.mode = mode || "readwrite";
	}
	begin(oncomplete: () => void, onabort: () => void): Promise<Txn> {
		var names : Array<string> = [];
		for (var i = 0; i < this.tables.length; i++) {
			var t = this.tables[i];
			t.lock(this);
			names[i] = t.name;
		}
		return new Promise((resolve: (ev: any) => void, reject: (error: any) => void) => {
			try {
				this.txn = this.db.transaction(names, this.mode);
				this.txn.oncomplete = oncomplete;
				this.txn.onabort = onabort;
				resolve(this);
			} catch (e) {
				reject(e);
			}
		});
	}
	handle(name: string): IDBObjectStore {
		return this.txn.objectStore(name);
	}
	table(name: string): Table {
		for (var i = 0; i < this.tables.length; i++) {
			if (this.tables[i].name == name) {
				return this.tables[i];
			}
		}
		return null;
	}
	commit = () => {
		console.log("commit");
		this.txn = null;
	}
	abort = () => {
		console.log("abort");
		this.txn.abort();
		this.txn = null;
	}
}

export class Table {
	name: string;
	txn: Txn;
	constructor(name: string) {
		this.name = name;
	}
	lock(txn: Txn) {
		this.txn = txn;
	}
	call(method: string, ...args:any[]): Promise<Txn> {
		var p = Database.promised_ret_call<Txn>(this.txn, this.txn.handle(this.name), method, ...args);
		p.done(null, this.txn.abort);
		return p;
	}
	put(record: any): Promise<Txn> {
		return this.call("put", record);
	}
	insert(record: any): Promise<Txn> {
		return this.call("add", record);
	}
	delete(key?: any): Promise<Txn> {
		return key ? this.call("delete", key) : this.call("clear");
	}
	get(key: any): Promise<any> {
		return Database.promised_call(this.txn.handle(this.name), "get", key);
	}
	select(where?:(record:any)=>boolean, range?: IDBKeyRange, order?:string): Promise<any[]> {
		return Database.promised_cursor_call(where, this.txn.handle(this.name), "openCursor", range, order);
	}
}

export class Database {
	name: string;
	indexedDB: IDBFactory;
	db: IDBDatabase;
	constructor(name: string) {
		this.name = name;
		this.indexedDB = window.indexedDB;
	}
	static promisify<T>(req: IDBRequest): Promise<T> {
		return new Promise((resolve: (ev: any) => void, reject: (error: any) => void) => {
			req.onerror = reject;
			req.onsuccess = resolve;
		});
	}
	static promised_call<T>(
		obj: any, method: string, ...args: any[]
	): Promise<T> {
		return this.promisify<T>(obj[method].call(obj, ...args));
	}
	static promised_ret_call<T>(
		ret: T, obj: any, method: string, ...args: any[]
	): Promise<T> {
		return this.promisify<any>(obj[method].call(obj, ...args)).then(() => {
			return ret;
		});	
	}
	static promised_cursor_call(
		where: (record: any) => boolean, obj: any, method: string, ...args: any[]
	): Promise<any[]> {
		var results: any[] = [];
		return new Promise<any[]>((resolve: (list: any[]) => void, reject: (e: Event) => void) => {
			var req: IDBRequest = obj[method].call(obj, ...args);
			req.onsuccess = (event: Event) => {
				var cur: Cursor = <Cursor>(<IDBRequest>event.target).result;
				if (cur) {
					if (where) {
						var ret = where(cur.value);
						if (ret == false) {
							//if return false, abort iteration, by not calling continue()
							resolve(results);
							return;
						} else if (ret) {
							results.push(cur.value);
						} else {
							//filtered by where. get next element
						}
					} else {
						results.push(cur.value);
					}
					cur.continue();
				} else {
					resolve(results);
				}
			}
			req.onerror = reject;
		});
	}
	initialize = (cb: (db: Database, ov: number, nv: number) => void, clear?:boolean): Promise<Database> => {
		if (clear) {
			console.log("truncate database");
			return this.truncate().then((db: Database) => {
				return this.create(cb);
			})
		} else {
			return this.create(cb);
		}
	}
	create = (onupgrade: (db: Database, oldver: number, newver: number) => void): Promise<Database> => {
		var req = this.indexedDB.open(this.name, 1);
		var p = Database.promisify<Event>(req);
		req.onupgradeneeded = (ev: IDBVersionChangeEvent) => {
			this.db = (<IDBRequest>event.target).result;
			if (onupgrade) {
				onupgrade(this, ev.oldVersion, ev.newVersion);
			}
		}
		return p.then((ev: Event) => {
			this.db = (<IDBRequest>event.target).result;
			return this;
		})
	}
	truncate = (): Promise<Database> => {
		return Database.promised_ret_call<Database>(this, this.indexedDB, "deleteDatabase", this.name);
	}
	open = (table: string, options: IDBObjectStoreParameters, reinitialize?:boolean): boolean => {
		console.log("open " + table);
		if (!this.db.objectStoreNames.contains(table)) {
			this.db.createObjectStore(table, options);
		} else if (reinitialize) {
			this.db.deleteObjectStore(table);
			//TODO: version up
			this.db.createObjectStore(table, options);
		}
		return true;
	}
	tx = (tableNames: string|string[], mode?: string): Txn => {
		var names: string[];
		if (typeof(tableNames) == "string") {
			names = [<string>tableNames];
		} else {
			names = <string[]>tableNames;
		}
		var tables = names.map((name: string) => {
			return new Table(name);
		})
		return new Txn(this.db, tables, mode);
	}
}
