import { L, type L10n } from "../i18n"
import { norm, snake, uid } from "../lib"

/* Tree select — the node tree and the pure edits the Edit Element tree editor makes on it. */

/** One item. `id` is editor-only (never in the spec); `key` is the saved value. */
export interface TsNode {
  id: string
  key: string
  label: L10n
  children: TsNode[]
}

/** Levels allowed in the tree (top level = 1). */
export const MAX_DEPTH = 4

export const tn = (en: string, id: string, children: TsNode[] = []): TsNode => ({ id: uid("t"), key: snake(en), label: L(en, id), children })

/** A node with where it sits: depth (0 = top), parent, path from the top (itself last), siblings. */
export interface TsEntry {
  node: TsNode
  depth: number
  parent: TsNode | null
  path: TsNode[]
  siblings: TsNode[]
  index: number
}

/** Every node, top to bottom (pre-order). */
export function entries(tree: TsNode[]): TsEntry[] {
  const out: TsEntry[] = []
  const walk = (list: TsNode[], parent: TsNode | null, path: TsNode[]) =>
    list.forEach((node, index) => {
      const p = [...path, node]
      out.push({ node, depth: path.length, parent, path: p, siblings: list, index })
      walk(node.children, node, p)
    })
  walk(tree, null, [])
  return out
}

/** Levels below a node: 0 for a leaf. */
export const height = (n: TsNode): number => (n.children.length ? 1 + Math.max(...n.children.map(height)) : 0)

export const isLeaf = (n: TsNode) => n.children.length === 0

/* ── edits (by editor id) ───────────────────────────────────────────────── */

/** Replace the sibling list that holds `id` with `fn(list, index)`. */
function editSiblings(list: TsNode[], id: string, fn: (list: TsNode[], i: number) => TsNode[]): TsNode[] {
  const i = list.findIndex((n) => n.id === id)
  if (i >= 0) return fn(list, i)
  return list.map((n) => (n.children.length ? { ...n, children: editSiblings(n.children, id, fn) } : n))
}

export const updateNode = (tree: TsNode[], id: string, fn: (n: TsNode) => TsNode): TsNode[] =>
  editSiblings(tree, id, (l, i) => l.map((n, j) => (j === i ? fn(n) : n)))

export const removeNode = (tree: TsNode[], id: string) => editSiblings(tree, id, (l, i) => l.filter((_, j) => j !== i))

export const insertAfter = (tree: TsNode[], id: string, node: TsNode) => editSiblings(tree, id, (l, i) => [...l.slice(0, i + 1), node, ...l.slice(i + 1)])

export const appendChild = (tree: TsNode[], id: string, node: TsNode) => updateNode(tree, id, (n) => ({ ...n, children: [...n.children, node] }))

export const moveBy = (tree: TsNode[], id: string, dir: -1 | 1) =>
  editSiblings(tree, id, (l, i) => {
    const j = i + dir
    if (j < 0 || j >= l.length) return l
    const next = l.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    return next
  })

/** Move in one level: becomes the last child of the item above it. */
export const indent = (tree: TsNode[], id: string) =>
  editSiblings(tree, id, (l, i) => {
    if (i === 0) return l
    const prev = { ...l[i - 1], children: [...l[i - 1].children, l[i]] }
    return [...l.slice(0, i - 1), prev, ...l.slice(i + 1)]
  })

/** Move out one level: placed right after its parent. */
export function outdent(tree: TsNode[], id: string) {
  const e = entries(tree).find((x) => x.node.id === id)
  if (!e?.parent) return tree
  return insertAfter(removeNode(tree, id), e.parent.id, e.node)
}

export const canAddChild = (e: TsEntry) => e.depth < MAX_DEPTH - 1
export const canIndent = (e: TsEntry) => e.index > 0 && e.depth + 1 + height(e.node) <= MAX_DEPTH - 1
export const canOutdent = (e: TsEntry) => e.depth > 0

