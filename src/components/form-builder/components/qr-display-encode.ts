/* QR code encoder (ISO/IEC 18004) for the QR code display component. No dependency, no network.

   - Byte mode only: the text is encoded as UTF-8 bytes (no ECI header; phone cameras, ZXing and
     iOS / macOS read UTF-8 byte mode as UTF-8).
   - Versions 1–40, error correction L / M / Q / H, Reed–Solomon over GF(256) (polynomial 0x11D),
     block interleaving, format and version information, all 8 masks scored with the standard
     penalty rules N1–N4. The smallest version that fits is used; the chosen ECC level is kept.
   - Output is a square matrix of modules (1 = dark) without the quiet zone; callers add 4 light
     modules on every side when drawing. Verified against macOS CoreImage (CIDetector). */

export type QrEcc = "L" | "M" | "Q" | "H"

export interface QrCode {
  /** 1–40. */
  version: number
  /** Modules per side (17 + 4 × version), quiet zone not included. */
  size: number
  ecc: QrEcc
  /** Mask pattern 0–7 that scored the lowest penalty (or the forced one). */
  mask: number
  /** Number of UTF-8 bytes encoded. */
  bytes: number
  /** size × size, row-major; 1 = dark. */
  modules: Uint8Array
}

export interface QrOptions {
  minVersion?: number
  maxVersion?: number
  /** Force a mask pattern (tests); default: lowest penalty. */
  mask?: number
}

/** Light modules around the symbol required by the standard. */
export const QUIET_ZONE = 4

/* ── tables (index 0 unused) ─────────────────────────────────────────────── */

const ECC_ORDER: Record<QrEcc, number> = { L: 0, M: 1, Q: 2, H: 3 }
/** Format-information bits of each level (L = 01, M = 00, Q = 11, H = 10). */
const ECC_FORMAT: Record<QrEcc, number> = { L: 1, M: 0, Q: 3, H: 2 }

/** Error-correction codewords per block, per level and version. */
const ECC_PER_BLOCK: number[][] = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
]

/** Number of error-correction blocks, per level and version. */
const BLOCKS: number[][] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
]

/** Modules left for data + ECC (incl. remainder bits) after the function patterns. */
function rawDataModules(ver: number): number {
  let n = (16 * ver + 128) * ver + 64
  if (ver >= 2) {
    const align = Math.floor(ver / 7) + 2
    n -= (25 * align - 10) * align - 55
    if (ver >= 7) n -= 36
  }
  return n
}

/** Data codewords (bytes) a version holds at a level. */
export function dataCodewords(ver: number, ecc: QrEcc): number {
  const e = ECC_ORDER[ecc]
  return Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[e][ver] * BLOCKS[e][ver]
}

/** Byte-mode character count indicator length. */
const countBits = (ver: number) => (ver <= 9 ? 8 : 16)

/** Most UTF-8 bytes that fit in byte mode at `ecc`, up to `version`. */
export function maxBytes(ecc: QrEcc, version = 40): number {
  return Math.floor((dataCodewords(version, ecc) * 8 - 4 - countBits(version)) / 8)
}

export const utf8 = (text: string) => new TextEncoder().encode(text)

/* ── GF(256) and Reed–Solomon ────────────────────────────────────────────── */

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
}

const gfMul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]])

/** Generator polynomial Π (x − αⁱ), i = 0…degree−1, highest power first (monic). */
const generators = new Map<number, number[]>()
function generator(degree: number): number[] {
  const hit = generators.get(degree)
  if (hit) return hit
  let g = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(g.length + 1).fill(0)
    for (let j = 0; j < g.length; j++) {
      next[j] ^= g[j]
      next[j + 1] ^= gfMul(g[j], EXP[i])
    }
    g = next
  }
  generators.set(degree, g)
  return g
}

/** ECC codewords: remainder of data(x) · x^n divided by the generator. */
function rsRemainder(data: number[], degree: number): number[] {
  const g = generator(degree)
  const r = new Array<number>(degree).fill(0)
  for (const b of data) {
    const f = b ^ (r.shift() ?? 0)
    r.push(0)
    if (f) for (let j = 0; j < degree; j++) r[j] ^= gfMul(g[j + 1], f)
  }
  return r
}

/* ── data codewords ──────────────────────────────────────────────────────── */

function dataBytes(bytes: Uint8Array, ver: number, ecc: QrEcc): number[] {
  const capacity = dataCodewords(ver, ecc) * 8
  const bits: number[] = []
  const put = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1)
  }
  put(0b0100, 4) // byte mode
  put(bytes.length, countBits(ver))
  for (const b of bytes) put(b, 8)
  put(0, Math.min(4, capacity - bits.length)) // terminator
  put(0, (8 - (bits.length % 8)) % 8)
  const out: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]
    out.push(b)
  }
  for (let pad = 0xec; out.length < capacity / 8; pad ^= 0xec ^ 0x11) out.push(pad)
  return out
}

