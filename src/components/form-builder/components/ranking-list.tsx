import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowUp01Icon, Cancel01Icon, DragDropVerticalIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { L, useT, type L10n } from "../i18n"

/*
 * Ranking — the sortable list. Three ways to move a row, all ending in `onCommit(nextKeys)`:
 *  - drag the handle (pointer events: mouse, touch, pen; no library),
 *  - the up / down buttons,
 *  - keyboard: focus a row, Space picks up, arrows move, Space drops, Esc cancels.
 * Every move is announced through `announce` (an aria-live region owned by the runtime).
 */

const moveArr = <T,>(a: T[], from: number, to: number) => {
  const next = a.slice()
  const [x] = next.splice(from, 1)
  next.splice(to, 0, x)
  return next
}

const MSG = {
  moved: (name: string, i: number, n: number) => L(`${name} moved to position ${i} of ${n}`, `${name} pindah ke posisi ${i} dari ${n}`),
  pickedUp: (name: string, i: number, n: number) =>
    L(
      `${name} picked up, position ${i} of ${n}. Use the arrow keys to move, Space to drop, Escape to cancel.`,
      `${name} diangkat, posisi ${i} dari ${n}. Pakai tombol panah untuk memindah, Spasi untuk meletakkan, Escape untuk batal.`,
    ),
  dropped: (name: string, i: number, n: number) => L(`${name} dropped at position ${i} of ${n}`, `${name} diletakkan di posisi ${i} dari ${n}`),
  cancelled: (name: string, i: number, n: number) => L(`Move cancelled. ${name} is back at position ${i} of ${n}`, `Batal dipindah. ${name} kembali ke posisi ${i} dari ${n}`),
}

interface Drag {
  key: string
  from: number
  to: number
  pointer: number
  startY: number
  listTop: number
  dy: number
  /** Row boxes at drag start, relative to the list top. */
  rows: { top: number; h: number }[]
}

/** Rank badge: solid once the order is an answer, muted while it is only the starting order. */
export function RankBadge({ n, solid, muted }: { n: number; solid: boolean; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
        muted ? "bg-muted-foreground/20 text-muted-foreground" : solid ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground ring-1 ring-border ring-inset",
      )}
    >
      {n}
    </span>
  )
}

