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
    [x: string]: any;
}
export declare class ProtoWatcher {
    private parser;
    private protomap;
    private callers;
    private subscribers;
    constructor(types: any, parser: (data: any) => ProtoPayloadModel);
    subscribe: (type: number, callback: (m: Model) => any) => void;
    unsubscribe: (type: number, callback: (m: Model) => any) => void;
    subscribe_response: (msgid: number, callback: (m: Model) => any) => void;
    ontimer: (now: number) => void;
    watch: (event: any) => void;
}
