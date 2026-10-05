// Gera os fundos do StudyTrack com degradê vertical de vários tons.
//
// Uso:
//   node scripts/gen-backgrounds.mjs <arquivo> <largura> <altura> <topo> <meio> <base>
// Exemplo:
//   node scripts/gen-backgrounds.mjs assets/bg-app.png 1080 1920 4A1D7E 7E4FBA 2A0A47
//
// As cores sao medidas de assets/studytrack-gradient.png (commit 55d96c6),
// com o topo e a base escurecidos para o texto branco ficar legivel.
import zlib from 'node:zlib';
import fs from 'node:fs';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

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

// Interpola entre os tons definidos e devolve a cor na posicao t (0..1).
function corEm(stops, t) {
  const pos = t * (stops.length - 1);
  const i = Math.min(Math.floor(pos), stops.length - 2);
  const f = pos - i;
  const a = stops[i];
  const b = stops[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

function writePng(file, w, h, stops) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    raw[p++] = 0; // filtro None
    const c = corEm(stops, h === 1 ? 0 : y / (h - 1));
    for (let x = 0; x < w; x++) {
      raw[p++] = c[0];
      raw[p++] = c[1];
      raw[p++] = c[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
  console.log(`${file}  ${w}x${h}`);
}

const [out, w, h, topo, meio, base] = process.argv.slice(2);
writePng(out, Number(w), Number(h), [hexToRgb(topo), hexToRgb(meio), hexToRgb(base)]);
