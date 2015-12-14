/// <reference path="../typings/q/Q.d.ts" />
import { StorageIO, Persistable } from "./storage";
export declare class Config {
    url: string;
    client_version: string;
    user_settings_path: string;
    response_timeout_ms: number;
    ping_interval_ms: number;
    auth_interval_ms: number;
    deactivate_timeout_ms: number;
    timer_resolution_ms: number;
    push_settings: any;
    constructor(src: any);
}
export declare class UserSettingsValues {
    user: string;
    pass: string;
    device_id: string;
    secret: string;
    last_url: string;
}
export declare class UserSettings implements Persistable {
    io: StorageIO;
    values: UserSettingsValues;
    constructor(io: StorageIO);
    save: () => Q.Promise<Persistable>;
    type: () => string;
    read: (blob: string) => void;
    write: () => string;
}
