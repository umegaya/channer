declare namespace proto {
    interface Model {
        toArrayBuffer(): ArrayBuffer;
        toBase64(): string;
        toString(): string;
    }
    interface Builder {
        new (): any;
        decode(buffer: ArrayBuffer): any;
        decode64(buffer: string): any;
    }
}
