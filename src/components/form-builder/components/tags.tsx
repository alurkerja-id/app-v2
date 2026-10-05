/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useRef, useState, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, Tag01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { L, useT, type L10n } from "../i18n"
import { F, ctl, norm } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"

/* Tags input — ui_type TAGS, value_kind "list" (array of strings). Story: vendor registration. */

interface TagSuggestion {
  text: string
  [k: string]: unknown
}
interface TagsProps {
  label: L10n
  name: string
  placeholder: L10n
  /** One-language rows (`list` with `i18n: false`): tags are saved as typed. */
  suggestions: TagSuggestion[]
  allowNew: boolean
  maxTags: number
  maxLen: number
  required: boolean
}
/** `tags` is the value; `q` (the text being typed) and `msg` (the live message) are UI state that resets with the form. */
interface TagsValue {
  tags: string[]
  q: string
  msg: L10n | null
}

const sugg = (p: TagsProps) => p.suggestions.map((s) => s.text).filter(Boolean)
const maxTags = (p: TagsProps) => Number(p.maxTags) || 5
const maxLen = (p: TagsProps) => Number(p.maxLen) || 30

/** Up to 6 suggestions not added yet that contain the typed text. */
function matches(p: TagsProps, v: TagsValue) {
  const q = norm(v.q)
  const have = v.tags.map(norm)
  return sugg(p)
    .filter((s) => !have.includes(norm(s)) && (!q || norm(s).includes(q)))
    .slice(0, 6)
}

/** Add one tag, or explain why not (same rules and order as the prototype). */
function add(p: TagsProps, v: TagsValue, text: string): TagsValue {
  const t = String(text || "")
    .trim()
    .replace(/\s+/g, " ")
  if (!t) return { ...v, msg: null }
  if (v.tags.length >= maxTags(p)) return { ...v, msg: L(`Maximum of ${maxTags(p)} tags reached`, `Batas ${maxTags(p)} tag tercapai`) }
  if (t.length > maxLen(p)) return { ...v, msg: L(`Tags can be up to ${maxLen(p)} characters`, `Tag maksimal ${maxLen(p)} karakter`) }
  if (v.tags.some((x) => norm(x) === norm(t))) return { ...v, msg: L(`“${t}” is already added`, `“${t}” sudah ditambahkan`) }
  const fromList = sugg(p).find((s) => norm(s) === norm(t))
  if (!fromList && !p.allowNew) return { ...v, msg: L("Pick a tag from the suggestions", "Pilih tag dari saran") }
  return { tags: [...v.tags, fromList ?? t], q: "", msg: null }
}

/* Same surface as the app's Select / Combobox popups. */
const LIST_SURFACE =
  "dark relative w-(--radix-popover-trigger-width) gap-0 overflow-hidden rounded-3xl bg-popover/70 p-0 text-popover-foreground shadow-lg ring-1 ring-foreground/5 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 dark:ring-foreground/10"
const OPTION =
  "flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium select-none hover:bg-foreground/10 aria-selected:bg-foreground/10"

function Chip({ children, muted, removable }: { children: ReactNode; muted?: boolean; removable?: boolean }) {
  return (
    <Badge variant="secondary" className={cn("h-6 gap-1 text-[13px]", removable && "pr-1", muted && "text-muted-foreground")}>
      {children}
    </Badge>
  )
}

function TagsCanvas({ props: p }: { props: TagsProps }) {
  const t = useT()
  const shown = sugg(p).slice(0, 2)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-3xl bg-[var(--input-surface)] px-1.5 py-1.5 shadow-[var(--input-depth)]">
        {(shown.length ? shown : ["Pengadaan IT", "Jaringan"]).map((s) => (
          <Chip key={s}>{s}</Chip>
        ))}
        <span className="truncate px-1.5 text-sm text-muted-foreground">{t(p.placeholder)}</span>
      </div>
      <p className="text-xs text-muted-foreground">{t(L(`Up to ${maxTags(p)} tags`, `Maksimal ${maxTags(p)} tag`))}</p>
    </div>
  )
}

