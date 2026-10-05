import { L, type L10n } from "../i18n"

/* Background art for the Drawing component: the built-in car outline and two sample
   pictures that stand in for an uploaded image. Each picture is a list of SVG path /
   text items, so the same data draws inline SVG on screen and, synchronously, the
   merged PNG on a canvas (Path2D) — no image loading, no network. Colours here are
   picture content (paper and ink), not theme chrome. */

export type ArtItem =
  | { k: "path"; d: string; fill?: string; stroke?: string; sw?: number; dash?: number[] }
  | { k: "text"; x: number; y: number; text: string; size: number; fill: string; weight?: number; anchor?: "start" | "middle" | "end" }

export interface Art {
  /** viewBox size; the drawing sheet keeps this aspect ratio. */
  w: number
  h: number
  items: ArtItem[]
}

export const FONT = "Inter, 'Segoe UI', Arial, sans-serif"

const path = (d: string, fill?: string, stroke?: string, sw = 2, dash?: number[]): ArtItem => ({ k: "path", d, fill, stroke, sw, dash })
const text = (x: number, y: number, s: string, size: number, fill: string, weight = 700, anchor: "start" | "middle" | "end" = "start"): ArtItem => ({
  k: "text",
  x,
  y,
  text: s,
  size,
  fill,
  weight,
  anchor,
})
const rect = (x: number, y: number, w: number, h: number, r = 0) =>
  r
    ? `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`
    : `M${x} ${y} H${x + w} V${y + h} H${x} Z`
