/// <reference path="../typings/phonegap.d.ts" />
/// <reference path="../typings/q/Q.d.ts" />
import q = require('q');
export declare class FS {
    fs: FileSystem;
    constructor(fs: FileSystem);
    openfile: (path: string, options?: Flags) => q.Promise<FileEntry>;
    readfile: (entry: FileEntry) => q.Promise<string>;
    removefile: (entry: FileEntry) => q.Promise<boolean>;
    writefile: (entry: FileEntry) => q.Promise<FileWriter>;
    rename: (src: string, to: string, name?: string) => q.Promise<Entry>;
    opendir: (path: string, options?: Flags) => q.Promise<DirectoryEntry>;
    download: (url: string, dest: string) => q.Promise<FileEntry>;
    load: (file: FileEntry) => q.Promise<FileEntry>;
    loadjs: (js: FileEntry) => q.Promise<FileEntry>;
    loadcss: (css: FileEntry) => q.Promise<FileEntry>;
    applycss: (name: string, css: string) => q.Promise<boolean>;
}
