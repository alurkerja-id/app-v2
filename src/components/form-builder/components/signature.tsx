/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { EraserIcon, SignatureIcon, Undo02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { L, useT, type L10n } from "../i18n"
import { F, TODAY } from "../lib"
import type { ComponentDef, RuntimeProps } from "../types"

/* Signature pad — ui_type SIGNATURE, value_kind "file". Story: signing a business trip report. */

type Pen = "black" | "blue"
/** x, y as 0–1 of the pad, so a stroke survives a resize. */
type Point = [number, number]

interface SignatureProps {
  label: L10n
  name: string
  pen: Pen
  /** px; "" while the stepper is being edited. */
  height: number | ""
  required: boolean
}
interface SignatureValue {
  strokes: Point[][]
  /** Pad size (CSS px) when the last stroke ended — the PNG size. 0 = not drawn here. */
  w: number
  h: number
  /** HH:MM of the last stroke, for `signed_at`. */
  at: string
}

/* Pen colors are data (saved as hex in the spec), not theme colors. */
const PENS: Record<Pen, { color: string; label: L10n }> = {
  black: { color: "#171717", label: L("Black", "Hitam") },
  blue: { color: "#226ABE", label: L("Studio blue", "Biru Studio") },
}
const PEN_KEYS: Pen[] = ["black", "blue"]
const ink = (p: SignatureProps) => (PENS[p.pen] ?? PENS.black).color
const padH = (p: SignatureProps) => Math.min(320, Math.max(120, Number(p.height) || 180))

/* The pad stays light "paper" in the dark theme (like --form-pad in Studio), so
   the ink keeps its colour on screen and in the saved PNG. */
const PAPER = "bg-white dark:bg-zinc-100"

/* ── sample signature (canvas preview + Read-only / Disabled sample) ───── */

const SAMPLE =
  "M18 62 C 30 30, 46 22, 52 44 S 50 78, 64 70 S 86 30, 96 40 S 98 66, 110 60 C 120 54, 124 40, 134 44 C 142 48, 138 62, 148 60 C 160 58, 168 36, 182 42 C 192 46, 186 62, 198 60 C 214 57, 226 46, 246 50"

/** The SAMPLE path (M / C / S only) as one stroke of pad-relative points. */
function sampleStroke(): Point[] {
  const tok = SAMPLE.match(/[MCS]|-?\d*\.?\d+/g) ?? []
  const pts: Point[] = []
  let i = 0
  let cmd = ""
  let x = 0
  let y = 0
  let cx = 0
  let cy = 0
  const num = () => Number(tok[i++])
  const cubic = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    for (let s = 1; s <= 10; s++) {
      const t = s / 10
      const u = 1 - t
      pts.push([u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3])
    }
    ;[x, y, cx, cy] = [x3, y3, x2, y2]
  }
  while (i < tok.length) {
    if (/^[MCS]$/.test(tok[i])) cmd = tok[i++]
    if (cmd === "M") {
      x = cx = num()
      y = cy = num()
      pts.push([x, y])
    } else if (cmd === "C") cubic(num(), num(), num(), num(), num(), num())
    else if (cmd === "S") cubic(2 * x - cx, 2 * y - cy, num(), num(), num(), num())
    else i++
  }
  // viewBox 264 × 100 → the middle of the pad, resting on the line at 70 %.
  return pts.map(([px, py]) => [0.3 + 0.4 * (px / 264), 0.1 + 0.62 * (py / 100)])
}
const SAMPLE_STROKE = sampleStroke()

/* ── drawing ────────────────────────────────────────────────────────────── */

function drawAll(c: CanvasRenderingContext2D, strokes: Point[][], w: number, h: number, scale: number, color: string) {
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.clearRect(0, 0, c.canvas.width, c.canvas.height)
  c.lineCap = "round"
  c.lineJoin = "round"
  c.strokeStyle = color
  c.fillStyle = color
  c.lineWidth = 2.4 * scale
  for (const s of strokes) {
    const p = s.map(([x, y]) => [x * w * scale, y * h * scale] as const)
    if (!p.length) continue
    c.beginPath()
    if (p.length === 1) {
      c.arc(p[0][0], p[0][1], 1.2 * scale, 0, Math.PI * 2)
      c.fill()
      continue
    }
    c.moveTo(p[0][0], p[0][1])
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i][0] + p[i + 1][0]) / 2
      const my = (p[i][1] + p[i + 1][1]) / 2
      c.quadraticCurveTo(p[i][0], p[i][1], mx, my)
    }
    c.lineTo(p[p.length - 1][0], p[p.length - 1][1])
    c.stroke()
  }
}