/**
 * Key for node `id` (under `parentKey`) named `en`: snake_case of the English name; when another
 * item already uses it, the parent's key goes in front (`software_other`), then a number.
 */
export function keyFor(tree: TsNode[], id: string | null, en: string, parentKey: string | null) {
  const taken = new Set(entries(tree).filter((e) => e.node.id !== id).map((e) => e.node.key))
  const base = snake(en)
  if (!taken.has(base)) return base
  if (parentKey && !taken.has(`${parentKey}_${base}`)) return `${parentKey}_${base}`
  let n = 2
  while (taken.has(`${base}_${n}`)) n++
  return `${base}_${n}`
}

/** A fresh "New item" with a key that does not clash. */
export function newItem(tree: TsNode[], parentKey: string | null): TsNode {
  const n = tn("New item", "Item baru")
  return { ...n, key: keyFor(tree, null, "New item", parentKey) }
}

/** First problem with the tree, or null. Blocks Save Changes. */
export function treeError(tree: TsNode[]): L10n | null {
  if (!tree.length) return L("Add at least one item", "Tambahkan minimal satu item")
  const all = entries(tree)
  if (all.some((e) => !e.node.label.en.trim())) return L("Every item needs an English name", "Setiap item butuh nama bahasa Inggris")
  if (all.some((e) => e.depth >= MAX_DEPTH)) return L(`Use at most ${MAX_DEPTH} levels`, `Maksimal ${MAX_DEPTH} tingkat`)
  const seen = new Set<string>()
  for (const e of all) {
    if (seen.has(e.node.key)) return L(`Two items share the key “${e.node.key}”`, `Dua item memakai key “${e.node.key}”`)
    seen.add(e.node.key)
  }
  return null
}

/** Spec form: `{ value, label, children? }`, children only when there are some. */
export const specOptions = (list: TsNode[]): Record<string, unknown>[] =>
  list.map((n) => ({ value: n.key, label: n.label, ...(n.children.length ? { children: specOptions(n.children) } : {}) }))

/** Ids of the nodes whose EN or ID name contains `q` (accents and case ignored). */
export function matches(all: TsEntry[], q: string) {
  const n = norm(q)
  return new Set(n ? all.filter((e) => norm(`${e.node.label.en} ${e.node.label.id}`).includes(n)).map((e) => e.node.id) : [])
}

/* ── sample trees ───────────────────────────────────────────────────────── */

export const helpdeskTree = (): TsNode[] => [
  tn("Hardware", "Perangkat keras", [
    tn("Laptop", "Laptop", [tn("Battery", "Baterai"), tn("Keyboard", "Keyboard"), tn("Screen", "Layar")]),
    tn("Printer", "Printer", [tn("Paper jam", "Kertas macet"), tn("Driver", "Driver")]),
  ]),
  tn("Software", "Perangkat lunak", [tn("Email", "Email"), tn("ERP", "ERP"), tn("VPN", "VPN")]),
  tn("Access", "Akses", [tn("New account", "Akun baru"), tn("Password reset", "Reset kata sandi"), tn("Building badge", "Kartu akses gedung")]),
]

/** Mock org-chart units (source "org"). The real list comes from the org chart (Wave 4 open decision 7). */
export const ORG_TREE: TsNode[] = [
  tn("Finance Directorate", "Direktorat Keuangan", [tn("Accounting", "Akuntansi"), tn("Tax", "Pajak"), tn("Treasury", "Treasuri")]),
  tn("Operations Directorate", "Direktorat Operasional", [
    tn("Warehouse", "Gudang", [tn("Inbound", "Penerimaan barang"), tn("Outbound", "Pengiriman barang")]),
    tn("Procurement", "Pengadaan"),
  ]),
  tn("Information Technology", "Teknologi Informasi", [tn("Infrastructure", "Infrastruktur"), tn("Business Applications", "Aplikasi Bisnis"), tn("IT Support", "Dukungan TI")]),
  tn("Human Capital", "Human Capital", [tn("Recruitment", "Rekrutmen"), tn("Payroll", "Penggajian")]),
]
