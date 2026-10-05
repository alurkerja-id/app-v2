/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  Image01Icon,
  ImageNotFound01Icon,
  ImageUploadIcon,
  Link01Icon,
  Refresh01Icon,
  VariableIcon,
  ViewOffSlashIcon,
  ZoomInAreaIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, FieldState, RuntimeProps } from "../types"
import { FILE_VARS, FILE_VAR_KEYS, SAMPLES, SAMPLE_IDS, fileVarValue, pick, type ImageFile, type PickedImage } from "./image-samples"

/* Image display — ui_type IMAGE, value_kind "none". Story: booking a meeting room with the
   floor 3 plan between the room choice and the date. Sample pictures only, no network. */

type Source = "upload" | "url" | "variable"
type Size = "fit" | "original" | "height"
type Align = "left" | "center"

interface ImageProps {
  /** Name: shown as a small title above the image only when `showLabel`. */
  label: L10n
  /** Key: identity of the node only — an image sends no value. */
  name: string
  showLabel: boolean
  source: Source
  /** Picked in the builder. The spec keeps the metadata; `preview` only draws it here. */
  file: PickedImage | null
  url: string
  variable: string
  alt: L10n
  decorative: boolean
  caption: L10n
  size: Size
  heightPx: number | ""
  align: Align
  zoom: boolean
}

/** Prototype only: how the image request behaves. Never submitted. */
type Sim = "loaded" | "slow" | "broken" | "empty"
interface ImageValue {
  sim: Sim
  /** Bumped by Reload / Try again to fetch again. */
  load: number
}

const LOAD_MS = 650
const SLOW_MS = 4000

const heightOf = (p: ImageProps) => Math.min(600, Math.max(120, Number(p.heightPx) || 320))

/** https only, with a dotted host name. */
function urlHost(v: unknown): string | null {
  try {
    const u = new URL(String(v ?? "").trim())
    return u.protocol === "https:" && u.hostname.includes(".") ? u.hostname : null
  } catch {
    return null
  }
}

/** Last path segment of a URL, decoded when possible. */
function fileNameOf(url: string) {
  const last = new URL(url).pathname.split("/").pop() ?? ""
  try {
    return decodeURIComponent(last)
  } catch {
    return last
  }
}

/** What the source points at: a picture, an empty variable, or nothing usable. */
type Resolved = { kind: "image"; meta: ImageFile; src: string } | { kind: "empty" } | { kind: "none" }

function resolve(p: ImageProps): Resolved {
  if (p.source === "upload") return p.file ? { kind: "image", meta: p.file, src: p.file.preview } : { kind: "none" }
  if (p.source === "url") {
    if (!urlHost(p.url)) return { kind: "none" }
    /* Prototype: any https address answers with the floor plan sample. */
    const s = SAMPLES.floor
    return { kind: "image", meta: { ...s, file_name: fileNameOf(p.url) || s.file_name }, src: s.preview }
  }
  const v = FILE_VARS[p.variable]
  return v?.sample ? { kind: "image", meta: SAMPLES[v.sample], src: SAMPLES[v.sample].preview } : { kind: "empty" }
}

const hasAlt = (p: ImageProps) => !p.decorative && Boolean(p.alt.en.trim() || p.alt.id.trim())
const hasCaption = (p: ImageProps) => Boolean(p.caption.en.trim() || p.caption.id.trim())

/* ── sizing: the same box for the picture, its skeleton and the zoom button ─ */

/** Outer box style. `fit` fills the form width; the others keep the aspect ratio and never overflow. */
function boxStyle(p: ImageProps, meta: ImageFile): CSSProperties {
  const ratio = `${meta.width} / ${meta.height}`
  if (p.size === "original") return { width: meta.width, maxWidth: "100%", aspectRatio: ratio }
  if (p.size === "height") {
    const h = heightOf(p)
    return { height: h, width: Math.round((h * meta.width) / meta.height), maxWidth: "100%" }
  }
  return { width: "100%", aspectRatio: ratio }
}

const FRAME = "relative overflow-hidden rounded-2xl border border-border bg-muted/30"