/** Splits into blocks, adds ECC per block, interleaves data then ECC codewords. */
function interleave(data: number[], ver: number, ecc: QrEcc): number[] {
  const e = ECC_ORDER[ecc]
  const nBlocks = BLOCKS[e][ver]
  const eccLen = ECC_PER_BLOCK[e][ver]
  const total = Math.floor(rawDataModules(ver) / 8)
  const nShort = nBlocks - (total % nBlocks)
  const shortData = Math.floor(total / nBlocks) - eccLen
  const dataBlocks: number[][] = []
  const eccBlocks: number[][] = []
  for (let i = 0, k = 0; i < nBlocks; i++) {
    const len = shortData + (i < nShort ? 0 : 1)
    const block = data.slice(k, k + len)
    k += len
    dataBlocks.push(block)
    eccBlocks.push(rsRemainder(block, eccLen))
  }
  const out: number[] = []
  for (let i = 0; i <= shortData; i++) for (const b of dataBlocks) if (i < b.length) out.push(b[i])
  for (let i = 0; i < eccLen; i++) for (const b of eccBlocks) out.push(b[i])
  return out
}

/* ── BCH-coded format and version information ────────────────────────────── */

/** 15 format bits (level + mask, BCH(15,5), XOR 0x5412). Bit 14 is sent first. */
export function formatBits(ecc: QrEcc, mask: number): number {
  const data = (ECC_FORMAT[ecc] << 3) | mask
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  return ((data << 10) | rem) ^ 0x5412
}

/** 18 version bits (BCH(18,6)), versions 7–40. */
export function versionBits(ver: number): number {
  let rem = ver
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
  return (ver << 12) | rem
}

/* ── matrix ──────────────────────────────────────────────────────────────── */

export function alignmentPositions(ver: number): number[] {
  if (ver === 1) return []
  const size = ver * 4 + 17
  const n = Math.floor(ver / 7) + 2
  const step = Math.floor((ver * 8 + n * 3 + 5) / (n * 4 - 4)) * 2
  const out = [6]
  for (let pos = size - 7; out.length < n; pos -= step) out.splice(1, 0, pos)
  return out
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

class Matrix {
  readonly size: number
  readonly mod: Uint8Array
  /** 1 = function pattern (finder, timing, alignment, format, version): never masked. */
  readonly fn: Uint8Array

  constructor(size: number) {
    this.size = size
    this.mod = new Uint8Array(size * size)
    this.fn = new Uint8Array(size * size)
  }

  get(x: number, y: number) {
    return this.mod[y * this.size + x]
  }

  setFn(x: number, y: number, dark: boolean) {
    this.mod[y * this.size + x] = dark ? 1 : 0
    this.fn[y * this.size + x] = 1
  }
}

function drawFunctionPatterns(m: Matrix, ver: number) {
  const s = m.size
  for (let i = 0; i < s; i++) {
    m.setFn(6, i, i % 2 === 0)
    m.setFn(i, 6, i % 2 === 0)
  }
  /* Finders with their light separators (distance 4 ring). */
  for (const [cx, cy] of [
    [3, 3],
    [s - 4, 3],
    [3, s - 4],
  ]) {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx
        const y = cy + dy
        if (x < 0 || y < 0 || x >= s || y >= s) continue
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        m.setFn(x, y, d !== 2 && d !== 4)
      }
  }
  const pos = alignmentPositions(ver)
  const n = pos.length
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) m.setFn(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    }
  drawFormat(m, "M", 0) // reserves the area; redrawn with the real mask
  if (ver >= 7) {
    const bits = versionBits(ver)
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) === 1
      const a = s - 11 + (i % 3)
      const b = Math.floor(i / 3)
      m.setFn(a, b, dark)
      m.setFn(b, a, dark)
    }
  }
}

function drawFormat(m: Matrix, ecc: QrEcc, mask: number) {
  const s = m.size
  const bits = formatBits(ecc, mask)
  const bit = (i: number) => ((bits >>> i) & 1) === 1
  /* Around the top-left finder. */
  for (let i = 0; i <= 5; i++) m.setFn(8, i, bit(i))
  m.setFn(8, 7, bit(6))
  m.setFn(8, 8, bit(7))
  m.setFn(7, 8, bit(8))
  for (let i = 9; i < 15; i++) m.setFn(14 - i, 8, bit(i))
  /* Second copy, split between the top-right and bottom-left finders. */
  for (let i = 0; i < 8; i++) m.setFn(s - 1 - i, 8, bit(i))
  for (let i = 8; i < 15; i++) m.setFn(8, s - 15 + i, bit(i))
  m.setFn(8, s - 8, true) // the dark module
}

/** Places codeword bits in the two-column zigzag, from the bottom-right corner. */
function drawCodewords(m: Matrix, codewords: number[]) {
  const s = m.size
  const total = codewords.length * 8
  let i = 0
  for (let right = s - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5 // skip the vertical timing column
    const upward = ((right + 1) & 2) === 0
    for (let v = 0; v < s; v++) {
      const y = upward ? s - 1 - v : v
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const k = y * s + x
        if (m.fn[k]) continue
        /* Remainder bits after the last codeword stay light. */
        m.mod[k] = i < total ? (codewords[i >>> 3] >>> (7 - (i & 7))) & 1 : 0
        i++
      }
    }
  }
}

