/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Car01Icon, Delete02Icon, EraserIcon, GridIcon, ImageUploadIcon, PaintBrush01Icon, SquareIcon, Undo02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, RuntimeProps } from "../types"
import {
  CAR_TOP,
  FONT,
  GRID_CELL,
  GRID_LINE,
  GRID_MAJOR,
  PICTURES,
  PICTURE_IDS,
  arrow,
  isSampleId,
  loop,
  paintArt,
  paintGrid,
  zigzag,
  type Art,
  type Point,
  type SampleId,
} from "./drawing-art"

/* Drawing — ui_type DRAWING, value_kind "file". Like Signature pad, but for sketches and
   marking up a picture. Story: returning a company car, marking scratches and dents. */

type Background = "none" | "car" | "grid" | "upload"
type Ink = "black" | "red" | "blue" | "green" | "amber"
type Size = "thin" | "medium" | "thick"

interface DrawingProps {
  label: L10n
  name: string
  background: Background
  /** Sample picture "uploaded" in the builder; "" = none yet. */
  picture: SampleId | ""
  colors: Ink[]
  sizes: Size[]
  eraser: boolean
  /** px; "" while the stepper is being edited. */
  heightPx: number | ""
  required: boolean
}

interface Stroke {
  /** Ink colour, or the eraser (rubs out ink, never the background). */
  ink: Ink | "eraser"
  size: Size
  /** 0–1 of the drawing sheet, so a stroke survives a resize. */
  pts: Point[]
}

interface DrawingValue {
  strokes: Stroke[]
  /** Sheet size (CSS px) when the last stroke ended — the PNG size. 0 = not drawn here. */
  w: number
  h: number
}

/* Ink colours are data (saved as hex in the spec), not theme colours. */
const INKS: Record<Ink, { hex: string; label: L10n }> = {
  black: { hex: "#171717", label: L("Black", "Hitam") },
  red: { hex: "#DC2626", label: L("Red", "Merah") },
  blue: { hex: "#2563EB", label: L("Blue", "Biru") },
  green: { hex: "#16A34A", label: L("Green", "Hijau") },
  amber: { hex: "#D97706", label: L("Amber", "Oranye") },
}
const INK_KEYS: Ink[] = ["black", "red", "blue", "green", "amber"]

const SIZES: Record<Size, { px: number; eraser: number; dot: number; label: L10n }> = {
  thin: { px: 2, eraser: 10, dot: 4, label: L("Thin", "Tipis") },
  medium: { px: 4, eraser: 20, dot: 7, label: L("Medium", "Sedang") },
  thick: { px: 8, eraser: 36, dot: 11, label: L("Thick", "Tebal") },
}
const SIZE_KEYS: Size[] = ["thin", "medium", "thick"]

const BACKGROUNDS: { v: Background; label: L10n }[] = [
  { v: "none", label: L("Blank", "Kosong") },
  { v: "car", label: L("Car outline", "Garis mobil") },
  { v: "grid", label: L("Grid", "Kisi") },
  { v: "upload", label: L("Picture", "Gambar") },
]

/* The sheet stays light "paper" in the dark theme, like Signature pad, so the
   saved PNG looks the same as the screen. */
const PAPER = "bg-white dark:bg-zinc-100"
const PAPER_FILL = "fill-white dark:fill-zinc-100"

const padH = (p: DrawingProps) => Math.min(600, Math.max(240, Number(p.heightPx) || 360))
/** Width of the runtime pad on a desktop task form (sample PNG size). */
const TYPICAL_W = 766

function artOf(p: DrawingProps): Art | null {
  if (p.background === "car") return CAR_TOP
  if (p.background === "upload" && p.picture) return PICTURES[p.picture].art
  return null
}

/** The drawing sheet in a pad `padW` wide: the picture's shape (never taller than Height), or the whole pad. */
function sheetOf(p: DrawingProps, padW: number) {
  const H = padH(p)
  const art = artOf(p)
  if (!art || !padW) return { w: padW, h: H }
  const ratio = art.w / art.h
  const h = Math.min(H, padW / ratio)
  return { w: Math.round(h * ratio), h: Math.round(h) }
}

const defaultSize = (sizes: Size[]): Size => (sizes.includes("medium") ? "medium" : (sizes[0] ?? "medium"))
const inkCount = (strokes: Stroke[]) => strokes.filter((s) => s.ink !== "eraser").length

/* ── required message: reuses the label when it already says what to do ─── */

const WHERE: Record<Background, L10n> = {
  none: L("on the canvas", "di kanvas"),
  grid: L("on the grid", "di kisi"),
  car: L("on the car", "pada gambar mobil"),
  upload: L("on the picture", "pada gambar"),
}
const VERB = /^(mark|draw|sketch|circle|show|point|highlight|tandai|gambar|gambarkan|lingkari|tunjukkan|coret)\b/i
const PLACE = /\b(car|picture|plan|canvas|grid|photo|mobil|denah|kanvas|kisi|foto)\b/i

