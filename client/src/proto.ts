namespace proto {
	export interface Model {
		toArrayBuffer(): ArrayBuffer;
		toBase64(): string;
		toString(): string;
	}
	export interface Builder {
		new() : any;
		decode(buffer: ArrayBuffer) : any;
		decode64(buffer: string) : any;
	}
}
