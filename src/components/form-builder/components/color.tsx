/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowUp01Icon, ColorPickerIcon, Delete02Icon, PaintBoardIcon, PlusSignIcon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { L, useT, type L10n } from "../i18n"
import { F, reqMsg, uid } from "../lib"
import { Rich } from "../rich"
import type { ComponentDef, CustomCtx, Issue, RuntimeProps } from "../types"

/* Color picker — ui_type COLOR, value_kind "string" (uppercase #RRGGBB). Story: project label colour. */

/** One listed colour. `id` is editor-only (React key), never in the spec. */
interface Swatch {
  id: string
  hex: string
  label: L10n
}
interface ColorProps {
  label: L10n
  name: string
  /** `swatches` = only the listed colours; `custom` = the list plus any hex colour. */
  mode: "swatches" | "custom"
  swatches: Swatch[]
  showName: boolean
  required: boolean
}
/** Uppercase `#RRGGBB`, or "" when nothing is picked. */
type ColorValue = string

const HEX_RE = /^#[0-9A-F]{6}$/
const EXAMPLE = "#1E66F5"
const MAX_SWATCHES = 16

/** "1e66f5", "#1e6" → "#1E66F5". Anything else comes back uppercased with one leading "#". */
function normHex(s: string): string {
  let h = String(s ?? "")
    .trim()
    .toUpperCase()
    .replace(/^#+/, "")
  if (/^[0-9A-F]{3}$/.test(h)) h = [...h].map((c) => c + c).join("")
  return h ? `#${h}` : ""
}
const isHex = (s: string) => HEX_RE.test(s)

/** True for light colours, so the tick on top is drawn dark (WCAG relative luminance). */
function isLight(hex: string) {
  if (!isHex(hex)) return true
  const ch = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2] > 0.4
}

const sw = (hex: string, en: string, id: string): Swatch => ({ id: uid("c"), hex, label: L(en, id) })

/** Colours offered when the builder adds a swatch (first one not already listed). */
const SPARE = ["#04A5E5", "#7287FD", "#E64553", "#209FB5", "#DD7878", "#DC8A78", "#5C5F77", "#1E1E2E"]

/** Listed swatches with a valid hex (a broken row in Edit Element cannot be saved, but stay safe). */
const listed = (p: ColorProps) => p.swatches.map((s) => ({ ...s, hex: normHex(s.hex) })).filter((s) => isHex(s.hex))

const minSwatches = (p: ColorProps) => (p.mode === "swatches" ? 2 : 1)

function swatchesError(p: ColorProps): L10n | null {
  const rows = p.swatches
  const min = minSwatches(p)
  if (rows.length < min) return L(`Keep at least ${min} colours`, `Minimal ${min} warna`)
  const seen = new Set<string>()
  for (let i = 0; i < rows.length; i++) {
    const hex = normHex(rows[i].hex)
    if (!isHex(hex)) return L(`Colour ${i + 1}: use a hex colour like ${EXAMPLE}`, `Warna ${i + 1}: pakai warna hex seperti ${EXAMPLE}`)
    if (!rows[i].label.en.trim()) return L("Every colour needs an English name", "Setiap warna butuh nama bahasa Inggris")
    if (seen.has(hex)) return L(`Two colours share ${hex}`, `Dua warna memakai ${hex}`)
    seen.add(hex)
  }
  return null
}

/* ── swatch editor (Edit Element) ───────────────────────────────────────── */

const ROW_GRID = "grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-1.5 sm:grid-cols-[2rem_6.5rem_minmax(0,1fr)_minmax(0,1fr)_auto]"

