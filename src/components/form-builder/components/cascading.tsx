/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useId } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, ListTreeIcon, PlusSignIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { GhostInput } from "../field-shell"
import { L, useT, type L10n } from "../i18n"
import { F, snake, uid, uniqueErr } from "../lib"
import { Rich } from "../rich"
import type { ComponentDef, CustomCtx, Issue, RuntimeProps } from "../types"

/* Cascading select (static) — ui_type CASCADING_SELECT, value_kind "json". Story: asset repair request. */

interface CsLevel {
  key: string
  label: L10n
  [k: string]: unknown
}
/** One option in the tree. `id` is editor-only (never in the spec); `value` follows the English label. */
interface CsNode {
  id: string
  value: string
  label: L10n
  children: CsNode[]
}
interface CsProps {
  label: L10n
  name: string
  levels: CsLevel[]
  tree: CsNode[]
  layout: "stacked" | "inline"
  requireAll: boolean
  required: boolean
}
/** Chosen option value per level, top first; shorter than the levels while lower levels are empty. */
type CsValue = string[]

const node = (en: string, id: string, children: CsNode[] = []): CsNode => ({ id: uid("o"), value: snake(en), label: L(en, id), children })

const lv = (p: CsProps) => p.levels.map((l, i) => ({ ...l, key: l.key || `level_${i + 1}` }))

/** Options at `depth` under the chosen path, or [] when a parent is missing. */
function optionsAt(p: CsProps, path: CsValue, depth: number) {
  let list = p.tree
  for (let i = 0; i < depth; i++) {
    const parent = list.find((x) => x.value === path[i])
    if (!parent) return []
    list = parent.children
  }
  return list
}

const firstPick = (p: CsProps, i: number) => {
  const prev = lv(p)[i - 1].label
  return L(`Pick ${prev.en.toLowerCase()} first`, `Pilih ${prev.id.toLowerCase()} dulu`)
}

const specTree = (list: CsNode[]): Record<string, unknown>[] =>
  list.map((o) => ({ value: o.value, label: o.label, ...(o.children.length ? { children: specTree(o.children) } : {}) }))

/* ── tree editor (Edit Element) ─────────────────────────────────────────── */

const mapNode = (list: CsNode[], id: string, fn: (n: CsNode) => CsNode): CsNode[] =>
  list.map((n) => (n.id === id ? fn(n) : n.children.length ? { ...n, children: mapNode(n.children, id, fn) } : n))

const dropNode = (list: CsNode[], id: string): CsNode[] =>
  list.filter((n) => n.id !== id).map((n) => (n.children.length ? { ...n, children: dropNode(n.children, id) } : n))

const INDENT = ["", "pl-4", "pl-8", "pl-12"]

