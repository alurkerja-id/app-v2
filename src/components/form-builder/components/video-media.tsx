/* eslint-disable react-refresh/only-export-components -- Video embed helpers: mock video files and the illustrated frames the mock player shows */
import { useId, type ReactNode } from "react"

import { L, type L10n } from "../i18n"

/* Mock videos for the Video embed prototype. No network and no media file: the
   player shows an SVG "frame" for the chapter at the current time. Colours here
   are the video's own picture, not theme chrome (a video looks the same in both themes). */

type SceneArt = "helmet" | "vest" | "exit" | "assembly" | "report" | "apar"

export interface Chapter {
  /** Start, seconds. */
  at: number
  kicker: string
  title: string[]
  sub: string[]
  art: SceneArt
  /** Big step letter on the APAR video (P · A · S · S). */
  letter?: string
}

export interface MockVideo {
  id: string
  file_name: string
  mime: string
  size: number
  /** Seconds. */
  duration: number
  title: L10n
  theme: "k3" | "apar"
  chapters: Chapter[]
}

export const K3_VIDEO: MockVideo = {
  id: "f_6a0c33e9",
  file_name: "induksi-k3-pabrik-cikarang.mp4",
  mime: "video/mp4",
  size: 48_906_240,
  duration: 330,
  title: L("Safety induction, Cikarang plant", "Induksi K3 Pabrik Cikarang"),
  theme: "k3",
  chapters: [
    { at: 0, kicker: "VIDEO INDUKSI", title: ["Induksi K3", "Karyawan Baru"], sub: ["PT Sinar Nusantara Abadi", "Pabrik Cikarang · 2026"], art: "helmet" },
    { at: 40, kicker: "BAGIAN 1 · APD", title: ["APD wajib di", "area produksi"], sub: ["Helm, rompi reflektif,", "dan sepatu safety"], art: "vest" },
    { at: 115, kicker: "BAGIAN 2 · EVAKUASI", title: ["Ikuti jalur", "evakuasi hijau"], sub: ["Jangan pakai lift saat", "alarm berbunyi"], art: "exit" },
    { at: 190, kicker: "BAGIAN 3 · TITIK KUMPUL", title: ["Titik kumpul:", "parkiran", "Gerbang 2"], sub: ["Lapor ke koordinator lantai", "dan tunggu aba-aba HSE"], art: "assembly" },
    { at: 265, kicker: "BAGIAN 4 · PELAPORAN", title: ["Lapor bahaya &", "kecelakaan"], sub: ["HSE ext. 112, atau", "lewat aplikasi AlurKerja"], art: "report" },
  ],
}

export const APAR_VIDEO: MockVideo = {
  id: "f_c41e7b02",
  file_name: "cara-memakai-apar.mp4",
  mime: "video/mp4",
  size: 19_293_184,
  duration: 160,
  title: L("How to use a fire extinguisher", "Cara memakai APAR"),
  theme: "apar",
  chapters: [
    { at: 0, kicker: "VIDEO PELATIHAN", title: ["Cara memakai", "APAR"], sub: ["Alat pemadam api ringan", "Ingat: P · A · S · S"], art: "apar" },
    { at: 25, kicker: "LANGKAH 1", title: ["Pull"], sub: ["Tarik pin pengaman", "di bawah tuas"], art: "apar", letter: "P" },
    { at: 60, kicker: "LANGKAH 2", title: ["Aim"], sub: ["Arahkan selang ke", "pangkal api"], art: "apar", letter: "A" },
    { at: 95, kicker: "LANGKAH 3", title: ["Squeeze"], sub: ["Tekan tuas perlahan", "dan stabil"], art: "apar", letter: "S" },
    { at: 125, kicker: "LANGKAH 4", title: ["Sweep"], sub: ["Sapukan ke kiri-kanan", "sampai api padam"], art: "apar", letter: "S" },
  ],
}

/** Files offered by the builder's video picker (prototype: no real upload). */
export const VIDEO_UPLOADS: MockVideo[] = [K3_VIDEO, APAR_VIDEO]

/** `file` process variables set by earlier steps; null = the step has not run yet. */
export const VIDEO_VARS: Record<string, { step: L10n; video: MockVideo | null }> = {
  induction_video: { step: L("HSE content update", "Pembaruan materi HSE"), video: K3_VIDEO },
  toolbox_talk_video: { step: L("Toolbox talk recording (not reached yet)", "Rekaman toolbox talk (belum sampai)"), video: null },
}
export const VIDEO_VAR_KEYS = Object.keys(VIDEO_VARS)

