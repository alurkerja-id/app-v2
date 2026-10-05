/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useEffectEvent, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Gps01Icon, Location01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { L, useT, type L10n } from "../i18n"
import { F, TODAY, issuesFor } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"

/* Location pin — ui_type LOCATION, value_kind "json". Story: field visit check-in.
   No real geolocation and no map provider (open decision 4): GPS is simulated (Controls) and the map is an SVG mock. */

type CaptureMode = "gps" | "gps_adjust" | "map"
const MODES: Record<CaptureMode, L10n> = {
  gps: L("GPS only", "GPS saja"),
  gps_adjust: L("GPS, then adjust", "GPS, lalu geser"),
  map: L("Pick on map", "Pilih di peta"),
}

interface LocationProps {
  label: L10n
  name: string
  mode: CaptureMode
  maxAccuracy: number
  showAddress: boolean
  required: boolean
}

interface Pos {
  lat: number
  lng: number
  accuracy_m: number | null
  source: "gps" | "manual"
  captured_at: string
  address: string
}
type GpsSim = "good" | "weak" | "denied"
/** Runtime state. `pos` becomes the payload object; the rest drives the simulated GPS. */
interface LocationValue {
  pos: Pos | null
  busy: boolean
  denied: boolean
  sim: GpsSim
}

/* The mock map is 400 × 210 units centred on the Surabaya branch office. */
const BASE = { lat: -7.26521, lng: 112.75173 }
const DEG_PER_PX = 0.00005
const MAP_W = 400
const MAP_H = 210
const ADDRESS = "Gubeng, Surabaya, Jawa Timur"
const GPS_MS = 1100

interface Pt {
  x: number
  y: number
}
const pxOf = (pos: Pos): Pt => ({ x: MAP_W / 2 + (pos.lng - BASE.lng) / DEG_PER_PX, y: MAP_H / 2 - (pos.lat - BASE.lat) / DEG_PER_PX })
const coordsOf = (pt: Pt) => ({
  lat: +(BASE.lat - (pt.y - MAP_H / 2) * DEG_PER_PX).toFixed(6),
  lng: +(BASE.lng + (pt.x - MAP_W / 2) * DEG_PER_PX).toFixed(6),
})
const clampPt = (pt: Pt): Pt => ({ x: Math.max(0, Math.min(MAP_W, pt.x)), y: Math.max(0, Math.min(MAP_H, pt.y)) })
const pctStyle = (pt: Pt) => ({ left: `${(pt.x / MAP_W) * 100}%`, top: `${(pt.y / MAP_H) * 100}%` })
const maxAcc = (p: LocationProps) => Number(p.maxAccuracy)

/** ISO 8601 with the Jakarta offset, on the prototype's fixed date. */
const stamp = () => {
  const d = new Date()
  return `${TODAY}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00+07:00`
}

/* ── mock map ─────────────────────────────────────────────────────────────── */

const BLOCKS: [number, number, number, number][] = [
  [20, 18, 110, 60],
  [160, 18, 90, 60],
  [280, 18, 100, 60],
  [20, 110, 80, 80],
  [130, 110, 120, 80],
  [280, 110, 100, 80],
]

/** City blocks, roads and a river. Token colours, so it follows light / dark. */
function MapBackdrop() {
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
      {BLOCKS.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx={4} className="fill-background" />
      ))}
      <g fill="none" className="stroke-muted-foreground/25">
        <path strokeWidth={12} d="M0 94 H400" />
        <path strokeWidth={10} d="M145 0 V210" />
        <path strokeWidth={8} d="M265 0 V210" />
      </g>
      {/* water, not an accent element */}
      <path fill="none" strokeWidth={10} className="stroke-sky-300/70 dark:stroke-sky-500/30" d="M0 200 C 90 170, 160 215, 250 196 S 360 175, 400 186" />
    </svg>
  )
}

function MapTag({ text }: { text: L10n }) {
  const t = useT()
  return (
    <span className="pointer-events-none absolute top-2 left-2 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
      {t(text)}
    </span>
  )
}