function TagsRuntime({ props: p, value: v, onChange, state, issues, id }: RuntimeProps<TagsProps, TagsValue>) {
  const t = useT()
  const live = state === "active"
  const bad = issues.length > 0 || undefined
  const max = maxTags(p)
  const full = v.tags.length >= max
  const wrap = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)

  const all = matches(p, v)
  const list = open && live && !full ? all : []
  const cur = Math.min(hi, Math.max(0, list.length - 1))
  const listId = `${id}-list`
  const optId = (i: number) => `${id}-o-${i}`

  const focusInput = () => requestAnimationFrame(() => input.current?.focus())
  const commit = (next: TagsValue) => {
    onChange(next)
    setHi(0)
  }

  return (
    <div ref={wrap} className="flex flex-col gap-1.5">
      <Popover open={list.length > 0}>
        <PopoverAnchor asChild>
          <div
            className={cn(
              "flex min-h-9 flex-wrap items-center gap-1.5 rounded-3xl px-1.5 py-1.5 transition-[box-shadow,background-color]",
              live
                ? "cursor-text bg-[var(--input-surface)] shadow-[var(--input-depth)] focus-within:shadow-[var(--input-depth-focus)]"
                : "bg-muted",
              live && bad && "shadow-[var(--input-depth-invalid)] focus-within:shadow-[var(--input-depth-invalid)]",
              state === "disabled" && "cursor-not-allowed",
            )}
            onMouseDown={(e) => {
              // a click on the empty part of the box focuses the input
              if (live && e.target === e.currentTarget) {
                e.preventDefault()
                input.current?.focus()
              }
            }}
          >
            {v.tags.map((tag, i) => (
              <Chip key={`${tag}-${i}`} muted={state === "disabled"} removable={live}>
                {tag}
                {live && (
                  <button
                    type="button"
                    aria-label={`${t(L("Remove ", "Hapus "))}${tag}`}
                    className="flex size-4 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                    onClick={() => {
                      onChange({ ...v, tags: v.tags.filter((_, j) => j !== i), msg: null })
                      focusInput()
                    }}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                  </button>
                )}
              </Chip>
            ))}
            <input
              ref={input}
              id={`${id}-input`}
              autoComplete="off"
              role="combobox"
              aria-expanded={list.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={list.length ? optId(cur) : undefined}
              aria-invalid={bad}
              aria-describedby={`${id}-hint`}
              value={v.q}
              placeholder={live ? t(full ? L("Limit reached", "Batas tercapai") : p.placeholder) : undefined}
              {...ctl(state)}
              disabled={state === "disabled" || (live && full)}
              className="h-6 min-w-[7.5rem] flex-1 bg-transparent px-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              onFocus={() => live && setOpen(true)}
              onBlur={(e) => {
                if (!wrap.current?.contains(e.relatedTarget)) setOpen(false)
              }}
              onChange={(e) => {
                if (!live) return
                const s = e.target.value
                if (s.includes(",")) {
                  const parts = s.split(",")
                  let next = v
                  for (const part of parts.slice(0, -1)) next = add(p, next, part)
                  onChange({ ...next, q: parts[parts.length - 1] })
                } else onChange({ ...v, q: s, msg: null })
                setOpen(true)
                setHi(0)
              }}
              onKeyDown={(e) => {
                if (!live || e.nativeEvent.isComposing) return
                if (e.key === "ArrowDown" && all.length) {
                  e.preventDefault()
                  setHi(open ? (cur + 1) % all.length : 0)
                  setOpen(true)
                } else if (e.key === "ArrowUp" && all.length) {
                  e.preventDefault()
                  setHi((cur + all.length - 1) % all.length)
                } else if (e.key === "Enter") {
                  e.preventDefault()
                  const h = list.length ? list[cur] : null
                  commit(add(p, v, h != null && (!v.q.trim() || norm(h).startsWith(norm(v.q))) ? h : v.q))
                } else if (e.key === "Backspace" && !e.currentTarget.value && v.tags.length) {
                  onChange({ ...v, tags: v.tags.slice(0, -1) })
                } else if (e.key === "Escape") {
                  setOpen(false)
                }
              }}
            />
          </div>
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
          <div className="max-h-72 overflow-y-auto overscroll-contain p-1.5">
            {list.map((s, i) => (
              <div
                key={s}
                id={optId(i)}
                role="option"
                aria-selected={i === cur}
                className={OPTION}
                onClick={() => {
                  commit(add(p, v, s))
                  input.current?.focus()
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {t(L(`${v.tags.length} of ${max} tags · Enter or comma to add`, `${v.tags.length} dari ${max} tag · Enter atau koma untuk menambah`))}
      </p>
      {live && v.msg && (
        <p role="status" className="text-xs font-medium text-destructive">
          {t(v.msg)}
        </p>
      )}
    </div>
  )
}

const validate = (p: TagsProps, v: TagsValue): Issue[] =>
  p.required && !v.tags.length
    ? [
        {
          fid: "input",
          msg: L(`Add at least one ${p.label.en.toLowerCase().replace(/s$/, "")}`, `Tambahkan minimal satu ${p.label.id.toLowerCase()}`),
        },
      ]
    : []

export const tags: ComponentDef<TagsProps, TagsValue> = {
  slug: "tags",
  wave: 2,
  ui: "TAGS",
  vk: "list",
  group: "input",
  week: 3,
  icon: Tag01Icon,
  label: L("Tags input", "Input tag"),
  title: L("Tags input", "Input tag"),
  blurb: L("Type and press Enter to add short tags, with suggestions.", "Ketik lalu tekan Enter untuk menambah tag pendek, dengan saran."),

  defaults: () => ({
    label: L("Business lines", "Bidang usaha"),
    name: "business_lines",
    placeholder: L("Type and press Enter", "Ketik lalu tekan Enter"),
    suggestions: ["Pengadaan IT", "Jaringan", "Perawatan AC", "Alat tulis kantor", "Furnitur", "Katering", "Percetakan"].map((text) => ({ text })),
    allowNew: true,
    maxTags: 5,
    maxLen: 30,
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
          k: "suggestions",
          i18n: false,
          label: L("Suggestions", "Saran"),
          max: 30,
          addLabel: L("Add suggestion", "Tambah saran"),
          newItem: () => ({ text: "" }),
          hint: L("Tags are saved as typed; they are not translated.", "Tag disimpan sesuai ketikan; tidak diterjemahkan."),
        },
        { t: "switch", k: "allowNew", label: L("Allow new tags", "Boleh tag baru"), hint: L("Off = only tags from the suggestions.", "Mati = hanya tag dari saran.") },
        { t: "number", k: "maxTags", label: L("Maximum tags", "Maksimal tag"), min: 1, max: 20 },
        { t: "number", k: "maxLen", label: L("Maximum characters per tag", "Maksimal karakter per tag"), min: 5, max: 60 },
      ],
    },
    { tab: "validation", fields: [F.required(L("At least one tag.", "Minimal satu tag."))] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: TagsCanvas,

  Runtime: TagsRuntime,
  /* Like the prototype, the form opens with the first suggestion already added. */
  initial: (p) => ({ tags: sugg(p).slice(0, 1), q: "", msg: null }),
  sample: (p) => {
    const s = sugg(p)
    const third = p.allowNew ? "Servis printer" : s[2]
    return { tags: [s[0], s[1], third].filter((x): x is string => Boolean(x)).slice(0, maxTags(p)), q: "", msg: null }
  },
  validate,
  value: (_, v) => v.tags.slice(),

  spec: (p) => ({
    ui_type: "TAGS",
    value_kind: "list",
    name: p.name,
    label: p.label,
    required: p.required,
    placeholder: p.placeholder,
    config: { suggestions: sugg(p), allow_new: p.allowNew, max_tags: Number(p.maxTags), max_length: Number(p.maxLen) },
  }),
  savedAs: (p) => L(`An array of strings in \`${p.name}\`, in the order added.`, `Array teks di \`${p.name}\`, sesuai urutan ditambahkan.`),
  notes: [
    L(
      '`value_kind: "list"` here holds strings, not objects like Repeater. See open decision 2.',
      '`value_kind: "list"` di sini berisi teks, bukan objek seperti Repeater. Lihat keputusan terbuka 2.',
    ),
    L(
      "Duplicates are ignored regardless of letter case; suggestions keep their own spelling.",
      "Duplikat diabaikan tanpa melihat huruf besar/kecil; saran tetap memakai ejaannya sendiri.",
    ),
    L(
      "Enter or comma adds a tag; Backspace in an empty input removes the last one.",
      "Enter atau koma menambah tag; Backspace di input kosong menghapus tag terakhir.",
    ),
  ],
  story: {
    process: L("Vendor registration", "Pendaftaran vendor"),
    step: L("Vendor details", "Data vendor"),
    ref: "VND-2026-0088",
    due: "2026-10-14",
    task: L("Complete vendor details: CV Mitra Kantor", "Lengkapi data vendor: CV Mitra Kantor"),
    before: [{ name: "company_name", label: L("Company name", "Nama perusahaan"), type: "text", required: true, value: "CV Mitra Kantor" }],
  },
}
