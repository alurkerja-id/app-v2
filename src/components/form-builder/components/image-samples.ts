import { L, type L10n } from "../i18n"

/* Sample pictures for the Image display prototype, drawn in code as SVG data URLs
   (no network, no binary assets). The metadata mimics the uploaded file it stands in for. */

export interface ImageFile {
  file_id: string
  file_name: string
  mime: string
  width: number
  height: number
}

/** A builder-picked file: the spec keeps the metadata, the prototype keeps `preview` to draw it. */
export interface PickedImage extends ImageFile {
  preview: string
}

const FONT = "Inter, 'Segoe UI', Arial, sans-serif"
const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
const wrap = (w: number, h: number, vw: number, vh: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${vw} ${vh}" font-family="${FONT}">${body}</svg>`

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

/* ── floor 3 plan ───────────────────────────────────────────────────────── */

const WALL = "#334155"

function room(x: number, y: number, w: number, h: number, fill: string, name: string, cap: string, tx = x + 16, ty = y + 30) {
  return (
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${WALL}" stroke-width="3"/>` +
    `<text x="${tx}" y="${ty}" font-size="17" font-weight="700" fill="#0f172a" letter-spacing="1">${name}</text>` +
    (cap ? `<text x="${tx}" y="${ty + 19}" font-size="12" fill="#475569">${cap}</text>` : "")
  )
}

/** A table with chairs on both long sides. */
function table(x: number, y: number, w: number, h: number, seats: number, top: string, chair: string) {
  const gap = w / seats
  const chairs = range(seats)
    .map((i) => {
      const cx = x + gap / 2 + i * gap
      return `<circle cx="${cx}" cy="${y - 11}" r="7" fill="${chair}"/><circle cx="${cx}" cy="${y + h + 11}" r="7" fill="${chair}"/>`
    })
    .join("")
  return `${chairs}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${top}"/>`
}

/** A door: a gap in the wall plus the swing arc. */
function door(x: number, y: number, horizontal: boolean, up = false) {
  if (horizontal) {
    const dy = up ? -30 : 30
    return `<rect x="${x}" y="${y - 3}" width="32" height="6" fill="#f8fafc"/><path d="M${x} ${y} L${x} ${y + dy} A30 30 0 0 ${up ? 1 : 0} ${x + 30} ${y}" fill="none" stroke="#94a3b8" stroke-width="1.5"/>`
  }
  return `<rect x="${x - 3}" y="${y}" width="6" height="32" fill="#f8fafc"/><path d="M${x} ${y} L${x - 30} ${y} A30 30 0 0 0 ${x} ${y + 30}" fill="none" stroke="#94a3b8" stroke-width="1.5"/>`
}

const floorPlanSvg = wrap(
  720,
  450,
  960,
  600,
  [
    `<defs><pattern id="g" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#e2e8f0" stroke-width="1"/></pattern></defs>`,
    `<rect width="960" height="600" fill="#f8fafc"/><rect width="960" height="600" fill="url(#g)"/>`,
    `<text x="40" y="52" font-size="24" font-weight="800" fill="#0f172a" letter-spacing="1">LANTAI 3 · FLOOR 3</text>`,
    `<text x="40" y="78" font-size="14" fill="#475569">Gedung Sejahtera — ruang rapat / meeting rooms</text>`,
    /* compass */
    `<g transform="translate(886 58)"><circle r="26" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/><path d="M0 -18 L8 6 L0 1 L-8 6 Z" fill="#0f172a"/><text y="22" font-size="11" font-weight="700" fill="#0f172a" text-anchor="middle">U/N</text></g>`,
    /* shell + corridor */
    `<rect x="40" y="100" width="880" height="440" rx="4" fill="#ffffff" stroke="${WALL}" stroke-width="6"/>`,
    `<rect x="43" y="298" width="697" height="60" fill="#f1f5f9"/>`,
    `<text x="590" y="334" font-size="12" fill="#64748b" letter-spacing="3" text-anchor="middle">KORIDOR · CORRIDOR</text>`,
    /* top row */
    `<rect x="40" y="100" width="110" height="198" fill="#e2e8f0" stroke="${WALL}" stroke-width="3"/>`,
    `<rect x="58" y="122" width="74" height="60" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/><path d="M58 122 L132 182 M132 122 L58 182" stroke="#64748b" stroke-width="2"/>`,
    `<rect x="58" y="196" width="74" height="60" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/><path d="M58 196 L132 256 M132 196 L58 256" stroke="#64748b" stroke-width="2"/>`,
    `<text x="95" y="282" font-size="12" font-weight="700" fill="#334155" text-anchor="middle">LIFT</text>`,
    room(150, 100, 240, 198, "#dbeafe", "MERAPI", "6 pax"),
    table(205, 185, 130, 50, 3, "#93c5fd", "#3b82f6"),
    room(390, 100, 130, 198, "#f1f5f9", "PANTRY", ""),
    `<rect x="404" y="150" width="102" height="26" rx="4" fill="#cbd5e1"/><circle cx="430" cy="163" r="7" fill="#94a3b8"/><rect x="404" y="214" width="40" height="56" rx="4" fill="#e2e8f0" stroke="#94a3b8"/>`,
    room(520, 100, 220, 198, "#dcfce7", "BROMO", "10 pax"),
    table(560, 180, 150, 54, 5, "#86efac", "#16a34a"),
    /* Semeru: the east end, full height */
    room(740, 100, 180, 440, "#fef3c7", "SEMERU", "20 pax", 760, 132),
    `${range(10)
      .map((i) => `<circle cx="${790}" cy="${190 + i * 32}" r="7" fill="#d97706"/><circle cx="${870}" cy="${190 + i * 32}" r="7" fill="#d97706"/>`)
      .join("")}<rect x="804" y="176" width="52" height="320" rx="12" fill="#fcd34d"/>`,
    `<rect x="764" y="512" width="132" height="10" rx="3" fill="#0f172a"/><text x="830" y="508" font-size="10" fill="#92400e" text-anchor="middle">LAYAR / SCREEN</text>`,
    /* bottom row */
    room(40, 358, 220, 182, "#ede9fe", "RESEPSIONIS", "Reception"),
    `<path d="M80 470 h120 a20 20 0 0 1 -20 30 h-80 a20 20 0 0 1 -20 -30 z" fill="#c4b5fd"/>`,
    room(260, 358, 120, 182, "#f1f5f9", "TOILET", ""),
    `<circle cx="300" cy="460" r="12" fill="#cbd5e1"/><circle cx="342" cy="460" r="12" fill="#cbd5e1"/>`,
    room(380, 358, 360, 182, "#ffffff", "AREA KERJA", "Open workspace"),
    `${range(3)
      .flatMap((r) => range(4).map((c) => `<rect x="${420 + c * 78}" y="${430 + r * 32}" width="62" height="20" rx="3" fill="#e2e8f0" stroke="#cbd5e1"/>`))
      .join("")}`,
    /* doors onto the corridor */
    door(232, 298, true, true),
    door(600, 298, true, true),
    door(430, 298, true, true),
    door(740, 300, false),
    door(84, 358, true, true),
    door(346, 358, true),
    door(520, 358, true, true),
    /* You are here */
    `<circle cx="196" cy="328" r="22" fill="#ef4444" opacity="0.18"/><circle cx="196" cy="328" r="10" fill="#ef4444" stroke="#ffffff" stroke-width="3"/>`,
    `<rect x="224" y="312" width="180" height="32" rx="16" fill="#ef4444"/>`,
    `<text x="314" y="333" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle">Anda di sini · You are here</text>`,
    /* scale */
    `<g transform="translate(40 570)"><rect width="80" height="6" fill="#0f172a"/><rect x="80" width="80" height="6" fill="#cbd5e1"/><text x="0" y="22" font-size="11" fill="#475569">0</text><text x="160" y="22" font-size="11" fill="#475569" text-anchor="middle">5 m</text></g>`,
  ].join(""),
)

/* ── building exterior ──────────────────────────────────────────────────── */

function windows(x: number, y: number, cols: number, rows: number, w: number, h: number, gx: number, gy: number, lit: string, dark: string) {
  return range(rows)
    .flatMap((r) => range(cols).map((c) => `<rect x="${x + c * (w + gx)}" y="${y + r * (h + gy)}" width="${w}" height="${h}" fill="${(r * 3 + c * 5) % 7 === 0 ? lit : dark}"/>`))
    .join("")
}

const buildingSvg = wrap(
  480,
  320,
  960,
  640,
  [
    `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93c5fd"/><stop offset="1" stop-color="#e0f2fe"/></linearGradient>`,
    `<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e3a5f"/><stop offset="1" stop-color="#0f2742"/></linearGradient></defs>`,
    `<rect width="960" height="640" fill="url(#sky)"/>`,
    `<circle cx="812" cy="110" r="52" fill="#fde68a"/>`,
    `<g fill="#ffffff" opacity="0.9"><ellipse cx="190" cy="110" rx="70" ry="22"/><ellipse cx="240" cy="96" rx="48" ry="26"/><ellipse cx="640" cy="160" rx="60" ry="18"/></g>`,
    /* skyline */
    `<rect x="40" y="300" width="110" height="260" fill="#cbd5e1"/><rect x="800" y="260" width="120" height="300" fill="#cbd5e1"/><rect x="700" y="330" width="90" height="230" fill="#d7dee8"/>`,
    /* low wing */
    `<rect x="150" y="380" width="200" height="180" fill="#475569"/>`,
    windows(170, 400, 4, 4, 34, 24, 12, 14, "#fde68a", "#93c5fd"),
    /* tower */
    `<rect x="340" y="80" width="290" height="480" fill="url(#glass)"/>`,
    `<rect x="380" y="56" width="210" height="28" fill="#0f172a"/><rect x="470" y="22" width="30" height="36" fill="#0f172a"/>`,
    windows(362, 104, 6, 12, 34, 26, 10, 9, "#fde68a", "#7dd3fc"),
    /* side wing */
    `<rect x="630" y="270" width="150" height="290" fill="#334155"/>`,
    windows(648, 290, 3, 7, 34, 24, 12, 12, "#fde68a", "#93c5fd"),
    /* entrance */
    `<rect x="400" y="470" width="170" height="90" fill="#0f172a"/><rect x="438" y="500" width="94" height="60" fill="#bae6fd"/><path d="M485 500 V560" stroke="#0f172a" stroke-width="4"/>`,
    `<rect x="380" y="452" width="210" height="22" fill="#e2e8f0"/><text x="485" y="468" font-size="13" font-weight="800" fill="#0f172a" text-anchor="middle" letter-spacing="2">GEDUNG SEJAHTERA</text>`,
    /* ground */
    `<rect y="560" width="960" height="24" fill="#e2e8f0"/><rect y="584" width="960" height="56" fill="#64748b"/>`,
    `${range(8)
      .map((i) => `<rect x="${30 + i * 120}" y="608" width="60" height="6" fill="#f8fafc"/>`)
      .join("")}`,
    /* trees */
    `${[110, 300, 680, 870]
      .map((x) => `<rect x="${x - 5}" y="520" width="10" height="42" fill="#78350f"/><circle cx="${x}" cy="508" r="30" fill="#16a34a"/><circle cx="${x + 16}" cy="520" r="20" fill="#15803d"/>`)
      .join("")}`,
  ].join(""),
)

/* ── meeting room Bromo ─────────────────────────────────────────────────── */

const roomSvg = wrap(
  560,
  364,
  800,
  520,
  [
    `<rect width="800" height="520" fill="#e7e5e4"/>`,
    /* floor */
    `<path d="M0 360 H800 V520 H0 Z" fill="#c8a27a"/>`,
    `${range(9)
      .map((i) => `<path d="M${i * 100 - 40} 520 L${i * 100 + 20} 360" stroke="#b08860" stroke-width="2"/>`)
      .join("")}`,
    /* window */
    `<rect x="40" y="70" width="170" height="230" fill="#bae6fd" stroke="#f5f5f4" stroke-width="10"/><path d="M125 70 V300 M40 185 H210" stroke="#f5f5f4" stroke-width="6"/>`,
    `<path d="M60 300 L110 250 L150 280 L200 230 V300 Z" fill="#7dd3fc" opacity="0.6"/>`,
    /* screen */
    `<rect x="300" y="70" width="280" height="160" rx="8" fill="#0f172a"/><rect x="314" y="84" width="252" height="132" rx="4" fill="#1e293b"/>`,
    `<text x="330" y="112" font-size="15" font-weight="700" fill="#f8fafc">Q4 PLANNING</text>`,
    `${[50, 80, 64, 104, 92]
      .map((h, i) => `<rect x="${336 + i * 44}" y="${204 - h * 0.8}" width="26" height="${h * 0.8}" rx="3" fill="${i === 3 ? "#fbbf24" : "#60a5fa"}"/>`)
      .join("")}`,
    /* name plate */
    `<rect x="640" y="90" width="110" height="40" rx="6" fill="#16a34a"/><text x="695" y="117" font-size="17" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="2">BROMO</text>`,
    /* lamp */
    `<path d="M440 0 V30" stroke="#57534e" stroke-width="3"/><path d="M405 30 H475 L460 46 H420 Z" fill="#44403c"/>`,
    /* chairs behind the table */
    `${range(5)
      .map((i) => `<rect x="${238 + i * 70}" y="300" width="50" height="62" rx="10" fill="#1f2937"/>`)
      .join("")}`,
    /* table */
    `<path d="M200 350 H620 L700 440 H120 Z" fill="#92400e"/><path d="M120 440 H700 V456 H120 Z" fill="#78350f"/>`,
    `<rect x="300" y="384" width="70" height="40" rx="4" fill="#e5e7eb" transform="skewX(-12)"/><rect x="520" y="380" width="60" height="6" rx="3" fill="#f8fafc"/>`,
    /* front chairs */
    `${range(4)
      .map((i) => `<rect x="${170 + i * 140}" y="452" width="90" height="68" rx="14" fill="#374151"/>`)
      .join("")}`,
    /* plant */
    `<path d="M712 470 H768 L760 520 H720 Z" fill="#a16207"/><g fill="#16a34a"><ellipse cx="728" cy="430" rx="14" ry="40" transform="rotate(-20 728 430)"/><ellipse cx="752" cy="428" rx="14" ry="42" transform="rotate(18 752 428)"/><ellipse cx="740" cy="410" rx="12" ry="46"/></g>`,
  ].join(""),
)

/* ── catalogue ──────────────────────────────────────────────────────────── */

export type SampleId = "floor" | "building" | "room"

export const SAMPLES: Record<SampleId, PickedImage & { title: L10n }> = {
  floor: {
    file_id: "f_7c2e91d4",
    file_name: "denah-lantai-3.png",
    mime: "image/png",
    width: 720,
    height: 450,
    preview: svgUrl(floorPlanSvg),
    title: L("Floor 3 plan", "Denah lantai 3"),
  },
  building: {
    file_id: "f_3a8d0457",
    file_name: "gedung-sejahtera.jpg",
    mime: "image/jpeg",
    width: 480,
    height: 320,
    preview: svgUrl(buildingSvg),
    title: L("Office building", "Gedung kantor"),
  },
  room: {
    file_id: "f_b51f6e20",
    file_name: "ruang-bromo.jpg",
    mime: "image/jpeg",
    width: 560,
    height: 364,
    preview: svgUrl(roomSvg),
    title: L("Bromo meeting room", "Ruang rapat Bromo"),
  },
}
export const SAMPLE_IDS = Object.keys(SAMPLES) as SampleId[]

/** The picked file as stored in the builder: metadata plus the preview, no catalogue extras. */
export function pick(id: SampleId): PickedImage {
  const { file_id, file_name, mime, width, height, preview } = SAMPLES[id]
  return { file_id, file_name, mime, width, height, preview }
}

/* ── mock process variables that hold a file (set by earlier steps) ─────── */

export interface FileVar {
  step: L10n
  /** null = the step that sets it has not run yet. */
  sample: SampleId | null
  size: number
}

export const FILE_VARS: Record<string, FileVar> = {
  room_photo: { step: L("Facility check", "Cek fasilitas"), sample: "room", size: 184_320 },
  floor_plan_latest: { step: L("Building admin update", "Pembaruan admin gedung"), sample: "floor", size: 412_660 },
  damage_photo: { step: L("Room check (not reached yet)", "Cek ruangan (belum sampai)"), sample: null, size: 0 },
}
export const FILE_VAR_KEYS = Object.keys(FILE_VARS)

/** The `file` value the variable holds, as File Upload saves it, or null when empty. */
export function fileVarValue(key: string) {
  const v = FILE_VARS[key]
  if (!v?.sample) return null
  const s = SAMPLES[v.sample]
  return { file_id: `${s.file_id}_v`, file_name: s.file_name, mime: s.mime, size: v.size, width: s.width, height: s.height }
}