function requiredMsg(p: DrawingProps): L10n {
  const side = (label: string, where: string, fallback: string) => {
    const s = label.trim().replace(/[.:]+$/, "")
    return VERB.test(s) ? (PLACE.test(s) ? s : `${s} ${where}`) : fallback
  }
  const en = p.label.en.trim() || "Drawing"
  const id = p.label.id.trim() || en
  return L(
    side(en, WHERE[p.background].en, `${en} is required — draw ${WHERE[p.background].en}`),
    side(id, WHERE[p.background].id, `${id} wajib diisi — buat coretan ${WHERE[p.background].id}`),
  )
}

/* ── sample marks (Read-only / Disabled, builder preview) ───────────────── */

function sampleStrokes(p: DrawingProps): Stroke[] {
  const a = p.colors[0] ?? "red"
  const b = p.colors[1] ?? a
  const size = defaultSize(p.sizes)
  const mk = (ink: Ink, pts: Point[]): Stroke => ({ ink, size, pts })
  if (p.background === "car")
    return [
      mk(a, loop(0.56, 0.25, 0.065, 0.1)),
      mk(a, loop(0.08, 0.5, 0.045, 0.08)),
      mk(b, zigzag([[0.25, 0.75], [0.28, 0.72], [0.31, 0.76], [0.34, 0.73], [0.37, 0.76]])),
    ]
  if (p.background === "upload" && p.picture === "floor")
    return [mk(a, loop(0.255, 0.475, 0.095, 0.13)), ...arrow([0.55, 0.74], [0.37, 0.53], 1.6).map((s) => mk(b, s))]
  if (p.background === "upload" && p.picture === "side")
    return [mk(a, loop(0.68, 0.52, 0.065, 0.14)), mk(b, zigzag([[0.08, 0.6], [0.1, 0.66], [0.12, 0.6], [0.14, 0.66], [0.16, 0.61]]))]
  const box: Point[] = [[0.12, 0.26], [0.42, 0.26], [0.42, 0.74], [0.12, 0.74], [0.12, 0.26]]
  const ratio = TYPICAL_W / padH(p)
  return [mk(a, zigzag(box)), mk(b, loop(0.72, 0.5, 0.1, 0.1 * ratio)), ...arrow([0.45, 0.5], [0.6, 0.5], ratio).map((s) => mk(a, s))]
}

/* ── painting ───────────────────────────────────────────────────────────── */

/** Ink layer only: transparent, the eraser punches through to whatever is underneath. */
function paintInk(c: CanvasRenderingContext2D, strokes: Stroke[], w: number, h: number, scale: number) {
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.clearRect(0, 0, c.canvas.width, c.canvas.height)
  c.lineCap = "round"
  c.lineJoin = "round"
  for (const s of strokes) {
    const erase = s.ink === "eraser"
    const color = s.ink === "eraser" ? "#000000" : (INKS[s.ink]?.hex ?? INKS.black.hex)
    const width = (erase ? SIZES[s.size].eraser : SIZES[s.size].px) * scale
    const p = s.pts.map(([x, y]) => [x * w * scale, y * h * scale] as const)
    if (!p.length) continue
    c.globalCompositeOperation = erase ? "destination-out" : "source-over"
    c.strokeStyle = color
    c.fillStyle = color
    c.lineWidth = width
    c.beginPath()
    if (p.length === 1) {
      c.arc(p[0][0], p[0][1], width / 2, 0, Math.PI * 2)
      c.fill()
      continue
    }
    c.moveTo(p[0][0], p[0][1])
    for (let i = 1; i < p.length - 1; i++) c.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2)
    c.lineTo(p[p.length - 1][0], p[p.length - 1][1])
    c.stroke()
  }
  c.globalCompositeOperation = "source-over"
}

/** The PNG that would be uploaded: white paper, the background, then the ink layer. */
function toPng(p: DrawingProps, r: DrawingValue) {
  if (!inkCount(r.strokes) || typeof document === "undefined") return null
  const fallback = sheetOf(p, TYPICAL_W)
  const w = Math.max(1, Math.round(r.w || fallback.w))
  const h = Math.max(1, Math.round(r.h || fallback.h))
  const out = document.createElement("canvas")
  out.width = w
  out.height = h
  const c = out.getContext("2d")
  if (!c) return null
  c.fillStyle = "#ffffff"
  c.fillRect(0, 0, w, h)
  const art = artOf(p)
  if (art) paintArt(c, art, 0, 0, w, h)
  else if (p.background === "grid") paintGrid(c, w, h)
  const ink = document.createElement("canvas")
  ink.width = w
  ink.height = h
  const ic = ink.getContext("2d")
  if (ic) {
    paintInk(ic, r.strokes, w, h, 1)
    c.drawImage(ink, 0, 0)
  }
  const b64 = out.toDataURL("image/png").split(",")[1] ?? ""
  return { w, h, size: Math.round((b64.length * 3) / 4) - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0) }
}