/** The PNG that would be uploaded: transparent background, ink in the pen color. */
function toPng(p: SignatureProps, r: SignatureValue) {
  if (!r.strokes.length || typeof document === "undefined") return null
  const w = Math.round(r.w || 600)
  const h = Math.round(r.h || padH(p))
  const cv = document.createElement("canvas")
  cv.width = w
  cv.height = h
  const c = cv.getContext("2d")
  if (!c) return null
  drawAll(c, r.strokes, w, h, 1, ink(p))
  const url = cv.toDataURL("image/png")
  const b64 = url.split(",")[1] ?? ""
  return { w, h, size: Math.round((b64.length * 3) / 4) - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0) }
}

const clock = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

/* ── shared bits ────────────────────────────────────────────────────────── */

/** Paper, signing line and "×". */
function Pad({ height, className, children, ref }: { height: number; className?: string; children: ReactNode; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={cn("relative overflow-hidden rounded-2xl border border-border", PAPER, className)} style={{ height }}>
      {children}
      <span className="pointer-events-none absolute bottom-[calc(30%+4px)] left-6 text-base font-semibold text-zinc-500" aria-hidden>
        ×
      </span>
      <span className="pointer-events-none absolute inset-x-6 bottom-[30%] border-b-[1.5px] border-dashed border-zinc-300" aria-hidden />
    </div>
  )
}

const HELP = L("Draw with a mouse, finger or stylus.", "Gambar dengan mouse, jari, atau stylus.")

/* ── builder ────────────────────────────────────────────────────────────── */

function SignatureCanvas({ props: p }: { props: SignatureProps }) {
  const t = useT()
  const fake = cn(buttonVariants({ variant: "ghost", size: "xs" }), "pointer-events-none")
  return (
    <div className="flex flex-col gap-1.5">
      <Pad height={padH(p)}>
        <svg viewBox="0 0 264 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" aria-hidden>
          <path d={SAMPLE} fill="none" stroke={ink(p)} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Pad>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="min-w-40 flex-1 text-xs text-muted-foreground">{t(HELP)}</span>
        <span className={fake} aria-hidden>
          <HugeiconsIcon icon={Undo02Icon} />
          {t(L("Undo", "Urungkan"))}
        </span>
        <span className={fake} aria-hidden>
          <HugeiconsIcon icon={EraserIcon} />
          {t(L("Clear", "Hapus"))}
        </span>
      </div>
    </div>
  )
}

