import type { CSSProperties } from "react"

/* ── Color Presets ── */
export interface ColorPreset {
  id: string
  name: string
  swatch: string
  light: { primary: string; foreground: string; ring: string }
  dark:  { primary: string; foreground: string; ring: string }
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "zinc", name: "Default", swatch: "#18181b",
    light: { primary: "oklch(0.205 0 0)",        foreground: "oklch(0.985 0 0)", ring: "oklch(0.5 0 0)"         },
    dark:  { primary: "oklch(0.922 0 0)",         foreground: "oklch(0.205 0 0)", ring: "oklch(0.6 0 0)"         },
  },
  {
    id: "slate", name: "Slate", swatch: "#475569",
    light: { primary: "oklch(0.392 0.049 252)",   foreground: "oklch(0.985 0 0)", ring: "oklch(0.52 0.04 252)"   },
    dark:  { primary: "oklch(0.641 0.044 252)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.72 0.04 252)"   },
  },
  {
    id: "gray", name: "Gray", swatch: "#4b5563",
    light: { primary: "oklch(0.372 0.014 285)",   foreground: "oklch(0.985 0 0)", ring: "oklch(0.50 0.01 285)"   },
    dark:  { primary: "oklch(0.633 0.016 285)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.72 0.01 285)"   },
  },
  {
    id: "neutral", name: "Neutral", swatch: "#404040",
    light: { primary: "oklch(0.371 0 0)",         foreground: "oklch(0.985 0 0)", ring: "oklch(0.50 0 0)"        },
    dark:  { primary: "oklch(0.892 0 0)",         foreground: "oklch(0.145 0 0)", ring: "oklch(0.72 0 0)"        },
  },
  {
    id: "stone", name: "Stone", swatch: "#57534e",
    light: { primary: "oklch(0.374 0.013 67)",    foreground: "oklch(0.985 0 0)", ring: "oklch(0.50 0.01 67)"    },
    dark:  { primary: "oklch(0.854 0.010 67)",    foreground: "oklch(0.145 0 0)", ring: "oklch(0.72 0.01 67)"    },
  },
  {
    id: "red", name: "Red", swatch: "#dc2626",
    light: { primary: "oklch(0.497 0.228 27)",    foreground: "oklch(0.985 0 0)", ring: "oklch(0.58 0.19 27)"    },
    dark:  { primary: "oklch(0.785 0.170 22)",    foreground: "oklch(0.145 0 0)", ring: "oklch(0.68 0.15 22)"    },
  },
  {
    id: "orange", name: "Orange", swatch: "#ea580c",
    light: { primary: "oklch(0.553 0.215 35)",    foreground: "oklch(0.985 0 0)", ring: "oklch(0.62 0.18 40)"    },
    dark:  { primary: "oklch(0.795 0.184 52)",    foreground: "oklch(0.145 0 0)", ring: "oklch(0.68 0.16 50)"    },
  },
  {
    id: "amber", name: "Amber", swatch: "#d97706",
    light: { primary: "oklch(0.576 0.165 62)",    foreground: "oklch(0.985 0 0)", ring: "oklch(0.63 0.14 65)"    },
    dark:  { primary: "oklch(0.836 0.141 84)",    foreground: "oklch(0.145 0 0)", ring: "oklch(0.72 0.13 82)"    },
  },
  {
    id: "yellow", name: "Yellow", swatch: "#ca8a04",
    light: { primary: "oklch(0.596 0.145 80)",    foreground: "oklch(0.145 0 0)", ring: "oklch(0.65 0.12 82)"    },
    dark:  { primary: "oklch(0.867 0.141 86)",    foreground: "oklch(0.145 0 0)", ring: "oklch(0.76 0.13 84)"    },
  },
  {
    id: "lime", name: "Lime", swatch: "#65a30d",
    light: { primary: "oklch(0.532 0.157 133)",   foreground: "oklch(0.985 0 0)", ring: "oklch(0.60 0.13 133)"   },
    dark:  { primary: "oklch(0.792 0.178 135)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.69 0.15 133)"   },
  },
  {
    id: "green", name: "Green", swatch: "#16a34a",
    light: { primary: "oklch(0.448 0.147 143)",   foreground: "oklch(0.985 0 0)", ring: "oklch(0.54 0.12 143)"   },
    dark:  { primary: "oklch(0.748 0.175 145)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.64 0.15 145)"   },
  },
  {
    id: "emerald", name: "Emerald", swatch: "#059669",
    light: { primary: "oklch(0.448 0.163 151)",   foreground: "oklch(0.985 0 0)", ring: "oklch(0.55 0.14 155)"   },
    dark:  { primary: "oklch(0.748 0.168 154)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.64 0.14 155)"   },
  },
  {
    id: "teal", name: "Teal", swatch: "#0d9488",
    light: { primary: "oklch(0.44 0.130 183)",    foreground: "oklch(0.985 0 0)", ring: "oklch(0.54 0.11 185)"   },
    dark:  { primary: "oklch(0.751 0.148 183)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.63 0.13 183)"   },
  },
  {
    id: "cyan", name: "Cyan", swatch: "#0891b2",
    light: { primary: "oklch(0.44 0.130 207)",    foreground: "oklch(0.985 0 0)", ring: "oklch(0.54 0.11 207)"   },
    dark:  { primary: "oklch(0.793 0.143 209)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.65 0.13 207)"   },
  },
  {
    id: "sky", name: "Sky", swatch: "#0284c7",
    light: { primary: "oklch(0.44 0.150 231)",    foreground: "oklch(0.985 0 0)", ring: "oklch(0.54 0.13 231)"   },
    dark:  { primary: "oklch(0.786 0.145 228)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.66 0.13 228)"   },
  },
  {
    id: "blue", name: "Blue", swatch: "#2563eb",
    light: { primary: "oklch(0.452 0.253 264)",   foreground: "oklch(0.985 0 0)", ring: "oklch(0.55 0.18 264)"   },
    dark:  { primary: "oklch(0.809 0.105 251)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.65 0.14 255)"   },
  },
  {
    id: "indigo", name: "Indigo", swatch: "#4f46e5",
    light: { primary: "oklch(0.418 0.195 277)",   foreground: "oklch(0.985 0 0)", ring: "oklch(0.52 0.16 277)"   },
    dark:  { primary: "oklch(0.776 0.152 277)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.65 0.14 277)"   },
  },
  {
    id: "violet", name: "Violet", swatch: "#7c3aed",
    light: { primary: "oklch(0.446 0.249 290)",   foreground: "oklch(0.985 0 0)", ring: "oklch(0.55 0.20 290)"   },
    dark:  { primary: "oklch(0.788 0.177 290)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.65 0.16 290)"   },
  },
  {
    id: "purple", name: "Purple", swatch: "#9333ea",
    light: { primary: "oklch(0.423 0.222 296)",   foreground: "oklch(0.985 0 0)", ring: "oklch(0.53 0.18 296)"   },
    dark:  { primary: "oklch(0.777 0.178 296)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.65 0.16 296)"   },
  },
  {
    id: "fuchsia", name: "Fuchsia", swatch: "#c026d3",
    light: { primary: "oklch(0.484 0.245 304)",   foreground: "oklch(0.985 0 0)", ring: "oklch(0.57 0.20 304)"   },
    dark:  { primary: "oklch(0.833 0.179 305)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.70 0.16 305)"   },
  },
  {
    id: "pink", name: "Pink", swatch: "#db2777",
    light: { primary: "oklch(0.494 0.215 345)",   foreground: "oklch(0.985 0 0)", ring: "oklch(0.58 0.18 345)"   },
    dark:  { primary: "oklch(0.833 0.162 343)",   foreground: "oklch(0.145 0 0)", ring: "oklch(0.70 0.14 343)"   },
  },
  {
    id: "rose", name: "Rose", swatch: "#e11d48",
    light: { primary: "oklch(0.47 0.215 16)",     foreground: "oklch(0.985 0 0)", ring: "oklch(0.56 0.18 16)"    },
    dark:  { primary: "oklch(0.793 0.172 10)",    foreground: "oklch(0.145 0 0)", ring: "oklch(0.65 0.15 12)"    },
  },
]