const fileName = (p: DrawingProps) => `${p.name.replace(/_/g, "-") || "drawing"}.png`

/* ── shared bits ────────────────────────────────────────────────────────── */

/** The picture as inline SVG; `paper` puts white paper behind it. */
function ArtSvg({ art, paper, className, children }: { art: Art; paper?: boolean; className?: string; children?: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${art.w} ${art.h}`} preserveAspectRatio="xMidYMid meet" fontFamily={FONT} className={className} aria-hidden>
      {paper && <rect width={art.w} height={art.h} className={PAPER_FILL} />}
      {art.items.map((it, i) =>
        it.k === "path" ? (
          <path
            key={i}
            d={it.d}
            fill={it.fill ?? "none"}
            stroke={it.stroke}
            strokeWidth={it.stroke ? it.sw : undefined}
            strokeDasharray={it.dash?.join(" ")}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <text key={i} x={it.x} y={it.y} fontSize={it.size} fontWeight={it.weight} fill={it.fill} textAnchor={it.anchor}>
            {it.text}
          </text>
        ),
      )}
      {children}
    </svg>
  )
}

/** Grid lines every 24 px, a stronger one every 5 cells — the same lines `paintGrid` draws into the PNG. */
function GridPattern() {
  const pid = `grid-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const tile = GRID_CELL * 5
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      <defs>
        <pattern id={pid} width={tile} height={tile} patternUnits="userSpaceOnUse">
          {[1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${i * GRID_CELL - 0.5} 0 V${tile} M0 ${i * GRID_CELL - 0.5} H${tile}`} stroke={i === 5 ? GRID_MAJOR : GRID_LINE} strokeWidth={1} />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  )
}

/** Strokes as SVG polylines in a `w` × `h` viewBox (builder preview). */
function Marks({ strokes, w, h }: { strokes: Stroke[]; w: number; h: number }) {
  return (
    <>
      {strokes.map((s, i) =>
        s.ink === "eraser" ? null : (
          <polyline
            key={i}
            points={s.pts.map(([x, y]) => `${(x * w).toFixed(1)},${(y * h).toFixed(1)}`).join(" ")}
            fill="none"
            stroke={INKS[s.ink].hex}
            strokeWidth={SIZES[s.size].px}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ),
      )}
    </>
  )
}

const Dot = ({ ink, className }: { ink: Ink; className?: string }) => (
  <span className={cn("size-4 shrink-0 rounded-full ring-1 ring-black/15 dark:ring-white/25", className)} style={{ background: INKS[ink].hex }} aria-hidden />
)

function SourceLine({ p }: { p: DrawingProps }) {
  const t = useT()
  const pic = p.background === "upload" && p.picture ? PICTURES[p.picture] : null
  const [icon, text] =
    p.background === "car"
      ? [Car01Icon, t(L("Car outline · seen from above", "Garis mobil · tampak atas"))]
      : p.background === "grid"
        ? [GridIcon, t(L("Grid paper", "Kertas kisi"))]
        : p.background === "upload"
          ? [ImageUploadIcon, pic ? pic.file_name : t(L("No picture chosen", "Belum ada gambar"))]
          : [SquareIcon, t(L("Blank paper", "Kertas kosong"))]
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
      <HugeiconsIcon icon={icon} className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate">{text}</span>
      <span className="ml-auto shrink-0">{t(L("Saved as PNG", "Disimpan sebagai PNG"))}</span>
    </div>
  )
}

/* ── builder ────────────────────────────────────────────────────────────── */

function DrawingCanvas({ props: p }: { props: DrawingProps }) {
  const t = useT()
  const art = artOf(p)
  const strokes = sampleStrokes(p)
  const fake = cn(buttonVariants({ variant: "ghost", size: "xs" }), "pointer-events-none")
  const h = Math.round(padH(p) * 0.7)
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5" aria-hidden>
        <span className="flex items-center gap-1.5">
          {p.colors.map((k, i) => (
            <Dot key={k} ink={k} className={cn(i === 0 && "ring-2 ring-ring ring-offset-2 ring-offset-background")} />
          ))}
        </span>
        <span className="flex items-center gap-2">
          {p.sizes.map((k) => (
            <span key={k} className="rounded-full bg-foreground/70" style={{ width: SIZES[k].dot, height: SIZES[k].dot }} />
          ))}
        </span>
        {p.eraser && <HugeiconsIcon icon={EraserIcon} className="size-4 text-muted-foreground" />}
        <span className="ml-auto flex">
          <span className={fake}>
            <HugeiconsIcon icon={Undo02Icon} />
            {t(L("Undo", "Urungkan"))}
          </span>
          <span className={fake}>
            <HugeiconsIcon icon={Delete02Icon} />
            {t(L("Clear", "Hapus"))}
          </span>
        </span>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/60" style={{ height: h }}>
        {art ? (
          <ArtSvg art={art} paper className="absolute inset-0 size-full">
            <Marks strokes={strokes} w={art.w} h={art.h} />
          </ArtSvg>
        ) : p.background === "upload" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <HugeiconsIcon icon={ImageUploadIcon} className="size-6" />
            {t(L("Pick the picture in Edit Element.", "Pilih gambarnya di Edit Element."))}
          </div>
        ) : (
          <div className={cn("absolute inset-0", PAPER)}>
            {p.background === "grid" && <GridPattern />}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
              <Marks strokes={strokes} w={100} h={100} />
            </svg>
          </div>
        )}
      </div>
      <SourceLine p={p} />
    </div>
  )
}

/** Edit Element: which ink colours the user gets (hex is saved, never typed). */
function InkPicker({ value, onChange }: { value: Ink[]; onChange: (next: Ink[]) => void }) {
  const t = useT()
  return (
    <ToggleGroup
      type="multiple"
      variant="outline"
      size="sm"
      spacing={1}
      value={value}
      aria-label={t(L("Pen colours", "Warna pena"))}
      onValueChange={(next) => onChange(INK_KEYS.filter((k) => next.includes(k)))}
      className="flex-wrap"
    >
      {INK_KEYS.map((k) => (
        <ToggleGroupItem key={k} value={k} className="gap-2 px-3 text-xs">
          <Dot ink={k} className="size-3.5" />
          {t(INKS[k].label)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** Edit Element: the picture to draw on (prototype: two sample pictures stand in for the upload box). */
function PicturePicker({ value, onChange }: { value: SampleId | ""; onChange: (id: SampleId | "") => void }) {
  const t = useT()
  const id = useId()
  const cur = value ? PICTURES[value] : null
  return (
    <div className="flex flex-col gap-3">
      {cur ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border p-2 pr-3">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-border">
            <ArtSvg art={cur.art} paper className="size-full" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{cur.file_name}</span>
            <span className="text-xs text-muted-foreground">
              {cur.mime} · {cur.width} × {cur.height} px
            </span>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label={t(L("Remove picture", "Hapus gambar"))} onClick={() => onChange("")} className="hover:text-destructive">
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          <HugeiconsIcon icon={ImageUploadIcon} className="size-5 shrink-0" />
          {t(L("No picture yet. Pick a sample below.", "Belum ada gambar. Pilih contoh di bawah."))}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <span id={`${id}-samples`} className="text-xs text-muted-foreground">
          {t(L("Prototype: sample pictures", "Prototipe: gambar contoh"))}
        </span>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={value}
          aria-labelledby={`${id}-samples`}
          onValueChange={(x) => isSampleId(x) && onChange(x)}
          className="grid w-full grid-cols-2"
        >
          {PICTURE_IDS.map((k) => (
            <ToggleGroupItem
              key={k}
              value={k}
              className="h-auto min-w-0 flex-col items-stretch gap-1.5 rounded-2xl p-1.5 data-[state=on]:border-primary data-[state=on]:ring-2 data-[state=on]:ring-primary/30"
            >
              <ArtSvg art={PICTURES[k].art} paper className="aspect-[16/10] w-full rounded-xl" />
              <span className="truncate px-1 text-left text-xs font-normal">{t(PICTURES[k].title)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <p className="text-xs text-muted-foreground">
        {t(L("Saved with the form, so every task draws on the same picture.", "Disimpan bersama form, jadi setiap task menandai gambar yang sama."))}
      </p>
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

interface Box {
  w: number
  dpr: number
}

function Tip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function DrawingRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<DrawingProps, DrawingValue>) {
  const t = useT()
  const padRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const cur = useRef<Stroke | null>(null)
  /** Set by Clear in the confirm dialog: focus goes to the sheet, since the Clear button turns disabled. */
  const cleared = useRef(false)
  const [box, setBox] = useState<Box>({ w: 0, dpr: 1 })
  const [drawing, setDrawing] = useState(false)
  const [pickedInk, setPickedInk] = useState<Ink>(p.colors[0] ?? "black")
  const [pickedSize, setPickedSize] = useState<Size>(defaultSize(p.sizes))
  const [erasing, setErasing] = useState(false)

  const live = state === "active"
  const bad = issues.length > 0
  const ink: Ink = p.colors.includes(pickedInk) ? pickedInk : (p.colors[0] ?? "black")
  const size: Size = p.sizes.includes(pickedSize) ? pickedSize : defaultSize(p.sizes)
  const erase = p.eraser && erasing
  const art = artOf(p)
  const sheet = sheetOf(p, box.w)
  const padHeight = art && box.w ? sheet.h : padH(p)
  const marks = inkCount(v.strokes)
  const n = v.strokes.length

  /* The pad follows the form width; the sheet inside keeps the picture's shape. */
  useEffect(() => {
    const pad = padRef.current
    if (!pad) return
    const ro = new ResizeObserver(() => {
      const next = { w: pad.clientWidth, dpr: window.devicePixelRatio || 1 }
      setBox((b) => (b.w === next.w && b.dpr === next.dpr ? b : next))
    })
    ro.observe(pad)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const c = cvRef.current?.getContext("2d")
    if (c && sheet.w) paintInk(c, cur.current ? [...v.strokes, cur.current] : v.strokes, sheet.w, sheet.h, box.dpr)
  }, [v.strokes, sheet.w, sheet.h, box.dpr])

  const repaint = (strokes: Stroke[]) => {
    const c = cvRef.current?.getContext("2d")
    if (c && sheet.w) paintInk(c, strokes, sheet.w, sheet.h, box.dpr)
  }
  const pt = (e: { clientX: number; clientY: number }, el: HTMLCanvasElement): Point => {
    const r = el.getBoundingClientRect()
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]
  }
  const end = () => {
    const s = cur.current
    if (!s) return
    cur.current = null
    setDrawing(false)
    onChange({ strokes: [...v.strokes, s], w: sheet.w, h: sheet.h })
  }
  const edit = (strokes: Stroke[]) => {
    // The button that was used turns disabled when nothing is left: keep focus on the sheet.
    if (!strokes.length) cvRef.current?.focus()
    onChange({ ...v, strokes })
  }
  const undo = () => edit(v.strokes.slice(0, -1))

  const helpText = !n
    ? art
      ? L("Draw on the picture with a mouse, finger or stylus.", "Coret di atas gambar dengan mouse, jari, atau stylus.")
      : L("Draw with a mouse, finger or stylus.", "Gambar dengan mouse, jari, atau stylus.")
    : L(
        `${marks} mark${marks === 1 ? "" : "s"} · saved as one PNG with the ${art ? "picture" : "background"} on submit`,
        `${marks} coretan · disimpan sebagai satu PNG bersama ${art ? "gambarnya" : "latarnya"} saat dikirim`,
      )

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {live && (
        <div role="toolbar" aria-label={t(L("Drawing tools", "Alat gambar"))} className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {p.colors.length > 1 && (
            <ToggleGroup
              type="single"
              size="sm"
              value={erase ? "" : ink}
              aria-label={t(L("Pen colour", "Warna pena"))}
              onValueChange={(x) => {
                const k = INK_KEYS.find((c) => c === x)
                if (k) setPickedInk(k)
                setErasing(false)
              }}
            >
              {p.colors.map((k) => (
                <Tip key={k} label={t(INKS[k].label)}>
                  <ToggleGroupItem value={k} aria-label={t(INKS[k].label)} className="min-w-8 px-2 data-[state=on]:bg-muted">
                    <Dot ink={k} className="group-data-[state=on]/toggle:ring-2 group-data-[state=on]/toggle:ring-ring group-data-[state=on]/toggle:ring-offset-2 group-data-[state=on]/toggle:ring-offset-muted" />
                  </ToggleGroupItem>
                </Tip>
              ))}
            </ToggleGroup>
          )}
          {p.sizes.length > 1 && (
            <ToggleGroup
              type="single"
              size="sm"
              value={size}
              aria-label={t(L("Line size", "Ketebalan garis"))}
              onValueChange={(x) => {
                const k = SIZE_KEYS.find((s) => s === x)
                if (k) setPickedSize(k)
              }}
            >
              {p.sizes.map((k) => (
                <Tip key={k} label={t(SIZES[k].label)}>
                  <ToggleGroupItem value={k} aria-label={t(SIZES[k].label)} className="min-w-8 px-2">
                    <span className="rounded-full bg-foreground" style={{ width: SIZES[k].dot, height: SIZES[k].dot }} aria-hidden />
                  </ToggleGroupItem>
                </Tip>
              ))}
            </ToggleGroup>
          )}
          {p.eraser && (
            <Toggle size="sm" pressed={erase} onPressedChange={setErasing} className="gap-1.5 px-2.5 text-xs">
              <HugeiconsIcon icon={EraserIcon} />
              {t(L("Eraser", "Penghapus"))}
            </Toggle>
          )}
          <span className="ml-auto flex items-center">
            <Button variant="ghost" size="xs" disabled={!n} onClick={undo}>
              <HugeiconsIcon icon={Undo02Icon} />
              {t(L("Undo", "Urungkan"))}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="xs" disabled={!n}>
                  <HugeiconsIcon icon={Delete02Icon} />
                  {t(L("Clear", "Hapus"))}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent
                size="sm"
                onCloseAutoFocus={(e) => {
                  if (!cleared.current) return
                  cleared.current = false
                  e.preventDefault()
                  cvRef.current?.focus()
                }}
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>{t(L("Clear the drawing?", "Hapus semua coretan?"))}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(
                      art || p.background === "grid"
                        ? L("Every mark is removed. The background stays.", "Semua coretan dihapus. Latarnya tetap ada.")
                        : L("Every mark is removed.", "Semua coretan dihapus."),
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t(L("Keep", "Batal"))}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      cleared.current = true
                      onChange({ ...v, strokes: [] })
                    }}
                  >
                    {t(L("Clear", "Hapus"))}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </span>
        </div>
      )}
      <div
        ref={padRef}
        className={cn(
          "relative flex touch-none justify-center overflow-hidden rounded-2xl border border-border bg-muted/60 has-[canvas:focus-visible]:ring-3 has-[canvas:focus-visible]:ring-ring/40",
          bad && "border-destructive ring-3 ring-destructive/20",
          state === "disabled" && "opacity-60",
        )}
        style={{ height: padHeight }}
      >
        <div className={cn("relative h-full shrink-0", PAPER)} style={{ width: sheet.w || "100%" }}>
          {art ? <ArtSvg art={art} className="pointer-events-none absolute inset-0 size-full" /> : p.background === "grid" && <GridPattern />}
          <canvas
            ref={cvRef}
            id={`${id}-input`}
            width={Math.max(1, Math.round(sheet.w * box.dpr))}
            height={Math.max(1, Math.round(sheet.h * box.dpr))}
            role="img"
            tabIndex={state === "disabled" ? -1 : 0}
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-help`}
            aria-invalid={bad || undefined}
            aria-disabled={state === "disabled" || undefined}
            aria-readonly={state === "readonly" || undefined}
            className={cn(
              "absolute inset-0 size-full touch-none outline-none",
              live ? (erase ? "cursor-cell" : "cursor-crosshair") : state === "disabled" ? "cursor-not-allowed" : "cursor-default",
            )}
            onKeyDown={(e) => {
              if (live && n && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.preventDefault()
                undo()
              }
            }}
            onPointerDown={(e) => {
              if (!live || (e.pointerType === "mouse" && e.button !== 0)) return
              e.preventDefault()
              e.currentTarget.focus()
              e.currentTarget.setPointerCapture(e.pointerId)
              cur.current = { ink: erase ? "eraser" : ink, size, pts: [pt(e, e.currentTarget)] }
              setDrawing(true)
              repaint([...v.strokes, cur.current])
            }}
            onPointerMove={(e) => {
              const s = cur.current
              if (!s) return
              // Coalesced events keep fast strokes smooth on touch screens and pens.
              const evs = e.nativeEvent.getCoalescedEvents?.() ?? []
              const el = e.currentTarget
              const next = evs.length ? evs.map((x) => pt(x, el)) : [pt(e, el)]
              cur.current = { ...s, pts: [...s.pts, ...next] }
              repaint([...v.strokes, cur.current])
            }}
            onPointerUp={end}
            onPointerCancel={end}
          />
          {!n && !drawing && !art && (
            <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs text-zinc-500">
              {t(live ? L("Draw here", "Gambar di sini") : L("Nothing drawn", "Belum ada coretan"))}
            </span>
          )}
        </div>
      </div>
      <p id={`${id}-help`} className={cn("text-xs text-muted-foreground", compact && "text-pretty")}>
        {t(helpText)}
        {live && n > 0 && !compact && ` ${t(L("· Ctrl+Z undoes", "· Ctrl+Z mengurungkan"))}`}
      </p>
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

function backgroundSpec(p: DrawingProps) {
  if (p.background === "car") return { type: "car", view: "top", front: "right" }
  if (p.background === "grid") return { type: "grid", cell_px: GRID_CELL }
  if (p.background === "upload") {
    const f = p.picture ? PICTURES[p.picture] : null
    return { type: "upload", file: f ? { file_id: f.file_id, file_name: f.file_name, mime: f.mime, size: f.size, width: f.width, height: f.height } : null }
  }
  return { type: "none" }
}

export const drawing: ComponentDef<DrawingProps, DrawingValue> = {
  slug: "drawing",
  wave: 4,
  week: 6,
  ui: "DRAWING",
  vk: "file",
  group: "field",
  icon: PaintBrush01Icon,
  label: L("Drawing", "Sketsa"),
  title: L("Drawing", "Sketsa"),
  blurb: L(
    "Draw or mark on a blank canvas, a grid, a car outline or a picture. Saved as one PNG.",
    "Menggambar atau menandai di kanvas kosong, kisi, garis mobil, atau gambar. Disimpan sebagai satu PNG.",
  ),

  defaults: () => ({
    label: L("Mark scratches or dents", "Tandai goresan atau penyok"),
    name: "damage_sketch",
    background: "car",
    picture: "",
    colors: ["red", "blue", "black"],
    sizes: ["thin", "medium", "thick"],
    eraser: true,
    heightPx: 360,
    required: true,
  }),
  schema: (p) => [
    {
      tab: "general",
      fields: [
        F.name(L("Name", "Nama"), {
          hint: L(
            "Shown above the canvas. Start with a verb (“Mark …”) and the required message reuses it.",
            "Tampil di atas kanvas. Awali dengan kata kerja (“Tandai …”) agar pesan wajib memakainya.",
          ),
        }),
        F.key(L("Holds the PNG file after submit.", "Menyimpan berkas PNG setelah dikirim.")),
      ],
    },
    {
      tab: "general",
      title: L("Background", "Latar"),
      fields: [
        {
          t: "seg",
          k: "background",
          label: L("Draw on", "Gambar di atas"),
          options: BACKGROUNDS,
          hint: L("The background is merged into the saved PNG.", "Latar ikut digabung ke PNG yang disimpan."),
        },
        {
          t: "note",
          when: (o) => o.background === "car",
          text: L(
            "Built-in car outline seen from above, front to the right, with **LEFT / RIGHT / FRONT / REAR** printed around it.",
            "Garis mobil bawaan tampak atas, depan di kanan, dengan tulisan **KIRI / KANAN / DEPAN / BELAKANG** di sekelilingnya.",
          ),
        },
        {
          t: "custom",
          id: "picture",
          label: L("Picture", "Gambar"),
          when: (o) => o.background === "upload",
          render: ({ props, set }) => <PicturePicker value={props.picture} onChange={(picture) => set({ picture })} />,
          validate: (_, o) => (o.picture ? null : L("Pick the picture to draw on", "Pilih gambar yang akan ditandai")),
        },
      ],
    },
    {
      tab: "general",
      title: L("Tools", "Alat"),
      fields: [
        {
          t: "custom",
          id: "colors",
          label: L("Pen colours", "Warna pena"),
          render: ({ props, set }) => <InkPicker value={props.colors} onChange={(colors) => set({ colors })} />,
          validate: (_, o) => (o.colors.length ? null : L("Pick at least one colour", "Pilih minimal satu warna")),
        },
        {
          t: "chips",
          k: "sizes",
          label: L("Line sizes", "Ketebalan garis"),
          options: SIZE_KEYS.map((k) => ({ v: k, label: SIZES[k].label })),
          hint: L("Thin 2 px, medium 4 px, thick 8 px. Medium is picked first when it is on.", "Tipis 2 px, sedang 4 px, tebal 8 px. Sedang terpilih pertama bila aktif."),
        },
        {
          t: "switch",
          k: "eraser",
          label: L("Eraser", "Penghapus"),
          hint: L("Rubs out ink only; the background stays.", "Hanya menghapus tinta; latarnya tetap."),
        },
        {
          t: "number",
          k: "heightPx",
          label: L("Canvas height", "Tinggi kanvas"),
          min: 240,
          max: 600,
          step: 20,
          suffix: "px",
          allowEmpty: true,
          validate: (v) => {
            const x = Number(v)
            return v === "" || Number.isNaN(x) || x < 240 || x > 600 ? L("Use 240–600 px", "Gunakan 240–600 px") : null
          },
          hint: L(
            "Width follows the form. With a car or a picture the canvas keeps the picture's shape, so it is lower on phones.",
            "Lebarnya mengikuti form. Dengan mobil atau gambar, kanvas mengikuti bentuk gambarnya, jadi lebih pendek di ponsel.",
          ),
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        F.required(
          L(
            `Message: “${requiredMsg(p).en}”. Checked by counting marks. If “no damage” is a valid answer, keep it optional and add a checkbox.`,
            `Pesan: “${requiredMsg(p).id}”. Dicek dengan menghitung coretan. Bila “tidak ada kerusakan” jawaban yang sah, biarkan opsional dan tambah checkbox.`,
          ),
        ),
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: DrawingCanvas,
  canvasWarn: (p) =>
    p.background === "upload" && !p.picture
      ? L("No picture chosen", "Belum ada gambar")
      : !p.colors.length
        ? L("No pen colour", "Belum ada warna pena")
        : !p.sizes.length
          ? L("No line size", "Belum ada ketebalan garis")
          : null,

  Runtime: DrawingRuntime,
  devices: true,
  initial: () => ({ strokes: [], w: 0, h: 0 }),
  sample: (p) => {
    const s = sheetOf(p, TYPICAL_W)
    return { strokes: sampleStrokes(p), w: s.w, h: s.h }
  },
  validate: (p, r) => (p.required && !inkCount(r.strokes) ? [{ fid: "sheet", msg: requiredMsg(p) }] : []),
  value: (p, r) => {
    const png = toPng(p, r)
    return png ? { file_name: fileName(p), mime: "image/png", size: png.size, width: png.w, height: png.h } : null
  },

  spec: (p) => ({
    ui_type: "DRAWING",
    value_kind: "file",
    name: p.name,
    label: p.label,
    required: p.required,
    config: {
      background: backgroundSpec(p),
      colors: p.colors.map((k) => INKS[k].hex),
      sizes: p.sizes,
      eraser: p.eraser,
      height_px: Number(p.heightPx),
      output_mime: "image/png",
    },
  }),
  savedAs: (p) =>
    L(
      `One PNG file in \`${p.name}\` (background and marks merged), uploaded through the same file pipeline as File Upload.`,
      `Satu berkas PNG di \`${p.name}\` (latar dan coretan digabung), diunggah lewat jalur berkas yang sama dengan File Upload.`,
    ),
  notes: [
    L(
      "`value_kind: \"file\"` like Signature pad: one PNG with the background merged in. Strokes are not stored, so a draft, history or a later step gets the picture, not editable strokes. `file_id` is added by the upload pipeline.",
      "`value_kind: \"file\"` seperti Signature pad: satu PNG dengan latar tergabung. Goresan tidak disimpan, jadi draft, history, atau langkah berikutnya menerima gambar, bukan goresan yang bisa diedit. `file_id` ditambahkan oleh jalur unggah.",
    ),
    L(
      "While the task is open, strokes stay vectors (0–1 of the sheet), so the canvas redraws sharp on resize and on high-DPI screens. With a car or a picture the sheet keeps the picture's shape, so a mark stays on the same spot from desktop to phone.",
      "Selama task terbuka, goresan tetap vektor (0–1 dari lembar), jadi kanvas digambar ulang tajam saat ukuran berubah dan di layar high-DPI. Dengan mobil atau gambar, lembar mengikuti bentuk gambarnya, jadi coretan tetap di titik yang sama dari desktop ke ponsel.",
    ),
    L(
      "Two layers: the background is SVG under a transparent ink canvas, and the eraser (`destination-out`) only touches the ink. On submit the same art is drawn with `Path2D` under the ink and exported as PNG.",
      "Dua lapis: latar berupa SVG di bawah kanvas tinta transparan, dan penghapus (`destination-out`) hanya mengenai tinta. Saat dikirim, gambar yang sama digambar dengan `Path2D` di bawah tinta lalu diekspor sebagai PNG.",
    ),
    L(
      "Pointer events cover mouse, touch and stylus; `touch-action: none` stops the page scrolling while drawing. Ctrl+Z / ⌘Z undoes; Clear asks first.",
      "Pointer events menangani mouse, sentuh, dan stylus; `touch-action: none` mencegah halaman ikut bergulir saat menggambar. Ctrl+Z / ⌘Z mengurungkan; Hapus meminta konfirmasi dulu.",
    ),
    L(
      "Ink colours are data (hex in the spec), not theme colours; the sheet stays white “paper” in the dark theme so the PNG matches the screen.",
      "Warna tinta adalah data (hex di spec), bukan warna tema; lembar tetap “kertas” putih di tema gelap agar PNG sama dengan layar.",
    ),
  ],
  story: {
    process: L("Company car return", "Pengembalian mobil dinas"),
    step: L("Vehicle check", "Pemeriksaan kendaraan"),
    ref: "VH-2026-0261",
    due: "2026-11-16",
    task: L("Check the returned car: Toyota Avanza B 1873 TKR", "Periksa mobil dinas yang dikembalikan: Toyota Avanza B 1873 TKR"),
    before: [
      {
        name: "odometer_km",
        label: L("Odometer (km)", "Odometer (km)"),
        type: "number",
        required: true,
        value: "",
        placeholder: L("e.g. 48215", "mis. 48215"),
        hint: L("Out: 47,890 km on 12 Nov (Budi Santoso).", "Keluar: 47.890 km pada 12 Nov (Budi Santoso)."),
      },
      {
        name: "fuel_level",
        label: L("Fuel level", "Level BBM"),
        type: "select",
        required: true,
        value: "",
        options: [
          { v: "full", label: L("Full", "Penuh") },
          { v: "three_quarters", label: L("¾", "¾") },
          { v: "half", label: L("½", "½") },
          { v: "quarter", label: L("¼", "¼") },
          { v: "reserve", label: L("Reserve light on", "Lampu cadangan menyala") },
        ],
      },
    ],
    after: [
      {
        name: "return_notes",
        label: L("Notes", "Catatan"),
        type: "textarea",
        rows: 3,
        value: "",
        placeholder: L(
          "e.g. Scratch on the rear bumper was already there (see VH-2026-0198).",
          "mis. Goresan di bumper belakang sudah ada sebelumnya (lihat VH-2026-0198).",
        ),
      },
    ],
  },
}