/** Map marker; the tip sits on the point. */
function PinMark({ muted }: { muted?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-[34px] stroke-card", muted ? "fill-muted-foreground" : "fill-primary")} strokeWidth={1.5} aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" className="fill-card" />
    </svg>
  )
}

const PREVIEW_TAG = L("Map preview · provider not decided", "Pratinjau peta · penyedia belum diputuskan")
const MAP_BOX = "relative h-[210px] overflow-hidden rounded-2xl border border-border bg-muted"

/* ── canvas ───────────────────────────────────────────────────────────────── */

function LocationCanvas({ props: p }: { props: LocationProps }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-2">
      {p.mode !== "map" && (
        <div>
          <span className={buttonVariants({ variant: "outline", size: "sm" })}>
            <HugeiconsIcon icon={Gps01Icon} />
            {t(L("Use my current location", "Pakai lokasi saya sekarang"))}
          </span>
        </div>
      )}
      <div className={MAP_BOX}>
        <MapBackdrop />
        <MapTag text={PREVIEW_TAG} />
      </div>
      <p className="text-xs text-muted-foreground">
        {t(MODES[p.mode])}
        {p.mode !== "map" && ` · ${t(L(`accuracy ≤ ${maxAcc(p)} m`, `akurasi ≤ ${maxAcc(p)} m`))}`}
      </p>
    </div>
  )
}

/* ── runtime ──────────────────────────────────────────────────────────────── */

const NUDGE: Record<string, Pt> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } }

function LocationRuntime({ props: p, value: v, onChange, state, issues, id }: RuntimeProps<LocationProps, LocationValue>) {
  const t = useT()
  const map = useRef<HTMLDivElement>(null)
  /* Drag: `drag` paints the pin while it moves; the ref keeps the last point for the commit on pointerup. */
  const dragPt = useRef<Pt | null>(null)
  const dragging = useRef(false)
  const [drag, setDrag] = useState<Pt | null>(null)
  const live = state === "active"
  const busy = live && v.busy
  const pos = v.pos
  const canDrag = live && pos != null && p.mode !== "gps"
  const pickOnMap = live && p.mode === "map"
  const bad = issuesFor(issues, "loc-btn").length > 0

  /* The simulated GPS answers after 1.1 s. Reset, a state change or unmount clears the timer. */
  const settle = useEffectEvent(() => {
    onChange({
      ...v,
      busy: false,
      pos: { lat: BASE.lat, lng: BASE.lng, accuracy_m: v.sim === "weak" ? 120 : 18, source: "gps", captured_at: stamp(), address: ADDRESS },
    })
  })
  useEffect(() => {
    if (!busy) return
    const timer = window.setTimeout(() => settle(), GPS_MS)
    return () => window.clearTimeout(timer)
  }, [busy])

  const locate = () => {
    if (!live || v.busy) return
    if (v.sim === "denied") return onChange({ ...v, denied: true })
    onChange({ ...v, denied: false, busy: true })
  }

  const toMap = (clientX: number, clientY: number): Pt => {
    const r = map.current?.getBoundingClientRect()
    if (!r || !r.width || !r.height) return { x: MAP_W / 2, y: MAP_H / 2 }
    return clampPt({ x: ((clientX - r.left) / r.width) * MAP_W, y: ((clientY - r.top) / r.height) * MAP_H })
  }
  /** Pin moved by hand: the reading is no longer GPS. */
  const moveTo = (pt: Pt) => pos && onChange({ ...v, pos: { ...pos, ...coordsOf(pt), accuracy_m: null, source: "manual" } })
  const dropAt = (pt: Pt) => {
    onChange({ ...v, pos: { ...coordsOf(pt), accuracy_m: null, source: "manual", captured_at: stamp(), address: ADDRESS } })
    requestAnimationFrame(() => map.current?.querySelector<HTMLButtonElement>("[data-locpin]")?.focus())
  }

  const pinAt = drag ?? (pos ? pxOf(pos) : null)
  const accR = pos?.accuracy_m && !drag ? Math.max(14, pos.accuracy_m / 2) : 0
  /* Pick on map with no pin yet: the map itself takes Enter / Space for keyboard users. */
  const mapIsButton = pickOnMap && !pos
  const tag = pickOnMap && !pos ? L("Tap the map to drop a pin", "Ketuk peta untuk menaruh titik") : PREVIEW_TAG

  return (
    <div role="group" aria-labelledby={`${id}-label`} id={`${id}-input`} tabIndex={-1} className="flex flex-col gap-2.5 outline-none">
      {live && v.denied && (
        <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400">
          <HugeiconsIcon icon={Alert02Icon} />
          <AlertTitle className="text-foreground">{t(L("Location access is blocked", "Akses lokasi diblokir"))}</AlertTitle>
          <AlertDescription>{t(L("Allow location in the browser settings and try again.", "Izinkan lokasi di pengaturan browser lalu coba lagi."))}</AlertDescription>
        </Alert>
      )}

      {live && p.mode !== "map" && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" disabled={busy} aria-busy={busy || undefined} aria-invalid={bad || undefined} onClick={locate}>
            {busy ? <Spinner aria-hidden /> : <HugeiconsIcon icon={Gps01Icon} />}
            {t(
              busy
                ? L("Finding your location…", "Mencari lokasi Anda…")
                : pos
                  ? L("Use my location again", "Ambil lokasi lagi")
                  : L("Use my current location", "Pakai lokasi saya sekarang"),
            )}
          </Button>
        </div>
      )}

      <div
        ref={map}
        role={mapIsButton ? "button" : undefined}
        tabIndex={mapIsButton ? 0 : undefined}
        aria-label={mapIsButton ? t(tag) : undefined}
        aria-invalid={(mapIsButton && bad) || undefined}
        className={cn(
          MAP_BOX,
          "outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40",
          pickOnMap && "cursor-crosshair",
          bad && p.mode === "map" && "border-destructive/60",
          state === "disabled" && "opacity-60",
        )}
        onClick={(e) => pickOnMap && dropAt(toMap(e.clientX, e.clientY))}
        onKeyDown={(e) => {
          if (!mapIsButton || (e.key !== "Enter" && e.key !== " ")) return
          e.preventDefault()
          dropAt({ x: MAP_W / 2, y: MAP_H / 2 })
        }}
      >
        <MapBackdrop />
        {accR > 0 && pinAt && (
          <span
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30 bg-primary/15"
            style={{ ...pctStyle(pinAt), width: accR * 2, height: accR * 2 }}
          />
        )}
        {pinAt &&
          (canDrag ? (
            <button
              type="button"
              data-locpin
              aria-label={t(L("Pin · drag it or use the arrow keys", "Titik · geser atau pakai tombol panah"))}
              className="absolute grid -translate-x-1/2 -translate-y-full cursor-grab touch-none place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
              style={pctStyle(pinAt)}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => {
                if (e.button !== 0) return
                e.preventDefault()
                e.currentTarget.focus()
                e.currentTarget.setPointerCapture(e.pointerId)
                dragging.current = true
              }}
              onPointerMove={(e) => {
                if (!dragging.current) return
                dragPt.current = toMap(e.clientX, e.clientY)
                setDrag(dragPt.current)
              }}
              onPointerUp={() => {
                if (!dragging.current) return
                const pt = dragPt.current
                dragging.current = false
                dragPt.current = null
                if (pt) moveTo(pt)
                setDrag(null)
              }}
              onPointerCancel={() => {
                dragging.current = false
                dragPt.current = null
                setDrag(null)
              }}
              onKeyDown={(e) => {
                const d = NUDGE[e.key]
                if (!d || !pos) return
                e.preventDefault()
                const step = e.shiftKey ? 20 : 5
                const at = pxOf(pos)
                moveTo(clampPt({ x: at.x + d.x * step, y: at.y + d.y * step }))
              }}
            >
              <PinMark />
            </button>
          ) : (
            <span role="img" aria-label={t(L("Pin", "Titik"))} className="pointer-events-none absolute grid -translate-x-1/2 -translate-y-full place-items-center" style={pctStyle(pinAt)}>
              <PinMark muted={state === "disabled"} />
            </span>
          ))}
        <MapTag text={tag} />
      </div>

      {pos && (
        <>
          <dl className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            {[
              { k: L("Latitude", "Lintang"), v: pos.lat.toFixed(6) },
              { k: L("Longitude", "Bujur"), v: pos.lng.toFixed(6) },
              { k: L("Accuracy", "Akurasi"), v: pos.accuracy_m ? `± ${pos.accuracy_m} m` : t(L("set by hand", "diatur manual")) },
            ].map((x) => (
              <div key={x.k.en} className="min-w-0">
                <dt>{t(x.k)}</dt>
                <dd className={cn("truncate font-mono text-[13px] font-medium", state === "disabled" ? "text-muted-foreground" : "text-foreground")}>{x.v}</dd>
              </div>
            ))}
          </dl>
          {p.showAddress && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Location01Icon} className="size-3.5 shrink-0" aria-hidden />
              {pos.address}
            </p>
          )}
          {canDrag && (
            <p className="text-xs text-muted-foreground">{t(L("Drag the pin if it is not exactly at the entrance.", "Geser titik bila belum tepat di pintu masuk."))}</p>
          )}
        </>
      )}
    </div>
  )
}