function applyMask(m: Matrix, mask: number) {
  const f = MASKS[mask]
  const s = m.size
  for (let y = 0; y < s; y++)
    for (let x = 0; x < s; x++) {
      const k = y * s + x
      if (!m.fn[k] && f(x, y)) m.mod[k] ^= 1
    }
}

/* ── penalty (ISO/IEC 18004 §7.8.3) ──────────────────────────────────────── */

function penalty(m: Matrix): number {
  const s = m.size
  const at = (x: number, y: number) => m.mod[y * s + x]
  let score = 0

  /* N1: 5+ same-colour modules in a row or column → 3 + (run − 5). */
  for (let pass = 0; pass < 2; pass++)
    for (let a = 0; a < s; a++) {
      let run = 1
      for (let b = 1; b <= s; b++) {
        const same = b < s && (pass === 0 ? at(b, a) === at(b - 1, a) : at(a, b) === at(a, b - 1))
        if (same) run++
        else {
          if (run >= 5) score += 3 + (run - 5)
          run = 1
        }
      }
    }

  /* N2: each 2 × 2 block of one colour → 3. */
  for (let y = 0; y < s - 1; y++)
    for (let x = 0; x < s - 1; x++) {
      const c = at(x, y)
      if (c === at(x + 1, y) && c === at(x, y + 1) && c === at(x + 1, y + 1)) score += 3
    }

  /* N3: finder-like 1:1:3:1:1 with 4 light modules before or after → 40 (outside counts as light). */
  const FINDER = [1, 0, 1, 1, 1, 0, 1]
  for (let pass = 0; pass < 2; pass++) {
    const cell = (a: number, b: number) => (pass === 0 ? at(b, a) : at(a, b))
    const light = (a: number, from: number, to: number) => {
      for (let b = Math.max(0, from); b < Math.min(s, to); b++) if (cell(a, b)) return false
      return true
    }
    for (let a = 0; a < s; a++)
      for (let b = 0; b + 7 <= s; b++) {
        let hit = true
        for (let k = 0; k < 7 && hit; k++) hit = cell(a, b + k) === FINDER[k]
        if (hit && (light(a, b - 4, b) || light(a, b + 7, b + 11))) score += 40
      }
  }

  /* N4: 10 per full 5 % step away from 50 % dark. */
  let dark = 0
  for (let k = 0; k < m.mod.length; k++) dark += m.mod[k]
  score += Math.floor(Math.abs((dark * 100) / m.mod.length - 50) / 5) * 10
  return score
}

/* ── public ──────────────────────────────────────────────────────────────── */

/** Smallest version holding `n` bytes at `ecc`, or null when even version 40 is too small. */
export function versionFor(n: number, ecc: QrEcc, min = 1, max = 40): number | null {
  for (let v = Math.max(1, min); v <= Math.min(40, max); v++) if (4 + countBits(v) + 8 * n <= dataCodewords(v, ecc) * 8) return v
  return null
}

/** Encodes `text` as UTF-8 in byte mode. Returns null when it doesn't fit in `maxVersion`. */
export function encodeQr(text: string, ecc: QrEcc, opts: QrOptions = {}): QrCode | null {
  const bytes = utf8(text)
  const ver = versionFor(bytes.length, ecc, opts.minVersion ?? 1, opts.maxVersion ?? 40)
  if (ver == null) return null
  const codewords = interleave(dataBytes(bytes, ver, ecc), ver, ecc)
  const m = new Matrix(ver * 4 + 17)
  drawFunctionPatterns(m, ver)
  drawCodewords(m, codewords)

  let mask = opts.mask ?? -1
  if (mask < 0 || mask > 7) {
    let best = Infinity
    for (let k = 0; k < 8; k++) {
      applyMask(m, k)
      drawFormat(m, ecc, k)
      const p = penalty(m)
      if (p < best) {
        best = p
        mask = k
      }
      applyMask(m, k) // XOR again = undo
    }
  }
  applyMask(m, mask)
  drawFormat(m, ecc, mask)
  return { version: ver, size: m.size, ecc, mask, bytes: bytes.length, modules: m.mod }
}

export const isDark = (qr: QrCode, x: number, y: number) => qr.modules[y * qr.size + x] === 1

/** SVG path of the dark modules (one rectangle per horizontal run), offset by the quiet zone. */
export function qrPath(qr: QrCode, quiet = QUIET_ZONE): string {
  const parts: string[] = []
  for (let y = 0; y < qr.size; y++) {
    let x = 0
    while (x < qr.size) {
      if (!isDark(qr, x, y)) {
        x++
        continue
      }
      const start = x
      while (x < qr.size && isDark(qr, x, y)) x++
      const len = x - start
      parts.push(`M${start + quiet} ${y + quiet}h${len}v1h-${len}z`)
    }
  }
  return parts.join("")
}
