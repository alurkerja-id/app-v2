/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowRight01Icon, Cancel01Icon, HierarchySquare02Icon, Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dateTriggerClass } from "@/components/dashboard/date-range-picker"
import { GhostInput } from "../field-shell"
import { L, useT, type L10n } from "../i18n"
import { F, reqMsg } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"
import { TreeEditor } from "./tree-select-editor"
import { ORG_TREE, entries, helpdeskTree, isLeaf, matches, specOptions, treeError, type TsEntry, type TsNode } from "./tree-select-model"

/* Tree select — ui_type TREE_SELECT, value_kind "string" (one key) or "list" (several). Story: IT helpdesk ticket. */

interface TsProps {
  label: L10n
  name: string
  /** `static` = the tree below; `org` = mock org-chart units (Wave 4 open decision 7). */
  source: "static" | "org"
  tree: TsNode[]
  multiple: boolean
  selectable: "leaf" | "any"
  search: boolean
  showPath: boolean
  /** Multiple only; "" = no limit. */
  maxSelections: number | ""
  required: boolean
}
/** Chosen node keys in tree order (one at most when single). */
type TsValue = string[]

const treeOf = (p: TsProps) => (p.source === "org" ? ORG_TREE : p.tree)
const pickable = (p: TsProps, n: TsNode) => p.selectable === "any" || isLeaf(n)
const maxOf = (p: TsProps) => {
  if (!p.multiple || p.maxSelections === "") return null
  const n = Number(p.maxSelections)
  return n > 0 ? n : null
}
const xor = (set: ReadonlySet<string>, id: string) => {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

/** Bold + tinted text for the part of `text` that matches the search. */
function Mark({ text, q }: { text: string; q: string }) {
  const n = q.trim().toLowerCase()
  const at = n ? text.toLowerCase().indexOf(n) : -1
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-sm bg-primary/15 px-px font-semibold text-foreground">{text.slice(at, at + n.length)}</mark>
      {text.slice(at + n.length)}
    </>
  )
}

function useLabel(p: TsProps) {
  const t = useT()
  return (e: TsEntry) => (p.showPath ? e.path.map((n) => t(n.label)).join(" › ") : t(e.node.label))
}

/* ── canvas ─────────────────────────────────────────────────────────────── */

