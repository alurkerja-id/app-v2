import { useCallback, useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  CodeIcon,
  LinkSquare02Icon,
  Pdf01Icon,
  PencilEdit02Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HeaderToolbar } from "@/components/layout/header-toolbar"
import { L, useT, type L10n } from "@/components/form-builder/i18n"
import { LangProvider, LangToggle } from "@/components/form-builder/lang"
import { Palette } from "@/components/form-builder/palette"
import { COMPONENTS, compBySlug, SHAPING_LINKS, WAVES, WEEKS } from "@/components/form-builder/registry"
import type { AnyComponentDef, Wave } from "@/components/form-builder/types"
import { Workbench, type WorkbenchTab } from "@/components/form-builder/workbench"

/* Form builder revamp — Wave 1 (8) + Wave 2 (12) new components, merged from
   the HTML prototype. Overview at /pages/form-builder, one page per component
   at /pages/form-builder/<slug>?tab=builder|runtime|data. Mock data only. */

const BASE = "/pages/form-builder"
const TABS: { id: WorkbenchTab; label: L10n; icon: typeof PlayIcon }[] = [
  { id: "builder", label: L("Builder", "Builder"), icon: PencilEdit02Icon },
  { id: "runtime", label: L("Runtime", "Runtime"), icon: PlayIcon },
  { id: "data", label: L("Data", "Data"), icon: CodeIcon },
]
const WAVE_KEY = "form-builder-wave"

interface Route {
  slug?: string
  tab: WorkbenchTab
  wave: Wave
}

function readRoute(): Route {
  const m = window.location.pathname.match(/^\/pages\/form-builder\/([^/]+)/)
  const sp = new URLSearchParams(window.location.search)
  const tab = sp.get("tab")
  const w = sp.get("wave") ?? localStorage.getItem(WAVE_KEY)
  return {
    slug: m?.[1],
    tab: tab === "runtime" || tab === "data" ? tab : "builder",
    wave: w === "4" ? 4 : w === "3" ? 3 : w === "2" ? 2 : 1,
  }
}

function hrefFor(r: Route) {
  return r.slug ? `${BASE}/${r.slug}${r.tab === "builder" ? "" : `?tab=${r.tab}`}` : `${BASE}?wave=${r.wave}`
}

export function FormBuilderPage() {
  return (
    <LangProvider>
      <FormBuilder />
    </LangProvider>
  )
}

function FormBuilder() {
  const [route, setRoute] = useState<Route>(readRoute)
  const go = useCallback((next: Route, replace = false) => {
    if (!next.slug) localStorage.setItem(WAVE_KEY, String(next.wave))
    setRoute(next)
    const url = hrefFor(next)
    if (url !== window.location.pathname + window.location.search) window.history[replace ? "replaceState" : "pushState"]({}, "", url)
  }, [])

  useEffect(() => {
    const onPop = () => setRoute(readRoute())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const def = compBySlug(route.slug)
  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 })
  }, [route.slug])

  if (route.slug && !def) return <NotFound onBack={() => go({ tab: "builder", wave: route.wave })} />
  if (def)
    return (
      <Detail
        key={def.slug}
        def={def}
        tab={route.tab}
        onTab={(tab) => go({ slug: def.slug, tab, wave: def.wave }, true)}
        onPick={(slug) => go({ slug, tab: route.tab, wave: compBySlug(slug)?.wave ?? route.wave })}
        onBack={() => go({ tab: "builder", wave: def.wave })}
      />
    )
  return <Overview wave={route.wave} onWave={(wave) => go({ tab: "builder", wave }, true)} onOpen={(slug) => go({ slug, tab: "builder", wave: route.wave })} />
}

/* ── overview ─────────────────────────────────────────────────────────────── */