/** The picture itself. Decorative images get `alt=""` so screen readers skip them. */
function Picture({ p, src, meta, onError }: { p: ImageProps; src: string; meta: ImageFile; onError?: () => void }) {
  const t = useT()
  return (
    <img
      src={src}
      alt={p.decorative ? "" : t(p.alt)}
      width={meta.width}
      height={meta.height}
      draggable={false}
      onError={onError}
      className="block size-full object-contain"
    />
  )
}

/** Title (when shown), the picture slot and the caption, aligned left or centred. */
function Figure({ p, busy, disabled, children }: { p: ImageProps; busy?: boolean; disabled?: boolean; children: ReactNode }) {
  const t = useT()
  return (
    <figure
      aria-busy={busy || undefined}
      aria-disabled={disabled || undefined}
      className={cn("m-0 flex min-w-0 flex-col gap-2", p.align === "center" ? "items-center text-center" : "items-start text-left", disabled && "opacity-60")}
    >
      {p.showLabel && p.label.en.trim() && <p className="text-sm font-medium text-foreground">{t(p.label)}</p>}
      {children}
      {hasCaption(p) && <figcaption className="max-w-prose text-xs text-pretty text-muted-foreground">{t(p.caption)}</figcaption>}
    </figure>
  )
}

/** Loading, error and empty boxes: never wider than the picture would be. */
function StateBox({ p, meta, children }: { p: ImageProps; meta?: ImageFile; children: ReactNode }) {
  const style: CSSProperties = meta && p.size !== "fit" ? { width: boxStyle(p, meta).width, maxWidth: "100%" } : {}
  return (
    <div
      style={style}
      className={cn(
        "flex min-h-40 w-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center dark:bg-muted/15",
        meta && p.size !== "fit" && "min-w-64",
      )}
    >
      {children}
    </div>
  )
}

/* ── canvas ─────────────────────────────────────────────────────────────── */

function SourceLine({ p, r }: { p: ImageProps; r: Resolved }) {
  const t = useT()
  const text =
    p.source === "upload"
      ? r.kind === "image"
        ? `${r.meta.file_name} · ${r.meta.width} × ${r.meta.height}`
        : t(L("No image picked", "Belum ada gambar"))
      : p.source === "url"
        ? (urlHost(p.url) ?? t(L("URL needs https://", "URL harus https://")))
        : p.variable
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <HugeiconsIcon icon={p.source === "upload" ? ImageUploadIcon : p.source === "url" ? Link01Icon : VariableIcon} className="size-3.5 shrink-0" />
      <span className={cn("min-w-0 truncate", p.source !== "upload" && "font-mono")}>{text}</span>
      {p.decorative && (
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <HugeiconsIcon icon={ViewOffSlashIcon} />
          {t(L("Decorative", "Dekoratif"))}
        </Badge>
      )}
      {p.zoom && (
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <HugeiconsIcon icon={ZoomInAreaIcon} />
          {t(L("Click to enlarge", "Klik untuk memperbesar"))}
        </Badge>
      )}
    </div>
  )
}

function ImageCanvas({ props: p }: { props: ImageProps }) {
  const t = useT()
  const r = resolve(p)
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <Figure p={p}>
        {r.kind === "image" ? (
          <div className={FRAME} style={boxStyle(p, r.meta)}>
            <Picture p={p} src={r.src} meta={r.meta} />
          </div>
        ) : (
          <StateBox p={p}>
            <HugeiconsIcon icon={r.kind === "empty" ? VariableIcon : ImageUploadIcon} className="size-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {t(
                r.kind === "empty"
                  ? L("The sample variable is empty — the image comes from an earlier step.", "Variabel contoh kosong — gambarnya dari langkah sebelumnya.")
                  : L("Pick an image in Edit Element.", "Pilih gambar di Edit Element."),
              )}
            </p>
          </StateBox>
        )}
      </Figure>
      <SourceLine p={p} r={r} />
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

type Phase = "loading" | "ready" | "error" | "empty"

