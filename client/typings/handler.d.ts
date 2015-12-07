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
    [x: string]: Model | number;
}
export declare class ProtoWatcher {
    private parser;
    private protomap;
    private subscribers;
    constructor(types: {
        [x: string]: number;
    }, parser: (data: any) => ProtoPayloadModel);
    subscribe: (type: number, callback: (m: Model) => any) => void;
    unsubscribe: (type: number, callback: (m: Model) => any) => void;
    watch: (event: any) => void;
}
