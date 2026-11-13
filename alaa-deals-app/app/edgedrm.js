// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// 🔐 توكن الاتصال بسيرفر الصوت (Sec-MS-GEC) — النسخة 2
// مايكروسوفت بطّلت تقبل التوكن القديم (SHA-256 العادي) من 13 أكتوبر 2026 ورجّعت 403 لكل اتصال.
// ده تنفيذ للنسخة الجديدة بنفس خوارزمية مكتبة edge-tts 7.3.1 (drm.py): كل العمليات على أرقام 32 بت.
"use strict";
const U = (x) => x >>> 0, M = Math.imul, WIN_EPOCH = 11644473600;
const rol16 = (v) => U((v << 16) | (v >>> 16));

const SHA_INIT = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
const SHA_STATE = [0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A, 0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2];
const SHA_SCHED = [0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA, 0xA622EE8C, 0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6, 0xF0C31573, 0x7058CE4E, 0x7188E606, 0x00E5AB33, 0xD258B060, 0x72766564];
const RC = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
];
const SHA_ADJ = 0xC9DC06A7, SIG0_ADJ = 0x059C0B80, SIG1_ADJ = 0x000B92C0;
const RC_BLOCK = RC.slice(); RC_BLOCK[14] = SHA_ADJ;
const ror = (x, n) => U((x >>> n) | (x << (32 - n)));

const sigma0 = (v) => U(ror(v, 7) ^ ror(v, 18) ^ (v >>> 3));
const sigma1 = (v) => U(ror(v, 17) ^ ror(v, 19) ^ (v >>> 10));