/** Edit Element: color swatches (the hex is saved, never typed). */
function PenPicker({ value, onChange }: { value: Pen; onChange: (pen: Pen) => void }) {
  const t = useT()
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <Label id={id} className="text-sm font-medium">
        {t(L("Pen color", "Warna pena"))}
      </Label>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={value}
        aria-labelledby={id}
        onValueChange={(v) => {
          if (v === "black" || v === "blue") onChange(v)
        }}
        className="flex-wrap"
      >
        {PEN_KEYS.map((k) => (
          <ToggleGroupItem key={k} value={k} className="gap-2 px-3 text-xs">
            <span className="size-3.5 shrink-0 rounded-full ring-1 ring-border" style={{ background: PENS[k].color }} aria-hidden />
            {t(PENS[k].label)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

interface PadSize {
  w: number
  h: number
  dpr: number
}

function paint(cv: HTMLCanvasElement | null, strokes: Point[][], size: PadSize, color: string) {
  const c = cv?.getContext("2d")
  if (c && size.w) drawAll(c, strokes, size.w, size.h, size.dpr, color)
}

function SignatureRuntime({ props: p, value: v, onChange, state, issues, id }: RuntimeProps<SignatureProps, SignatureValue>) {
  const t = useT()
  const padRef = useRef<HTMLDivElement>(null)
  const cvRef = useRef<HTMLCanvasElement>(null)
  const cur = useRef<Point[] | null>(null)
  const [size, setSize] = useState<PadSize>({ w: 0, h: 0, dpr: 1 })
  const [drawing, setDrawing] = useState(false)
  const live = state === "active"
  const bad = issues.length > 0
  const n = v.strokes.length
  const color = ink(p)

  /* Canvas follows the pad (inside its border): width from the form, height from Canvas height. */
  useEffect(() => {
    const pad = padRef.current
    if (!pad) return
    const ro = new ResizeObserver(() => {
      const next = { w: pad.clientWidth, h: pad.clientHeight, dpr: window.devicePixelRatio || 1 }
      setSize((s) => (s.w === next.w && s.h === next.h && s.dpr === next.dpr ? s : next))
    })
    ro.observe(pad)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    paint(cvRef.current, cur.current ? [...v.strokes, cur.current] : v.strokes, size, color)
  }, [v.strokes, size, color])

  const pt = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect()
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]
  }
  const end = () => {
    const s = cur.current
    if (!s) return
    cur.current = null
    setDrawing(false)
    onChange({ strokes: [...v.strokes, s], w: size.w, h: size.h, at: clock() })
  }
  const edit = (strokes: Point[][]) => {
    onChange({ ...v, strokes })
    // The button that was used turns disabled when nothing is left: keep focus on the pad.
    if (!strokes.length) requestAnimationFrame(() => cvRef.current?.focus())
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Pad
        ref={padRef}
        height={padH(p)}
        className={cn(
          "touch-none has-[canvas:focus-visible]:ring-3 has-[canvas:focus-visible]:ring-ring/40",
          bad && "border-destructive",
          state === "disabled" && "opacity-60",
        )}
      >
        <canvas
          ref={cvRef}
          id={`${id}-input`}
          width={Math.max(1, Math.round(size.w * size.dpr))}
          height={Math.max(1, Math.round(size.h * size.dpr))}
          role="img"
          tabIndex={state === "disabled" ? -1 : 0}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-help`}
          aria-invalid={bad || undefined}
          aria-disabled={state === "disabled" || undefined}
          aria-readonly={state === "readonly" || undefined}
          className={cn(
            "absolute inset-0 z-10 size-full touch-none outline-none",
            live ? "cursor-crosshair" : state === "disabled" ? "cursor-not-allowed" : "cursor-default",
          )}
          onPointerDown={(e) => {
            if (!live || (e.pointerType === "mouse" && e.button !== 0)) return
            e.preventDefault()
            e.currentTarget.focus()
            e.currentTarget.setPointerCapture(e.pointerId)
            cur.current = [pt(e)]
            setDrawing(true)
            paint(cvRef.current, [...v.strokes, cur.current], size, color)
          }}
          onPointerMove={(e) => {
            if (!cur.current) return
            cur.current = [...cur.current, pt(e)]
            paint(cvRef.current, [...v.strokes, cur.current], size, color)
          }}
          onPointerUp={end}
          onPointerCancel={end}
        />
        {!n && !drawing && (
          <span className="pointer-events-none absolute inset-x-0 bottom-[calc(30%-24px)] text-center text-xs text-zinc-500">
            {t(L("Sign above the line", "Tanda tangan di atas garis"))}
          </span>
        )}
      </Pad>
      <div className="flex flex-wrap items-center gap-1.5">
        <span id={`${id}-help`} className="min-w-40 flex-1 text-xs text-muted-foreground">
          {t(n ? L(`${n} stroke${n > 1 ? "s" : ""} · saved as PNG on submit`, `${n} goresan · disimpan sebagai PNG saat dikirim`) : HELP)}
        </span>
        {live && (
          <>
            <Button variant="ghost" size="xs" disabled={!n} onClick={() => edit(v.strokes.slice(0, -1))}>
              <HugeiconsIcon icon={Undo02Icon} />
              {t(L("Undo", "Urungkan"))}
            </Button>
            <Button variant="ghost" size="xs" disabled={!n} onClick={() => edit([])}>
              <HugeiconsIcon icon={EraserIcon} />
              {t(L("Clear", "Hapus"))}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export const signature: ComponentDef<SignatureProps, SignatureValue> = {
  slug: "signature",
  wave: 1,
  ui: "SIGNATURE",
  vk: "file",
  group: "field",
  week: 2,
  icon: SignatureIcon,
  label: L("Signature pad", "Tanda tangan"),
  title: L("Signature pad", "Tanda tangan"),
  blurb: L("Draw a signature with mouse, finger or stylus. Saved as a PNG file.", "Tanda tangan digambar dengan mouse, jari, atau stylus. Disimpan sebagai berkas PNG."),

  defaults: () => ({
    label: L("Employee signature", "Tanda tangan pegawai"),
    name: "employee_signature",
    pen: "black",
    height: 180,
    required: true,
  }),
  schema: () => [
    { tab: "general", fields: [F.name(), F.key(L("Holds the PNG file after submit.", "Menyimpan berkas PNG setelah dikirim."))] },
    {
      tab: "general",
      title: L("Pad", "Bidang tanda tangan"),
      fields: [
        { t: "custom", id: "pen", render: ({ props, set }) => <PenPicker value={props.pen} onChange={(pen) => set({ pen })} /> },
        {
          t: "number",
          k: "height",
          label: L("Canvas height", "Tinggi bidang"),
          min: 120,
          max: 320,
          step: 20,
          suffix: "px",
          allowEmpty: true,
          validate: (v) => {
            const x = Number(v)
            return v === "" || Number.isNaN(x) || x < 120 || x > 320 ? L("Use 120–320 px", "Gunakan 120–320 px") : null
          },
          hint: L("Width always follows the form.", "Lebarnya selalu mengikuti form."),
        },
      ],
    },
    {
      tab: "validation",
      fields: [F.required(L("Checked by counting strokes; the server checks that the file exists.", "Dicek dengan menghitung goresan; server mengecek berkasnya ada."))],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: SignatureCanvas,

  Runtime: SignatureRuntime,
  initial: () => ({ strokes: [], w: 0, h: 0, at: "" }),
  sample: (p) => ({ strokes: [SAMPLE_STROKE], w: 768, h: padH(p) - 2, at: "09:32" }),
  validate: (p, r) =>
    p.required && !r.strokes.length
      ? [{ fid: "pad", msg: L(`${p.label.en} is required — sign in the box`, `${p.label.id} wajib diisi — tanda tangani di kotak`) }]
      : [],
  value: (p, r) => {
    const png = toPng(p, r)
    if (!png) return null
    return {
      file_name: "signature.png",
      mime: "image/png",
      size: png.size,
      width: png.w,
      height: png.h,
      signed_at: `${TODAY}T${r.at || "00:00"}:00+07:00`,
    }
  },

  spec: (p) => ({
    ui_type: "SIGNATURE",
    value_kind: "file",
    name: p.name,
    label: p.label,
    required: p.required,
    config: { pen_color: ink(p), canvas_height: Number(p.height), output_mime: "image/png" },
  }),
  savedAs: (p) =>
    L(
      `A PNG file in \`${p.name}\`, uploaded through the same file pipeline as File Upload.`,
      `Berkas PNG di \`${p.name}\`, diunggah lewat jalur berkas yang sama dengan File Upload.`,
    ),
  notes: [
    L(
      "`value_kind: \"file\"`: draft, history and bulk complete treat it like any attachment, so no new reader code is needed beyond the spec.",
      "`value_kind: \"file\"`: draft, history, dan bulk complete memperlakukannya seperti lampiran biasa, jadi tidak perlu kode pembaca baru selain spec.",
    ),
    L(
      "Pointer events cover mouse, touch and stylus with one code path; `touch-action: none` stops the page scrolling while signing.",
      "Pointer events menangani mouse, sentuh, dan stylus dalam satu jalur; `touch-action: none` mencegah halaman ikut bergulir saat menandatangani.",
    ),
    L(
      "The pad keeps a light “paper” surface in the dark theme (`--form-pad`), so the ink in the saved PNG looks the same in both themes.",
      "Bidang tetap berwarna “kertas” terang di tema gelap (`--form-pad`), jadi tinta di PNG tersimpan tampak sama di kedua tema.",
    ),
    L(
      "Required is checked in the browser by counting strokes; the server checks that the file exists.",
      "Required dicek di browser dengan menghitung goresan; server mengecek berkasnya ada.",
    ),
    L("The PNG has a transparent background with ink in the Pen color.", "PNG berlatar transparan dengan tinta sesuai Pen color."),
  ],
  story: {
    process: L("Business trip report", "Laporan perjalanan dinas"),
    step: L("Employee sign-off", "Pengesahan pegawai"),
    ref: "PD-2026-0217",
    due: "2026-10-07",
    task: L("Sign the trip report", "Tanda tangani laporan perjalanan"),
    before: [
      {
        name: "trip_summary",
        label: L("Trip summary", "Ringkasan perjalanan"),
        type: "textarea",
        required: true,
        rows: 2,
        value: "Surabaya, 1–3 Oktober 2026. Pendampingan go-live AlurKerja di kantor cabang.",
      },
      {
        name: "statement_true",
        label: L("I confirm this report and its receipts are accurate.", "Saya menyatakan laporan dan bukti pengeluaran ini benar."),
        type: "checkbox",
        required: true,
        value: "",
        requiredMsg: L("Confirm that the report is accurate", "Centang pernyataan bahwa laporan benar"),
      },
    ],
  },
}
