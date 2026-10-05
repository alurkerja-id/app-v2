import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, ArrowUp01Icon, Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { L, useT, type L10n } from "../i18n"
import { Rich } from "../rich"
import {
  MAX_DEPTH,
  appendChild,
  canAddChild,
  canIndent,
  canOutdent,
  entries,
  indent,
  insertAfter,
  keyFor,
  moveBy,
  newItem,
  outdent,
  removeNode,
  updateNode,
  type TsEntry,
  type TsNode,
} from "./tree-select-model"

/*
 * Edit Element tree editor: an outline (role="tree", one Tab stop, arrow keys) on the left and the
 * selected item's names + actions on the right. Every action has a button; the outline adds
 * Alt/Option + arrow shortcuts for moving, so a long tree never needs dozens of Tab stops.
 */

type FocusTarget = "tree" | "name" | "keep" | "confirm"

export function TreeEditor({ tree, onTree }: { tree: TsNode[]; onTree: (tree: TsNode[]) => void }) {
  const t = useT()
  const labelId = useId()
  const hintId = useId()
  const enId = useId()
  const [selId, setSelId] = useState<string | null>(null)
  const [closed, setClosed] = useState<ReadonlySet<string>>(() => new Set())
  const [confirm, setConfirm] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const enRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const focusNext = useRef<FocusTarget | null>(null)

  const all = entries(tree)
  const sel: TsEntry | null = all.find((e) => e.node.id === selId) ?? all[0] ?? null
  const rows = all.filter((e) => e.path.slice(0, -1).every((a) => !closed.has(a.id)))
  const keyCount = new Map<string, number>()
  for (const e of all) keyCount.set(e.node.key, (keyCount.get(e.node.key) ?? 0) + 1)

  /* Move focus after the tree re-renders (new item → its name, keyboard move → the row). */
  useLayoutEffect(() => {
    const what = focusNext.current
    if (!what) return
    focusNext.current = null
    if (what === "name") {
      enRef.current?.focus()
      enRef.current?.select()
      return
    }
    if (what === "confirm") {
      confirmRef.current?.focus()
      return
    }
    const a = document.activeElement as HTMLButtonElement | null
    if (what === "tree" || !a || a === document.body || a.disabled) box.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
  })

  const setOpen = (id: string, open: boolean) =>
    setClosed((prev) => {
      if (open !== prev.has(id)) return prev
      const next = new Set(prev)
      if (open) next.delete(id)
      else next.add(id)
      return next
    })

  /* The row is already on screen: focus it now (selecting the same row again does not re-render). */
  const select = (id: string) => {
    setSelId(id)
    setConfirm(null)
    box.current?.querySelector<HTMLElement>(`[data-tid="${id}"]`)?.focus()
  }

  const commit = (next: TsNode[], nextSel: string | null, focus: FocusTarget) => {
    onTree(next)
    if (nextSel) setSelId(nextSel)
    setConfirm(null)
    focusNext.current = focus
  }

  /* ── actions on the selected item ── */
  const addChild = (e: TsEntry) => {
    if (!canAddChild(e)) return
    const n = newItem(tree, e.node.key)
    setOpen(e.node.id, true)
    commit(appendChild(tree, e.node.id, n), n.id, "name")
  }
  const addSibling = (e: TsEntry) => {
    const n = newItem(tree, e.parent?.key ?? null)
    commit(insertAfter(tree, e.node.id, n), n.id, "name")
  }
  const addRoot = () => {
    const n = newItem(tree, null)
    commit([...tree, n], n.id, "name")
  }
  const move = (e: TsEntry, dir: -1 | 1, focus: FocusTarget) => {
    if (e.index + dir < 0 || e.index + dir >= e.siblings.length) return
    commit(moveBy(tree, e.node.id, dir), e.node.id, focus)
  }
  const moveIn = (e: TsEntry, focus: FocusTarget) => {
    if (!canIndent(e)) return
    setOpen(e.siblings[e.index - 1].id, true)
    commit(indent(tree, e.node.id), e.node.id, focus)
  }
  const moveOut = (e: TsEntry, focus: FocusTarget) => {
    if (!canOutdent(e)) return
    commit(outdent(tree, e.node.id), e.node.id, focus)
  }
  const below = (e: TsEntry) => all.filter((x) => x.path.length > e.path.length && x.path[e.depth] === e.node).length
  const canRemove = (e: TsEntry) => !(e.depth === 0 && tree.length === 1)
  const remove = (e: TsEntry) => {
    if (!canRemove(e)) return
    if (e.node.children.length && confirm !== e.node.id) {
      setConfirm(e.node.id)
      focusNext.current = "confirm"
      return
    }
    const next = e.siblings[e.index + 1] ?? e.siblings[e.index - 1] ?? e.parent
    commit(removeNode(tree, e.node.id), next?.id ?? null, "tree")
  }
  const rename = (e: TsEntry, side: "en" | "id", text: string) =>
    onTree(
      updateNode(tree, e.node.id, (n) =>
        side === "en" ? { ...n, label: { ...n.label, en: text }, key: keyFor(tree, n.id, text, e.parent?.key ?? null) } : { ...n, label: { ...n.label, id: text } },
      ),
    )

  const onKeyDown = (ev: KeyboardEvent<HTMLDivElement>) => {
    if (!sel) return
    const i = rows.findIndex((r) => r.node.id === sel.node.id)
    const go = (j: number) => rows[j] && select(rows[j].node.id)
    const kids = sel.node.children.length > 0
    const isOpen = kids && !closed.has(sel.node.id)
    let done = true
    if (ev.altKey && ev.key === "ArrowUp") move(sel, -1, "tree")
    else if (ev.altKey && ev.key === "ArrowDown") move(sel, 1, "tree")
    else if (ev.altKey && ev.key === "ArrowRight") moveIn(sel, "tree")
    else if (ev.altKey && ev.key === "ArrowLeft") moveOut(sel, "tree")
    else if (ev.key === "ArrowDown") go(i + 1)
    else if (ev.key === "ArrowUp") go(i - 1)
    else if (ev.key === "Home") go(0)
    else if (ev.key === "End") go(rows.length - 1)
    else if (ev.key === "ArrowRight") {
      if (kids && !isOpen) setOpen(sel.node.id, true)
      else if (kids) go(i + 1)
    } else if (ev.key === "ArrowLeft") {
      if (isOpen) setOpen(sel.node.id, false)
      else if (sel.parent) select(sel.parent.id)
    } else if (ev.key === "Enter" || ev.key === "F2") {
      enRef.current?.focus()
      enRef.current?.select()
    } else done = false
    if (done) ev.preventDefault()
  }

  const levelText = (e: TsEntry) => L(`Level ${e.depth + 1} of ${MAX_DEPTH}`, `Tingkat ${e.depth + 1} dari ${MAX_DEPTH}`)
  const nameOf = (n: TsNode) => t(n.label) || t(L("(no English name)", "(tanpa nama Inggris)"))

  return (
    <div className="@container flex flex-col gap-2">
      <Label id={labelId} className="text-sm font-medium">
        {t(L("Items", "Daftar item"))}
      </Label>
      <div className="grid gap-3 @2xl:grid-cols-[minmax(0,1fr)_17rem]">
        {/* outline */}
        <div className="max-h-80 min-h-40 overflow-y-auto rounded-2xl border border-border bg-muted/20 p-1.5 dark:bg-muted/10">
          {rows.length ? (
            <div ref={box} role="tree" aria-labelledby={labelId} aria-describedby={hintId} onKeyDown={onKeyDown} className="flex flex-col gap-px">
              {rows.map((e) => {
                const n = e.node
                const kids = n.children.length > 0
                const open = kids && !closed.has(n.id)
                const on = sel?.node.id === n.id
                const bad = !n.label.en.trim() || (keyCount.get(n.key) ?? 0) > 1
                return (
                  <div
                    key={n.id}
                    role="treeitem"
                    data-tid={n.id}
                    aria-level={e.depth + 1}
                    aria-setsize={e.siblings.length}
                    aria-posinset={e.index + 1}
                    aria-expanded={kids ? open : undefined}
                    aria-selected={on}
                    aria-invalid={bad || undefined}
                    aria-label={nameOf(n)}
                    tabIndex={on ? 0 : -1}
                    onClick={() => select(n.id)}
                    className={cn(
                      "flex min-h-8 cursor-pointer items-center gap-1 rounded-xl pr-2 text-sm outline-none select-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/50",
                      on && "bg-primary/10 font-medium hover:bg-primary/15",
                    )}
                    style={{ paddingLeft: `${0.125 + e.depth * 1.125}rem` }}
                  >
                    {kids ? (
                      <span
                        aria-hidden
                        className="grid size-6 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/10"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          setOpen(n.id, !open)
                          // closing the branch that holds the selection selects the branch, so the tree keeps a Tab stop
                          if (open && sel && sel.node.id !== n.id && sel.path.includes(n)) setSelId(n.id)
                        }}
                      >
                        <HugeiconsIcon icon={ArrowRight01Icon} className={cn("size-3.5 transition-transform", open && "rotate-90")} />
                      </span>
                    ) : (
                      <span aria-hidden className="grid size-6 shrink-0 place-items-center">
                        <span className="size-1 rounded-full bg-muted-foreground/50" />
                      </span>
                    )}
                    <span className={cn("min-w-0 flex-1 truncate", !n.label.en.trim() && "text-destructive italic")}>{nameOf(n)}</span>
                    {kids && !open && <span className="text-[11px] text-muted-foreground tabular-nums">{n.children.length}</span>}
                    <span className={cn("hidden max-w-[40%] truncate font-mono text-[10px] md:inline", bad ? "text-destructive" : "text-muted-foreground")}>{n.key}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t(L("No items yet.", "Belum ada item."))}</p>
          )}
        </div>

        {/* selected item */}
        {sel ? (
          <div className="flex min-w-0 flex-col gap-2.5 rounded-2xl border border-border p-3" role="group" aria-label={t(L("Selected item", "Item terpilih"))}>
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{t(levelText(sel))}</p>
            <div className="flex flex-col gap-1.5">
              <InputGroup className="h-8">
                <InputGroupAddon>
                  <span className="w-5 text-[10px] font-semibold tracking-wider">EN</span>
                </InputGroupAddon>
                <InputGroupInput
                  ref={enRef}
                  id={enId}
                  value={sel.node.label.en}
                  aria-label={t(L("Name (English)", "Nama (bahasa Inggris)"))}
                  aria-invalid={!sel.node.label.en.trim() || undefined}
                  className="text-xs"
                  onChange={(ev) => rename(sel, "en", ev.target.value)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") {
                      ev.preventDefault()
                      select(sel.node.id)
                    }
                  }}
                />
              </InputGroup>
              <InputGroup className="h-8">
                <InputGroupAddon>
                  <span className="w-5 text-[10px] font-semibold tracking-wider">ID</span>
                </InputGroupAddon>
                <InputGroupInput
                  value={sel.node.label.id}
                  aria-label={t(L("Name (Bahasa Indonesia)", "Nama (Bahasa Indonesia)"))}
                  className="text-xs"
                  onChange={(ev) => rename(sel, "id", ev.target.value)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") {
                      ev.preventDefault()
                      select(sel.node.id)
                    }
                  }}
                />
              </InputGroup>
              <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="shrink-0">{t(L("Key", "Key"))}</span>
                <code className={cn("truncate rounded-md bg-muted px-1 py-px font-mono", (keyCount.get(sel.node.key) ?? 0) > 1 ? "text-destructive" : "text-foreground")}>
                  {sel.node.key}
                </code>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 @md:grid-cols-4 @2xl:grid-cols-2">
              <ActionButton icon={PlusSignIcon} label={L("Add child", "Tambah sub-item")} disabled={!canAddChild(sel)} onClick={() => addChild(sel)} />
              <ActionButton icon={PlusSignIcon} label={L("Add sibling", "Tambah sejajar")} onClick={() => addSibling(sel)} />
              <ActionButton icon={ArrowUp01Icon} label={L("Move up", "Naikkan")} disabled={sel.index === 0} onClick={() => move(sel, -1, "keep")} />
              <ActionButton icon={ArrowDown01Icon} label={L("Move down", "Turunkan")} disabled={sel.index === sel.siblings.length - 1} onClick={() => move(sel, 1, "keep")} />
              <ActionButton icon={ArrowLeft01Icon} label={L("Move out", "Keluar tingkat")} title={L("Move out one level", "Pindah keluar satu tingkat")} disabled={!canOutdent(sel)} onClick={() => moveOut(sel, "keep")} />
              <ActionButton icon={ArrowRight01Icon} label={L("Move in", "Masuk tingkat")} title={L("Move into the item above", "Masukkan ke item di atasnya")} disabled={!canIndent(sel)} onClick={() => moveIn(sel, "keep")} />
              <ActionButton icon={Delete02Icon} label={L("Delete", "Hapus")} danger disabled={!canRemove(sel)} onClick={() => remove(sel)} />
            </div>
            {confirm === sel.node.id && (
              <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-2.5 text-xs">
                <p>
                  {t(
                    L(
                      `Delete “${nameOf(sel.node)}” and the ${below(sel)} items under it?`,
                      `Hapus “${nameOf(sel.node)}” beserta ${below(sel)} item di bawahnya?`,
                    ),
                  )}
                </p>
                <div className="flex gap-1.5">
                  <Button ref={confirmRef} variant="destructive" size="xs" onClick={() => remove(sel)}>
                    {t(L("Delete", "Hapus"))}
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => select(sel.node.id)}>
                    {t(L("Cancel", "Batal"))}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div />
        )}
      </div>
      <div>
        <Button variant="ghost" size="sm" onClick={addRoot}>
          <HugeiconsIcon icon={PlusSignIcon} />
          {t(L("Add top-level item", "Tambah item tingkat atas"))}
        </Button>
      </div>
      <p id={hintId} className="text-xs text-muted-foreground">
        <Rich
          text={L(
            `Up to ${MAX_DEPTH} levels. In the list: **↑ ↓** move, **→ ←** open and close, **Enter** renames, **Alt/Option + ↑ ↓** reorders, **Alt/Option + → ←** moves in or out a level. The key comes from the English name and is unique across the tree.`,
            `Maksimal ${MAX_DEPTH} tingkat. Di daftar: **↑ ↓** berpindah, **→ ←** membuka dan menutup, **Enter** mengganti nama, **Alt/Option + ↑ ↓** mengubah urutan, **Alt/Option + → ←** memindah masuk atau keluar satu tingkat. Key diambil dari nama bahasa Inggris dan unik di seluruh pohon.`,
          )}
        />
      </p>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  title,
  disabled,
  danger,
  onClick,
}: {
  icon: IconSvgElement
  label: L10n
  title?: L10n
  disabled?: boolean
  danger?: boolean
  onClick: () => void
}) {
  const t = useT()
  return (
    <Button
      variant="outline"
      size="xs"
      disabled={disabled}
      title={title ? t(title) : undefined}
      onClick={onClick}
      className={cn("h-7 min-w-0 justify-start", danger && "text-destructive hover:text-destructive")}
    >
      <HugeiconsIcon icon={icon} />
      <span className="truncate">{t(label)}</span>
    </Button>
  )
}