function ImageRuntime({ props: p, value: v, onChange, state }: RuntimeProps<ImageProps, ImageValue>) {
  const t = useT()
  const r = resolve(p)
  const disabled = state === "disabled"
  const sim: Sim = v.sim === "empty" && p.source !== "variable" ? "loaded" : v.sim

  /* Every change to the source, the simulated answer or Reload fetches the picture again. */
  const reqKey = JSON.stringify([p.source, p.file?.file_id, p.url, p.variable, sim, v.load])
  const delay = sim === "slow" ? SLOW_MS : LOAD_MS
  const [doneKey, setDoneKey] = useState<string | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setDoneKey(reqKey), delay)
    return () => window.clearTimeout(timer)
  }, [reqKey, delay])

  const phase: Phase =
    r.kind === "empty" || sim === "empty"
      ? "empty"
      : doneKey !== reqKey
        ? "loading"
        : r.kind !== "image" || sim === "broken" || failedKey === reqKey
          ? "error"
          : "ready"
  const img = r.kind === "image" ? r : null

  let body: ReactNode
  if (phase === "empty") {
    body = (
      <StateBox p={p}>
        <HugeiconsIcon icon={VariableIcon} className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t(L("No image yet — it is set in an earlier step.", "Belum ada gambar — diisi di langkah sebelumnya."))}</p>
        <span className="font-mono text-xs text-muted-foreground">{p.variable}</span>
      </StateBox>
    )
  } else if (phase === "loading" && img) {
    body = (
      <Skeleton className="relative flex items-center justify-center" style={boxStyle(p, img.meta)}>
        <HugeiconsIcon icon={Image01Icon} className="size-7 text-muted-foreground/60" />
        <span role="status" className="sr-only">
          {t(L("Loading image…", "Memuat gambar…"))}
        </span>
      </Skeleton>
    )
  } else if (phase === "error" || !img) {
    body = (
      <StateBox p={p} meta={img?.meta}>
        <HugeiconsIcon icon={ImageNotFound01Icon} className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">{t(L("Image couldn’t be loaded", "Gambar gagal dimuat"))}</p>
        {hasAlt(p) && (
          <div className="w-full max-w-md rounded-xl border border-border bg-background px-3 py-2 text-left">
            <p className="text-[11px] font-medium text-muted-foreground">{t(L("What the image shows", "Isi gambar"))}</p>
            <p className="text-sm text-foreground">{t(p.alt)}</p>
          </div>
        )}
        <Button variant="outline" size="sm" disabled={disabled} onClick={() => onChange({ sim: "loaded", load: v.load + 1 })}>
          <HugeiconsIcon icon={Refresh01Icon} />
          {t(L("Try again", "Coba lagi"))}
        </Button>
      </StateBox>
    )
  } else {
    const pic = <Picture p={p} src={img.src} meta={img.meta} onError={() => setFailedKey(reqKey)} />
    body =
      p.zoom && !disabled ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={t(L(`Enlarge image: ${p.label.en}`, `Perbesar gambar: ${p.label.id || p.label.en}`))}
              className={cn(FRAME, "group/zoom block cursor-zoom-in outline-none focus-visible:ring-3 focus-visible:ring-ring/40")}
              style={boxStyle(p, img.meta)}
            >
              {pic}
              <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm ring-1 ring-border transition-opacity group-hover/zoom:opacity-100 group-focus-visible/zoom:opacity-100 sm:opacity-0">
                <HugeiconsIcon icon={ZoomInAreaIcon} className="size-3.5" />
                {t(L("Enlarge", "Perbesar"))}
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="gap-3 p-4 sm:max-w-[min(64rem,calc(100%-2rem))]">
            <DialogHeader className="pr-10">
              <DialogTitle>{t(p.label)}</DialogTitle>
              <DialogDescription className="text-xs">
                {hasCaption(p) ? `${t(p.caption)} · ` : ""}
                {t(L("Esc closes", "Esc untuk menutup"))}
              </DialogDescription>
            </DialogHeader>
            <img
              src={img.src}
              alt={p.decorative ? "" : t(p.alt)}
              width={img.meta.width}
              height={img.meta.height}
              className="max-h-[75dvh] w-full rounded-xl bg-muted/30 object-contain"
            />
          </DialogContent>
        </Dialog>
      ) : (
        <div className={FRAME} style={boxStyle(p, img.meta)}>
          {pic}
        </div>
      )
  }

  return (
    <Figure p={p} busy={phase === "loading"} disabled={disabled}>
      {body}
    </Figure>
  )
}

