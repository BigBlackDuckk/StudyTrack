// Gera os fundos do StudyTrack: degradê violeta pastel -> violeta profundo.
// Cores medidas em assets/studytrack-gradient.png (commit 55d96c6).
import zlib from 'node:zlib';
import fs from 'node:fs';

const TOP = [0xe0, 0xc2, 0xf8];
const BOTTOM = [0x2f, 0x0a, 0x4f];

function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function writePng(file, w, h) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    raw[p++] = 0; // filtro None
    const t = h === 1 ? 0 : y / (h - 1);
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 3; c++) {
        raw[p++] = Math.round(TOP[c] + (BOTTOM[c] - TOP[c]) * t);
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type RGB
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
  console.log(file + '  ' + w + 'x' + h);
}

const [out, w, h] = process.argv.slice(2);
writePng(out, Number(w), Number(h));
