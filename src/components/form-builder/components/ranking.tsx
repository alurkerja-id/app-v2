/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useLayoutEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { DragDropVerticalIcon, PlusSignIcon, RankingIcon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { L, useT, type L10n } from "../i18n"
import { F, snake } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"
import { RankBadge, SortableList } from "./ranking-list"

/* Ranking — ui_type RANKING, value_kind "list" (option keys, rank 1 first). Story: training needs survey. */

interface RkOption {
  value: string
  label: L10n
  [k: string]: unknown
}
interface RankingProps {
  label: L10n
  name: string
  options: RkOption[]
  /** `all` = rank every option; `top` = pick N and rank them. */
  mode: "all" | "top"
  topN: number
  /** Random starting order per task (against order bias); never saved. */
  shuffle: boolean
  required: boolean
}
interface RankingValue {
  /** Every option key in screen order. All mode: the ranking. Top mode: the order of the "Other options" pool. */
  order: string[]
  /** Top mode: picked keys, rank 1 first. */
  picked: string[]
  /** All mode: the user moved something or pressed "Keep this order" — only then is the order an answer. */
  confirmed: boolean
}

const opt = (en: string, id: string): RkOption => ({ value: snake(en), label: L(en, id) })
const keysOf = (p: RankingProps) => p.options.map((o) => o.value)
const topOf = (p: RankingProps) => Math.max(2, Math.min(p.options.length, Math.round(Number(p.topN)) || 3))

function shuffled<T>(a: T[]): T[] {
  const out = a.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** The value's order with options added / removed in Edit Element taken into account. */
const orderOf = (p: RankingProps, v: RankingValue) => {
  const ks = keysOf(p)
  return [...v.order.filter((k) => ks.includes(k)), ...ks.filter((k) => !v.order.includes(k))]
}
const pickedOf = (p: RankingProps, v: RankingValue) => {
  const ks = keysOf(p)
  return v.picked.filter((k) => ks.includes(k)).slice(0, topOf(p))
}

/** What a typical answer looks like (Read-only / Disabled columns). */
const PREF = ["excel_data_analysis", "project_management", "leadership", "business_english", "public_speaking", "negotiation"]
const prefOrder = (p: RankingProps) => {
  const ks = keysOf(p)
  return [...PREF.filter((k) => ks.includes(k)), ...ks.filter((k) => !PREF.includes(k))]
}

/* ── canvas ─────────────────────────────────────────────────────────────── */

function RkCanvas({ props: p }: { props: RankingProps }) {
  const t = useT()
  const n = topOf(p)
  if (p.mode === "top") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold">{t(L(`Your top ${n}`, `${n} teratas Anda`))}</p>
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: n }, (_, i) => (
            <div key={i} className="flex h-10 items-center gap-2.5 rounded-2xl border border-dashed border-border px-2.5">
              <RankBadge n={i + 1} solid={false} />
            </div>
          ))}
        </div>
        <p className="text-xs font-semibold">{t(L("Other options", "Opsi lainnya"))}</p>
        <div className="flex flex-wrap gap-1.5">
          {p.options.map((o) => (
            <span key={o.value} className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs">
              <HugeiconsIcon icon={PlusSignIcon} className="size-3" />
              {t(o.label)}
            </span>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      {p.options.map((o, i) => (
        <div key={o.value} className="flex h-10 items-center gap-2 rounded-2xl border border-border bg-background px-2">
          <HugeiconsIcon icon={DragDropVerticalIcon} className="size-4 text-muted-foreground" />
          <RankBadge n={i + 1} solid={false} />
          <span className="truncate text-sm">{t(o.label)}</span>
        </div>
      ))}
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

function RkRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<RankingProps, RankingValue>) {
  const t = useT()
  const root = useRef<HTMLDivElement>(null)
  const pending = useRef<string | null>(null)
  const [msg, setMsg] = useState("")
  /* A trailing zero-width space flips on every message, so a repeated message is announced again. */
  const announce = (m: L10n) => setMsg((prev) => t(m) + (prev.endsWith("​") ? "" : "​"))

  /* Adding / removing / keeping removes the focused button — move focus to where the user continues. */
  useLayoutEffect(() => {
    if (!pending.current) return
    const el = root.current?.querySelector<HTMLElement>(pending.current)
    pending.current = null
    el?.focus()
  })

  const order = orderOf(p, v)
  const picked = pickedOf(p, v)
  const n = topOf(p)
  const byKey = new Map(p.options.map((o) => [o.value, o]))
  const name = (k: string) => t(byKey.get(k)?.label ?? L(k))
  const bad = issues.length > 0
  const helpId = `${id}-rk-help`
  const status = (
    <p aria-live="assertive" className="sr-only">
      {msg}
    </p>
  )

  /* Read-only / Disabled: the answer as a numbered list. */
  if (state !== "active") {
    const off = state === "disabled"
    const keys = p.mode === "top" ? picked : v.confirmed ? order : []
    const rest = p.mode === "top" ? order.filter((k) => !picked.includes(k)) : []
    return (
      <div className={cn("flex flex-col gap-2", off && "cursor-not-allowed")} aria-disabled={off || undefined}>
        {keys.length ? (
          <ol aria-labelledby={`${id}-label`} className="flex flex-col gap-1.5">
            {keys.map((k, i) => (
              <li key={k} className={cn("flex min-h-10 items-center gap-2.5 rounded-2xl bg-muted px-3 py-1.5 text-sm", off && "text-muted-foreground")}>
                <RankBadge n={i + 1} solid={!off} muted={off} />
                <span className="min-w-0 flex-1 break-words">{name(k)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">{t(L("Not ranked yet", "Belum diurutkan"))}</p>
        )}
        {rest.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t(L(`Not in the top ${n}: `, `Tidak masuk ${n} teratas: `))}
            {rest.map(name).join(", ")}
          </p>
        )}
      </div>
    )
  }

  const help = (
    <p id={helpId} className={cn("text-xs text-muted-foreground", (compact || (p.mode === "top" && picked.length < 2)) && "sr-only")}>
      {t(
        L(
          "Drag the handle or use the arrows. Keyboard: Space picks up a row, ↑ ↓ move it, Space drops, Esc cancels.",
          "Seret pegangannya atau pakai tombol panah. Keyboard: Spasi mengangkat baris, ↑ ↓ memindah, Spasi meletakkan, Esc batal.",
        ),
      )}
      {p.mode === "top" && t(L(" Delete removes it from the top list.", " Delete mengeluarkannya dari daftar teratas."))}
    </p>
  )

  if (p.mode === "all") {
    const keep = () => {
      onChange({ ...v, order, confirmed: true })
      announce(L("Current order kept as your answer", "Urutan saat ini dipakai sebagai jawaban"))
      pending.current = "[data-rk-focus]"
    }
    return (
      <div ref={root} className="flex flex-col gap-2.5">
        {help}
        <SortableList
          keys={order}
          name={name}
          total={order.length}
          solid={v.confirmed}
          compact={compact}
          invalid={bad}
          labelledBy={`${id}-label`}
          describedBy={helpId}
          onCommit={(next) => onChange({ ...v, order: next, confirmed: true })}
          announce={announce}
        />
        {v.confirmed ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Tick02Icon} className="size-3.5 shrink-0 text-primary" />
            {t(L("This order is your answer. Move an option to change it.", "Urutan ini jawaban Anda. Pindahkan opsi untuk mengubahnya."))}
          </p>
        ) : (
          <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-dashed px-3 py-2", bad ? "border-destructive/50 bg-destructive/5" : "border-border")}>
            <p className="min-w-0 flex-1 basis-56 text-xs text-muted-foreground">
              {t(
                L(
                  "This is only the starting order, not an answer yet. Move the options, or keep this order.",
                  "Ini baru urutan awal, belum jawaban. Pindahkan opsinya, atau pakai urutan ini.",
                ),
              )}
            </p>
            <Button size="sm" variant="outline" onClick={keep} aria-invalid={bad || undefined}>
              <HugeiconsIcon icon={Tick02Icon} />
              {t(L("Keep this order", "Pakai urutan ini"))}
            </Button>
          </div>
        )}
        {status}
      </div>
    )
  }

  /* Top mode: "Your top N" (sortable) + "Other options" (tap to add). */
  const pool = order.filter((k) => !picked.includes(k))
  const full = picked.length >= n
  const add = (k: string, idx: number) => {
    if (full) return
    const next = [...picked, k]
    onChange({ ...v, order, picked: next })
    announce(L(`${name(k)} added as number ${next.length} of ${n}`, `${name(k)} ditambahkan sebagai nomor ${next.length} dari ${n}`))
    const stay = next.length < n ? (pool[idx + 1] ?? pool[idx - 1]) : undefined
    pending.current = stay ? `[data-rk-pool="${stay}"]` : `[data-rk-focus="${k}"]`
  }
  const remove = (k: string, i: number) => {
    const next = picked.filter((x) => x !== k)
    onChange({ ...v, order, picked: next })
    announce(L(`${name(k)} removed from your top ${n}`, `${name(k)} dikeluarkan dari ${n} teratas Anda`))
    const stay = next[i] ?? next[i - 1]
    pending.current = stay ? `[data-rk-focus="${stay}"]` : `[data-rk-pool="${k}"]`
  }

  return (
    <div ref={root} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <p id={`${id}-rk-top`} className="text-xs font-semibold text-foreground">
            {t(L(`Your top ${n}`, `${n} teratas Anda`))}
          </p>
          <span className={cn("text-xs tabular-nums", full ? "font-medium text-foreground" : "text-muted-foreground")}>
            {t(L(`${picked.length} of ${n} picked`, `${picked.length} dari ${n} dipilih`))}
          </span>
        </div>
        <SortableList
          keys={picked}
          name={name}
          total={n}
          solid
          compact={compact}
          invalid={bad}
          labelledBy={`${id}-label ${id}-rk-top`}
          describedBy={helpId}
          slots={n - picked.length}
          slotText={picked.length ? L("Your next pick goes here", "Pilihan berikutnya masuk ke sini") : L("Tap an option below to add it", "Ketuk opsi di bawah untuk menambahkannya")}
          removeLabel={(label) => t(L(`Remove ${label} from your top ${n}`, `Keluarkan ${label} dari ${n} teratas`))}
          onCommit={(next) => onChange({ ...v, order, picked: next })}
          onRemove={remove}
          announce={announce}
        />
        {help}
      </div>
      <div className="flex flex-col gap-1.5">
        <p id={`${id}-rk-pool`} className="text-xs font-semibold text-foreground">
          {t(L("Other options", "Opsi lainnya"))}
        </p>
        {pool.length ? (
          <ul aria-labelledby={`${id}-rk-pool`} className={cn("flex gap-1.5", compact ? "flex-col" : "flex-wrap")}>
            {pool.map((k, idx) => (
              <li key={k}>
                <Button
                  variant="outline"
                  size="sm"
                  data-rk-pool={k}
                  disabled={full}
                  aria-label={full ? name(k) : t(L(`Add ${name(k)} as number ${picked.length + 1}`, `Tambahkan ${name(k)} sebagai nomor ${picked.length + 1}`))}
                  onClick={() => add(k, idx)}
                  className={cn("h-auto min-h-8 py-1.5 text-left whitespace-normal", compact && "min-h-11 w-full justify-start")}
                >
                  <HugeiconsIcon icon={PlusSignIcon} />
                  {name(k)}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">{t(L("Every option is in your top list.", "Semua opsi sudah masuk daftar teratas."))}</p>
        )}
        {full && pool.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {t(L(`Your top ${n} is full. Remove one (×) to swap it for another.`, `${n} teratas Anda sudah penuh. Keluarkan satu (×) untuk menggantinya.`))}
          </p>
        )}
      </div>
      {status}
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

function validate(p: RankingProps, v: RankingValue): Issue[] {
  if (!p.required) return []
  if (p.mode === "all")
    return v.confirmed ? [] : [{ fid: "ranking", msg: L("Put the options in order, or confirm the current order", "Urutkan opsinya, atau konfirmasi urutan saat ini") }]
  const n = topOf(p)
  return pickedOf(p, v).length >= n ? [] : [{ fid: "ranking", msg: L(`Pick your top ${n}`, `Pilih ${n} teratas Anda`) }]
}

export const ranking: ComponentDef<RankingProps, RankingValue> = {
  slug: "ranking",
  wave: 4,
  week: 6,
  ui: "RANKING",
  vk: "list",
  group: "survey",
  icon: RankingIcon,
  label: L("Ranking", "Urutan prioritas"),
  title: L("Ranking", "Urutan prioritas"),
  blurb: L("Put options in order, or pick and order the top few.", "Mengurutkan opsi, atau memilih dan mengurutkan beberapa teratas."),

  defaults: () => ({
    label: L("Training you need most", "Pelatihan yang paling Anda butuhkan"),
    name: "training_priorities",
    options: [
      opt("Leadership", "Kepemimpinan"),
      opt("Public speaking", "Berbicara di depan umum"),
      opt("Excel & data analysis", "Excel & analisis data"),
      opt("Project management", "Manajemen proyek"),
      opt("Business English", "Bahasa Inggris bisnis"),
      opt("Negotiation", "Negosiasi"),
    ],
    mode: "top",
    topN: 3,
    shuffle: true,
    required: true,
  }),
  schema: (p) => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(),
        {
          t: "list",
          k: "options",
          label: L("Options", "Opsi"),
          keyField: "value",
          min: 2,
          max: 10,
          addLabel: L("Add option", "Tambah opsi"),
          hint: L("The small text is the key saved in the ranked list.", "Teks kecil adalah key yang disimpan di daftar urutan."),
        },
        {
          t: "seg",
          k: "mode",
          label: L("What to rank", "Yang diurutkan"),
          options: [
            { v: "all", label: L("Every option", "Semua opsi") },
            { v: "top", label: L("Top few only", "Beberapa teratas saja") },
          ],
          hint: L(
            "**Top few only**: the user picks N options and orders them; the rest get no rank.",
            "**Beberapa teratas saja**: user memilih N opsi lalu mengurutkannya; sisanya tidak diberi peringkat.",
          ),
        },
        {
          t: "number",
          k: "topN",
          label: L("How many to pick (N)", "Jumlah yang dipilih (N)"),
          min: 2,
          max: Math.max(2, p.options.length),
          when: (o) => o.mode === "top",
          validate: (val, o) =>
            Number(val) > o.options.length ? L(`Use ${o.options.length} or less (the number of options)`, `Maksimal ${o.options.length} (jumlah opsi)`) : null,
          hint: L("From 2 up to the number of options.", "Dari 2 sampai jumlah opsi."),
        },
        {
          t: "switch",
          k: "shuffle",
          label: L("Shuffle the starting order", "Acak urutan awal"),
          hint: L(
            "A new random order for every task, so the first option is not favoured. The order shown is not saved.",
            "Urutan acak baru untuk setiap task, agar opsi pertama tidak diuntungkan. Urutan yang ditampilkan tidak disimpan.",
          ),
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        F.required(
          p.mode === "all"
            ? L("Required = the user moves an option or presses **Keep this order**.", "Wajib = user memindah opsi atau menekan **Pakai urutan ini**.")
            : L(`Required = exactly ${topOf(p)} picked. Optional = any number up to ${topOf(p)}.`, `Wajib = tepat ${topOf(p)} dipilih. Opsional = berapa pun sampai ${topOf(p)}.`),
        ),
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: RkCanvas,

  Runtime: RkRuntime,
  initial: (p) => ({ order: p.shuffle ? shuffled(keysOf(p)) : keysOf(p), picked: [], confirmed: false }),
  sample: (p) =>
    p.mode === "all" ? { order: prefOrder(p), picked: [], confirmed: true } : { order: keysOf(p), picked: prefOrder(p).slice(0, topOf(p)), confirmed: false },
  validate,
  value: (p, v) => (p.mode === "all" ? (v.confirmed ? orderOf(p, v) : []) : pickedOf(p, v)),

  spec: (p) => ({
    ui_type: "RANKING",
    value_kind: "list",
    name: p.name,
    label: p.label,
    required: p.required,
    config: { mode: p.mode, top_n: p.mode === "top" ? topOf(p) : null, shuffle: p.shuffle },
    options: p.options.map((o) => ({ value: o.value, label: o.label })),
  }),
  savedAs: (p) =>
    p.mode === "all"
      ? L(
          `A list of every option key in \`${p.name}\`, rank 1 first. Stays \`[]\` until the user moves an option or keeps the order.`,
          `Daftar semua key opsi di \`${p.name}\`, peringkat 1 di depan. Tetap \`[]\` sampai user memindah opsi atau memakai urutan awal.`,
        )
      : L(
          `A list of the ${topOf(p)} picked option keys in \`${p.name}\`, rank 1 first; empty is \`[]\`.`,
          `Daftar ${topOf(p)} key opsi yang dipilih di \`${p.name}\`, peringkat 1 di depan; kosong \`[]\`.`,
        ),
  notes: [
    L(
      "The value is the option keys in rank order (first = most important), so labels can be reworded later. Top mode saves only the N picked; the others have no rank.",
      "Nilainya adalah key opsi sesuai peringkat (pertama = paling penting), jadi label bisa diubah nanti. Mode teratas hanya menyimpan N yang dipilih; sisanya tidak punya peringkat.",
    ),
    L(
      "**Shuffle** only changes the starting order on screen, new for every task (against order bias). It is not saved, and the payload does not say which order was shown.",
      "**Acak** hanya mengubah urutan awal di layar, baru untuk setiap task (mengurangi bias urutan). Tidak disimpan, dan payload tidak mencatat urutan yang ditampilkan.",
    ),
    L(
      "Every option: the starting order is not an answer until the user moves an option or presses **Keep this order**; an untouched list stays `[]`, so it never passes for a deliberate ranking.",
      "Semua opsi: urutan awal belum menjadi jawaban sampai user memindah opsi atau menekan **Pakai urutan ini**; daftar yang tidak disentuh tetap `[]`, jadi tidak pernah terbaca sebagai peringkat yang disengaja.",
    ),
    L(
      "Drag uses pointer events on the handle (mouse, touch, pen; `touch-action: none` on the handle only, so the page still scrolls), no library. Up / down buttons do the same. Keyboard: Tab to the list, ↑ ↓ choose a row, Space picks up, ↑ ↓ move, Space drops, Esc cancels; every move is announced in an `aria-live` region.",
      "Seret memakai pointer event di pegangan (mouse, sentuh, pena; `touch-action: none` hanya di pegangan, jadi halaman tetap bisa digulir), tanpa library. Tombol naik / turun melakukan hal yang sama. Keyboard: Tab ke daftar, ↑ ↓ memilih baris, Spasi mengangkat, ↑ ↓ memindah, Spasi meletakkan, Esc batal; setiap perpindahan dibacakan lewat region `aria-live`.",
    ),
    L(
      "Reports: average rank per option, or how often each option is first (top mode: how often it is in the top N).",
      "Laporan: rata-rata peringkat per opsi, atau seberapa sering opsi ada di urutan pertama (mode teratas: seberapa sering masuk N teratas).",
    ),
  ],
  story: {
    process: L("Training needs survey", "Survei kebutuhan pelatihan"),
    step: L("Employee response", "Jawaban karyawan"),
    ref: "TNA-2026-Q4-117",
    due: "2026-11-18",
    task: L("Training needs for 2027", "Kebutuhan pelatihan 2027"),
    after: [
      {
        name: "other_topic",
        label: L("Other topic", "Topik lain"),
        type: "text",
        placeholder: L("Optional — a topic that is not in the list", "Opsional — topik yang tidak ada di daftar"),
        value: "",
      },
    ],
  },
}