/* ── Pattern Presets ── */
export interface PatternPreset {
  id: string
  name: string
  getStyle: (color: string) => CSSProperties
}

const PATTERN_SCALE = 1.125

function svgUri(content: string, w: number, h: number, color: string): CSSProperties {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${content.replaceAll("C", color)}</svg>`
  return {
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    backgroundPosition: "0 0",
    backgroundRepeat: "repeat",
    backgroundSize: `${w * PATTERN_SCALE}px ${h * PATTERN_SCALE}px`,
  }
}

export const PATTERN_PRESETS: PatternPreset[] = [
  {
    id: "none", name: "None",
    getStyle: () => ({}),
  },
  {
    id: "hideout", name: "Hideout",
    getStyle: (c) => svgUri(
      `<path d="M0 0 L7 14 L14 0M-7 14 L0 28 L7 14M7 14 L14 28 L21 14" fill="none" stroke="C" stroke-width="0.5"/>`,
      14, 28, c
    ),
  },
  {
    id: "dots", name: "Dots",
    getStyle: (c) => svgUri(`<circle cx="2" cy="2" r="1.5" fill="C"/>`, 16, 16, c),
  },
  {
    id: "grid", name: "Grid",
    getStyle: (c) => svgUri(`<path d="M 24 0 L 0 0 0 24" fill="none" stroke="C" stroke-width="0.6"/>`, 24, 24, c),
  },
  {
    id: "diagonal", name: "Diagonal",
    getStyle: (c) => svgUri(
      `<line x1="0" y1="0" x2="16" y2="16" stroke="C" stroke-width="0.8"/>
       <line x1="-8" y1="8" x2="8" y2="24" stroke="C" stroke-width="0.8"/>
       <line x1="8" y1="-8" x2="24" y2="8" stroke="C" stroke-width="0.8"/>`,
      16, 16, c
    ),
  },
  {
    id: "waves", name: "Waves",
    getStyle: (c) => svgUri(
      `<path d="M0 10 q7.5-10 15 0 q7.5 10 15 0 q7.5-10 15 0 q7.5 10 15 0" fill="none" stroke="C" stroke-width="1.2"/>`,
      60, 20, c
    ),
  },
  {
    id: "lines", name: "Lines",
    getStyle: (c) => svgUri(`<line x1="0" y1="10" x2="20" y2="10" stroke="C" stroke-width="0.8"/>`, 20, 20, c),
  },
  {
    id: "hexagon", name: "Hexagon",
    getStyle: (c) => svgUri(
      `<polygon points="18,1 34,10 34,28 18,37 2,28 2,10" fill="none" stroke="C" stroke-width="0.8"/>`,
      36, 38, c
    ),
  },
  {
    id: "zigzag", name: "Zigzag",
    getStyle: (c) => svgUri(
      `<polyline points="0,10 5,0 10,10 15,0 20,10" fill="none" stroke="C" stroke-width="1.2"/>
       <polyline points="0,20 5,10 10,20 15,10 20,20" fill="none" stroke="C" stroke-width="1.2"/>`,
      20, 20, c
    ),
  },
  {
    id: "crosses", name: "Crosses",
    getStyle: (c) => svgUri(
      `<line x1="12" y1="7" x2="12" y2="17" stroke="C" stroke-width="1.2"/>
       <line x1="7" y1="12" x2="17" y2="12" stroke="C" stroke-width="1.2"/>`,
      24, 24, c
    ),
  },
  {
    id: "wiggle", name: "Wiggle",
    getStyle: (c) => svgUri(
      `<path d="M0 9 q3-5 6 0 q3 5 6 0 q3-5 6 0 q3 5 6 0 q3-5 6 0 q3 5 6 0 q3-5 6 0 q3 5 6 0" fill="none" stroke="C" stroke-width="1"/>
       <path d="M0 22 q3-5 6 0 q3 5 6 0 q3-5 6 0 q3 5 6 0 q3-5 6 0 q3 5 6 0 q3-5 6 0 q3 5 6 0" fill="none" stroke="C" stroke-width="1"/>`,
      48, 30, c
    ),
  },
  {
    id: "rain", name: "Rain",
    getStyle: (c) => svgUri(
      `<line x1="3" y1="0" x2="0" y2="8" stroke="C" stroke-width="0.7"/>
       <line x1="13" y1="0" x2="10" y2="8" stroke="C" stroke-width="0.7"/>
       <line x1="8" y1="10" x2="5" y2="18" stroke="C" stroke-width="0.7"/>
       <line x1="18" y1="10" x2="15" y2="18" stroke="C" stroke-width="0.7"/>`,
      20, 20, c
    ),
  },
  {
    id: "tic-tac-toe", name: "Tic Tac Toe",
    getStyle: (c) => svgUri(
      `<line x1="12" y1="2" x2="12" y2="34" stroke="C" stroke-width="0.6"/>
       <line x1="24" y1="2" x2="24" y2="34" stroke="C" stroke-width="0.6"/>
       <line x1="2" y1="12" x2="34" y2="12" stroke="C" stroke-width="0.6"/>
       <line x1="2" y1="24" x2="34" y2="24" stroke="C" stroke-width="0.6"/>
       <line x1="4" y1="4" x2="10" y2="10" stroke="C" stroke-width="0.6"/>
       <line x1="10" y1="4" x2="4" y2="10" stroke="C" stroke-width="0.6"/>
       <circle cx="30" cy="7" r="3.5" fill="none" stroke="C" stroke-width="0.6"/>
       <circle cx="18" cy="30" r="3.5" fill="none" stroke="C" stroke-width="0.6"/>`,
      36, 36, c
    ),
  },
  {
    id: "endless-clouds", name: "Endless Clouds",
    getStyle: (c) => svgUri(
      `<path d="M0 14 a14 14 0 0 1 28 0" fill="none" stroke="C" stroke-width="1"/>
       <path d="M14 28 a14 14 0 0 1 28 0" fill="none" stroke="C" stroke-width="1"/>
       <path d="M28 14 a14 14 0 0 1 28 0" fill="none" stroke="C" stroke-width="1"/>`,
      56, 28, c
    ),
  },
  {
    id: "curtain", name: "Curtain",
    getStyle: (c) => svgUri(
      `<path d="M5 0 q8 10 0 20 q-8 10 0 20" fill="none" stroke="C" stroke-width="0.8"/>
       <path d="M15 0 q8 10 0 20 q-8 10 0 20" fill="none" stroke="C" stroke-width="0.8"/>
       <path d="M25 0 q8 10 0 20 q-8 10 0 20" fill="none" stroke="C" stroke-width="0.8"/>`,
      20, 40, c
    ),
  },
  {
    id: "bubbles", name: "Bubbles",
    getStyle: (c) => svgUri(
      `<circle cx="8" cy="8" r="7" fill="none" stroke="C" stroke-width="0.8"/>
       <circle cx="28" cy="6" r="5" fill="none" stroke="C" stroke-width="0.8"/>
       <circle cx="20" cy="24" r="6" fill="none" stroke="C" stroke-width="0.8"/>
       <circle cx="4" cy="26" r="3" fill="none" stroke="C" stroke-width="0.8"/>`,
      36, 32, c
    ),
  },
]
