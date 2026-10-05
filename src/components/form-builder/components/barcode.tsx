/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useEffectEvent, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Camera01Icon, Cancel01Icon, QrCodeScanIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { GhostInput } from "../field-shell"
import { L, useT, type L10n } from "../i18n"
import { F, ctl, issuesFor } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"

/* Barcode / QR scan — ui_type BARCODE_SCAN, value_kind "string". Story: annual asset audit.
   No real camera: the scan is simulated (Controls) until the scanning library is chosen (open decision 5). */

type FormatId = "qr" | "code128" | "code39" | "ean13"
const FORMATS: Record<FormatId, string> = { qr: "QR Code", code128: "Code 128", code39: "Code 39", ean13: "EAN-13" }
const FORMAT_IDS = Object.keys(FORMATS) as FormatId[]

interface BarcodeProps {
  label: L10n
  name: string
  formats: FormatId[]
  manual: boolean
  mask: string
  required: boolean
}

type CameraSim = "valid" | "wrong" | "blocked"
/** Runtime state. Only `code` reaches the payload; the rest drives the simulated camera. */
interface BarcodeValue {
  code: string
  via: "scan" | "typed" | null
  fmt: FormatId | null
  scanning: boolean
  blocked: boolean
  sim: CameraSim
}

const SCAN_MS = 1400
const GOOD_CODE = "AST-2026-00417"
const WRONG_CODE = "AST-26-417"