/* ── simulation controls ──────────────────────────────────────────────────── */

const SIMS: { v: GpsSim; label: L10n }[] = [
  { v: "good", label: L("Good signal (± 18 m)", "Sinyal baik (± 18 m)") },
  { v: "weak", label: L("Weak signal (± 120 m)", "Sinyal lemah (± 120 m)") },
  { v: "denied", label: L("Permission denied", "Izin ditolak") },
]

function LocationControls({ value: v, onChange }: { props: LocationProps; value: LocationValue; onChange: (next: LocationValue) => void }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={1}
        value={v.sim}
        aria-label={t(L("Prototype · simulate GPS", "Prototipe · simulasi GPS"))}
        onValueChange={(s) => s && onChange({ ...v, sim: s as GpsSim, denied: false })}
        className="w-full flex-col items-stretch"
      >
        {SIMS.map((s) => (
          <ToggleGroupItem key={s.v} value={s.v} className="justify-start px-3 text-xs">
            {t(s.label)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

/* ── definition ───────────────────────────────────────────────────────────── */

function validate(p: LocationProps, v: LocationValue): Issue[] {
  const pos = v.pos
  if (!pos)
    return p.required
      ? [
          {
            fid: "loc-btn",
            msg: p.mode === "map" ? L("Drop a pin on the map", "Taruh titik di peta") : L("Capture the " + p.label.en.toLowerCase(), "Ambil " + p.label.id.toLowerCase()),
          },
        ]
      : []
  // the limit applies to GPS readings, even when the field is optional
  if (pos.source === "gps" && pos.accuracy_m != null && pos.accuracy_m > maxAcc(p))
    return [
      {
        fid: "loc-btn",
        msg: L(
          `Accuracy is ± ${pos.accuracy_m} m, above the ${maxAcc(p)} m limit. Move to an open area and try again.`,
          `Akurasi ± ${pos.accuracy_m} m, melebihi batas ${maxAcc(p)} m. Pindah ke area terbuka lalu coba lagi.`,
        ),
      },
    ]
  return []
}

export const location: ComponentDef<LocationProps, LocationValue> = {
  slug: "location",
  wave: 2,
  ui: "LOCATION",
  vk: "json",
  group: "field",
  week: 4,
  icon: Location01Icon,
  label: L("Location pin", "Titik lokasi"),
  title: L("Location pin", "Titik lokasi"),
  blurb: L("Capture GPS coordinates with their accuracy, or adjust the pin by hand.", "Ambil koordinat GPS beserta akurasinya, atau geser titiknya secara manual."),

  defaults: () => ({
    label: L("Visit location", "Lokasi kunjungan"),
    name: "visit_location",
    mode: "gps_adjust",
    maxAccuracy: 50,
    showAddress: true,
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(),
        {
          t: "seg",
          k: "mode",
          label: L("How to capture", "Cara mengambil"),
          options: (Object.keys(MODES) as CaptureMode[]).map((k) => ({ v: k, label: MODES[k] })),
          hint: L("“Adjust” lets the user drag the pin after GPS; the value is then marked manual.", "“Geser” membolehkan user menggeser titik setelah GPS; nilainya ditandai manual."),
        },
        {
          t: "number",
          k: "maxAccuracy",
          label: L("Maximum GPS accuracy", "Akurasi GPS maksimal"),
          min: 10,
          max: 500,
          step: 10,
          suffix: "m",
          when: (o) => o.mode !== "map",
          hint: L("Readings less precise than this are rejected.", "Hasil yang kurang presisi dari ini ditolak."),
        },
        {
          t: "switch",
          k: "showAddress",
          label: L("Show the address", "Tampilkan alamat"),
          hint: L("Needs reverse geocoding from the map provider.", "Butuh reverse geocoding dari penyedia peta."),
        },
      ],
    },
    { tab: "validation", fields: [F.required()] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: LocationCanvas,

  Runtime: LocationRuntime,
  Controls: LocationControls,
  // "Pick on map" never asks the GPS, so there is nothing to simulate.
  hasControls: (p) => p.mode !== "map",
  controlsTitle: L("GPS", "GPS"),
  initial: () => ({ pos: null, busy: false, denied: false, sim: "good" }),
  sample: (p) => ({
    pos:
      p.mode === "map"
        ? { lat: BASE.lat, lng: BASE.lng, accuracy_m: null, source: "manual", captured_at: "2026-10-05T09:42:00+07:00", address: ADDRESS }
        : { lat: BASE.lat, lng: BASE.lng, accuracy_m: 18, source: "gps", captured_at: "2026-10-05T09:42:00+07:00", address: ADDRESS },
    busy: false,
    denied: false,
    sim: "good",
  }),
  validate,
  value: (p, v) => {
    const pos = v.pos
    if (!pos) return null
    const o: Record<string, unknown> = { lat: pos.lat, lng: pos.lng, accuracy_m: pos.accuracy_m, source: pos.source, captured_at: pos.captured_at }
    if (p.showAddress) o.address = pos.address
    return o
  },

  spec: (p) => ({
    ui_type: "LOCATION",
    value_kind: "json",
    name: p.name,
    label: p.label,
    required: p.required,
    config: { capture: p.mode, max_accuracy_m: p.mode === "map" ? null : maxAcc(p), show_address: p.showAddress, map_provider: null },
  }),
  savedAs: (p) =>
    L(
      `One JSON object in \`${p.name}\`: lat, lng, accuracy in metres, source (gps / manual) and time${p.showAddress ? ", plus the address" : ""}.`,
      `Satu objek JSON di \`${p.name}\`: lat, lng, akurasi dalam meter, sumber (gps / manual), dan waktu${p.showAddress ? ", plus alamat" : ""}.`,
    ),
  notes: [
    L(
      "Needs HTTPS and location permission. The map and the address need a provider (open decision 4); until then the map is only a preview.",
      "Butuh HTTPS dan izin lokasi. Peta dan alamat butuh penyedia (keputusan terbuka 4); sampai itu diputuskan, peta hanya pratinjau.",
    ),
    L("Coordinates are WGS84 decimal degrees with 6 decimals (about 0.1 m).", "Koordinat dalam derajat desimal WGS84 dengan 6 angka di belakang koma (sekitar 0,1 m)."),
    L(
      'The accuracy limit applies to GPS readings. A pin moved by hand is saved with `source: "manual"` and `accuracy_m: null` so reviewers can tell.',
      'Batas akurasi berlaku untuk hasil GPS. Titik yang digeser manual disimpan dengan `source: "manual"` dan `accuracy_m: null` agar pemeriksa tahu.',
    ),
  ],
  story: {
    process: L("Field visit report", "Laporan kunjungan lapangan"),
    step: L("Visit check-in", "Check-in kunjungan"),
    ref: "KJG-2026-0731",
    due: "2026-10-05",
    task: L("Check in: Surabaya branch office", "Check-in: kantor cabang Surabaya"),
    after: [
      { name: "visited", label: L("Place visited", "Tempat yang dikunjungi"), type: "text", required: true, value: "Kantor cabang Surabaya" },
      { name: "visit_notes", label: L("Visit notes", "Catatan kunjungan"), type: "textarea", required: true, rows: 2, value: "" },
    ],
  },
}
