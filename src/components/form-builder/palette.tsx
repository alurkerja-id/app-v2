import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { L, useLang, useT } from "./i18n"
import { norm } from "./lib"
import { PALETTE } from "./registry"
import type { GroupId } from "./types"

const OPEN_KEY = "form-builder-palette-closed"

/** Highlight every search token inside `text`. */
function Hl({ text, q }: { text: string; q: string }) {
  const tokens = norm(q).split(" ").filter(Boolean)
  if (!tokens.length) return <>{text}</>
  const low = text.toLowerCase()
  const marks = new Array<boolean>(text.length).fill(false)
  for (const tok of tokens) {
    let i = low.indexOf(tok)
    while (i > -1) {
      for (let j = i; j < i + tok.length; j++) marks[j] = true
      i = low.indexOf(tok, i + 1)
    }
  }
  const out: React.ReactNode[] = []
  let start = 0
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || marks[i] !== marks[start]) {
      const chunk = text.slice(start, i)
      out.push(
        marks[start] ? (
          <mark key={start} className="rounded-sm bg-amber-200/70 text-foreground dark:bg-amber-400/30">
            {chunk}
          </mark>
        ) : (
          chunk
        ),
      )
      start = i
    }
  }
  return <>{out}</>
}

/**
 * The regrouped palette: search in English and Indonesian, groups fold, the
 * new components carry a "New" badge. Existing items are shown for context only.
 */
export function Palette({ activeSlug, onPick, className }: { activeSlug?: string; onPick: (slug: string) => void; className?: string }) {
  const t = useT()
  const { lang } = useLang()
  const [q, setQ] = useState("")
  const [closed, setClosed] = useState<GroupId[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(OPEN_KEY) ?? "[]") as GroupId[]
    } catch {
      return []
    }
  })
  const toggle = (id: GroupId) => {
    const next = closed.includes(id) ? closed.filter((x) => x !== id) : [...closed, id]
    setClosed(next)
    localStorage.setItem(OPEN_KEY, JSON.stringify(next))
  }

  const groups = useMemo(() => {
    const tokens = norm(q).split(" ").filter(Boolean)
    if (!tokens.length) return PALETTE
    return PALETTE.map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        const hay = norm(`${it.label.en} ${it.label.id} ${it.kw} ${g.label.en} ${g.label.id}`)
        return tokens.every((tok) => hay.includes(tok))
      }),
    })).filter((g) => g.items.length)
  }, [q])
  const total = groups.reduce((n, g) => n + g.items.length, 0)
  const searching = q.trim().length > 0

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <InputGroup>
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} />
        </InputGroupAddon>
        <InputGroupInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(L("Search components (EN / ID)", "Cari komponen (EN / ID)"))}
          aria-label={t(L("Search components", "Cari komponen"))}
        />
        {q && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label={t(L("Clear search", "Hapus pencarian"))} onClick={() => setQ("")}>
              <HugeiconsIcon icon={Cancel01Icon} />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      {searching && (
        <p className="px-1 text-xs text-muted-foreground" aria-live="polite">
          {total
            ? t(L(`${total} result${total === 1 ? "" : "s"}`, `${total} hasil`))
            : t(L(`Nothing matches “${q}”. Try another word, in English or Indonesian.`, `Tidak ada yang cocok dengan “${q}”. Coba kata lain, dalam bahasa Inggris atau Indonesia.`))}
        </p>
      )}
      <nav className="flex flex-col gap-1" aria-label={t(L("Component palette", "Palette komponen"))}>
        {groups.map((g) => {
          const open = searching || !closed.includes(g.id)
          const fresh = g.items.filter((it) => it.slug).length
          return (
            <Collapsible key={g.id} open={open} onOpenChange={() => !searching && toggle(g.id)}>
              <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[11px] font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted">
                <HugeiconsIcon icon={ArrowRight01Icon} className={cn("size-3.5 transition-transform", open && "rotate-90")} />
                <span className="flex-1">{t(g.label)}</span>
                {fresh > 0 && <span className="text-[10px] font-medium tracking-normal normal-case tabular-nums">{t(L(`${fresh} new`, `${fresh} baru`))}</span>}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="mt-0.5 mb-1.5 flex flex-col gap-0.5">
                  {g.items.map((it) => {
                    const active = it.slug != null && it.slug === activeSlug
                    const body = (
                      <>
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background",
                            active && "border-foreground/20 bg-foreground text-background",
                          )}
                        >
                          <HugeiconsIcon icon={it.icon} className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          <Hl text={it.label[lang] || it.label.en} q={q} />
                          {it.star && <span className="ml-1 text-amber-500">★</span>}
                        </span>
                        {it.slug && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                            {t(L("New", "Baru"))}
                          </Badge>
                        )}
                      </>
                    )
                    return (
                      <li key={it.key}>
                        {it.slug ? (
                          <button
                            type="button"
                            onClick={() => onPick(it.slug!)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                              active && "bg-muted font-medium",
                            )}
                          >
                            {body}
                          </button>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex cursor-default items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm text-muted-foreground" tabIndex={0}>
                                {body}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">{t(L("Existing component — unchanged", "Komponen existing — tidak berubah"))}</TooltipContent>
                          </Tooltip>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </nav>
    </div>
  )
}