/** mask: # = digit, A = letter, * = letter or digit, anything else must match as typed */
const maskRe = (m: string) =>
  new RegExp(
    "^" +
      m
        .split("")
        .map((c) => (c === "#" ? "\\d" : c === "A" ? "[A-Z]" : c === "*" ? "[A-Z0-9]" : c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
        .join("") +
      "$",
  )
const fits = (p: BarcodeProps, code: string) => !p.mask || maskRe(p.mask).test(code)
const formatList = (p: BarcodeProps) => p.formats.map((f) => FORMATS[f] ?? f).join(", ")
const scanFormat = (p: BarcodeProps): FormatId | null => (p.formats.includes("code128") ? "code128" : (p.formats[0] ?? null))

function BarcodeCanvas({ props: p }: { props: BarcodeProps }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={buttonVariants({ variant: "outline", size: "sm" })}>
          <HugeiconsIcon icon={Camera01Icon} />
          {t(L("Scan with camera", "Pindai dengan kamera"))}
        </span>
        {p.manual && (
          <>
            <span className="text-xs text-muted-foreground">{t(L("or type it", "atau ketik"))}</span>
            <GhostInput className="min-w-36 flex-1 font-mono">{p.mask}</GhostInput>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{formatList(p)}</p>
    </div>
  )
}

/** Simulated camera view: aiming frame, moving scan line, caption. */
function Viewfinder() {
  const t = useT()
  const line = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = line.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const anim = el.animate([{ top: "10%" }, { top: "88%" }], { duration: SCAN_MS, iterations: Infinity, direction: "alternate", easing: "ease-in-out" })
    return () => anim.cancel()
  }, [])
  const corner = "absolute size-[22px] border-white"
  return (
    <div role="status" aria-live="polite" className="relative grid h-[210px] place-items-center overflow-hidden rounded-2xl bg-zinc-950 text-white dark:ring-1 dark:ring-border">
      <div className="relative h-[46%] w-[62%]" aria-hidden>
        <span className={cn(corner, "top-0 left-0 rounded-tl-md border-t-[3px] border-l-[3px]")} />
        <span className={cn(corner, "top-0 right-0 rounded-tr-md border-t-[3px] border-r-[3px]")} />
        <span className={cn(corner, "bottom-0 left-0 rounded-bl-md border-b-[3px] border-l-[3px]")} />
        <span className={cn(corner, "right-0 bottom-0 rounded-br-md border-r-[3px] border-b-[3px]")} />
        {/* scanner laser: a depiction, not an accent element */}
        <span ref={line} className="absolute inset-x-[6%] top-[10%] h-0.5 rounded-full bg-red-500 shadow-[0_0_8px_1px] shadow-red-500/70" />
      </div>
      <span className="absolute inset-x-0 bottom-3 text-center text-xs">{t(L("Point the camera at the code…", "Arahkan kamera ke kode…"))}</span>
    </div>
  )
}

function BarcodeRuntime({ props: p, value: v, onChange, state, issues, id }: RuntimeProps<BarcodeProps, BarcodeValue>) {
  const t = useT()
  const input = useRef<HTMLInputElement>(null)
  const live = state === "active"
  const scanning = live && v.scanning
  const bad = issuesFor(issues, "bc-in").length > 0
  const ok = fits(p, v.code)

  /* The simulated camera reads a code after 1.4 s. Cancel, reset, a state change or unmount clears the timer. */
  const read = useEffectEvent(() => {
    const code = v.sim === "valid" ? GOOD_CODE : WRONG_CODE
    onChange({ ...v, scanning: false, via: "scan", fmt: scanFormat(p), code })
    toast.info(t(L(`Code read: ${code}`, `Kode terbaca: ${code}`)))
  })
  useEffect(() => {
    if (!scanning) return
    const timer = window.setTimeout(() => read(), SCAN_MS)
    return () => window.clearTimeout(timer)
  }, [scanning])

  const scan = () => {
    if (!live) return
    if (v.sim === "blocked") {
      onChange({ ...v, blocked: true })
      requestAnimationFrame(() => input.current?.focus())
      return
    }
    onChange({ ...v, blocked: false, scanning: true })
  }

  const via =
    v.via === "scan"
      ? L(`Scanned · ${v.fmt ? FORMATS[v.fmt] : ""}`, `Dipindai · ${v.fmt ? FORMATS[v.fmt] : ""}`)
      : L("Typed by hand", "Diketik manual")

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      // without typing there is no input: the group carries the field id (vanilla: a span with tabindex -1)
      id={p.manual ? undefined : `${id}-input`}
      tabIndex={p.manual ? undefined : -1}
      className="flex flex-col gap-2.5 outline-none"
    >
      {live && v.blocked && (
        <Alert className="border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400">
          <HugeiconsIcon icon={Alert02Icon} />
          <AlertTitle className="text-foreground">{t(L("Camera access is blocked", "Akses kamera diblokir"))}</AlertTitle>
          <AlertDescription>
            {t(
              L(
                "Allow the camera in the browser settings" + (p.manual ? ", or type the code below." : "."),
                "Izinkan kamera di pengaturan browser" + (p.manual ? ", atau ketik kodenya di bawah." : "."),
              ),
            )}
          </AlertDescription>
        </Alert>
      )}

      {scanning && <Viewfinder />}

      {live && (
        <div className="flex flex-wrap items-center gap-2">
          {scanning ? (
            <Button variant="outline" size="sm" onClick={() => onChange({ ...v, scanning: false })}>
              <HugeiconsIcon icon={Cancel01Icon} />
              {t(L("Cancel scan", "Batal pindai"))}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={scan} aria-invalid={(!p.manual && bad) || undefined}>
              <HugeiconsIcon icon={Camera01Icon} />
              {t(v.code ? L("Scan again", "Pindai ulang") : L("Scan with camera", "Pindai dengan kamera"))}
            </Button>
          )}
          {p.manual && <span className="text-xs text-muted-foreground">{t(L("or type it", "atau ketik"))}</span>}
        </div>
      )}

      {p.manual && (
        <Input
          ref={input}
          id={`${id}-input`}
          value={v.code}
          placeholder={p.mask}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={bad || undefined}
          aria-describedby={`${id}-hint`}
          className="font-mono"
          {...ctl(state)}
          onChange={(e) => live && onChange({ ...v, code: e.target.value.toUpperCase().trim(), via: "typed" })}
        />
      )}

      {v.code && !scanning && (
        <div
          aria-live="polite"
          className={cn("flex items-center gap-2.5 rounded-2xl border border-border bg-background px-3 py-2.5", state === "disabled" && "opacity-60")}
        >
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg",
              ok ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive",
            )}
          >
            <HugeiconsIcon icon={ok ? Tick02Icon : Alert02Icon} className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className={cn("truncate font-mono text-sm font-semibold", state === "disabled" ? "text-muted-foreground" : "text-foreground")}>{v.code}</p>
            <p className="text-xs text-muted-foreground">
              {t(via)}
              {!ok && <span className="sr-only"> · {t(L("does not match the expected format", "tidak sesuai format yang diharapkan"))}</span>}
            </p>
          </div>
        </div>
      )}

      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {t(L("Accepted: ", "Diterima: "))}
        {formatList(p)}
        {p.mask && (
          <>
            {" · "}
            {t(L("format ", "format "))}
            <span className="font-mono">{p.mask}</span>
          </>
        )}
      </p>
    </div>
  )
}

const SIMS: { v: CameraSim; label: L10n }[] = [
  { v: "valid", label: L(`Reads ${GOOD_CODE}`, `Membaca ${GOOD_CODE}`) },
  { v: "wrong", label: L("Reads a wrong format", "Membaca format salah") },
  { v: "blocked", label: L("Camera blocked", "Kamera diblokir") },
]