export function chapterAt(v: MockVideo, t: number) {
  let i = 0
  v.chapters.forEach((c, n) => {
    if (c.at <= t) i = n
  })
  return i
}

/* ── frames ─────────────────────────────────────────────────────────────── */

const FONT = "Inter, 'Segoe UI', Arial, sans-serif"

interface Theme {
  bg1: string
  bg2: string
  accent: string
  deep: string
}
const THEMES: Record<MockVideo["theme"], Theme> = {
  k3: { bg1: "#0b2545", bg2: "#13315c", accent: "#fbbf24", deep: "#d97706" },
  apar: { bg1: "#1e293b", bg2: "#0f172a", accent: "#fca5a5", deep: "#dc2626" },
}

const WHITE = "#ffffff"
const INK = "#111827"
const GREEN = "#16a34a"

function Person({ x, y, fill }: { x: number; y: number; fill: string }) {
  return (
    <g fill={fill}>
      <circle cx={x} cy={y - 46} r={22} />
      <path d={`M${x - 34} ${y + 34} C${x - 34} ${y - 22} ${x + 34} ${y - 22} ${x + 34} ${y + 34} Z`} />
    </g>
  )
}

function art(kind: SceneArt, th: Theme, letter?: string): ReactNode {
  switch (kind) {
    case "helmet":
      return (
        <g>
          <path d="M-190 50 C-190 -170 190 -170 190 50 Z" fill={th.accent} />
          <path d="M-32 -112 C-20 -118 20 -118 32 -112 L32 50 L-32 50 Z" fill={WHITE} opacity={0.3} />
          <path d="M-240 50 H240 C240 92 204 106 160 106 H-160 C-204 106 -240 92 -240 50 Z" fill={th.deep} />
          <text y={22} textAnchor="middle" fontSize={56} fontWeight={800} fill={th.bg1}>
            K3
          </text>
        </g>
      )
    case "vest":
      return (
        <g>
          <path d="M-70 -170 L-150 -140 L-170 170 L170 170 L150 -140 L70 -170 L35 -60 L0 -20 L-35 -60 Z" fill="#f97316" />
          <path d="M-160 40 H160 V80 H-160 Z M-162 110 H162 V140 H-162 Z" fill="#e5e7eb" />
          <path d="M-112 -150 L-90 -156 L-98 40 L-122 40 Z M112 -150 L90 -156 L98 40 L122 40 Z" fill="#e5e7eb" />
          <path d="M0 -20 V170" stroke="#9a3412" strokeWidth={6} />
        </g>
      )
    case "exit":
      return (
        <g>
          <rect x={-230} y={-150} width={460} height={300} rx={28} fill={GREEN} />
          <rect x={-208} y={-128} width={416} height={256} rx={16} fill="none" stroke={WHITE} strokeWidth={6} opacity={0.45} />
          <rect x={70} y={-100} width={110} height={190} fill={WHITE} />
          <rect x={86} y={-84} width={78} height={174} fill={GREEN} />
          <circle cx={-40} cy={-74} r={26} fill={WHITE} />
          <path
            d="M-52 -38 L-22 32 L22 92 M-22 32 L-74 82 M-48 -28 L8 -6 L40 -40 M-48 -28 L-100 -2"
            fill="none"
            stroke={WHITE}
            strokeWidth={24}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M-190 112 H-120 M-140 92 L-118 112 L-140 132" fill="none" stroke={WHITE} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case "assembly":
      return (
        <g>
          <rect x={-210} y={-210} width={420} height={420} rx={32} fill={GREEN} />
          <rect x={-170} y={-170} width={340} height={340} rx={12} fill={WHITE} />
          {[0, 90, 180, 270].map((r) => (
            <path key={r} d="M-158 -158 L-92 -158 L-158 -92 Z" fill={GREEN} transform={`rotate(${r})`} />
          ))}
          <Person x={-78} y={30} fill={GREEN} />
          <Person x={0} y={10} fill={GREEN} />
          <Person x={78} y={30} fill={GREEN} />
          <text y={130} textAnchor="middle" fontSize={34} fontWeight={800} fill={GREEN}>
            TITIK KUMPUL
          </text>
        </g>
      )
    case "report":
      return (
        <g>
          <rect x={-120} y={-190} width={240} height={380} rx={36} fill="#1f2937" />
          <rect x={-100} y={-160} width={200} height={296} rx={12} fill="#e0f2fe" />
          <text y={-50} textAnchor="middle" fontSize={40} fontWeight={800} fill={th.bg1}>
            HSE
          </text>
          <text y={30} textAnchor="middle" fontSize={72} fontWeight={800} fill="#dc2626">
            112
          </text>
          <circle cy={94} r={30} fill={GREEN} />
          <g transform="translate(150 -150)">
            <path d="M0 -72 L78 62 H-78 Z" fill="#facc15" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
            <path d="M0 -26 V16" stroke={INK} strokeWidth={12} strokeLinecap="round" />
            <circle cy={38} r={7} fill={INK} />
          </g>
        </g>
      )
    case "apar":
      return (
        <g>
          <path d="M30 -150 C140 -140 165 -40 145 60 C135 110 150 150 172 162" fill="none" stroke="#64748b" strokeWidth={18} strokeLinecap="round" />
          <path d="M166 156 L206 192" stroke="#94a3b8" strokeWidth={26} strokeLinecap="round" />
          <rect x={-30} y={-166} width={60} height={52} fill="#94a3b8" />
          <path d="M-46 -172 L84 -204 M-46 -150 L92 -150" stroke="#cbd5e1" strokeWidth={16} strokeLinecap="round" />
          <circle cx={-66} cy={-160} r={16} fill="none" stroke="#facc15" strokeWidth={7} />
          <rect x={-82} y={-122} width={164} height={304} rx={72} fill="#dc2626" stroke="#7f1d1d" strokeWidth={6} />
          <rect x={-62} y={-20} width={124} height={108} rx={10} fill="#fef3c7" />
          <text y={50} textAnchor="middle" fontSize={40} fontWeight={800} fill="#7f1d1d">
            APAR
          </text>
          {letter && (
            <g>
              <circle cx={-180} cy={-150} r={64} fill={th.accent} />
              <text x={-180} y={-122} textAnchor="middle" fontSize={84} fontWeight={900} fill={th.bg2}>
                {letter}
              </text>
            </g>
          )}
        </g>
      )
  }
}

/**
 * One frame of the mock video: the chapter playing at `at` seconds. 1600 × 900 art,
 * cropped (slice) for 4:3 — everything important sits between x 200 and 1400.
 */
export function VideoFrame({ video, at, className }: { video: MockVideo; at: number; className?: string }) {
  const uid = `v${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const th = THEMES[video.theme]
  const ch = video.chapters[chapterAt(video, at)]
  const titleH = ch.title.length * 70
  const block = 34 + 26 + titleH + 22 + ch.sub.length * 44
  const y0 = 440 - block / 2
  const titleY = y0 + 34 + 26 + 56
  const subY = titleY + titleH - 70 + 22 + 50
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" fontFamily={FONT} className={className} aria-hidden>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={th.bg1} />
          <stop offset="1" stopColor={th.bg2} />
        </linearGradient>
        <pattern id={`${uid}-hz`} width={80} height={48} patternUnits="userSpaceOnUse" patternTransform="skewX(-40)">
          <rect width={40} height={48} fill="#facc15" />
          <rect x={40} width={40} height={48} fill={INK} />
        </pattern>
      </defs>
      <rect width={1600} height={900} fill={`url(#${uid}-bg)`} />
      <circle cx={480} cy={440} r={300} fill={WHITE} opacity={0.05} />
      <circle cx={480} cy={440} r={236} fill={WHITE} opacity={0.06} />
      <g transform="translate(480 440)">{art(ch.art, th, ch.letter)}</g>
      <text x={820} y={y0 + 34} fontSize={28} fontWeight={700} letterSpacing={4} fill={th.accent}>
        {ch.kicker}
      </text>
      {ch.title.map((s, i) => (
        <text key={i} x={820} y={titleY + i * 70} fontSize={60} fontWeight={800} fill={WHITE}>
          {s}
        </text>
      ))}
      {ch.sub.map((s, i) => (
        <text key={i} x={820} y={subY + i * 44} fontSize={32} fontWeight={500} fill={WHITE} opacity={0.78}>
          {s}
        </text>
      ))}
      <text x={1360} y={96} textAnchor="end" fontSize={24} fontWeight={800} letterSpacing={3} fill={WHITE} opacity={0.55}>
        SNA · HSE
      </text>
      {video.theme === "k3" ? <rect y={852} width={1600} height={48} fill={`url(#${uid}-hz)`} /> : <rect y={862} width={1600} height={38} fill={th.deep} />}
    </svg>
  )
}
