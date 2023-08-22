import { ByteBuffer } from "./bb";
import { Schema } from "./schema";
export declare function decodeBinarySchema(buffer: Uint8Array | ByteBuffer): Schema;
export declare function encodeBinarySchema(schema: Schema): Uint8Array;
