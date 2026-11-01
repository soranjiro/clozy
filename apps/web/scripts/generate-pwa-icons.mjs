/**
 * Generate PWA raster icons from clozy-old's original 180x180 apple-icon.png.
 * Uses only Node built-ins, so CI and local builds render the same artwork.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, bytes) {
  const name = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);
  const check = Buffer.alloc(4);
  check.writeUInt32BE(crc32(Buffer.concat([name, bytes])));
  return Buffer.concat([length, name, bytes, check]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
  return da <= db && da <= dc ? a : db <= dc ? b : c;
}

function decodeRgbaPng(source) {
  if (!source.subarray(0, 8).equals(signature)) throw new Error('Input is not a PNG');
  let offset = 8, width, height, bitDepth, colorType, interlace;
  const idat = [];
  while (offset < source.length) {
    const len = source.readUInt32BE(offset);
    const type = source.toString('ascii', offset + 4, offset + 8);
    const data = source.subarray(offset + 8, offset + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    }
    if (type === 'IDAT') idat.push(data);
    offset += len + 12;
    if (type === 'IEND') break;
  }
  if (width !== 180 || height !== 180 || bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error('Expected original 180x180, 8-bit RGBA Clozy icon');
  }
  const scan = inflateSync(Buffer.concat(idat));
  const stride = width * 4, rgba = Buffer.alloc(stride * height);
  if (scan.length !== (stride + 1) * height) throw new Error('Invalid PNG row length');
  for (let y = 0; y < height; y++) {
    const filter = scan[y * (stride + 1)];
    if (filter > 4) throw new Error('Unsupported PNG filter');
    for (let x = 0; x < stride; x++) {
      const raw = scan[y * (stride + 1) + 1 + x];
      const left = x >= 4 ? rgba[y * stride + x - 4] : 0;
      const up = y > 0 ? rgba[(y - 1) * stride + x] : 0;
      const upperLeft = x >= 4 && y > 0 ? rgba[(y - 1) * stride + x - 4] : 0;
      const predictor = filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, upperLeft) : 0;
      rgba[y * stride + x] = (raw + predictor) & 255;
    }
  }
  return { width, height, rgba };
}

function resize({ width, height, rgba }, size) {
  const result = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const fy = Math.max(0, Math.min(height - 1, (y + .5) * height / size - .5));
    const y0 = Math.floor(fy), y1 = Math.min(height - 1, y0 + 1), wy = fy - y0;
    for (let x = 0; x < size; x++) {
      const fx = Math.max(0, Math.min(width - 1, (x + .5) * width / size - .5));
      const x0 = Math.floor(fx), x1 = Math.min(width - 1, x0 + 1), wx = fx - x0;
      for (let c = 0; c < 4; c++) {
        const a = rgba[(y0 * width + x0) * 4 + c];
        const b = rgba[(y0 * width + x1) * 4 + c];
        const d = rgba[(y1 * width + x0) * 4 + c];
        const e = rgba[(y1 * width + x1) * 4 + c];
        result[(y * size + x) * 4 + c] = Math.round(a * (1 - wx) * (1 - wy) + b * wx * (1 - wy) + d * (1 - wx) * wy + e * wx * wy);
      }
    }
  }
  return result;
}

function encodeRgbaPng(rgba, size) {
  const info = Buffer.alloc(13);
  info.writeUInt32BE(size, 0); info.writeUInt32BE(size, 4);
  info[8] = 8; info[9] = 6;
  const stride = size * 4, rows = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) rgba.copy(rows, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  return Buffer.concat([signature, chunk('IHDR', info), chunk('IDAT', deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const original = decodeRgbaPng(readFileSync(join(publicDir, 'apple-touch-icon.png')));
for (const size of [192, 512]) {
  const png = encodeRgbaPng(resize(original, size), size);
  writeFileSync(join(publicDir, 'icon-' + size + '.png'), png);
  console.log('Generated ' + size + 'x' + size + ' Clozy icon (' + png.length + ' bytes)');
}
