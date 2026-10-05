/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, SearchList01Icon } from "@hugeicons/core-free-icons"

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { GhostInput } from "../field-shell"
import { L, tr, useLang, useT, type L10n } from "../i18n"
import { F, ctl, norm, reqMsg, uniqueErr } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"

/* Autocomplete — ui_type AUTOCOMPLETE, value_kind "string". Story: vendor bank account. */

interface AcOption {
  value: string
  label: L10n
  [k: string]: unknown
}
interface AcProps {
  label: L10n
  name: string
  placeholder: L10n
  options: AcOption[]
  allowCustom: boolean
  minChars: number
  maxResults: number
  required: boolean
}
/** `q` = text in the input; `value` = chosen option value or kept custom text (null = nothing chosen). */
interface AcValue {
  q: string
  value: string | null
}

const BANKS: [string, string][] = [
  ["bca", "Bank Central Asia (BCA)"],
  ["mandiri", "Bank Mandiri"],
  ["bri", "Bank Rakyat Indonesia (BRI)"],
  ["bni", "Bank Negara Indonesia (BNI)"],
  ["bsi", "Bank Syariah Indonesia (BSI)"],
  ["btn", "Bank Tabungan Negara (BTN)"],
  ["cimb_niaga", "CIMB Niaga"],
  ["danamon", "Bank Danamon"],
  ["permata", "Bank Permata"],
  ["ocbc", "OCBC Indonesia"],
  ["panin", "Panin Bank"],
  ["mega", "Bank Mega"],
  ["jago", "Bank Jago"],
  ["bjb", "bank bjb"],
  ["jatim", "Bank Jatim"],
]

const optBy = (p: AcProps, v: string | null) => (v == null ? undefined : p.options.find((o) => o.value === v))

/** Options whose EN label, ID label or value contain the typed text, once it is long enough. */
function results(p: AcProps, q: string) {
  const n = norm(q)
  if (n.length < Number(p.minChars)) return []
  return p.options.filter((o) => !n || norm(`${o.label.en} ${o.label.id} ${o.value}`).includes(n)).slice(0, Number(p.maxResults) || 6)
}

/** Offer “Use …” when custom values are allowed and the text is not an option label. */
const customOk = (p: AcProps, q: string, label: (o: AcOption) => string) =>
  p.allowCustom && q.trim() !== "" && !p.options.some((o) => norm(label(o)) === norm(q))

/** Wraps the parts of `text` that match a typed word in <mark> (shaping: matches are bold). */
function Highlight({ text, q }: { text: string; q: string }) {
  const words = norm(q).split(" ").filter(Boolean)
  if (!words.length) return <>{text}</>
  const low = text.toLowerCase()
  const marks = new Array<boolean>(text.length).fill(false)
  for (const w of words) {
    let i = low.indexOf(w)
    while (i > -1) {
      for (let j = i; j < i + w.length; j++) marks[j] = true
      i = low.indexOf(w, i + 1)
    }
  }
  const out: ReactNode[] = []
  let start = 0
  for (let i = 1; i <= text.length; i++) {
    if (i < text.length && marks[i] === marks[start]) continue
    const part = text.slice(start, i)
    out.push(
      marks[start] ? (
        <mark key={start} className="bg-transparent font-bold text-inherit">
          {part}
        </mark>
      ) : (
        <Fragment key={start}>{part}</Fragment>
      ),
    )
    start = i
  }
  return <>{out}</>
}

/* Same surface as the app's Select / Combobox popups. */
const LIST_SURFACE =
  "dark relative w-(--radix-popover-trigger-width) gap-0 overflow-hidden rounded-3xl bg-popover/70 p-0 text-popover-foreground shadow-lg ring-1 ring-foreground/5 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 dark:ring-foreground/10"
const OPTION =
  "flex cursor-pointer items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm font-medium select-none hover:bg-foreground/10 aria-selected:bg-foreground/10"

function AcCanvas({ props: p }: { props: AcProps }) {
  const t = useT()
  const n = Number(p.minChars)
  return (
    <div className="flex flex-col gap-1.5">
      <GhostInput>{t(p.placeholder)}</GhostInput>
      <p className="text-xs text-muted-foreground">
        {t(
          L(
            `${p.options.length} options · suggestions after ${n} character${n === 1 ? "" : "s"}`,
            `${p.options.length} opsi · saran muncul setelah ${n} karakter`,
          ),
        )}
      </p>
    </div>
  )
}

