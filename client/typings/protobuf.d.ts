declare class ByteBuffer {
	buffer: ArrayBuffer;
    view: Uint8Array;
    offset: number;
    markedOffset: number;
    limit: number;
    littleEndian: boolean;
    noAssert: boolean;

    static VERSION: string;
    static LITTLE_ENDIAN: boolean;
    static BIG_ENDIAN: boolean;
    static DEFAULT_CAPACITY: number;
    static DEFAULT_ENDIAN: boolean;
    static DEFAULT_NOASSERT: boolean;
    static Long: any;
    
    //project-defined 
    slice(offset?: number, limit?: number): Uint8Array;
}
