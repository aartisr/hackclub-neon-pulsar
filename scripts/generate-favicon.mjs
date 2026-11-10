import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const size = 64;
const pixels = Buffer.alloc(size * (1 + size * 4));
const pulse = [[10, 32], [25, 32], [33, 19], [40, 45], [48, 32], [54, 32]];
const colors = { background: [7, 16, 30], cyan: [37, 217, 236], magenta: [235, 101, 237], white: [255, 255, 255] };

function segmentDistance(x, y, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const offset = y * (1 + size * 4) + 1 + x * 4;
    const radius = Math.hypot(x + 0.5 - 32, y + 0.5 - 32);
    const onPulse = pulse.slice(1).some((point, i) => segmentDistance(x + 0.5, y + 0.5, pulse[i], point) < 2.6);
    const color = radius < 3.5 ? colors.white : onPulse ? colors.magenta : Math.abs(radius - 22) < 3 ? colors.cyan : colors.background;
    pixels.set([...color, 255], offset);
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const content = Buffer.concat([name, data]);
  let crc = 0xffffffff;
  for (const byte of content) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, content, checksum]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(size, 0);
header.writeUInt32BE(size, 4);
header[8] = 8;
header[9] = 6;
writeFileSync(new URL('../public/favicon.png', import.meta.url), Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header),
  chunk('IDAT', deflateSync(pixels)),
  chunk('IEND', Buffer.alloc(0)),
]));