export function SortableList({
  keys,
  name,
  total,
  solid,
  compact,
  invalid,
  labelledBy,
  describedBy,
  removeLabel,
  slots = 0,
  slotText,
  onCommit,
  onRemove,
  announce,
}: {
  keys: string[]
  name: (key: string) => string
  /** "of N" in announcements (top mode: N; all mode: the number of options). */
  total: number
  solid: boolean
  compact: boolean
  invalid: boolean
  labelledBy: string
  describedBy: string
  /** Accessible name of the remove button, e.g. "Remove Leadership from your top 3". */
  removeLabel?: (name: string) => string
  /** Empty dashed rows after the list (top mode, until N are picked). */
  slots?: number
  slotText?: L10n
  onCommit: (next: string[], key: string) => void
  onRemove?: (key: string, index: number) => void
  announce: (msg: L10n) => void
}) {
  const t = useT()
  const list = useRef<HTMLOListElement>(null)
  const pending = useRef<string | null>(null)
  const [grab, setGrab] = useState<{ key: string; from: number; order: string[] } | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [focusKey, setFocusKey] = useState<string | null>(null)

  /* A grabbed row keeps its order locally until dropped; Escape throws it away. */
  const held = grab && grab.order.length === keys.length && grab.order.every((k) => keys.includes(k)) ? grab : null
  const shown = held ? held.order : keys
  const tabKey = focusKey && shown.includes(focusKey) ? focusKey : shown[0]
  const rowSel = (k: string) => `[data-rk-focus="${k}"]`

  /* Moving a keyed row re-inserts DOM nodes, which can drop focus — put it back. */
  useLayoutEffect(() => {
    if (!pending.current) return
    const el = list.current?.querySelector<HTMLElement>(pending.current)
    pending.current = null
    el?.focus()
  })

  const commitMove = (from: number, to: number, key: string) => {
    onCommit(moveArr(keys, from, to), key)
    announce(MSG.moved(name(key), to + 1, total))
  }

  /** Drop the grabbed row where it is. `refocus` = false when focus is leaving (Tab, click elsewhere). */
  const drop = (refocus = true) => {
    if (!held) return
    const j = held.order.indexOf(held.key)
    if (j !== held.from) onCommit(held.order, held.key)
    announce(MSG.dropped(name(held.key), j + 1, total))
    if (refocus) pending.current = rowSel(held.key)
    setGrab(null)
  }
  const cancel = () => {
    if (!held) return
    announce(MSG.cancelled(name(held.key), held.from + 1, total))
    pending.current = rowSel(held.key)
    setGrab(null)
  }

  const pickUp = (key: string) => {
    if (drag) return
    const i = shown.indexOf(key)
    setGrab({ key, from: i, order: shown })
    announce(MSG.pickedUp(name(key), i + 1, total))
  }

  const onRowKey = (e: KeyboardEvent<HTMLDivElement>, key: string) => {
    const i = shown.indexOf(key)
    const n = shown.length
    const target = e.key === "ArrowUp" ? i - 1 : e.key === "ArrowDown" ? i + 1 : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null
    if (held) {
      if (target != null) {
        e.preventDefault()
        if (target < 0 || target >= n || target === i) return
        setGrab({ ...held, order: moveArr(held.order, i, target) })
        pending.current = rowSel(key)
        announce(MSG.moved(name(key), target + 1, total))
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        drop()
      } else if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        cancel()
      } else if (e.key === "Tab") drop(false)
      return
    }
    if (target != null) {
      e.preventDefault()
      const k = shown[Math.max(0, Math.min(n - 1, target))]
      setFocusKey(k)
      list.current?.querySelector<HTMLElement>(rowSel(k))?.focus()
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      pickUp(key)
    } else if ((e.key === "Delete" || e.key === "Backspace") && onRemove) {
      e.preventDefault()
      onRemove(key, i)
    }
  }

  /* ── pointer drag on the handle ── */
  const onDown = (e: ReactPointerEvent<HTMLSpanElement>, key: string) => {
    if (held || drag || (e.pointerType === "mouse" && e.button !== 0) || !list.current) return
    e.preventDefault()
    const box = list.current.getBoundingClientRect()
    const rows = [...list.current.querySelectorAll<HTMLElement>("[data-rk-row]")].map((r) => {
      const b = r.getBoundingClientRect()
      return { top: b.top - box.top, h: b.height }
    })
    const from = keys.indexOf(key)
    if (from < 0 || rows.length !== keys.length) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ key, from, to: from, pointer: e.pointerId, startY: e.clientY, listTop: box.top, dy: 0, rows })
  }
  const onMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (!drag || e.pointerId !== drag.pointer || !list.current) return
    const { rows, from } = drag
    const scrolled = list.current.getBoundingClientRect().top - drag.listTop
    const last = rows[rows.length - 1]
    const lo = rows[0].top - rows[from].top
    const hi = last.top + last.h - (rows[from].top + rows[from].h)
    const dy = Math.max(lo, Math.min(hi, e.clientY - drag.startY - scrolled))
    const c = rows[from].top + rows[from].h / 2 + dy
    let to = from
    for (let j = 0; j < from; j++)
      if (c < rows[j].top + rows[j].h / 2) {
        to = j
        break
      }
    if (to === from)
      for (let j = rows.length - 1; j > from; j--)
        if (c > rows[j].top + rows[j].h / 2) {
          to = j
          break
        }
    setDrag({ ...drag, dy, to })
  }
  const onUp = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (!drag || e.pointerId !== drag.pointer) return
    setDrag(null)
    if (drag.to !== drag.from) commitMove(drag.from, drag.to, drag.key)
  }

  const gap = drag && drag.rows.length > 1 ? drag.rows[1].top - (drag.rows[0].top + drag.rows[0].h) : 0
  const shift = drag ? drag.rows[drag.from].h + gap : 0
  const offset = (j: number) => {
    if (!drag) return 0
    if (j === drag.from) return drag.dy
    if (drag.from < drag.to && j > drag.from && j <= drag.to) return -shift
    if (drag.to < drag.from && j >= drag.to && j < drag.from) return shift
    return 0
  }

  const btn = compact ? "icon-sm" : "icon-xs"

  return (
    <ol
      ref={list}
      aria-labelledby={labelledBy}
      className={cn("flex flex-col gap-1.5 rounded-2xl", drag && "select-none", invalid && "ring-2 ring-destructive/40 ring-offset-4 ring-offset-background")}
    >
      {shown.map((key, i) => {
        const dragged = drag?.key === key
        const grabbed = held?.key === key
        const dy = offset(i)
        const label = name(key)
        return (
          <li
            key={key}
            data-rk-row
            style={dy ? { transform: `translateY(${dy}px)` } : undefined}
            className={cn("relative", dragged ? "z-10" : drag && "transition-transform duration-150 ease-out")}
          >
            <div
              className={cn(
                "flex items-center gap-1 rounded-2xl border bg-card py-1 pr-1 pl-0.5 transition-shadow has-[[data-rk-focus]:focus-visible]:ring-3 has-[[data-rk-focus]:focus-visible]:ring-ring/40",
                compact ? "min-h-12" : "min-h-11",
                dragged || grabbed ? "border-primary/60 shadow-lg ring-2 ring-primary/30" : "border-border",
              )}
            >
              <span
                aria-hidden
                title={t(L("Drag to move", "Seret untuk memindah"))}
                onPointerDown={(e) => onDown(e, key)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={() => setDrag(null)}
                onLostPointerCapture={() => setDrag((d) => (d?.key === key ? null : d))}
                className={cn(
                  "grid w-8 shrink-0 touch-none place-items-center self-stretch rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground",
                  dragged ? "cursor-grabbing" : "cursor-grab",
                )}
              >
                <HugeiconsIcon icon={DragDropVerticalIcon} className="size-4" />
              </span>
              <div
                role="button"
                tabIndex={key === tabKey ? 0 : -1}
                data-rk-focus={key}
                aria-roledescription={t(L("sortable item", "item yang bisa diurutkan"))}
                aria-describedby={describedBy}
                aria-pressed={grabbed}
                aria-label={`${label}, ${t(L(`position ${i + 1} of ${total}`, `posisi ${i + 1} dari ${total}`))}`}
                onFocus={() => setFocusKey(key)}
                onBlur={(e) => {
                  if (held && e.relatedTarget instanceof Node && !list.current?.contains(e.relatedTarget)) drop(false)
                }}
                onKeyDown={(e) => onRowKey(e, key)}
                onClick={(e) => {
                  // Screen readers in browse mode send a click (detail 0) instead of Space / Enter.
                  if (e.detail !== 0) return
                  if (held) drop()
                  else pickUp(key)
                }}
                className="flex min-w-0 flex-1 cursor-default items-center gap-2.5 self-stretch rounded-xl py-1 pl-0.5 outline-none"
              >
                <RankBadge n={i + 1} solid={solid} />
                <span className="min-w-0 flex-1 text-sm leading-snug break-words">{label}</span>
                {grabbed && <span className="shrink-0 text-[11px] font-medium text-primary">{t(L("Moving", "Dipindah"))}</span>}
              </div>
              <div className="flex shrink-0 items-center">
                <Button
                  variant="ghost"
                  size={btn}
                  tabIndex={-1}
                  aria-label={`${t(L("Move up", "Naikkan"))}: ${label}`}
                  disabled={i === 0 || !!held}
                  onClick={() => commitMove(i, i - 1, key)}
                >
                  <HugeiconsIcon icon={ArrowUp01Icon} />
                </Button>
                <Button
                  variant="ghost"
                  size={btn}
                  tabIndex={-1}
                  aria-label={`${t(L("Move down", "Turunkan"))}: ${label}`}
                  disabled={i === shown.length - 1 || !!held}
                  onClick={() => commitMove(i, i + 1, key)}
                >
                  <HugeiconsIcon icon={ArrowDown01Icon} />
                </Button>
                {onRemove && (
                  <Button
                    variant="ghost"
                    size={btn}
                    tabIndex={-1}
                    aria-label={removeLabel ? removeLabel(label) : t(L("Remove", "Hapus"))}
                    disabled={!!held}
                    className="hover:text-destructive"
                    onClick={() => onRemove(key, i)}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} />
                  </Button>
                )}
              </div>
            </div>
          </li>
        )
      })}
      {Array.from({ length: slots }, (_, s) => (
        <li
          key={`slot-${s}`}
          aria-hidden
          className={cn("flex items-center gap-2.5 rounded-2xl border border-dashed border-border px-2.5 text-sm text-muted-foreground", compact ? "min-h-12" : "min-h-11")}
        >
          <RankBadge n={shown.length + s + 1} solid={false} />
          {s === 0 && slotText ? <span className="text-xs">{t(slotText)}</span> : null}
        </li>
      ))}
    </ol>
  )
}
