export declare class ByteBuffer {
    private _data;
    private _index;
    length: number;
    constructor(data?: Uint8Array);
    toUint8Array(): Uint8Array;
    readByte(): number;
    readByteArray(): Uint8Array;
    readVarFloat(): number;
    readVarUint(): number;
    readVarInt(): number;
    readVarUint64(): bigint;
    readVarInt64(): bigint;
    readString(): string;
    private _growBy;
    writeByte(value: number): void;
    writeByteArray(value: Uint8Array): void;
    writeVarFloat(value: number): void;
    writeVarUint(value: number): void;
    writeVarInt(value: number): void;
    writeVarUint64(value: bigint | string): void;
    writeVarInt64(value: bigint | string): void;
    writeString(value: string): void;
}