function TreeEditor({ props: p, set }: CustomCtx<CsProps>) {
  const t = useT()
  const labelId = useId()
  const levels = lv(p)
  const setTree = (tree: CsNode[]) => set({ tree })
  const rows: { n: CsNode; depth: number }[] = []
  const walk = (list: CsNode[], depth: number) => {
    for (const n of list) {
      rows.push({ n, depth })
      if (depth < levels.length - 1) walk(n.children, depth + 1)
    }
  }
  walk(p.tree, 0)
  const lastRoot = p.tree.length === 1

  return (
    <div className="flex flex-col gap-1.5">
      <Label id={labelId} className="text-sm font-medium">
        {t(L("Options per level", "Opsi per tingkat"))}
      </Label>
      <div className="grid grid-cols-[1fr_1fr_3.25rem] gap-1.5 px-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        <span>EN</span>
        <span>ID</span>
      </div>
      <div role="group" aria-labelledby={labelId} className="flex flex-col gap-1">
        {rows.map(({ n, depth }) => {
          const lvl = t(levels[depth].label)
          return (
            <div key={n.id} className={cn("relative", INDENT[depth] ?? "pl-12")}>
              {depth > 0 && <span aria-hidden className="absolute top-0 bottom-0 border-l border-border" style={{ left: `${depth * 1 - 0.5}rem` }} />}
              <div className="grid grid-cols-[1fr_1fr_3.25rem] items-center gap-1.5">
                <Input
                  value={n.label.en}
                  aria-label={`${lvl} (English)`}
                  aria-invalid={!n.label.en.trim() || undefined}
                  className="h-8 px-2.5 text-xs"
                  onChange={(e) => setTree(mapNode(p.tree, n.id, (x) => ({ ...x, label: { ...x.label, en: e.target.value }, value: snake(e.target.value) })))}
                />
                <Input
                  value={n.label.id}
                  aria-label={`${lvl} (Bahasa Indonesia)`}
                  className="h-8 px-2.5 text-xs"
                  onChange={(e) => setTree(mapNode(p.tree, n.id, (x) => ({ ...x, label: { ...x.label, id: e.target.value } })))}
                />
                <div className="flex items-center justify-end gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${t(L("Add option under ", "Tambah opsi di bawah "))}${t(n.label)}`}
                    disabled={depth >= levels.length - 1}
                    onClick={() => setTree(mapNode(p.tree, n.id, (x) => ({ ...x, children: [...x.children, node("New option", "Opsi baru")] })))}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`${t(L("Remove ", "Hapus "))}${t(n.label)}`}
                    disabled={depth === 0 && lastRoot}
                    className="hover:text-destructive"
                    onClick={() => setTree(dropNode(p.tree, n.id))}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div>
        <Button variant="ghost" size="sm" onClick={() => setTree([...p.tree, node("New option", "Opsi baru")])}>
          <HugeiconsIcon icon={PlusSignIcon} />
          {t(L("Add ", "Tambah "))}
          {t(levels[0].label).toLowerCase()}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        <Rich
          text={L(
            "“+” adds an option one level down. The saved value comes from the English label.",
            "“+” menambah opsi satu tingkat di bawahnya. Nilai yang disimpan diambil dari label bahasa Inggris.",
          )}
        />
      </p>
    </div>
  )
}

/* ── canvas + runtime ───────────────────────────────────────────────────── */

const gridCls = (inline: boolean) => cn("grid gap-2.5", inline ? "grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))]" : "grid-cols-1")

function CsCanvas({ props: p }: { props: CsProps }) {
  const t = useT()
  return (
    <div className={gridCls(p.layout === "inline")}>
      {lv(p).map((l, i) => (
        <div key={`${l.key}-${i}`} className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-foreground/80">{t(l.label)}</span>
          <GhostInput select>{t(i ? firstPick(p, i) : L("Select…", "Pilih…"))}</GhostInput>
        </div>
      ))}
    </div>
  )
}

function CsRuntime({ props: p, value: path, onChange, state, issues, compact, id }: RuntimeProps<CsProps, CsValue>) {
  const t = useT()
  const live = state === "active"
  return (
    <div role="group" aria-labelledby={`${id}-label`} className={gridCls(p.layout === "inline" && !compact)}>
      {lv(p).map((l, i) => {
        const opts = optionsAt(p, path, i)
        const locked = i > 0 && !path[i - 1]
        const bad = issues.some((x) => x.fid === `level-${i}`) || undefined
        const ctlId = i === 0 ? `${id}-input` : `${id}-level-${i}`
        const chosen = opts.find((o) => o.value === path[i])
        return (
          <div key={`${l.key}-${i}`} className="flex min-w-0 flex-col gap-1">
            <Label htmlFor={ctlId} className={cn("text-xs font-medium", state === "disabled" ? "text-muted-foreground" : "text-foreground/80")}>
              {t(l.label)}
            </Label>
            {state === "readonly" ? (
              <Input id={ctlId} readOnly value={chosen ? t(chosen.label) : ""} placeholder="—" />
            ) : (
              <NativeSelect
                id={ctlId}
                className="w-full"
                value={path[i] ?? ""}
                disabled={state === "disabled" || locked}
                aria-invalid={bad}
                onChange={(e) => {
                  if (!live) return
                  const next = path.slice(0, i)
                  if (e.target.value) next[i] = e.target.value
                  onChange(next)
                }}
              >
                <NativeSelectOption value="">{t(locked ? firstPick(p, i) : L("Select…", "Pilih…"))}</NativeSelectOption>
                {opts.map((o) => (
                  <NativeSelectOption key={o.id} value={o.value}>
                    {t(o.label)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </div>
        )
      })}
    </div>
  )
}

function validate(p: CsProps, path: CsValue): Issue[] {
  if (!p.required) return []
  const levels = lv(p)
  const need = p.requireAll ? levels.length : 1
  for (let i = 0; i < need; i++) {
    if (!path[i]) {
      // a level with no options on this branch is not required
      if (i > 0 && !optionsAt(p, path, i).length) return []
      return [{ fid: `level-${i}`, msg: L(`Pick ${/^[aeiou]/i.test(levels[i].label.en) ? "an" : "a"} ${levels[i].label.en.toLowerCase()}`, `Pilih ${levels[i].label.id.toLowerCase()}`) }]
    }
  }
  return []
}

/** First option at every level: Electronics → Laptop → Battery will not charge. */
function samplePath(p: CsProps): CsValue {
  const out: CsValue = []
  let list = p.tree
  for (let i = 0; i < p.levels.length && list.length; i++) {
    out.push(list[0].value)
    list = list[0].children
  }
  return out
}

export const cascading: ComponentDef<CsProps, CsValue> = {
  slug: "cascading",
  wave: 2,
  ui: "CASCADING_SELECT",
  vk: "json",
  group: "choice",
  week: 4,
  icon: ListTreeIcon,
  label: L("Cascading select", "Pilihan bertingkat"),
  title: L("Cascading select (static)", "Pilihan bertingkat (statis)"),
  blurb: L("Each choice narrows the next, from an option tree set in the builder.", "Setiap pilihan menyaring pilihan berikutnya, dari pohon opsi yang diatur di builder."),

  defaults: () => ({
    label: L("Damaged asset", "Aset yang rusak"),
    name: "asset_issue",
    levels: [
      { key: "category", label: L("Category", "Kategori") },
      { key: "item", label: L("Item", "Barang") },
      { key: "issue", label: L("Problem", "Masalah") },
    ],
    tree: [
      node("Electronics", "Elektronik", [
        node("Laptop", "Laptop", [node("Battery will not charge", "Baterai tidak mengisi"), node("Broken screen", "Layar rusak"), node("Keys stuck", "Tombol macet")]),
        node("Printer", "Printer", [node("Paper jam", "Kertas macet"), node("Out of ink", "Tinta habis")]),
        node("Projector", "Proyektor", [node("No signal", "Tidak ada sinyal")]),
      ]),
      node("Furniture", "Furnitur", [
        node("Chair", "Kursi", [node("Broken wheel", "Roda patah"), node("Loose backrest", "Sandaran goyang")]),
        node("Desk", "Meja", [node("Drawer stuck", "Laci macet")]),
      ]),
      node("Building", "Gedung", [
        node("Air conditioner", "AC", [node("Not cooling", "Tidak dingin"), node("Leaking water", "Bocor air")]),
        node("Lights", "Lampu", [node("Light is out", "Lampu mati")]),
      ]),
    ],
    layout: "stacked",
    requireAll: true,
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(),
        {
          t: "list",
          k: "levels",
          label: L("Levels", "Tingkat"),
          keyField: "key",
          min: 2,
          max: 4,
          addLabel: L("Add level", "Tambah tingkat"),
          newItem: (i) => ({ key: `level_${i + 1}`, label: L(`Level ${i + 1}`, `Tingkat ${i + 1}`) }),
          hint: L("The small text is the key of that level in the saved object.", "Teks kecil adalah key tingkat itu di objek yang disimpan."),
        },
        { t: "custom", id: "tree", render: (ctx) => <TreeEditor {...ctx} /> },
        {
          t: "seg",
          k: "layout",
          label: L("Layout", "Tata letak"),
          options: [
            { v: "stacked", label: L("Stacked", "Bertumpuk") },
            { v: "inline", label: L("Side by side", "Berdampingan") },
          ],
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        F.required(),
        {
          t: "switch",
          k: "requireAll",
          label: L("Must reach the last level", "Wajib sampai tingkat terakhir"),
          when: (o) => o.required,
          hint: L("Off = choosing the first level is enough.", "Mati = memilih tingkat pertama sudah cukup."),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: CsCanvas,
  canvasWarn: (p) => (uniqueErr(p.levels, "key") ? L("Duplicate level keys", "Key tingkat ganda") : null),

  Runtime: CsRuntime,
  initial: () => [],
  sample: samplePath,
  validate,
  value: (p, path) => Object.fromEntries(lv(p).map((l, i) => [l.key, path[i] || null])),

  spec: (p) => ({
    ui_type: "CASCADING_SELECT",
    value_kind: "json",
    name: p.name,
    label: p.label,
    required: p.required,
    config: {
      levels: lv(p).map((l) => ({ key: l.key, label: l.label })),
      options: specTree(p.tree),
      layout: p.layout,
      require_all_levels: p.requireAll,
    },
  }),
  savedAs: (p) =>
    L(
      `One JSON object in \`${p.name}\` with one key per level; unchosen levels are \`null\`.`,
      `Satu objek JSON di \`${p.name}\` dengan satu key per tingkat; tingkat yang belum dipilih bernilai \`null\`.`,
    ),
  notes: [
    L(
      "“Static”: the option tree is saved in the form spec. Lists that change often belong in master data, not here.",
      "“Statis”: pohon opsi disimpan di spec form. Daftar yang sering berubah sebaiknya di master data, bukan di sini.",
    ),
    L(
      "Changing a parent clears every level below it, in the UI and in the saved object.",
      "Mengganti induk mengosongkan semua tingkat di bawahnya, di UI dan di objek yang disimpan.",
    ),
    L(
      "Indonesian administrative regions use the separate Wilayah component, not this one.",
      "Wilayah administratif Indonesia memakai komponen Wilayah bertingkat, bukan komponen ini.",
    ),
  ],
  story: {
    process: L("Asset repair request", "Permintaan perbaikan aset"),
    step: L("Report the problem", "Laporkan masalah"),
    ref: "REP-2026-0566",
    due: "2026-10-08",
    task: L("Report a damaged asset", "Laporkan aset yang rusak"),
    after: [
      {
        name: "description",
        label: L("Describe the problem", "Jelaskan masalahnya"),
        type: "textarea",
        required: true,
        rows: 3,
        value: "Baterai laptop tidak mengisi sejak kemarin, lampu indikator tidak menyala.",
      },
    ],
  },
}