function rounds(state, words, first) {
  let [a, b, c, d, e, f, g, h] = state; const K = first === 14 ? RC_BLOCK : RC;
  for (let i = first; i < 64; i++) {
    const t1 = U(h + U(ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + U(g ^ (e & (f ^ g))) + K[i] + words[i]);
    const t2 = U(U(ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + U((a & b) | (c & (a | b))));
    h = g; g = f; f = e; e = U(d + t1); d = c; c = b; b = a; a = U(t1 + t2);
  }
  return [a, b, c, d, e, f, g, h];
}
function expand(words, from) { for (let i = from; i < 64; i++) words[i] = U(sigma1(words[i - 2]) + words[i - 7] + sigma0(words[i - 15]) + words[i - 16]); }

function shaInit(d7) { // d7: أول 7 بايت
  const w = new Array(14).fill(0); w.push(U((d7[0] << 16) | (d7[1] << 8) | d7[2])); w.push(U(((d7[3] << 24) | (d7[4] << 16) | (d7[5] << 8) | d7[6])));
  for (let i = 16; i < 30; i++) {
    let v = SHA_SCHED[i - 16];
    if (i - 2 >= 14) v += i === 16 ? U(sigma1(w[i - 2]) ^ SIG1_ADJ) : sigma1(w[i - 2]);
    if (i - 7 >= 14) v += w[i - 7];
    if (i - 15 >= 14) v += i === 29 ? U(sigma0(w[i - 15]) ^ SIG0_ADJ) : sigma0(w[i - 15]);
    w.push(U(v));
  }
  w.push(U(sigma1(w[28]) + w[23] + sigma0(w[15]) + w[14] + SHA_ADJ - RC[14]));
  expand(w, 31);
  const work = rounds(SHA_STATE, w, 14); return SHA_INIT.map((x, i) => U(x + work[i]));
}
function shaDigest(data) { // data: Buffer
  if (data.length < 7) throw new Error("salt");
  const length = 57 + data.length, rest = data.subarray(7), padN = (((55 - length) % 64) + 64) % 64;
  const padded = Buffer.alloc(rest.length + 1 + padN + 8); rest.copy(padded, 0); padded[rest.length] = 0x80;
  padded.writeUInt32BE(Math.floor((length * 8) / 4294967296), padded.length - 8); padded.writeUInt32BE(U(length * 8), padded.length - 4);
  let st = shaInit(data.subarray(0, 7));
  for (let o = 0; o < padded.length; o += 64) {
    const w = []; for (let i = 0; i < 16; i++) w.push(padded.readUInt32BE(o + i * 4)); expand(w, 16);
    const work = rounds(st, w, 0); st = st.map((x, i) => U(x + work[i]));
  }
  const out = Buffer.alloc(32); st.forEach((x, i) => out.writeUInt32BE(x, i * 4)); return out;
}

const CS = [[0xE82E91B1, 0xB32700D0], [0x44DE24C6, 0x88DFF51D], [0x3BEB65BC, 0x29514038], [0xC89C5933, 0xB328CBDF], [0x8D1EC211, 0xD405B4D5], [0x314EF5D5, 0x26E55F3C], [0xE92491B1, 0x607801C6],
  [0xF0A5B9D5, 0x82B2C1FB], [0x06064CF3, 0xFA51A3DA], [0xDA79FA60, 0x207CC464], [0xBED20560, 0x3C3C74F3], [0x89F9C9F8, 0xD2D14B61], [0x35FA38C6, 0xBB04A2C1], [0xCB49E3C6, 0xC5626167]];
const CS_FACTOR = 0x82893933, CS_ADJ0 = 0xF2F90B1A, CS_ADJ1 = 0x0B1A0000;
const mul = (a, b) => U(M(a, b));

function cs64(data, digest) {
  let keyA = U(digest.readUInt32LE(0) | 1), keyB = U(digest.readUInt32LE(4) | 1);
  const fac = [mul(keyA, CS_FACTOR), mul(keyB, CS_FACTOR)], terms = CS.map((c, i) => mul(c[0], fac[i % 2])), offs = CS.map((c) => c[1]);
  const raw = Buffer.concat([Buffer.from([0]), data]), n4 = Math.ceil(raw.length / 4), nw = n4 + (n4 % 2), pad = Buffer.alloc(nw * 4); raw.copy(pad);
  for (let i = 0; i < nw; i++) {
    const w = pad.readUInt32LE(i * 4); let term = mul(w, i % 2 === 0 ? keyA : keyB), off = mul(rol16(w), i % 2 === 0 ? 0xEF0569FB : 0xC31713DB);
    if (i === 0) { term = U(term + mul(CS_ADJ0, fac[0])); off = U(off + CS_ADJ1); }
    terms.push(term); offs.push(off);
  }
  let swapAcc = 0, swapLast = 0, state = 0, acc = 0;
  for (let i = 0; i < terms.length; i += 2) {
    const x = terms[i], y = terms[i + 1];
    let t = rol16(U(offs[i] + x)), q = mul(t, 0x76F50F34); swapAcc = U(swapAcc + U(mul(rol16(q), 0xC3EFEA97) + q));
    t = rol16(U(offs[i + 1] + y)); q = mul(t, 0x1881CE3C); swapLast = U(mul(rol16(q), 0x35BD1EC9) + q); swapAcc = U(swapAcc + swapLast);
    state = U(mul(state, keyA) + x); state = mul(rol16(state), 0xCF98B111); state = mul(rol16(state), 0x87085B9F); state = mul(rol16(state), 0x12CEB96D); state = mul(rol16(state), 0x257E1D83);
    acc = U(acc + state);
    t = U(mul(state, keyB) + y); t = mul(rol16(t), 0xA27416F5); t = mul(rol16(t), 0xD38396FF); state = mul(rol16(mul(rol16(t), 0x7C932B89)), 0xBFA49F69); acc = U(acc + state);
  }
  return [U(swapLast ^ state), U(swapAcc ^ acc)];
}

// unixSec: الوقت بالثواني (متضبوط على ساعة السيرفر) — بيرجّع "<16 hex>-<64 hex>"
function gecV2(unixSec, token) {
  let sec = Math.floor(unixSec) + WIN_EPOCH; sec -= sec % 300;
  const ticks = BigInt(sec) * 10000000n, data = Buffer.from(String(ticks) + token, "ascii"), dg = shaDigest(data), c = cs64(data, dg), cb = Buffer.alloc(8);
  cb.writeUInt32LE(c[0], 0); cb.writeUInt32LE(c[1], 4); return cb.toString("hex").toUpperCase() + "-" + dg.toString("hex").toUpperCase();
}
module.exports = { gecV2 };