function Overview({ wave, onWave, onOpen }: { wave: Wave; onWave: (w: Wave) => void; onOpen: (slug: string) => void }) {
  const t = useT()
  const list = COMPONENTS.filter((c) => c.wave === wave)
  const W = WAVES[wave]
  const stars = list.filter((c) => c.star)
  const kinds = [...new Set(list.map((c) => c.vk))]

  return (
    <div className="mx-auto max-w-screen-xl space-y-5 p-4 sm:p-6">
      <HeaderToolbar>
        <div className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-300 group-data-[scrolled]/header:grid-rows-[0fr]">
          <div className="min-h-0 overflow-hidden">
            <div className="px-4 py-3 sm:px-5">
              <h1 className="text-xl font-bold">{t(L("Form Builder Revamp", "Revamp Form Builder"))}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t(L("New Studio form components, from the shaping of task 147071. Prototype — mock data, no backend.", "Komponen form Studio baru, dari shaping task 147071. Prototipe — data tiruan, tanpa backend."))}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-b-[inherit] border-t border-border/60 bg-muted/60 px-3 py-2.5 group-data-[scrolled]/header:border-t-0 sm:px-4 dark:bg-muted/30">
          <Tabs value={String(wave)} onValueChange={(v) => onWave(v === "3" ? 3 : v === "2" ? 2 : 1)}>
            <TabsList>
              {([1, 2, 3, 4] as Wave[]).map((w) => (
                <TabsTrigger key={w} value={String(w)} className="px-3">
                  {t(WAVES[w].label)}
                  <span className="text-xs text-muted-foreground tabular-nums">{COMPONENTS.filter((c) => c.wave === w).length}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={SHAPING_LINKS.pdf(wave)} target="_blank" rel="noopener noreferrer">
                <HugeiconsIcon icon={Pdf01Icon} />
                {t(L("Shaping PDF", "PDF shaping"))}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={SHAPING_LINKS.doc} target="_blank" rel="noopener noreferrer">
                <HugeiconsIcon icon={BookOpen01Icon} />
                {t(L("Shaping doc", "Dokumen shaping"))}
                <HugeiconsIcon icon={LinkSquare02Icon} className="size-3.5 opacity-60" />
              </a>
            </Button>
            <LangToggle />
          </div>
        </div>
      </HeaderToolbar>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: L("Components", "Komponen"), v: String(list.length), s: W.blurb },
          {
            k: L("Built with a senior ★", "Bersama senior ★"),
            v: String(stars.length),
            s: L(stars.map((c) => c.title.en).join(", ") || "—", stars.map((c) => c.title.id).join(", ") || "—"),
          },
          { k: L("Schedule", "Jadwal"), v: t(W.schedule), s: L(`${new Set(list.map((c) => c.week)).size} weeks`, `${new Set(list.map((c) => c.week)).size} minggu`) },
          { k: L("Value kinds", "Jenis nilai"), v: String(kinds.length), s: L(kinds.join(" · "), kinds.join(" · ")) },
        ].map((x) => (
          <Card key={x.k.en} className="gap-1 p-4">
            <p className="text-xs text-muted-foreground">{t(x.k)}</p>
            <p className="font-heading text-2xl font-semibold tabular-nums">{x.v}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{t(x.s)}</p>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <Card className="h-fit gap-3 p-3 lg:sticky lg:top-4">
          <div className="px-1">
            <p className="text-xs font-semibold">{t(L("New palette", "Palette baru"))}</p>
            <p className="text-[11px] text-muted-foreground">{t(L("Regrouped and searchable in English and Indonesian.", "Dikelompokkan ulang dan bisa dicari dalam bahasa Inggris dan Indonesia."))}</p>
          </div>
          <Palette onPick={onOpen} />
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <ComponentCard key={c.slug} def={c} onOpen={() => onOpen(c.slug)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ComponentCard({ def, onOpen }: { def: AnyComponentDef; onOpen: () => void }) {
  const t = useT()
  const [props] = useState(() => def.defaults())
  const Canvas = def.Canvas
  return (
    <button type="button" onClick={onOpen} className="group text-left outline-none">
      <Card className="h-full gap-0 p-0 transition-shadow group-hover:shadow-lg group-focus-visible:ring-3 group-focus-visible:ring-ring/40">
        <div className="relative h-40 overflow-hidden border-b border-border bg-muted/40 px-4 pt-4 dark:bg-muted/15" aria-hidden>
          <div className="pointer-events-none origin-top-left scale-[0.82] [width:122%]">
            {!def.bare && <p className="mb-1.5 text-xs text-muted-foreground">{t(def.fieldLabel(props))}</p>}
            <Canvas props={props} />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border">
              <HugeiconsIcon icon={def.icon} className="size-4" />
            </span>
            <p className="min-w-0 flex-1 truncate font-heading text-[15px] font-semibold">
              {t(def.title)}
              {def.star && <span className="ml-1 text-amber-500">★</span>}
            </p>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{t(def.blurb)}</p>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            <Badge variant="outline" className="font-mono text-[10px]">
              {def.ui}
              {def.fft ? ` · ${def.fft}` : ""}
            </Badge>
            <Badge variant="secondary" className="font-mono text-[10px]">
              {def.vk}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {t(WEEKS[def.week])}
            </Badge>
          </div>
        </div>
      </Card>
    </button>
  )
}

/* ── one component ────────────────────────────────────────────────────────── */

function Detail({
  def,
  tab,
  onTab,
  onPick,
  onBack,
}: {
  def: AnyComponentDef
  tab: WorkbenchTab
  onTab: (tab: WorkbenchTab) => void
  onPick: (slug: string) => void
  onBack: () => void
}) {
  const t = useT()
  const siblings = COMPONENTS.filter((c) => c.wave === def.wave)
  const i = siblings.indexOf(def)
  const prev = siblings[i - 1]
  const next = siblings[i + 1]

  return (
    <div className="mx-auto max-w-screen-xl space-y-5 p-4 sm:p-6">
      <HeaderToolbar>
        <div className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-300 group-data-[scrolled]/header:grid-rows-[0fr]">
          <div className="min-h-0 overflow-hidden">
            <div className="flex items-start gap-3 px-4 py-3 sm:px-5">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                <HugeiconsIcon icon={def.icon} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold">
                    {t(def.title)}
                    {def.star && <span className="ml-1 text-amber-500">★</span>}
                  </h1>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {def.ui}
                    {def.fft ? ` · ${def.fft}` : ""}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    value_kind: {def.vk}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {t(WAVES[def.wave].label)} · {t(WEEKS[def.week])}
                  </Badge>
                  {def.star && (
                    <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-700 dark:text-amber-400">
                      {t(L("★ with a senior", "★ bersama senior"))}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{t(def.blurb)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-b-[inherit] border-t border-border/60 bg-muted/60 px-3 py-2.5 group-data-[scrolled]/header:border-t-0 sm:px-4 dark:bg-muted/30">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <HugeiconsIcon icon={ArrowLeft01Icon} />
            {t(L("All components", "Semua komponen"))}
          </Button>
          <Tabs value={tab} onValueChange={(v) => onTab(v as WorkbenchTab)}>
            <TabsList>
              {TABS.map((x) => (
                <TabsTrigger key={x.id} value={x.id} className="gap-1.5 px-3">
                  <HugeiconsIcon icon={x.icon} className="size-3.5" />
                  {t(x.label)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon-sm" disabled={!prev} onClick={() => prev && onPick(prev.slug)} aria-label={prev ? t(prev.title) : undefined}>
              <HugeiconsIcon icon={ArrowLeft01Icon} />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {i + 1} / {siblings.length}
            </span>
            <Button variant="ghost" size="icon-sm" disabled={!next} onClick={() => next && onPick(next.slug)} aria-label={next ? t(next.title) : undefined}>
              <HugeiconsIcon icon={ArrowRight01Icon} />
            </Button>
            <LangToggle className="ml-1" />
          </div>
        </div>
      </HeaderToolbar>

      <Workbench def={def} tab={tab} onPick={onPick} onTab={onTab} />
    </div>
  )
}

function NotFound({ onBack }: { onBack: () => void }) {
  const t = useT()
  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center")}>
      <p className="font-heading text-lg font-semibold">{t(L("Component not found", "Komponen tidak ditemukan"))}</p>
      <Button variant="outline" onClick={onBack}>
        <HugeiconsIcon icon={ArrowLeft01Icon} />
        {t(L("All components", "Semua komponen"))}
      </Button>
    </div>
  )
}