function TsCanvas({ props: p }: { props: TsProps }) {
  const t = useT()
  const all = entries(treeOf(p))
  const depth = all.length ? Math.max(...all.map((e) => e.depth)) + 1 : 0
  const bits: L10n[] = [
    L(`${all.length} items in ${depth} levels`, `${all.length} item dalam ${depth} tingkat`),
    p.selectable === "leaf" ? L("last level only", "tingkat terakhir saja") : L("any level", "tingkat mana saja"),
    ...(p.multiple ? [L("several allowed", "boleh beberapa")] : []),
    ...(p.source === "org" ? [L("org chart", "bagan organisasi")] : []),
  ]
  return (
    <div className="flex flex-col gap-1.5">
      <GhostInput select>{t(L("Select…", "Pilih…"))}</GhostInput>
      <p className="text-xs text-muted-foreground">{bits.map((b) => t(b)).join(" · ")}</p>
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

function TsRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<TsProps, TsValue>) {
  const t = useT()
  const label = useLabel(p)
  const tree = treeOf(p)
  const all = useMemo(() => entries(tree), [tree])
  const byKey = useMemo(() => new Map(all.map((e) => [e.node.key, e])), [all])
  const live = state === "active"
  const bad = issues.length > 0
  const max = maxOf(p)
  const chosen = v.map((k) => byKey.get(k)).filter((e): e is TsEntry => e != null)

  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  /* Branches the user opened / closed while this search text was typed (search opens parents of matches itself). */
  const [flip, setFlip] = useState<{ q: string; ids: ReadonlySet<string> }>(() => ({ q: "", ids: new Set() }))
  const [active, setActive] = useState<string | null>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const searching = q.trim() !== ""
  const hits = useMemo(() => matches(all, q), [all, q])
  const autoOpen = useMemo(() => {
    const s = new Set<string>()
    for (const e of all) if (hits.has(e.node.id)) for (const a of e.path.slice(0, -1)) s.add(a.id)
    return s
  }, [all, hits])
  const toggled = flip.q === q ? flip.ids : new Set<string>()
  const isOpen = (n: TsNode) => (searching ? autoOpen.has(n.id) !== toggled.has(n.id) : expanded.has(n.id))

  /* Rows on screen: every ancestor open; while searching only matches, their parents and what lies under a match. */
  const rows: TsEntry[] = []
  for (const e of all) {
    const anc = e.path.slice(0, -1)
    if (!anc.every(isOpen)) continue
    if (searching && !(hits.has(e.node.id) || autoOpen.has(e.node.id) || anc.some((a) => hits.has(a.id)))) continue
    rows.push(e)
  }
  const activeId = rows.some((r) => r.node.id === active) ? active : (rows[0]?.node.id ?? null)

  const isOn = (n: TsNode) => v.includes(n.key)
  const full = max != null && v.length >= max
  const blocked = (n: TsNode) => p.multiple && full && !isOn(n)

  const toggle = (n: TsNode) => {
    if (searching) setFlip({ q, ids: xor(toggled, n.id) })
    else setExpanded((prev) => xor(prev, n.id))
  }
  const focusRow = (nid: string) => {
    setActive(nid)
    requestAnimationFrame(() => treeRef.current?.querySelector<HTMLElement>(`[data-tid="${nid}"]`)?.focus())
  }
  const pick = (n: TsNode) => {
    if (!live) return
    if (!pickable(p, n)) return toggle(n)
    if (!p.multiple) {
      onChange([n.key])
      setOpen(false)
      return
    }
    if (blocked(n)) return
    const next = isOn(n) ? v.filter((k) => k !== n.key) : [...v, n.key]
    // keep tree order, not click order, so the payload is stable
    onChange(all.map((e) => e.node.key).filter((k) => next.includes(k)))
  }

  const onOpenChange = (o: boolean) => {
    if (o && !live) return
    if (o) {
      const anc = new Set<string>()
      for (const e of chosen) for (const a of e.path.slice(0, -1)) anc.add(a.id)
      setExpanded(anc)
      setQ("")
      setFlip({ q: "", ids: new Set() })
      setActive(chosen[0]?.node.id ?? null)
    }
    setOpen(o)
  }

  const onTreeKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-tid]")
    const i = rows.findIndex((r) => r.node.id === el?.dataset.tid)
    const r = rows[i]
    if (!r) return
    const kids = r.node.children.length > 0
    let handled = true
    if (e.key === "ArrowDown") {
      if (rows[i + 1]) focusRow(rows[i + 1].node.id)
    } else if (e.key === "ArrowUp") {
      if (i > 0) focusRow(rows[i - 1].node.id)
      else if (p.search) searchRef.current?.focus()
    } else if (e.key === "ArrowRight") {
      if (kids && !isOpen(r.node)) toggle(r.node)
      else if (kids && rows[i + 1]) focusRow(rows[i + 1].node.id)
    } else if (e.key === "ArrowLeft") {
      if (kids && isOpen(r.node)) toggle(r.node)
      else if (r.parent) focusRow(r.parent.id)
    } else if (e.key === "Home") focusRow(rows[0].node.id)
    else if (e.key === "End") focusRow(rows[rows.length - 1].node.id)
    else if (e.key === "Enter" || e.key === " ") pick(r.node)
    else if (p.search && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // typing in the tree goes to the search box
      setQ(q + e.key)
      searchRef.current?.focus()
    } else handled = false
    if (handled) e.preventDefault()
  }

  const countText = p.multiple
    ? max != null
      ? L(`${v.length} of ${max} selected${full ? " · limit reached" : ""}`, `${v.length} dari ${max} dipilih${full ? " · batas tercapai" : ""}`)
      : L(`${v.length} selected`, `${v.length} dipilih`)
    : null

  const chips = (removable: boolean) =>
    chosen.length > 0 && (
      <ul aria-label={t(L("Selected items", "Item terpilih"))} className="flex min-w-0 flex-wrap gap-1.5">
        {chosen.map((e) => (
          <li
            key={e.node.key}
            className={cn(
              "flex max-w-full min-w-0 items-center gap-0.5 rounded-full bg-secondary py-0.5 text-xs text-secondary-foreground",
              removable ? "pr-0.5 pl-2.5" : "px-2.5",
              state === "disabled" && "opacity-60",
            )}
          >
            <span className="min-w-0 py-0.5 break-words">{label(e)}</span>
            {removable && (
              <button
                type="button"
                aria-label={`${t(L("Remove", "Hapus"))} ${label(e)}`}
                onClick={() => onChange(v.filter((k) => k !== e.node.key))}
                className="grid size-6 shrink-0 place-items-center rounded-full outline-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
              </button>
            )}
          </li>
        ))}
      </ul>
    )

  /* Read-only / Disabled: the chosen path(s) as text, nothing to open. */
  if (!live) {
    return (
      <div
        id={`${id}-input`}
        role="textbox"
        tabIndex={state === "readonly" ? 0 : -1}
        aria-readonly={state === "readonly" || undefined}
        aria-disabled={state === "disabled" || undefined}
        aria-labelledby={`${id}-label`}
        className={cn(
          "flex min-h-9 min-w-0 items-center gap-2 rounded-3xl border border-transparent bg-muted px-3 py-1.5 text-sm outline-none",
          state === "disabled" ? "cursor-not-allowed text-muted-foreground" : "cursor-default text-foreground select-text focus-visible:shadow-[var(--input-depth-readonly-focus)]",
        )}
      >
        <HugeiconsIcon icon={HierarchySquare02Icon} className="size-4 shrink-0 text-muted-foreground" />
        {!chosen.length ? <span className="text-muted-foreground">—</span> : p.multiple ? chips(false) : <span className="min-w-0 break-words">{label(chosen[0])}</span>}
      </div>
    )
  }

  const rowView = (e: TsEntry): ReactNode => {
    const n = e.node
    const kids = n.children.length > 0
    const o = kids && isOpen(n)
    const can = pickable(p, n)
    const on = can && isOn(n)
    const blk = can && blocked(n)
    return (
      <div
        key={n.id}
        role="treeitem"
        data-tid={n.id}
        aria-level={e.depth + 1}
        aria-setsize={e.siblings.length}
        aria-posinset={e.index + 1}
        aria-expanded={kids ? o : undefined}
        aria-selected={can ? on : undefined}
        aria-disabled={blk || undefined}
        tabIndex={n.id === activeId ? 0 : -1}
        onFocus={() => setActive(n.id)}
        onClick={() => pick(n)}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-2xl py-1 pr-2.5 text-sm outline-none select-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/50",
          compact ? "min-h-11" : "min-h-9",
          on && !p.multiple && "bg-primary/10 font-medium hover:bg-primary/15",
          !can && "font-medium",
          blk && "cursor-not-allowed opacity-50",
        )}
        style={{ paddingLeft: `${0.25 + e.depth * 1.25}rem` }}
      >
        {kids ? (
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/10"
            onClick={(ev) => {
              ev.stopPropagation()
              toggle(n)
            }}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className={cn("size-3.5 transition-transform", o && "rotate-90")} />
          </span>
        ) : (
          <span aria-hidden className="size-6 shrink-0" />
        )}
        {p.multiple && can && (
          <span
            aria-hidden
            className={cn("grid size-4 shrink-0 place-items-center rounded-[5px]", on ? "bg-primary text-primary-foreground" : "bg-input/90 shadow-[var(--input-depth)]")}
          >
            {on && <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-3" />}
          </span>
        )}
        <span className="min-w-0 flex-1 py-1 break-words">
          <Mark text={t(n.label)} q={searching && hits.has(n.id) ? q : ""} />
        </span>
        {kids && !can && <span className="text-[11px] font-normal text-muted-foreground tabular-nums">{n.children.length}</span>}
        {!p.multiple && on && <HugeiconsIcon icon={Tick02Icon} className="size-4 shrink-0 text-primary" />}
      </div>
    )
  }

  const triggerText = !chosen.length
    ? t(L("Select…", "Pilih…"))
    : p.multiple
      ? t(L(`${chosen.length} selected`, `${chosen.length} dipilih`))
      : label(chosen[0])

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={`${id}-input`}
            aria-labelledby={`${id}-label ${id}-value`}
            aria-invalid={bad || undefined}
            className={cn(dateTriggerClass, "h-auto min-h-9 w-full min-w-0 py-1.5 aria-invalid:shadow-[var(--input-depth-invalid)]")}
          >
            <HugeiconsIcon icon={HierarchySquare02Icon} className="size-4 shrink-0 text-muted-foreground" />
            <span id={`${id}-value`} className={cn("min-w-0 flex-1 text-left break-words", !chosen.length && "text-muted-foreground")}>
              {triggerText}
            </span>
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          aria-label={t(p.label)}
          className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-1.5rem)] min-w-[min(18rem,calc(100vw-1.5rem))] gap-0 overflow-hidden p-0"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            requestAnimationFrame(() => (p.search ? searchRef.current : treeRef.current?.querySelector<HTMLElement>('[tabindex="0"]'))?.focus())
          }}
        >
          {p.search && (
            <div className="border-b border-border p-2">
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Search01Icon} />
                </InputGroupAddon>
                <InputGroupInput
                  ref={searchRef}
                  value={q}
                  placeholder={t(L("Search…", "Cari…"))}
                  aria-label={t(L("Search items", "Cari item"))}
                  aria-controls={`${id}-tree`}
                  autoComplete="off"
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown" && rows[0]) {
                      e.preventDefault()
                      focusRow(rows[0].node.id)
                    } else if (e.key === "Enter" && searching) {
                      e.preventDefault()
                      const first = rows.find((r) => hits.has(r.node.id) && pickable(p, r.node) && !blocked(r.node))
                      if (first) pick(first.node)
                    }
                  }}
                />
              </InputGroup>
              <p className="sr-only" aria-live="polite">
                {searching ? t(L(`${hits.size} matching items`, `${hits.size} item cocok`)) : ""}
              </p>
            </div>
          )}
          <div id={`${id}-tree`} className="max-h-72 overflow-y-auto p-1.5">
            {rows.length ? (
              <div
                ref={treeRef}
                role="tree"
                aria-label={t(p.label)}
                aria-multiselectable={p.multiple || undefined}
                onKeyDown={onTreeKey}
                className="flex flex-col gap-px"
              >
                {rows.map(rowView)}
              </div>
            ) : (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t(L(`Nothing matches “${q.trim()}”`, `Tidak ada yang cocok dengan “${q.trim()}”`))}</p>
            )}
          </div>
          {(p.multiple || chosen.length > 0) && (
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
              <span className={cn("text-xs", full ? "font-medium text-foreground" : "text-muted-foreground")}>{countText ? t(countText) : null}</span>
              <div className="flex gap-1.5">
                {chosen.length > 0 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      onChange([])
                      if (!p.multiple) setOpen(false)
                    }}
                  >
                    {t(L("Clear", "Kosongkan"))}
                  </Button>
                )}
                {p.multiple && (
                  <Button size="xs" onClick={() => setOpen(false)}>
                    {t(L("Done", "Selesai"))}
                  </Button>
                )}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {p.multiple && chips(true)}
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

