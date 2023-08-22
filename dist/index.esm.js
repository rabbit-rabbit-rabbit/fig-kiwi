// fightml.ts
import { Buffer } from "buffer";
var metaStart = "<!--(figmeta)";
var metaEnd = "(/figmeta)-->";
var figmaStart = "<!--(figma)";
var figmaEnd = "(/figma)-->";
function base64_decode_string(s) {
  return Buffer.from(s, "base64").toString();
}
function base64_decode_data(s) {
  return Buffer.from(s, "base64");
}
function parseHTMLString(html) {
  const msi = html.indexOf(metaStart);
  const mei = html.indexOf(metaEnd);
  const fsi = html.indexOf(figmaStart);
  const fei = html.indexOf(figmaEnd);
  if (msi == -1) {
    throw new Error("Couldn't find start of figmeta");
  }
  const metaB64 = html.substring(msi + metaStart.length, mei);
  const figB64 = html.substring(fsi + figmaStart.length, fei);
  const metaStr = base64_decode_string(metaB64);
  return {
    meta: JSON.parse(metaStr),
    figma: base64_decode_data(figB64)
  };
}
function composeHTMLString(data) {
  const strValue = "";
  const metaStr = Buffer.from(JSON.stringify(data.meta)).toString("base64");
  const figStr = Buffer.from(data.figma).toString("base64");
  return `<meta charset="utf-8" /><meta charset="utf-8" /><span
  data-metadata="<!--(figmeta)${metaStr}(/figmeta)-->"
></span
><span
  data-buffer="<!--(figma)${figStr}(/figma)-->"
></span
><span style="white-space: pre-wrap">${strValue}</span>`;
}

// archive.ts
var FIG_KIWI_PRELUDE = "fig-kiwi";
var FIG_KIWI_VERSION = 15;
var FigmaArchiveParser = class {
  constructor(buffer) {
    this.offset = 0;
    this.buffer = buffer;
    this.data = new DataView(buffer.buffer);
  }
  readUint32() {
    const n = this.data.getUint32(this.offset, true);
    this.offset += 4;
    return n;
  }
  read(bytes) {
    if (this.offset + bytes <= this.buffer.length) {
      const d = this.buffer.slice(this.offset, this.offset + bytes);
      this.offset += bytes;
      return d;
    } else {
      throw new Error(`read(${bytes}) is past end of data`);
    }
  }
  readHeader() {
    const preludeData = this.read(FIG_KIWI_PRELUDE.length);
    const prelude = String.fromCharCode.apply(String, preludeData);
    if (prelude != FIG_KIWI_PRELUDE) {
      throw new Error(`Unexpected prelude: "${prelude}"`);
    }
    const version = this.readUint32();
    return { prelude, version };
  }
  readData(size) {
    return this.read(size);
  }
  readAll() {
    const header = this.readHeader();
    const files = [];
    while (this.offset + 4 < this.buffer.length) {
      const size = this.readUint32();
      const data = this.readData(size);
      files.push(data);
    }
    return { header, files };
  }
  static parseArchive(data) {
    const parser = new FigmaArchiveParser(data);
    return parser.readAll();
  }
};
var FigmaArchiveWriter = class {
  constructor() {
    this.files = [];
    this.header = { prelude: FIG_KIWI_PRELUDE, version: FIG_KIWI_VERSION };
  }
  write() {
    const headerSize = FIG_KIWI_PRELUDE.length + 4;
    const totalSize = this.files.reduce((sz, f) => sz + 4 + f.byteLength, headerSize);
    const buffer = new Uint8Array(totalSize);
    const view = new DataView(buffer.buffer);
    const enc = new TextEncoder();
    let offset = 0;
    offset = enc.encodeInto(FIG_KIWI_PRELUDE, buffer).written;
    view.setUint32(offset, this.header.version, true);
    offset += 4;
    for (let file of this.files) {
      view.setUint32(offset, file.byteLength, true);
      offset += 4;
      buffer.set(file, offset);
      offset += file.byteLength;
    }
    return buffer;
  }
};

// index.ts
import {
  compileSchema,
  decodeBinarySchema,
  encodeBinarySchema
} from "kiwi-schema";
import { deflateRaw, inflateRaw } from "pako";
function readHTMLMessage(html) {
  const { figma, meta } = parseHTMLString(html);
  const { header, files } = FigmaArchiveParser.parseArchive(figma);
  const [schemaCompressed, dataCompressed] = files;
  const schema = decodeBinarySchema(inflateRaw(schemaCompressed));
  const compiledSchema = compileSchema(schema);
  const message = compiledSchema.decodeMessage(inflateRaw(dataCompressed));
  return { header, meta, schema, message };
}
function writeHTMLMessage(m) {
  const { meta, schema, message } = m;
  const encoder = new FigmaArchiveWriter();
  const binSchema = encodeBinarySchema(schema);
  const compiledSchema = compileSchema(schema);
  encoder.files = [
    deflateRaw(binSchema),
    deflateRaw(compiledSchema.encodeMessage(m.message))
  ];
  const data = encoder.write();
  return composeHTMLString({ meta, figma: data });
}
export {
  FigmaArchiveParser,
  readHTMLMessage,
  writeHTMLMessage
};
