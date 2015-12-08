export interface Model {
    toArrayBuffer(): ArrayBuffer;
    toBase64(): string;
    toString(): string;
}
export interface Builder {
    new (): any;
    decode(buffer: ArrayBuffer): any;
    decode64(buffer: string): any;
}
export interface ProtoPayloadModel {
    type: number;
    msgid?: number;
    error?: any;
    [x: string]: any;
}
export declare class ProtoWatcher {
    private parser;
    private protomap;
    private callers;
    private subscribers;
    private response_timeout;
    constructor(types: any, parser: (data: any) => ProtoPayloadModel, response_timeout?: number);
    subscribe: (type: number, callback: (m: Model) => any) => void;
    unsubscribe: (type: number, callback: (m: Model) => any) => void;
    subscribe_response: (msgid: number, callback: (m: Model) => any, error: (e: Error) => any) => void;
    ontimer: (now: number) => void;
    watch: (event: any) => void;
}