function BarcodeControls({ value: v, onChange }: { props: BarcodeProps; value: BarcodeValue; onChange: (next: BarcodeValue) => void }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-2">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={1}
        value={v.sim}
        aria-label={t(L("Prototype · simulate camera", "Prototipe · simulasi kamera"))}
        onValueChange={(s) => s && onChange({ ...v, sim: s as CameraSim, blocked: false })}
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

function validate(p: BarcodeProps, v: BarcodeValue): Issue[] {
  const c = v.code
  if (!c)
    return p.required
      ? [
          {
            fid: "bc-in",
            msg: L((p.manual ? "Scan or type the " : "Scan the ") + p.label.en.toLowerCase(), (p.manual ? "Pindai atau ketik " : "Pindai ") + p.label.id.toLowerCase()),
          },
        ]
      : []
  if (!fits(p, c)) return [{ fid: "bc-in", msg: L(`“${c}” does not match ${p.mask}`, `“${c}” tidak sesuai format ${p.mask}`) }]
  return []
}

export const barcode: ComponentDef<BarcodeProps, BarcodeValue> = {
  slug: "barcode",
  wave: 2,
  ui: "BARCODE_SCAN",
  vk: "string",
  group: "field",
  week: 4,
  icon: QrCodeScanIcon,
  label: L("Barcode / QR scan", "Pindai barcode / QR"),
  title: L("Barcode / QR scan", "Pindai barcode / QR"),
  blurb: L("Scan with the camera or type the code; checked against an expected format.", "Pindai dengan kamera atau ketik kodenya; dicek terhadap format yang diharapkan."),

  defaults: () => ({
    label: L("Asset tag", "Label aset"),
    name: "asset_tag",
    formats: ["qr", "code128"],
    manual: true,
    mask: "AST-####-#####",
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(),
        {
          t: "chips",
          k: "formats",
          label: L("Accepted formats", "Format yang diterima"),
          options: FORMAT_IDS.map((k) => ({ v: k, label: L(FORMATS[k]) })),
          validate: (v) => (!Array.isArray(v) || !v.length ? L("Pick at least one format", "Pilih minimal satu format") : null),
        },
        {
          t: "switch",
          k: "manual",
          label: L("Allow typing the code", "Boleh mengetik kode"),
          hint: L("Keep on: cameras fail on worn labels and some browsers.", "Biarkan aktif: kamera bisa gagal pada label usang dan sebagian browser."),
        },
        {
          t: "text",
          k: "mask",
          label: L("Expected format", "Format yang diharapkan"),
          placeholder: L("e.g. AST-####-#####", "mis. AST-####-#####"),
          mono: true,
          hint: L(
            "`#` digit, `A` letter, `*` letter or digit. Leave empty to accept any code.",
            "`#` angka, `A` huruf, `*` huruf atau angka. Kosongkan untuk menerima kode apa pun.",
          ),
        },
      ],
    },
    { tab: "validation", fields: [F.required()] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: BarcodeCanvas,

  Runtime: BarcodeRuntime,
  Controls: BarcodeControls,
  controlsTitle: L("Camera", "Kamera"),
  initial: () => ({ code: "", via: null, fmt: null, scanning: false, blocked: false, sim: "valid" }),
  sample: (p) => ({ code: GOOD_CODE, via: "scan", fmt: scanFormat(p), scanning: false, blocked: false, sim: "valid" }),
  validate,
  value: (_, v) => v.code,

  spec: (p) => ({
    ui_type: "BARCODE_SCAN",
    value_kind: "string",
    name: p.name,
    label: p.label,
    required: p.required,
    config: { formats: p.formats, allow_manual: p.manual, expected_format: p.mask || null },
  }),
  savedAs: (p) =>
    L(
      `The code as text in \`${p.name}\`, e.g. \`${GOOD_CODE}\`. How it was entered is not saved.`,
      `Kode sebagai teks di \`${p.name}\`, mis. \`${GOOD_CODE}\`. Cara memasukkannya tidak disimpan.`,
    ),
  notes: [
    L(
      "The camera needs HTTPS and the user’s permission. `BarcodeDetector` is missing in some browsers, so a scanning library is needed (open decision 5).",
      "Kamera butuh HTTPS dan izin user. `BarcodeDetector` tidak ada di sebagian browser, jadi perlu library pemindai (keputusan terbuka 5).",
    ),
    L(
      "Typing the code stays available by default: it is the fallback for blocked cameras, worn labels and screen-reader users.",
      "Mengetik kode tetap tersedia secara bawaan: ini cadangan untuk kamera diblokir, label usang, dan pengguna pembaca layar.",
    ),
    L("The expected format is checked the same way for scanned and typed codes.", "Format yang diharapkan dicek dengan cara yang sama untuk kode hasil pindai dan ketikan."),
  ],
  story: {
    process: L("Annual asset audit", "Audit aset tahunan"),
    step: L("Room check", "Pemeriksaan ruangan"),
    ref: "AUD-2026-0412",
    due: "2026-10-10",
    task: L("Audit: Merapi meeting room, floor 3", "Audit: Ruang rapat Merapi, lantai 3"),
    after: [
      {
        name: "condition",
        label: L("Condition", "Kondisi"),
        type: "select",
        required: true,
        value: "",
        options: [
          { v: "good", label: L("Good", "Baik") },
          { v: "minor", label: L("Minor damage", "Rusak ringan") },
          { v: "major", label: L("Major damage", "Rusak berat") },
        ],
      },
      { name: "note", label: L("Note", "Catatan"), type: "textarea", placeholder: L("Optional", "Opsional"), rows: 2, value: "" },
    ],
  },
}
