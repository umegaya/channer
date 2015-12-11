/// <reference path="../typings/q/Q.d.ts" />
import { StorageIO, Persistable } from "./storage";
export declare class Config {
    url: string;
    user_settings_path: string;
    response_timeout_ms: number;
    ping_interval_ms: number;
    deactivate_timeout_ms: number;
    timer_resolution_ms: number;
    push_settings: any;
    constructor(src: any);
}
export declare class UserSettings implements Persistable {
    io: StorageIO;
    device_id: string;
    constructor(io: StorageIO);
    save: () => Q.Promise<Persistable>;
    type: () => string;
    read: (blob: string) => void;
    write: () => string;
}
