/// <reference path="../typings/phonegap.d.ts" />
/// <reference path="../typings/q/Q.d.ts" />
import q = require('q');
import { Config } from "./config";
import { FS } from "./fs";
export interface Persistable {
    type(): string;
    read(blob: string | ArrayBuffer): any;
    write(): string | ArrayBuffer;
}
export declare class StorageIO {
    entry: FileEntry;
    fs: FS;
    constructor(entry: FileEntry, fs: FS);
    write: (f: Persistable) => q.Promise<Persistable>;
    read: (f: Persistable) => q.Promise<Persistable>;
}
export declare class Storage {
    fs: FS;
    constructor(config: Config, fs: FS);
    open: (path: string, options?: Flags) => q.Promise<StorageIO>;
}