/* ── simulation controls (beside the runtime form) ──────────────────────── */

const SIMS: [Sim, L10n][] = [
  ["loaded", L("Loaded", "Termuat")],
  ["slow", L("Slow", "Lambat")],
  ["broken", L("Broken", "Rusak")],
  ["empty", L("Variable empty", "Variabel kosong")],
]

function ImageControls({ props: p, value: v, onChange }: { props: ImageProps; value: ImageValue; onChange: (next: ImageValue) => void; state: FieldState }) {
  const t = useT()
  const id = useId()
  const isVar = p.source === "variable"
  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-sim`} className="text-xs text-muted-foreground">
        {t(L("Image request", "Permintaan gambar"))}
      </span>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={v.sim}
        aria-labelledby={`${id}-sim`}
        onValueChange={(x) => {
          const sim = SIMS.find(([k]) => k === x)?.[0]
          if (sim) onChange({ sim, load: v.load + 1 })
        }}
        className="flex-wrap"
      >
        {SIMS.map(([k, label]) => (
          <ToggleGroupItem key={k} value={k} disabled={k === "empty" && !isVar} className="px-3 text-xs">
            {t(label)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">
        {t(
          isVar
            ? L(`Variable empty = ${p.variable} has no file yet.`, `Variabel kosong = ${p.variable} belum berisi berkas.`)
            : L("Variable empty applies when Source is Process variable.", "Variabel kosong berlaku bila Sumber = Variabel proses."),
        )}
      </p>
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => onChange({ ...v, load: v.load + 1 })}>
        <HugeiconsIcon icon={Refresh01Icon} />
        {t(L("Reload", "Muat ulang"))}
      </Button>
    </div>
  )
}

/* ── Edit Element: file picker (sample images stand in for the upload box) ─ */

function FilePicker({ p, set }: { p: ImageProps; set: (patch: Partial<ImageProps>) => void }) {
  const t = useT()
  const id = useId()
  const current = SAMPLE_IDS.find((k) => SAMPLES[k].file_id === p.file?.file_id) ?? ""
  return (
    <div className="flex flex-col gap-3">
      {p.file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border p-2 pr-3">
          <img src={p.file.preview} alt="" className="size-14 shrink-0 rounded-xl border border-border bg-muted object-cover" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{p.file.file_name}</span>
            <span className="text-xs text-muted-foreground">
              {p.file.mime} · {p.file.width} × {p.file.height} px
            </span>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label={t(L("Remove image", "Hapus gambar"))} onClick={() => set({ file: null })} className="hover:text-destructive">
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          <HugeiconsIcon icon={ImageUploadIcon} className="size-5 shrink-0" />
          {t(L("No image yet. Pick a sample below.", "Belum ada gambar. Pilih contoh di bawah."))}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <span id={`${id}-samples`} className="text-xs text-muted-foreground">
          {t(L("Sample images", "Gambar contoh"))}
        </span>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={current}
          aria-labelledby={`${id}-samples`}
          onValueChange={(x) => {
            const k = SAMPLE_IDS.find((s) => s === x)
            if (k) set({ file: pick(k) })
          }}
          className="grid w-full grid-cols-3"
        >
          {SAMPLE_IDS.map((k) => (
            <ToggleGroupItem key={k} value={k} className="h-auto min-w-0 flex-col items-stretch gap-1.5 rounded-2xl p-1.5 data-[state=on]:border-primary data-[state=on]:ring-2 data-[state=on]:ring-primary/30">
              <img src={SAMPLES[k].preview} alt="" className="aspect-[3/2] w-full rounded-xl bg-muted object-cover" />
              <span className="truncate px-1 text-left text-xs font-normal">{t(SAMPLES[k].title)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

const initial = (): ImageValue => ({ sim: "loaded", load: 0 })

function sourceSpec(p: ImageProps) {
  if (p.source === "url") return { type: "url", url: p.url }
  if (p.source === "variable") return { type: "variable", variable: p.variable }
  const f = p.file
  return { type: "upload", file: f ? { file_id: f.file_id, file_name: f.file_name, mime: f.mime, width: f.width, height: f.height } : null }
}

export const image: ComponentDef<ImageProps, ImageValue> = {
  slug: "image",
  wave: 3,
  ui: "IMAGE",
  vk: "none",
  group: "display",
  week: 5,
  icon: Image01Icon,
  label: L("Image display", "Tampilan gambar"),
  title: L("Image display", "Tampilan gambar"),
  blurb: L("Show a picture from the builder, a URL or a process variable, with alt text.", "Menampilkan gambar dari builder, URL, atau variabel proses, dengan teks alternatif."),
  bare: true,

  defaults: () => ({
    label: L("Floor 3 plan", "Denah lantai 3"),
    name: "floor_plan_image",
    showLabel: true,
    source: "upload",
    file: pick("floor"),
    url: "https://intranet.perusahaan.co.id/fasilitas/denah-lantai-3.png",
    variable: "room_photo",
    alt: L(
      "Floor 3 plan. Merapi (6 people) is next to the lifts, Bromo (10) is beside the pantry and Semeru (20) fills the east end. You are at reception, west side.",
      "Denah lantai 3. Merapi (6 orang) di sebelah lift, Bromo (10) di samping pantry, dan Semeru (20) di ujung timur. Anda di resepsionis, sisi barat.",
    ),
    decorative: false,
    caption: L("Floor 3 · rooms you can book. Click the plan to enlarge it.", "Lantai 3 · ruangan yang bisa dipesan. Klik denah untuk memperbesar."),
    size: "fit",
    heightPx: 320,
    align: "left",
    zoom: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(L("Name", "Nama"), {
          hint: L("Shown as a small title above the image when **Show the name** is on.", "Tampil sebagai judul kecil di atas gambar bila **Tampilkan nama** aktif."),
        }),
        F.key(L("Identity of the node; an image sends no value.", "Identitas node; gambar tidak mengirim nilai.")),
      ],
    },
    {
      tab: "general",
      title: L("Image", "Gambar"),
      fields: [
        {
          t: "seg",
          k: "source",
          label: L("Source", "Sumber"),
          options: [
            { v: "upload", label: L("Upload", "Unggah") },
            { v: "url", label: L("URL", "URL") },
            { v: "variable", label: L("Process variable", "Variabel proses") },
          ],
        },
        {
          t: "custom",
          id: "file",
          label: L("Image file", "Berkas gambar"),
          when: (p) => p.source === "upload",
          render: ({ props, set }) => <FilePicker p={props} set={set} />,
          validate: (_, p) => (p.source === "upload" && !p.file ? L("Pick an image", "Pilih gambar") : null),
        },
        {
          t: "note",
          when: (p) => p.source === "upload",
          text: L(
            "In Studio this is an upload box (PNG, JPG, WebP, SVG). The prototype offers sample images.",
            "Di Studio ini kotak unggah (PNG, JPG, WebP, SVG). Prototipe menyediakan gambar contoh.",
          ),
        },
        {
          t: "url",
          k: "url",
          label: L("Image URL", "URL gambar"),
          placeholder: "https://",
          when: (p) => p.source === "url",
          validate: (v) => (urlHost(v) ? null : L("Use an https:// address", "Pakai alamat https://")),
          hint: L("Prototype: any https address shows the floor plan sample.", "Prototipe: alamat https apa pun menampilkan contoh denah."),
        },
        {
          t: "select",
          k: "variable",
          label: L("Process variable", "Variabel proses"),
          when: (p) => p.source === "variable",
          options: FILE_VAR_KEYS.map((k) => {
            const f = fileVarValue(k)
            const s = FILE_VARS[k].step
            return { v: k, label: L(`${k} — ${s.en} · ${f ? f.file_name : "empty"}`, `${k} — ${s.id} · ${f ? f.file_name : "kosong"}`) }
          }),
          hint: L("Variables that hold a `file` value, with the step that sets them.", "Variabel berisi nilai `file`, beserta langkah yang mengisinya."),
        },
      ],
    },
    {
      tab: "general",
      title: L("Accessibility", "Aksesibilitas"),
      fields: [
        {
          t: "i18n",
          k: "alt",
          multi: true,
          rows: 2,
          label: L("Alt text", "Teks alternatif"),
          when: (p) => !p.decorative,
          hint: L("Read aloud by screen readers and shown if the image fails to load.", "Dibacakan pembaca layar dan tampil bila gambar gagal dimuat."),
          validate: (v) =>
            !(v as L10n).en.trim() ? L("Describe the image for people who can’t see it", "Jelaskan gambar untuk orang yang tidak bisa melihatnya") : null,
        },
        {
          t: "switch",
          k: "decorative",
          label: L("Decorative image", "Gambar dekoratif"),
          hint: L(
            "No alt text needed; screen readers skip the image. Only for pictures that add no information.",
            "Tidak perlu teks alternatif; pembaca layar melewati gambar. Hanya untuk gambar yang tidak membawa informasi.",
          ),
        },
        { t: "i18n", k: "caption", label: L("Caption", "Keterangan"), hint: L("Optional. Shown under the image.", "Opsional. Tampil di bawah gambar.") },
      ],
    },
    {
      tab: "general",
      title: L("Display", "Tampilan"),
      fields: [
        { t: "switch", k: "showLabel", label: L("Show the name", "Tampilkan nama"), hint: L("A small title above the image.", "Judul kecil di atas gambar.") },
        {
          t: "seg",
          k: "size",
          label: L("Size", "Ukuran"),
          options: [
            { v: "fit", label: L("Fit width", "Selebar form") },
            { v: "original", label: L("Original size", "Ukuran asli") },
            { v: "height", label: L("Fixed height", "Tinggi tetap") },
          ],
          hint: L("Never wider than the form; large images are scaled down for display.", "Tidak pernah melebihi lebar form; gambar besar diperkecil untuk tampilan."),
        },
        {
          t: "number",
          k: "heightPx",
          label: L("Height", "Tinggi"),
          min: 120,
          max: 600,
          step: 20,
          suffix: "px",
          when: (p) => p.size === "height",
          validate: (v) => {
            const n = Number(v)
            return v === "" || v == null || Number.isNaN(n) || n < 120 || n > 600 ? L("Use 120–600 px", "Gunakan 120–600 px") : null
          },
        },
        {
          t: "seg",
          k: "align",
          label: L("Align", "Rata"),
          options: [
            { v: "left", label: L("Left", "Kiri") },
            { v: "center", label: L("Center", "Tengah") },
          ],
        },
        {
          t: "switch",
          k: "zoom",
          label: L("Click to enlarge", "Klik untuk memperbesar"),
          hint: L("Opens the full image in a dialog; **Esc** closes it.", "Membuka gambar penuh di dialog; **Esc** menutupnya."),
        },
      ],
    },
    { tab: "validation", fields: [{ t: "note", text: L("Display only — nothing to validate.", "Hanya tampilan — tidak ada yang divalidasi.") }] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  Canvas: ImageCanvas,
  canvasWarn: (p) =>
    p.source === "upload" && !p.file
      ? L("No image picked", "Belum ada gambar")
      : p.source === "url" && !urlHost(p.url)
        ? L("URL needs https://", "URL harus https://")
        : !p.decorative && !p.alt.en.trim()
          ? L("Alt text missing", "Teks alternatif kosong")
          : null,

  Runtime: ImageRuntime,
  Controls: ImageControls,
  controlsTitle: L("Image", "Gambar"),
  initial,
  sample: initial,
  validate: () => [],
  value: () => null,

  spec: (p) => ({
    ui_type: "IMAGE",
    value_kind: "none",
    name: p.name,
    label: p.label,
    config: {
      source: sourceSpec(p),
      alt: p.decorative ? null : p.alt,
      decorative: p.decorative,
      caption: hasCaption(p) ? p.caption : null,
      size: p.size,
      height_px: p.size === "height" ? heightOf(p) : null,
      align: p.align,
      zoom: p.zoom,
      show_label: p.showLabel,
    },
  }),
  savedAs: () => L("Nothing. The picture is only shown; the spec keeps where it comes from.", "Tidak ada. Gambar hanya ditampilkan; spec menyimpan asal gambarnya."),
  notes: [
    L(
      "Alt text is required unless the image is marked **Decorative** (accessibility). Decorative images render with `alt=\"\"` so screen readers skip them; the alt text is also shown when the image fails to load.",
      "Teks alternatif wajib kecuali gambar ditandai **Dekoratif** (aksesibilitas). Gambar dekoratif dirender dengan `alt=\"\"` agar dilewati pembaca layar; teks alternatif juga tampil bila gambar gagal dimuat.",
    ),
    L(
      "A **Process variable** source reads a `file` value from an earlier step and is served through the same file endpoint and permission check as File Upload. Who may load the image is Wave 3 open decision 5.",
      "Sumber **Variabel proses** membaca nilai `file` dari langkah sebelumnya dan disajikan lewat endpoint berkas dan cek izin yang sama dengan File Upload. Siapa yang boleh memuat gambar adalah keputusan terbuka Gelombang 3 no. 5.",
    ),
    L(
      "The image sends no value (`value_kind: \"none\"`); submit, draft and bulk complete skip it. The spec stores the `file_id`, never the image data.",
      "Gambar tidak mengirim nilai (`value_kind: \"none\"`); submit, draft, dan bulk complete melewatinya. Spec menyimpan `file_id`, bukan data gambar.",
    ),
    L(
      "Large images are resized for display only; the stored file stays as uploaded and **Click to enlarge** shows it in full.",
      "Gambar besar hanya diperkecil untuk tampilan; berkas tersimpan tetap seperti diunggah dan **Klik untuk memperbesar** menampilkannya penuh.",
    ),
    L(
      "Dark mode keeps the picture’s own colours — no inversion or filter. Only the frame, caption and states follow the theme.",
      "Mode gelap mempertahankan warna asli gambar — tanpa inversi atau filter. Hanya bingkai, keterangan, dan state yang mengikuti tema.",
    ),
  ],
  dataExtra: (p) =>
    p.source === "variable"
      ? [
          {
            title: L("Process variable", "Variabel proses"),
            sub: L(`${p.variable} · file value set by ${FILE_VARS[p.variable]?.step.en ?? "an earlier step"}`, `${p.variable} · nilai file dari ${FILE_VARS[p.variable]?.step.id ?? "langkah sebelumnya"}`),
            json: { [p.variable]: fileVarValue(p.variable) },
          },
        ]
      : [],
  story: {
    process: L("Meeting room booking", "Pemesanan ruang rapat"),
    step: L("Pick a room", "Pilih ruangan"),
    ref: "RRM-2026-0311",
    due: "2026-11-10",
    task: L("Book a room for the Q4 planning", "Pesan ruangan untuk perencanaan Q4"),
    before: [
      {
        name: "room",
        label: L("Room", "Ruangan"),
        type: "select",
        required: true,
        value: "",
        options: [
          { v: "merapi", label: L("Merapi — 6 people", "Merapi — 6 orang") },
          { v: "bromo", label: L("Bromo — 10 people", "Bromo — 10 orang") },
          { v: "semeru", label: L("Semeru — 20 people", "Semeru — 20 orang") },
        ],
      },
    ],
    after: [
      { name: "meeting_date", label: L("Meeting date", "Tanggal rapat"), type: "date", required: true, value: "" },
      {
        name: "attendees",
        label: L("Number of attendees", "Jumlah peserta"),
        type: "number",
        required: true,
        value: "",
        placeholder: L("1–30", "1–30"),
        validate: (v) => {
          const n = Number(v)
          return !Number.isInteger(n) || n < 1 || n > 30 ? L("Enter 1 to 30 attendees", "Isi 1 sampai 30 peserta") : null
        },
      },
    ],
  },
}