function SwatchEditor({ props: p, set }: CustomCtx<ColorProps>) {
  const t = useT()
  const labelId = useId()
  const rows = p.swatches
  const setRows = (swatches: Swatch[]) => set({ swatches })
  const update = (i: number, patch: Partial<Swatch>) => setRows(rows.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= rows.length) return
    const next = rows.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows(next)
  }
  const add = () => {
    const used = new Set(rows.map((s) => normHex(s.hex)))
    const hex = SPARE.find((h) => !used.has(h)) ?? "#808080"
    setRows([...rows, sw(hex, "New colour", "Warna baru")])
  }
  const counts = new Map<string, number>()
  for (const s of rows) counts.set(normHex(s.hex), (counts.get(normHex(s.hex)) ?? 0) + 1)

  return (
    <div className="flex flex-col gap-2">
      <Label id={labelId} className="text-sm font-medium">
        {t(L("Colours", "Daftar warna"))}
      </Label>
      <div className={cn(ROW_GRID, "hidden px-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase sm:grid")} aria-hidden>
        <span />
        <span>Hex</span>
        <span>EN</span>
        <span>ID</span>
      </div>
      <ol role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
        {rows.map((s, i) => {
          const hex = normHex(s.hex)
          const ok = isHex(hex)
          const dup = ok && (counts.get(hex) ?? 0) > 1
          const name = s.label.en || `${i + 1}`
          return (
            <li key={s.id} className={ROW_GRID}>
              <label
                className="relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full ring-1 ring-foreground/15 ring-inset has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
                style={ok ? { backgroundColor: hex } : undefined}
                title={t(L("Open the colour picker", "Buka pemilih warna"))}
              >
                {!ok && <span className="text-xs font-semibold text-destructive">?</span>}
                <input
                  type="color"
                  value={ok ? hex.toLowerCase() : "#000000"}
                  aria-label={`${t(L("Colour", "Warna"))} ${i + 1}: ${t(L("open the colour picker", "buka pemilih warna"))}`}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  onChange={(e) => update(i, { hex: e.target.value.toUpperCase() })}
                />
              </label>
              <InputGroup className="h-8">
                <InputGroupAddon className="pr-0">
                  <InputGroupText className="font-mono text-xs">#</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  value={s.hex.replace(/^#/, "")}
                  maxLength={7}
                  spellCheck={false}
                  autoComplete="off"
                  aria-label={`${t(L("Colour", "Warna"))} ${i + 1}: hex`}
                  aria-invalid={!ok || dup || undefined}
                  className="pl-1 font-mono text-xs uppercase"
                  onChange={(e) => update(i, { hex: `#${e.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 6).toUpperCase()}` })}
                  onBlur={() => update(i, { hex: normHex(s.hex) })}
                />
              </InputGroup>
              <div className="order-last col-span-full grid grid-cols-2 gap-1.5 sm:order-none sm:col-span-1 sm:contents">
                <Input
                  value={s.label.en}
                  aria-label={`${t(L("Colour", "Warna"))} ${i + 1} (English)`}
                  aria-invalid={!s.label.en.trim() || undefined}
                  placeholder="English"
                  className="h-8 px-2.5 text-xs"
                  onChange={(e) => update(i, { label: { ...s.label, en: e.target.value } })}
                />
                <Input
                  value={s.label.id}
                  aria-label={`${t(L("Colour", "Warna"))} ${i + 1} (Bahasa Indonesia)`}
                  placeholder="Indonesia"
                  className="h-8 px-2.5 text-xs"
                  onChange={(e) => update(i, { label: { ...s.label, id: e.target.value } })}
                />
              </div>
              <div className="flex items-center justify-end gap-0.5">
                <Button variant="ghost" size="icon-xs" aria-label={`${t(L("Move up", "Naikkan"))}: ${name}`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <HugeiconsIcon icon={ArrowUp01Icon} />
                </Button>
                <Button variant="ghost" size="icon-xs" aria-label={`${t(L("Move down", "Turunkan"))}: ${name}`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                  <HugeiconsIcon icon={ArrowDown01Icon} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${t(L("Remove", "Hapus"))}: ${name}`}
                  disabled={rows.length <= minSwatches(p)}
                  className="hover:text-destructive"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                </Button>
              </div>
            </li>
          )
        })}
      </ol>
      <div>
        <Button variant="ghost" size="sm" disabled={rows.length >= MAX_SWATCHES} onClick={add}>
          <HugeiconsIcon icon={PlusSignIcon} />
          {t(L("Add colour", "Tambah warna"))}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        <Rich
          text={L(
            `Click the dot to pick a colour, or type the hex code. Up to ${MAX_SWATCHES} colours; the saved value is the hex code.`,
            `Klik bulatan untuk memilih warna, atau ketik kode hex. Maksimal ${MAX_SWATCHES} warna; nilai yang disimpan adalah kode hex.`,
          )}
        />
      </p>
    </div>
  )
}

/* ── canvas + runtime ───────────────────────────────────────────────────── */

/** The round colour sample. `custom` with no colour = dashed "pick any colour" circle. */
function Face({ hex, on, custom, size }: { hex: string; on: boolean; custom?: boolean; size: string }) {
  const filled = isHex(hex)
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full",
        size,
        filled ? "ring-1 ring-foreground/15 ring-inset" : "border border-dashed border-muted-foreground/60 text-muted-foreground",
        on && "outline-2 outline-offset-2 outline-foreground",
      )}
      style={filled ? { backgroundColor: hex } : undefined}
    >
      {on && filled ? (
        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className={cn("size-4", isLight(hex) ? "text-black/80" : "text-white")} />
      ) : custom ? (
        <HugeiconsIcon icon={filled ? ColorPickerIcon : PlusSignIcon} className={cn("size-4", filled && (isLight(hex) ? "text-black/70" : "text-white/90"))} />
      ) : null}
    </span>
  )
}

/** "● Blue · #1E66F5" — the chosen colour is always named in text, never shown by colour alone. */
function Chip({ hex, name, muted, id }: { hex: string; name: string; muted?: boolean; id?: string }) {
  const t = useT()
  return (
    <p id={id} className={cn("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm", muted && "text-muted-foreground")}>
      {hex ? (
        <>
          <span aria-hidden className="size-4 shrink-0 rounded-full ring-1 ring-foreground/15 ring-inset" style={isHex(hex) ? { backgroundColor: hex } : undefined} />
          <span className="font-medium">{name}</span>
          <span className="font-mono text-xs text-muted-foreground">{hex}</span>
        </>
      ) : (
        <span className="text-muted-foreground">{t(L("No colour picked yet", "Belum ada warna dipilih"))}</span>
      )}
    </p>
  )
}

const CUSTOM_LABEL = L("Custom…", "Warna lain…")

/** One radio in the swatch grid. Extra props (ref, data-*) come from PopoverAnchor for the "Custom…" stop. */
function Tile({
  on,
  face,
  name,
  live,
  showName,
  disabled,
  className,
  ...rest
}: ComponentProps<"button"> & { on: boolean; face: ReactNode; name: string; live: boolean; showName: boolean; "data-sw": number }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      disabled={disabled}
      className={cn(
        "group flex flex-col items-center gap-1 rounded-2xl p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        showName && "w-16",
        live ? "cursor-pointer" : "cursor-default",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...rest}
    >
      <span className={cn("rounded-full transition-transform", live && "group-hover:scale-110")}>{face}</span>
      {showName && <span className={cn("line-clamp-2 text-center text-[11px] leading-tight", on ? "font-semibold text-foreground" : "text-muted-foreground")}>{name}</span>}
    </button>
  )
}

function ColorCanvas({ props: p }: { props: ColorProps }) {
  const t = useT()
  const list = listed(p)
  const tile = (key: string, face: ReactNode, name: string) => (
    <span key={key} className={cn("flex flex-col items-center gap-1", p.showName && "w-16")}>
      {face}
      {p.showName && <span className="line-clamp-2 text-center text-[11px] leading-tight text-muted-foreground">{name}</span>}
    </span>
  )
  return (
    <div className="flex flex-col gap-2.5">
      <div className={cn("flex flex-wrap", p.showName ? "gap-x-1 gap-y-3" : "gap-2.5")}>
        {list.map((s) => tile(s.id, <Face hex={s.hex} on={false} size="size-9" />, t(s.label)))}
        {p.mode === "custom" && tile("custom", <Face hex="" on={false} custom size="size-9" />, t(CUSTOM_LABEL))}
      </div>
      <Chip hex="" name="" />
    </div>
  )
}

function ColorRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<ColorProps, ColorValue>) {
  const t = useT()
  const live = state === "active"
  const disabled = state === "disabled"
  const bad = issues.length > 0
  const group = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [tried, setTried] = useState(false)

  const list = listed(p)
  const allowCustom = p.mode === "custom"
  const hex = normHex(v)
  const match = list.find((s) => s.hex === hex)
  const isCustom = hex !== "" && !match
  /* Radios in order; the "Custom…" swatch (custom mode) is the last stop. */
  const count = list.length + (allowCustom ? 1 : 0)
  const checkedIdx = match ? list.indexOf(match) : isCustom && allowCustom ? list.length : -1
  const focusIdx = checkedIdx >= 0 ? checkedIdx : 0
  const size = compact ? "size-10" : "size-9"

  const focusAt = (i: number) => requestAnimationFrame(() => group.current?.querySelector<HTMLElement>(`[data-sw="${i}"]`)?.focus())
  const choose = (i: number) => {
    if (i < list.length) onChange(list[i].hex)
    focusAt(i)
  }
  const openCustom = () => {
    if (!live) return
    setDraft(isCustom ? hex : match ? match.hex : EXAMPLE)
    setTried(false)
    setOpen(true)
  }
  const draftHex = normHex(draft)
  const draftOk = isHex(draftHex)
  const apply = () => {
    setTried(true)
    if (!draftOk) return
    onChange(draftHex)
    setOpen(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-sw]")
    if (!btn || !count) return
    const cur = Number(btn.dataset.sw)
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (cur + 1) % count
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? (cur - 1 + count) % count
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? count - 1
              : null
    if (next == null) return
    e.preventDefault()
    /* Like native radios, arrows select — except in read-only, and except the "Custom…" stop, which only opens on Space / Enter. */
    if (live && next < list.length) choose(next)
    else focusAt(next)
  }

  const common = (i: number) => ({
    "data-sw": i,
    tabIndex: disabled ? -1 : i === focusIdx ? 0 : -1,
    disabled,
    live,
    showName: p.showName,
  })

  const chipName = match ? t(match.label) : isCustom ? t(L("Custom colour", "Warna lain")) : ""

  return (
    <div className="flex flex-col gap-2.5">
      <Popover open={open && live} onOpenChange={setOpen}>
        <div
          ref={group}
          id={`${id}-input`}
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-chip`}
          aria-readonly={state === "readonly" || undefined}
          aria-disabled={disabled || undefined}
          aria-invalid={bad || undefined}
          onKeyDown={onKeyDown}
          className={cn(
            "flex w-fit max-w-full flex-wrap rounded-2xl",
            p.showName ? "gap-x-1 gap-y-2" : compact ? "gap-2" : "gap-1.5",
            bad && "ring-2 ring-destructive/40 ring-offset-4 ring-offset-background",
          )}
        >
          {list.map((s, i) => (
            <Tile
              key={s.id}
              {...common(i)}
              on={i === checkedIdx}
              face={<Face hex={s.hex} on={i === checkedIdx} size={size} />}
              name={t(s.label)}
              aria-label={`${t(s.label)}, ${s.hex}`}
              title={p.showName ? undefined : `${t(s.label)} · ${s.hex}`}
              onClick={() => live && choose(i)}
            />
          ))}
          {allowCustom && (
            <PopoverAnchor asChild>
              <Tile
                {...common(list.length)}
                on={isCustom}
                face={<Face hex={isCustom ? hex : ""} on={isCustom} custom size={size} />}
                name={t(CUSTOM_LABEL)}
                aria-label={
                  isCustom
                    ? `${t(L("Custom colour", "Warna lain"))}, ${hex}. ${t(L("Press Space to change", "Tekan Spasi untuk mengganti"))}`
                    : `${t(L("Custom colour", "Warna lain"))}. ${t(L("Press Space to choose any colour", "Tekan Spasi untuk memilih warna apa saja"))}`
                }
                title={p.showName ? undefined : t(CUSTOM_LABEL)}
                onClick={openCustom}
              />
            </PopoverAnchor>
          )}
        </div>
        {allowCustom && (
          <PopoverContent
            align="start"
            aria-label={t(L("Custom colour", "Warna lain"))}
            className="w-72 max-w-[calc(100vw-1.5rem)] gap-3"
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              requestAnimationFrame(() => document.getElementById(`${id}-hex`)?.focus())
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault()
              group.current?.querySelector<HTMLElement>(`[data-sw="${list.length}"]`)?.focus()
            }}
          >
            <p className="text-sm font-medium">{t(L("Custom colour", "Warna lain"))}</p>
            <div className="flex items-start gap-3">
              <label
                className="relative grid size-16 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl ring-1 ring-foreground/15 ring-inset has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
                style={draftOk ? { backgroundColor: draftHex } : undefined}
              >
                {!draftOk && <HugeiconsIcon icon={ColorPickerIcon} className="size-5 text-muted-foreground" />}
                <input
                  type="color"
                  value={draftOk ? draftHex.toLowerCase() : "#000000"}
                  aria-label={t(L("Open the colour picker", "Buka pemilih warna"))}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                  onChange={(e) => setDraft(e.target.value.toUpperCase())}
                />
              </label>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Label htmlFor={`${id}-hex`} className="text-xs text-muted-foreground">
                  {t(L("Hex code", "Kode hex"))}
                </Label>
                <InputGroup>
                  <InputGroupAddon className="pr-0">
                    <InputGroupText className="font-mono">#</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id={`${id}-hex`}
                    value={draft.replace(/^#/, "")}
                    maxLength={6}
                    spellCheck={false}
                    autoComplete="off"
                    aria-invalid={(tried && !draftOk) || undefined}
                    aria-describedby={`${id}-hex-msg`}
                    className="pl-1 font-mono uppercase"
                    onChange={(e) => setDraft(`#${e.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 6).toUpperCase()}`)}
                    onBlur={() => setDraft(normHex(draft))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        apply()
                      }
                    }}
                  />
                </InputGroup>
                <p id={`${id}-hex-msg`} className={cn("text-xs", tried && !draftOk ? "font-medium text-destructive" : "text-muted-foreground")}>
                  {t(L(`Use a hex colour like ${EXAMPLE}`, `Pakai warna hex seperti ${EXAMPLE}`))}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                {t(L("Cancel", "Batal"))}
              </Button>
              <Button size="sm" onClick={apply}>
                {t(L("Use colour", "Pakai warna"))}
              </Button>
            </div>
          </PopoverContent>
        )}
      </Popover>
      <Chip id={`${id}-chip`} hex={hex} name={chipName} muted={disabled} />
    </div>
  )
}

function validate(p: ColorProps, v: ColorValue): Issue[] {
  const hex = normHex(v)
  if (!hex) return p.required ? [{ fid: "color", msg: reqMsg(p.label) }] : []
  if (!isHex(hex)) return [{ fid: "color", msg: L(`Use a hex colour like ${EXAMPLE}`, `Pakai warna hex seperti ${EXAMPLE}`) }]
  if (p.mode === "swatches" && !listed(p).some((s) => s.hex === hex))
    return [{ fid: "color", msg: L("Pick one of the listed colours", "Pilih salah satu warna yang tersedia") }]
  return []
}

export const colorPicker: ComponentDef<ColorProps, ColorValue> = {
  slug: "color",
  wave: 4,
  week: 6,
  ui: "COLOR",
  vk: "string",
  group: "choice",
  icon: PaintBoardIcon,
  label: L("Color picker", "Pilih warna"),
  title: L("Color picker", "Pilih warna"),
  blurb: L("Pick a colour from named swatches, or any hex colour.", "Pilih warna dari contoh warna bernama, atau warna hex apa saja."),

  defaults: () => ({
    label: L("Label colour", "Warna label"),
    name: "label_color",
    mode: "custom",
    swatches: [
      sw("#1E66F5", "Blue", "Biru"),
      sw("#179299", "Teal", "Hijau toska"),
      sw("#40A02B", "Green", "Hijau"),
      sw("#DF8E1D", "Amber", "Kuning tua"),
      sw("#FE640B", "Orange", "Oranye"),
      sw("#D20F39", "Red", "Merah"),
      sw("#EA76CB", "Pink", "Merah muda"),
      sw("#8839EF", "Purple", "Ungu"),
      sw("#6C6F85", "Grey", "Abu-abu"),
    ],
    showName: false,
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
          label: L("Colours allowed", "Warna yang boleh"),
          options: [
            { v: "swatches", label: L("Listed colours only", "Hanya warna di daftar") },
            { v: "custom", label: L("Listed + any colour", "Daftar + warna bebas") },
          ],
          hint: L(
            "**Listed colours only** keeps boards consistent. **Listed + any colour** adds a “Custom…” swatch with a colour picker and a hex field.",
            "**Hanya warna di daftar** menjaga tampilan board tetap seragam. **Daftar + warna bebas** menambah contoh “Warna lain…” dengan pemilih warna dan isian hex.",
          ),
        },
        { t: "custom", id: "swatches", render: (ctx) => <SwatchEditor {...ctx} />, validate: (_, p) => swatchesError(p) },
        {
          t: "switch",
          k: "showName",
          label: L("Show colour names under the swatches", "Tampilkan nama warna di bawah contoh warna"),
          hint: L(
            "Off = round swatches only. The chosen colour's name and hex are always shown as text under the swatches.",
            "Mati = hanya bulatan warna. Nama dan kode hex warna yang dipilih selalu tampil sebagai teks di bawahnya.",
          ),
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        F.required(L("Empty is saved as `\"\"`.", "Kosong disimpan sebagai `\"\"`.")),
        {
          t: "note",
          text: L(
            "Listed colours only: a value that is not in the list (e.g. from an old draft) is rejected with “Pick one of the listed colours”.",
            "Hanya warna di daftar: nilai di luar daftar (mis. dari draf lama) ditolak dengan pesan “Pilih salah satu warna yang tersedia”.",
          ),
          when: (p) => p.mode === "swatches",
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: ColorCanvas,

  Runtime: ColorRuntime,
  initial: () => "",
  sample: (p) => listed(p)[0]?.hex ?? EXAMPLE,
  validate,
  value: (_, v) => normHex(v),

  spec: (p) => ({
    ui_type: "COLOR",
    value_kind: "string",
    name: p.name,
    label: p.label,
    required: p.required,
    config: {
      mode: p.mode,
      swatches: p.swatches.map((s) => ({ hex: normHex(s.hex), label: s.label })),
      show_name: p.showName,
    },
  }),
  savedAs: (p) =>
    L(
      `An uppercase hex colour like \`${EXAMPLE}\` in \`${p.name}\`; empty is \`""\`. The swatch name is not saved.`,
      `Warna hex huruf besar seperti \`${EXAMPLE}\` di \`${p.name}\`; kosong \`""\`. Nama warna tidak ikut disimpan.`,
    ),
  notes: [
    L(
      "The value is always `#RRGGBB` in capitals (shorthand `#1e6` is expanded), so it compares and sorts the same everywhere. The name is looked up from `config.swatches` when shown.",
      "Nilainya selalu `#RRGGBB` huruf besar (singkatan `#1e6` dibuka), jadi sama saat dibandingkan dan diurutkan. Nama warna dicari dari `config.swatches` saat ditampilkan.",
    ),
    L(
      "Never colour alone: each swatch is a radio announced by its name and hex, and the chosen value is always written as text (WCAG 1.4.1).",
      "Tidak pernah hanya warna: setiap contoh warna adalah radio yang dibacakan dengan nama dan hex-nya, dan nilai terpilih selalu tertulis sebagai teks (WCAG 1.4.1).",
    ),
    L(
      "**Listed colours only**: the server should also check the value is one of `config.swatches[].hex`. Removing a swatch later leaves old values as a custom colour.",
      "**Hanya warna di daftar**: server sebaiknya juga mengecek nilai ada di `config.swatches[].hex`. Bila contoh warna dihapus nanti, nilai lama tampil sebagai warna lain.",
    ),
    L(
      "“Custom…” uses the browser's `<input type=\"color\">` (its look depends on the OS) plus a hex field. No transparency and no CSS colour names.",
      "“Warna lain…” memakai `<input type=\"color\">` bawaan browser (tampilannya mengikuti OS) ditambah isian hex. Tanpa transparansi dan tanpa nama warna CSS.",
    ),
    L(
      "Text drawn on the colour (e.g. a board label) must pick black or white by contrast; that is the board's job, not this field's.",
      "Teks di atas warna (mis. label di board) harus memilih hitam atau putih sesuai kontras; itu tugas board, bukan field ini.",
    ),
  ],
  story: {
    process: L("Project setup", "Penyiapan proyek"),
    step: L("Create project", "Buat proyek"),
    ref: "PRJ-2026-0093",
    due: "2026-11-13",
    task: L("Create the project and pick its colour on the board and calendar", "Buat proyek dan pilih warnanya di board dan kalender"),
    before: [
      {
        name: "project_name",
        label: L("Project name", "Nama proyek"),
        type: "text",
        required: true,
        value: "Implementasi WMS Gudang Cikarang",
      },
    ],
    after: [
      {
        name: "description",
        label: L("Description", "Deskripsi"),
        type: "textarea",
        rows: 3,
        placeholder: L("What is this project about?", "Proyek ini tentang apa?"),
        value: "Rollout sistem gudang di Cikarang, PIC Rizky Pratama. Target go-live 19 Nov 2026.",
      },
    ],
  },
}