function AcRuntime({ props: p, value: v, onChange, state, issues, id }: RuntimeProps<AcProps, AcValue>) {
  const t = useT()
  const { lang } = useLang()
  const live = state === "active"
  const bad = issues.length > 0 || undefined
  const input = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)

  const labelOf = (o: AcOption) => tr(lang, o.label)
  const all = results(p, v.q)
  const allTotal = all.length + (customOk(p, v.q, labelOf) ? 1 : 0)
  const shown = open && live
  const list = shown ? all : []
  const extra = shown && customOk(p, v.q, labelOf)
  const total = list.length + (extra ? 1 : 0)
  const showList = shown && (total > 0 || norm(v.q).length >= Number(p.minChars))
  const cur = Math.min(hi, Math.max(0, total - 1))
  const sel = optBy(p, v.value)
  const listId = `${id}-list`
  const optId = (i: number) => `${id}-o-${i}`

  /* Keep the highlighted option visible inside the list (not the page). */
  useEffect(() => {
    const c = box.current
    const el = c?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!c || !el) return
    if (el.offsetTop < c.scrollTop) c.scrollTop = el.offsetTop
    else if (el.offsetTop + el.offsetHeight > c.scrollTop + c.clientHeight) c.scrollTop = el.offsetTop + el.offsetHeight - c.clientHeight
  })

  const pick = (o: AcOption | null) => {
    onChange(o ? { q: labelOf(o), value: o.value } : { ...v, value: v.q.trim() })
    setOpen(false)
    setHi(0)
    input.current?.focus()
  }

  const shownText = !live && sel ? labelOf(sel) : v.q

  return (
    <div className="flex flex-col gap-1.5">
      <Popover open={showList}>
        <PopoverAnchor asChild>
          <InputGroup data-disabled={state === "disabled" || undefined}>
            <InputGroupInput
              ref={input}
              id={`${id}-input`}
              role="combobox"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={showList}
              aria-controls={listId}
              aria-activedescendant={total ? optId(cur) : undefined}
              aria-invalid={bad}
              aria-describedby={`${id}-note`}
              value={shownText}
              placeholder={live ? t(p.placeholder) : undefined}
              {...ctl(state)}
              onFocus={() => live && Number(p.minChars) === 0 && setOpen(true)}
              onBlur={() => setOpen(false)}
              onChange={(e) => {
                if (!live) return
                const q = e.target.value
                const exact = p.options.find((o) => norm(labelOf(o)) === norm(q))
                onChange({ q, value: exact ? exact.value : null })
                setOpen(true)
                setHi(0)
              }}
              onKeyDown={(e) => {
                if (!live || e.nativeEvent.isComposing) return
                if (e.key === "ArrowDown") {
                  e.preventDefault()
                  setHi(open && allTotal ? (cur + 1) % allTotal : 0)
                  setOpen(true)
                } else if (e.key === "ArrowUp") {
                  e.preventDefault()
                  setHi(total ? (cur + total - 1) % total : 0)
                } else if (e.key === "Enter" && showList && total) {
                  e.preventDefault()
                  pick(cur < list.length ? list[cur] : null)
                } else if (e.key === "Escape") {
                  setOpen(false)
                }
              }}
            />
            {live && v.q && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label={t(L("Clear", "Kosongkan"))}
                  onClick={() => {
                    onChange({ q: "", value: null })
                    setOpen(true)
                    setHi(0)
                    input.current?.focus()
                  }}
                >
                  <HugeiconsIcon icon={Cancel01Icon} />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
        </PopoverAnchor>
        <PopoverContent
          role="listbox"
          id={listId}
          aria-labelledby={`${id}-label`}
          align="start"
          sideOffset={6}
          className={LIST_SURFACE}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div ref={box} className="relative max-h-72 overflow-y-auto overscroll-contain p-1.5">
            {total ? (
              <>
                {list.map((o, i) => (
                  <div key={o.value} id={optId(i)} role="option" aria-selected={i === cur} className={OPTION} onClick={() => pick(o)}>
                    <span className="min-w-0 truncate">
                      <Highlight text={labelOf(o)} q={v.q} />
                    </span>
                    <small className="shrink-0 font-mono text-[11px] text-muted-foreground">{o.value}</small>
                  </div>
                ))}
                {extra && (
                  <div id={optId(list.length)} role="option" aria-selected={cur === list.length} className={`${OPTION} text-primary`} onClick={() => pick(null)}>
                    {t(L(`Use “${v.q.trim()}”`, `Pakai “${v.q.trim()}”`))}
                  </div>
                )}
              </>
            ) : (
              <div role="option" aria-selected={false} aria-disabled="true" className="px-3 py-2 text-sm text-muted-foreground">
                {t(L(`No option matches “${v.q}”`, `Tidak ada opsi yang cocok dengan “${v.q}”`))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <p id={`${id}-note`} className="text-xs text-muted-foreground">
        {sel ? (
          <>
            {t(L("Saved as ", "Disimpan sebagai "))}
            <b className="font-mono font-semibold text-foreground">{sel.value}</b>
          </>
        ) : v.value ? (
          <>
            {t(L("Saved as typed: ", "Disimpan sesuai ketikan: "))}
            <b className="font-semibold text-foreground">{v.value}</b>
          </>
        ) : (
          t(L("Use ↑ ↓ and Enter to pick.", "Pakai ↑ ↓ lalu Enter untuk memilih."))
        )}
      </p>
    </div>
  )
}

function validate(p: AcProps, v: AcValue): Issue[] {
  if (v.value == null && !v.q.trim()) return p.required ? [{ fid: "input", msg: reqMsg(p.label) }] : []
  if (v.value == null)
    return [
      {
        fid: "input",
        msg: p.allowCustom
          ? L("Pick an option or choose “Use …” to keep your text", "Pilih opsi atau pilih “Pakai …” untuk memakai ketikan Anda")
          : L(`Pick a ${p.label.en.toLowerCase()} from the list`, `Pilih ${p.label.id.toLowerCase()} dari daftar`),
      },
    ]
  return []
}

export const autocomplete: ComponentDef<AcProps, AcValue> = {
  slug: "autocomplete",
  wave: 2,
  ui: "AUTOCOMPLETE",
  vk: "string",
  group: "choice",
  week: 4,
  icon: SearchList01Icon,
  label: L("Autocomplete", "Isian otomatis"),
  title: L("Autocomplete", "Isian otomatis"),
  blurb: L("Type to filter a long option list, then pick with keyboard or mouse.", "Ketik untuk menyaring daftar pilihan panjang, lalu pilih dengan keyboard atau mouse."),

  defaults: () => ({
    label: L("Bank", "Bank"),
    name: "bank",
    placeholder: L("Type a bank name", "Ketik nama bank"),
    options: BANKS.map(([value, n]) => ({ value, label: L(n, n) })),
    allowCustom: false,
    minChars: 1,
    maxResults: 6,
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(),
        { t: "i18n", k: "placeholder", label: L("Placeholder", "Placeholder") },
        {
          t: "list",
          k: "options",
          label: L("Options", "Opsi"),
          keyField: "value",
          min: 1,
          max: 500,
          addLabel: L("Add option", "Tambah opsi"),
          newItem: (n) => ({ value: `option_${n + 1}`, label: L(`Option ${n + 1}`, `Opsi ${n + 1}`) }),
          hint: L("The small text is the saved value.", "Teks kecil adalah nilai yang disimpan."),
        },
        {
          t: "switch",
          k: "allowCustom",
          label: L("Allow a value not in the list", "Boleh nilai di luar daftar"),
          hint: L("Off = the user must pick an option.", "Mati = user wajib memilih dari opsi."),
        },
        { t: "number", k: "minChars", label: L("Suggest after (characters)", "Saran muncul setelah (karakter)"), min: 0, max: 3 },
        { t: "number", k: "maxResults", label: L("Maximum suggestions shown", "Maksimal saran tampil"), min: 3, max: 20 },
      ],
    },
    { tab: "validation", fields: [F.required()] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: AcCanvas,
  canvasWarn: (p) => (uniqueErr(p.options, "value") ? L("Duplicate option values", "Nilai opsi ganda") : null),

  Runtime: AcRuntime,
  initial: () => ({ q: "", value: null }),
  sample: (p) => {
    const o = optBy(p, "mandiri") ?? p.options[0]
    return o ? { q: o.label.en, value: o.value } : { q: "", value: null }
  },
  validate,
  value: (_, v) => (v.value == null ? "" : v.value),

  spec: (p) => ({
    ui_type: "AUTOCOMPLETE",
    value_kind: "string",
    name: p.name,
    label: p.label,
    required: p.required,
    placeholder: p.placeholder,
    config: {
      options: p.options.map((o) => ({ value: o.value, label: o.label })),
      allow_custom: p.allowCustom,
      min_chars: Number(p.minChars),
      max_results: Number(p.maxResults),
    },
  }),
  savedAs: (p) =>
    L(
      `The option value (e.g. \`bca\`) in \`${p.name}\`${p.allowCustom ? ", or the typed text when it is not in the list" : ""}.`,
      `Nilai opsi (mis. \`bca\`) di \`${p.name}\`${p.allowCustom ? ", atau teks ketikan bila tidak ada di daftar" : ""}.`,
    ),
  notes: [
    L(
      "Use it when a list is too long for a dropdown (about 15+ options). The list here is static; lists from an API stay in Remote Select.",
      "Pakai bila daftar terlalu panjang untuk dropdown (sekitar 15+ opsi). Daftar di sini statis; daftar dari API tetap memakai Remote Select.",
    ),
    L(
      'ARIA combobox pattern: `role="combobox"`, `aria-expanded`, `aria-activedescendant`, listbox options.',
      'Pola ARIA combobox: `role="combobox"`, `aria-expanded`, `aria-activedescendant`, opsi listbox.',
    ),
    L("Search matches the English label, the Indonesian label and the value.", "Pencarian mencocokkan label bahasa Inggris, label bahasa Indonesia, dan nilai."),
  ],
  story: {
    process: L("Vendor registration", "Pendaftaran vendor"),
    step: L("Payment details", "Data pembayaran"),
    ref: "VND-2026-0088",
    due: "2026-10-14",
    task: L("Add bank account: CV Mitra Kantor", "Tambah rekening: CV Mitra Kantor"),
    after: [
      {
        name: "account_number",
        label: L("Account number", "Nomor rekening"),
        type: "text",
        required: true,
        value: "",
        validate: (v) => (v && !/^\d{8,16}$/.test(v) ? L("Use 8–16 digits", "Gunakan 8–16 digit") : null),
      },
      { name: "account_holder", label: L("Account holder name", "Nama pemilik rekening"), type: "text", required: true, value: "CV Mitra Kantor" },
    ],
  },
}