const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`

const LINE = "#475569"
const SOFT = "#94a3b8"
const LABEL = "#64748b"
const GLASS = "#dbeafe"
const BODY = "#f8fafc"
const TYRE = "#334155"

/* ── built-in: car seen from above, front to the right ─────────────────── */

export const CAR_TOP: Art = {
  w: 600,
  h: 360,
  items: [
    /* tyres first: the body covers their inner half */
    ...[100, 410].flatMap((x) => [path(rect(x, 66, 72, 24, 7), TYRE), path(rect(x, 270, 72, 24, 7), TYRE)]),
    /* mirrors */
    path("M368 84 L360 64 Q376 57 392 64 L386 84 Z", "#e2e8f0", LINE, 2),
    path("M368 276 L360 296 Q376 303 392 296 L386 276 Z", "#e2e8f0", LINE, 2),
    /* body */
    path("M92 82 L452 82 C512 82 552 98 560 140 L560 220 C552 262 512 278 452 278 L92 278 C58 278 40 262 40 228 L40 132 C40 98 58 82 92 82 Z", BODY, LINE, 3),
    /* lights */
    path("M540 100 C552 108 558 120 560 134 L548 130 C546 117 542 109 535 103 Z", "#fde68a", LINE, 1.5),
    path("M540 260 C552 252 558 240 560 226 L548 230 C546 243 542 251 535 257 Z", "#fde68a", LINE, 1.5),
    path("M43 122 C45 105 54 94 66 88 L70 97 C60 103 54 111 52 124 Z", "#fca5a5", LINE, 1.5),
    path("M43 238 C45 255 54 266 66 272 L70 263 C60 257 54 249 52 236 Z", "#fca5a5", LINE, 1.5),
    /* hood creases and boot lid */
    path("M420 112 C480 110 528 120 548 142", undefined, SOFT, 1.5),
    path("M420 248 C480 250 528 240 548 218", undefined, SOFT, 1.5),
    path("M122 100 C113 150 113 210 122 260", undefined, SOFT, 1.5),
    /* glass and roof */
    path("M352 104 C376 100 396 102 405 108 C415 150 415 210 405 252 C396 258 376 260 352 256 C360 210 360 150 352 104 Z", GLASS, LINE, 2),
    path("M196 108 C180 108 166 110 158 114 C152 150 152 210 158 246 C166 250 180 252 196 252 C190 210 190 150 196 108 Z", GLASS, LINE, 2),
    path("M200 104 L348 104 C356 150 356 210 348 256 L200 256 C194 210 194 150 200 104 Z", "#e2e8f0", LINE, 2),
    /* door seams and handles */
    path("M290 82 V104 M290 256 V278 M196 84 V106 M196 254 V276", undefined, SOFT, 1.5),
    path(rect(246, 87, 18, 5, 2) + rect(330, 87, 18, 5, 2) + rect(246, 268, 18, 5, 2) + rect(330, 268, 18, 5, 2), SOFT),
    /* where is where */
    text(300, 40, "KIRI · LEFT", 13, LABEL, 700, "middle"),
    text(300, 334, "KANAN · RIGHT", 13, LABEL, 700, "middle"),
    text(24, 334, "← BELAKANG · REAR", 12, LABEL, 600),
    text(576, 334, "DEPAN · FRONT →", 12, LABEL, 600, "end"),
  ],
}

/* ── sample upload 1: warehouse floor plan ─────────────────────────────── */

const WALL = "#334155"
const INK = "#0f172a"

const FLOOR_PLAN: Art = {
  w: 640,
  h: 400,
  items: [
    path(rect(20, 20, 600, 360), "#ffffff", WALL, 5),
    /* office, toilet, electrical panel */
    path(rect(20, 20, 190, 130), "#e0f2fe", WALL, 3),
    text(36, 50, "KANTOR", 15, INK),
    text(36, 68, "Admin gudang", 11, LABEL, 500),
    path(rect(20, 150, 95, 80), "#f1f5f9", WALL, 3),
    text(36, 180, "WC", 14, INK),
    path(rect(115, 150, 95, 80), "#fef3c7", WALL, 3),
    text(128, 180, "PANEL", 14, INK),
    text(128, 197, "listrik", 11, LABEL, 500),
    /* doors into the hall */
    path("M210 92 V124 M50 230 H80 M150 230 H182", undefined, "#ffffff", 6),
    path("M210 92 A32 32 0 0 1 242 124", undefined, SOFT, 1.5),
    /* racks */
    ...["A", "B", "C", "D"].flatMap((r, i) => [
      path(rect(262, 48 + i * 50, 330, 24, 4), "#cbd5e1", LINE, 1.5),
      text(250, 66 + i * 50, r, 13, INK, 700, "end"),
      path(
        Array.from({ length: 10 }, (_, j) => `M${295 + j * 30} ${48 + i * 50} V${72 + i * 50}`).join(" "),
        undefined,
        SOFT,
        1,
      ),
    ]),
    text(592, 40, "RAK PALET", 11, LABEL, 600, "end"),
    /* staging and dock */
    path(rect(262, 258, 330, 78, 6), "#f8fafc", SOFT, 2, [8, 6]),
    text(427, 302, "AREA STAGING", 13, LABEL, 700, "middle"),
    ...[290, 390, 490].map((x) => path(rect(x, 370, 70, 20, 3), "#94a3b8", WALL, 2)),
    text(427, 362, "LOADING DOCK", 11, LABEL, 700, "middle"),
    /* forklift charging, entrance */
    path(rect(32, 292, 120, 70, 6), "#dcfce7", "#16a34a", 2),
    text(92, 324, "CHARGER", 12, "#166534", 700, "middle"),
    text(92, 340, "forklift", 11, "#166534", 500, "middle"),
    path("M20 252 V284", undefined, "#ffffff", 7),
    text(30, 274, "MASUK →", 11, LABEL, 700),
  ],
}

/* ── sample upload 2: MPV, right side (front to the right) ──────────────── */

const CAR_SIDE: Art = {
  w: 640,
  h: 300,
  items: [
    path(
      "M40 200 L40 172 C40 152 52 142 72 138 L156 128 L212 80 C220 72 232 68 250 68 L432 68 C452 68 468 74 480 86 L528 128 L582 140 C600 145 606 160 606 176 L606 200 C606 214 598 222 584 222 L56 222 C46 222 40 214 40 200 Z",
      BODY,
      LINE,
      3,
    ),
    /* wheel arches cut the body, then the wheels */
    ...[150, 500].flatMap((cx) => [path(circle(cx, 222, 42), "#ffffff"), path(circle(cx, 222, 34), TYRE), path(circle(cx, 222, 15), "#cbd5e1", LINE, 2)]),
    path("M108 214 A42 42 0 0 1 192 214 M458 214 A42 42 0 0 1 542 214", undefined, LINE, 2),
    /* windows */
    path("M178 124 L216 88 C222 82 228 80 236 80 L268 80 L268 124 Z", GLASS, LINE, 2),
    path(rect(276, 80, 96, 44), GLASS, LINE, 2),
    path("M380 80 L432 80 C448 80 458 86 468 96 L494 124 L380 124 Z", GLASS, LINE, 2),
    /* doors, handles, mirror, lights, bumper line */
    path("M272 76 V214 M376 76 V214 M500 130 V172", undefined, SOFT, 1.5),
    path(rect(328, 140, 24, 6, 3) + rect(432, 140, 24, 6, 3), SOFT),
    path("M496 112 L516 106 L522 122 L502 125 Z", "#e2e8f0", LINE, 2),
    path("M584 146 L602 156 L603 168 L580 161 Z", "#fde68a", LINE, 1.5),
    path("M42 150 L58 146 L58 172 L42 174 Z", "#fca5a5", LINE, 1.5),
    path("M40 196 H108 M192 196 H458 M542 196 H606", undefined, SOFT, 1.5),
    text(320, 282, "SISI KANAN · RIGHT SIDE", 13, LABEL, 700, "middle"),
    text(616, 40, "DEPAN · FRONT →", 12, LABEL, 600, "end"),
  ],
}

/* ── sample pictures the builder can "upload" ───────────────────────────── */

export type SampleId = "floor" | "side"

export interface SamplePicture {
  file_id: string
  file_name: string
  mime: string
  width: number
  height: number
  size: number
  title: L10n
  art: Art
}

export const PICTURES: Record<SampleId, SamplePicture> = {
  floor: {
    file_id: "f_5d81a0c3",
    file_name: "denah-gudang-cikarang.png",
    mime: "image/png",
    width: 1280,
    height: 800,
    size: 148_220,
    title: L("Warehouse floor plan", "Denah gudang"),
    art: FLOOR_PLAN,
  },
  side: {
    file_id: "f_9b27e6f1",
    file_name: "mobil-sisi-kanan.png",
    mime: "image/png",
    width: 1280,
    height: 600,
    size: 96_480,
    title: L("Car, right side", "Mobil, sisi kanan"),
    art: CAR_SIDE,
  },
}
export const PICTURE_IDS = Object.keys(PICTURES) as SampleId[]
export const isSampleId = (s: string): s is SampleId => s in PICTURES

/* ── sample marks (Read-only / Disabled and the builder preview) ────────── */

/** x, y as 0–1 of the drawing sheet. */
export type Point = [number, number]

/** A hand-drawn loop: a little uneven and overshooting where it closes. */
export function loop(cx: number, cy: number, rx: number, ry: number, n = 36): Point[] {
  return Array.from({ length: n + 4 }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - 0.5
    const wob = 1 + 0.035 * Math.sin(i * 0.8)
    return [cx + rx * wob * Math.cos(a), cy + ry * wob * Math.sin(a)] as Point
  })
}

/** Straight segment as a few points (so it smooths like a real stroke). */
export function line(a: Point, b: Point, n = 8): Point[] {
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n] as Point)
}

export function zigzag(pts: Point[]): Point[] {
  return pts.flatMap((p, i) => (i ? line(pts[i - 1], p, 3).slice(1) : [p]))
}

/** Shaft plus the two halves of the head, as three strokes. */
export function arrow(a: Point, b: Point, aspect: number): Point[][] {
  const ang = Math.atan2((b[1] - a[1]) / aspect, b[0] - a[0])
  const head = (da: number): Point => [b[0] - 0.04 * Math.cos(ang + da), b[1] - 0.04 * aspect * Math.sin(ang + da)]
  return [line(a, b, 10), line(b, head(0.5), 3), line(b, head(-0.5), 3)]
}

/* ── painting on a canvas (the merged PNG) ──────────────────────────────── */

/** Draws `art` into the box x, y, w, h (the box already has the art's aspect ratio). */
export function paintArt(c: CanvasRenderingContext2D, art: Art, x: number, y: number, w: number, h: number) {
  c.save()
  c.translate(x, y)
  c.scale(w / art.w, h / art.h)
  c.lineCap = "round"
  c.lineJoin = "round"
  for (const it of art.items) {
    if (it.k === "path") {
      const p = new Path2D(it.d)
      if (it.fill) {
        c.fillStyle = it.fill
        c.fill(p)
      }
      if (it.stroke) {
        c.strokeStyle = it.stroke
        c.lineWidth = it.sw ?? 2
        c.setLineDash(it.dash ?? [])
        c.stroke(p)
        c.setLineDash([])
      }
    } else {
      c.fillStyle = it.fill
      c.font = `${it.weight ?? 700} ${it.size}px ${FONT}`
      c.textAlign = it.anchor === "middle" ? "center" : it.anchor === "end" ? "right" : "left"
      c.textBaseline = "alphabetic"
      c.fillText(it.text, it.x, it.y)
    }
  }
  c.restore()
}

/** Square grid every 24 px, a stronger line every 5 cells (same lines as the SVG pattern on screen). */
export const GRID_CELL = 24
export const GRID_LINE = "#e2e8f0"
export const GRID_MAJOR = "#cbd5e1"

export function paintGrid(c: CanvasRenderingContext2D, w: number, h: number) {
  c.save()
  c.lineWidth = 1
  for (let i = 1; i * GRID_CELL < Math.max(w, h); i++) {
    const at = i * GRID_CELL - 0.5
    c.strokeStyle = i % 5 ? GRID_LINE : GRID_MAJOR
    c.beginPath()
    if (at < w) {
      c.moveTo(at, 0)
      c.lineTo(at, h)
    }
    if (at < h) {
      c.moveTo(0, at)
      c.lineTo(w, at)
    }
    c.stroke()
  }
  c.restore()
}