function validate(p: TsProps, v: TsValue): Issue[] {
  if (!v.length) return p.required ? [{ fid: "tree", msg: reqMsg(p.label) }] : []
  const max = maxOf(p)
  if (max != null && v.length > max) return [{ fid: "tree", msg: L(`Pick up to ${max} items`, `Pilih paling banyak ${max} item`) }]
  return []
}

/** Realistic picks: the helpdesk story's keys when they exist, else the first pickable items. */
function sample(p: TsProps): TsValue {
  const all = entries(treeOf(p))
  const ok = all.filter((e) => pickable(p, e.node)).map((e) => e.node.key)
  const want = ["battery", "vpn", "it_support", "payroll"].filter((k) => ok.includes(k))
  const pickList = [...want, ...ok.filter((k) => !want.includes(k))]
  const n = p.multiple ? Math.min(2, maxOf(p) ?? 2) : 1
  const keys = new Set(pickList.slice(0, n))
  return all.map((e) => e.node.key).filter((k) => keys.has(k))
}

export const treeSelect: ComponentDef<TsProps, TsValue> = {
  slug: "tree-select",
  wave: 4,
  week: 6,
  ui: "TREE_SELECT",
  vk: "string",
  group: "choice",
  icon: HierarchySquare02Icon,
  label: L("Tree select", "Pilihan pohon"),
  title: L("Tree select", "Pilihan pohon"),
  blurb: L("Pick one or more items from a tree of any depth.", "Pilih satu atau beberapa item dari pohon bertingkat."),

  defaults: () => ({
    label: L("Problem category", "Kategori masalah"),
    name: "problem_category",
    source: "static",
    tree: helpdeskTree(),
    multiple: false,
    selectable: "leaf",
    search: true,
    showPath: true,
    maxSelections: "",
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
          k: "source",
          label: L("Items from", "Item dari"),
          options: [
            { v: "static", label: L("Tree set here", "Pohon diatur di sini") },
            { v: "org", label: L("Org chart (mock)", "Bagan organisasi (mock)") },
          ],
          hint: L(
            "**Org chart** lists company units instead of a tree typed here (Wave 4 open decision 7).",
            "**Bagan organisasi** menampilkan unit perusahaan, bukan pohon yang diketik di sini (keputusan terbuka Gelombang 4 no. 7).",
          ),
        },
        {
          t: "custom",
          id: "tree",
          when: (p) => p.source === "static",
          render: ({ props, set }) => <TreeEditor tree={props.tree} onTree={(tree) => set({ tree })} />,
          validate: (_, p) => (p.source === "static" ? treeError(p.tree) : null),
        },
        {
          t: "note",
          when: (p) => p.source === "org",
          text: L(
            "Units are read from the org chart when the task opens; the tree typed here is kept but not used. The prototype shows 4 directorates and 12 units. Wave 4 open decision 7.",
            "Unit dibaca dari bagan organisasi saat task dibuka; pohon yang diketik di sini tetap disimpan tetapi tidak dipakai. Prototipe menampilkan 4 direktorat dan 12 unit. Keputusan terbuka Gelombang 4 no. 7.",
          ),
        },
        {
          t: "seg",
          k: "selectable",
          label: L("Can be picked", "Yang bisa dipilih"),
          options: [
            { v: "leaf", label: L("Last level only", "Tingkat terakhir saja") },
            { v: "any", label: L("Any level", "Tingkat mana saja") },
          ],
          hint: L("**Last level only**: parents only open and close.", "**Tingkat terakhir saja**: induk hanya bisa dibuka dan ditutup."),
        },
        {
          t: "switch",
          k: "multiple",
          label: L("Allow several items", "Boleh pilih beberapa item"),
          hint: L(
            "Saves a list of keys instead of one. Ticking a parent does not tick its children.",
            "Disimpan sebagai daftar key, bukan satu key. Mencentang induk tidak ikut mencentang anaknya.",
          ),
        },
        {
          t: "number",
          k: "maxSelections",
          label: L("Most items", "Maksimal item"),
          min: 2,
          max: 20,
          allowEmpty: true,
          when: (p) => p.multiple,
          hint: L("Empty = no limit.", "Kosong = tanpa batas."),
        },
        { t: "switch", k: "search", label: L("Search box", "Kotak pencarian"), hint: L("Search keeps the parents of every match visible.", "Pencarian tetap menampilkan induk dari setiap hasil.") },
        {
          t: "switch",
          k: "showPath",
          label: L("Show the full path", "Tampilkan jalur lengkap"),
          hint: L("e.g. “Hardware › Laptop › Battery” instead of “Battery”.", "mis. “Perangkat keras › Laptop › Baterai”, bukan hanya “Baterai”."),
        },
      ],
    },
    { tab: "validation", fields: [F.required(L("Empty is `\"\"` (one item) or `[]` (several).", "Kosong adalah `\"\"` (satu item) atau `[]` (beberapa)."))] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: TsCanvas,
  canvasWarn: (p) => (p.source === "static" && treeError(p.tree) ? L("Check the tree", "Periksa pohonnya") : null),

  Runtime: TsRuntime,
  initial: () => [],
  sample,
  validate,
  value: (p, v) => (p.multiple ? v : (v[0] ?? "")),
  valueKindOf: (p) => (p.multiple ? "list" : "string"),

  spec: (p) => ({
    ui_type: "TREE_SELECT",
    value_kind: p.multiple ? "list" : "string",
    name: p.name,
    label: p.label,
    required: p.required,
    config: {
      source: p.source,
      multiple: p.multiple,
      selectable: p.selectable,
      search: p.search,
      show_path: p.showPath,
      max_selections: maxOf(p),
    },
    ...(p.source === "static" ? { options: specOptions(p.tree) } : {}),
  }),
  savedAs: (p) =>
    p.multiple
      ? L(
          `A list of item keys in \`${p.name}\`, in tree order, e.g. \`["battery", "vpn"]\`; empty is \`[]\`.`,
          `Daftar key item di \`${p.name}\`, urut sesuai pohon, mis. \`["battery", "vpn"]\`; kosong \`[]\`.`,
        )
      : L(`One item key in \`${p.name}\`, e.g. \`"battery"\`; empty is \`""\`.`, `Satu key item di \`${p.name}\`, mis. \`"battery"\`; kosong \`""\`.`),
  notes: [
    L(
      "Unlike Cascading select (Wave 2), which has fixed named levels and saves a JSON object with one key per level, Tree select allows any depth (up to 4 here) and saves only the chosen item's key.",
      "Berbeda dengan Cascading select (Gelombang 2) yang tingkatnya tetap dan bernama serta menyimpan objek JSON berisi satu key per tingkat, Tree select boleh sedalam apa pun (di sini maks. 4) dan hanya menyimpan key item yang dipilih.",
    ),
    L(
      "Keys come from the English name and are unique across the whole tree (a clash gets the parent key in front, e.g. `software_other`), so one key is enough; the path is looked up from `options` when shown.",
      "Key diambil dari nama bahasa Inggris dan unik di seluruh pohon (bila bentrok, key induk ditaruh di depan, mis. `software_other`), jadi satu key sudah cukup; jalurnya dicari dari `options` saat ditampilkan.",
    ),
    L(
      "Several items: no cascade. Ticking a parent does not tick its children, and with **Last level only** parents have no checkbox.",
      "Beberapa item: tidak berantai. Mencentang induk tidak mencentang anaknya, dan dengan **Tingkat terakhir saja** induk tidak punya kotak centang.",
    ),
    L(
      "Source **Org chart** reads units from the org chart at render; only **Tree set here** stores `options` in the spec (Wave 4 open decision 7, ties to the Remote Select org-chart option).",
      "Sumber **Bagan organisasi** membaca unit dari bagan organisasi saat render; hanya **Pohon diatur di sini** yang menyimpan `options` di spec (keputusan terbuka Gelombang 4 no. 7, terkait opsi org chart di Remote Select).",
    ),
    L(
      "Keyboard: `role=\"tree\"`; ↑ ↓ move, → ← open and close, Enter or Space picks, typing jumps to the search box. Search keeps the parents of matches visible.",
      "Keyboard: `role=\"tree\"`; ↑ ↓ berpindah, → ← membuka dan menutup, Enter atau Spasi memilih, mengetik langsung ke kotak pencarian. Pencarian tetap menampilkan induk dari hasil.",
    ),
  ],
  story: {
    process: L("IT helpdesk", "Helpdesk TI"),
    step: L("Report a problem", "Laporkan masalah"),
    ref: "HD-2026-1302",
    due: "2026-11-16",
    task: L("Report an IT problem", "Laporkan masalah TI"),
    before: [
      {
        name: "short_description",
        label: L("Short description", "Deskripsi singkat"),
        type: "text",
        required: true,
        value: "Laptop tidak mengisi daya saat dicolok",
      },
    ],
    after: [
      {
        name: "details",
        label: L("Details", "Detail"),
        type: "textarea",
        rows: 3,
        placeholder: L("What happened, since when, what you already tried", "Apa yang terjadi, sejak kapan, apa yang sudah dicoba"),
        value: "",
      },
      {
        name: "urgency",
        label: L("Urgency", "Tingkat urgensi"),
        type: "select",
        required: true,
        value: "normal",
        options: [
          { v: "low", label: L("Low", "Rendah") },
          { v: "normal", label: L("Normal", "Normal") },
          { v: "high", label: L("High — I cannot work", "Tinggi — saya tidak bisa bekerja") },
        ],
      },
    ],
  },
}
