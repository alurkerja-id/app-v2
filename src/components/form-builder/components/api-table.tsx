/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { Fragment, useEffect, useId, useState, type ReactNode } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Alert02Icon,
  ArrowDown02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp02Icon,
  ArrowUpDownIcon,
  CloudOffIcon,
  FilterIcon,
  InboxIcon,
  Link01Icon,
  Plug01Icon,
  Refresh01Icon,
  SortByDown02Icon,
  SortByUp02Icon,
  Table02Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Label } from "@/components/ui/label"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, RuntimeProps } from "../types"
import {
  CellValue,
  SOURCES,
  TEAM_VAR,
  VARS,
  cellClass,
  check,
  filterRows,
  isNumFmt,
  missingColumns,
  response,
  sortRows,
  srcText,
  urlErr,
  varVal,
  type ApiColumn,
  type ApiTableProps,
  type ApiTableState,
  type Row,
  type Sim,
} from "./api-table-data"
import { ColumnsEditor, RootCheck, SourceField } from "./api-table-editors"

/* API data table ★ — ui_type API_TABLE, value_kind "none". Story: a quarterly OKR check-in
   where the manager reviews the team's key results before answering. Mock endpoints only. */

const PAGE_SIZES = [5, 10, 20]
const pageSizeOf = (p: ApiTableProps) => (PAGE_SIZES.includes(Number(p.pageSize)) ? Number(p.pageSize) : 5)

/** Simulated request time; "slow" shows the skeleton long enough to read it. */
const LOAD_MS = 1100
const SLOW_MS = 4500

const SIMS: [Sim, L10n][] = [
  ["ready", L("Rows", "Ada data")],
  ["empty", L("Empty", "Kosong")],
  ["error", L("Error", "Gagal")],
  ["slow", L("Slow", "Lambat")],
]

const col = (id: string, en: string, idn: string, field: string, format: ApiColumn["format"]): ApiColumn => ({ id, title: L(en, idn), field, format })

/** Value the filter compares against: team_id comes from the simulated task, the rest are fixed. */
const filterValue = (p: ApiTableProps, v: ApiTableState) => (p.filterVar === TEAM_VAR.v ? v.team : varVal(p.filterVar))

const notInResponse = (n: number) => L(`${n} column${n > 1 ? "s" : ""} not in response`, `${n} kolom tidak ada di respons`)

/* ── shared pieces ──────────────────────────────────────────────────────── */

function SourceLine({ p }: { p: ApiTableProps }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <HugeiconsIcon icon={p.mode === "url" ? Link01Icon : Plug01Icon} className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate font-mono">{srcText(p) || "—"}</span>
      {p.filterOn && (
        <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
          <HugeiconsIcon icon={FilterIcon} />
          {p.filterField} = {p.filterVar}
        </Badge>
      )}
    </div>
  )
}

function StateBox({ icon, title, text, bad, children }: { icon: IconSvgElement; title?: L10n; text: L10n; bad?: boolean; children?: ReactNode }) {
  const t = useT()
  return (
    <Empty className="gap-3 p-8">
      <EmptyHeader className="gap-1.5">
        <EmptyMedia variant="icon" className={cn(bad && "bg-destructive/10 text-destructive")}>
          <HugeiconsIcon icon={icon} />
        </EmptyMedia>
        {title && <EmptyTitle className="text-sm">{t(title)}</EmptyTitle>}
        <EmptyDescription className="text-xs">{t(text)}</EmptyDescription>
      </EmptyHeader>
      {children}
    </Empty>
  )
}

type SortState = ApiTableState["sort"]

function HeadRow({ p, sort, onSort, disabled }: { p: ApiTableProps; sort?: SortState; onSort?: (id: string) => void; disabled?: boolean }) {
  const t = useT()
  return (
    <TableRow className="hover:bg-transparent">
      {p.columns.map((k) => {
        const dir = sort && sort.id === k.id ? sort.dir : null
        return (
          <TableHead
            key={k.id}
            aria-sort={dir ? (dir === "asc" ? "ascending" : "descending") : undefined}
            className={cn("h-9 px-3 text-xs font-medium text-muted-foreground", isNumFmt(k.format) && "text-right")}
          >
            {onSort ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSort(k.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none",
                  dir && "text-foreground",
                  isNumFmt(k.format) && "flex-row-reverse",
                )}
              >
                {t(k.title)}
                <HugeiconsIcon icon={dir === "asc" ? ArrowUp02Icon : dir === "desc" ? ArrowDown02Icon : ArrowUpDownIcon} className={cn("size-3.5", !dir && "opacity-50")} />
              </button>
            ) : (
              t(k.title)
            )}
          </TableHead>
        )
      })}
    </TableRow>
  )
}

function BodyRows({ p, rows, keyBase = 0 }: { p: ApiTableProps; rows: Row[]; keyBase?: number }) {
  return (
    <>
      {rows.map((r, i) => (
        <TableRow key={keyBase + i} className="hover:bg-muted/30">
          {p.columns.map((k) => (
            <TableCell key={k.id} className={cn("px-3 py-2.5 text-sm", cellClass(k.format))}>
              <CellValue col={k} row={r} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

/** Phone layout: one block per row — first column as the heading, the rest as label / value pairs. */
function StackedRows({ p, rows, keyBase, labelledBy }: { p: ApiTableProps; rows: Row[]; keyBase: number; labelledBy: string }) {
  const t = useT()
  const [head, ...rest] = p.columns
  return (
    <ul className="divide-y divide-border" aria-labelledby={labelledBy}>
      {rows.map((r, i) => (
        <li key={keyBase + i} className="flex flex-col gap-2 px-4 py-3">
          {head && (
            <div className="text-sm font-medium text-foreground">
              <span className="sr-only">{t(head.title)}: </span>
              <CellValue col={head} row={r} />
            </div>
          )}
          {rest.length > 0 && (
            <dl className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 text-sm">
              {rest.map((k) => (
                <Fragment key={k.id}>
                  <dt className="text-xs text-muted-foreground">{t(k.title)}</dt>
                  <dd className={cn("min-w-0", isNumFmt(k.format) && "tabular-nums")}>
                    <CellValue col={k} row={r} />
                  </dd>
                </Fragment>
              ))}
            </dl>
          )}
        </li>
      ))}
    </ul>
  )
}

const SKEL_W = [80, 60, 70, 50, 65]

function SkeletonRows({ p, n, compact }: { p: ApiTableProps; n: number; compact: boolean }) {
  if (compact) {
    return (
      <ul className="divide-y divide-border" aria-hidden>
        {Array.from({ length: n }, (_, i) => (
          <li key={i} className="flex flex-col gap-2.5 px-4 py-3.5">
            <Skeleton className="h-3.5 rounded-full" style={{ width: `${SKEL_W[i % 5]}%` }} />
            <Skeleton className="h-3 rounded-full" style={{ width: `${SKEL_W[(i + 2) % 5] - 15}%` }} />
            <Skeleton className="h-3 rounded-full" style={{ width: `${SKEL_W[(i + 3) % 5] - 20}%` }} />
          </li>
        ))}
      </ul>
    )
  }
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          {p.columns.map((k, j) => (
            <TableCell key={k.id} className="px-3 py-3.5">
              <Skeleton className="h-3 rounded-full" style={{ width: `${SKEL_W[(i + j) % 5]}%` }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function Footer({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">{children}</div>
}

function Pager({
  page,
  pages,
  from,
  count,
  total,
  onPage,
  disabled,
}: {
  page: number
  pages: number
  from: number
  count: number
  total: number
  onPage: (page: number) => void
  disabled: boolean
}) {
  const t = useT()
  return (
    <Footer>
      <span aria-live="polite">
        {t(L(`Showing ${from + 1}–${from + count} of ${total}`, `Menampilkan ${from + 1}–${from + count} dari ${total}`))}
      </span>
      <Pagination aria-label={t(L("Pages", "Halaman"))} className="mx-0 w-auto">
        <PaginationContent className="gap-0.5">
          <PaginationItem>
            <Button variant="ghost" size="icon-sm" aria-label={t(L("Previous page", "Halaman sebelumnya"))} disabled={disabled || page <= 1} onClick={() => onPage(page - 1)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} />
            </Button>
          </PaginationItem>
          {Array.from({ length: pages }, (_, k) => k + 1).map((i) => (
            <PaginationItem key={i}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-current={i === page ? "page" : undefined}
                aria-label={t(L(`Page ${i}`, `Halaman ${i}`))}
                disabled={disabled}
                onClick={() => onPage(i)}
                className={cn("text-xs tabular-nums", i === page && "bg-primary/10 font-semibold text-primary hover:bg-primary/15 hover:text-primary")}
              >
                {i}
              </Button>
            </PaginationItem>
          ))}
          <PaginationItem>
            <Button variant="ghost" size="icon-sm" aria-label={t(L("Next page", "Halaman berikutnya"))} disabled={disabled || page >= pages} onClick={() => onPage(page + 1)}>
              <HugeiconsIcon icon={ArrowRight01Icon} />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </Footer>
  )
}

/** Phone layout has no header row, so sorting moves to a picker above the rows. */
function SortBar({ p, sort, onSort, disabled, id }: { p: ApiTableProps; sort: SortState; onSort: (next: SortState) => void; disabled: boolean; id: string }) {
  const t = useT()
  const dir = sort?.dir ?? "asc"
  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
      <Label htmlFor={`${id}-sort`} className="shrink-0 text-xs text-muted-foreground">
        {t(L("Sort by", "Urutkan"))}
      </Label>
      <Select value={sort?.id ?? "_none"} onValueChange={(x) => onSort(x === "_none" ? null : { id: x, dir })} disabled={disabled}>
        <SelectTrigger id={`${id}-sort`} size="sm" className="min-w-0 flex-1 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">{t(L("Original order", "Urutan asli"))}</SelectItem>
          {p.columns.map((k) => (
            <SelectItem key={k.id} value={k.id}>
              {t(k.title)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={disabled || !sort}
        aria-label={t(dir === "asc" ? L("Ascending — switch to descending", "Naik — ubah ke turun") : L("Descending — switch to ascending", "Turun — ubah ke naik"))}
        onClick={() => sort && onSort({ id: sort.id, dir: dir === "asc" ? "desc" : "asc" })}
      >
        <HugeiconsIcon icon={dir === "desc" ? SortByDown02Icon : SortByUp02Icon} />
      </Button>
    </div>
  )
}

/* ── builder canvas ─────────────────────────────────────────────────────── */

function ApiTableCanvas({ props: p }: { props: ApiTableProps }) {
  const t = useT()
  const c = check(p)
  const ps = pageSizeOf(p)

  if (!c.ok) {
    return (
      <div className="flex min-w-0 flex-col gap-2.5">
        <SourceLine p={p} />
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <StateBox
            bad
            icon={Alert02Icon}
            title={c.kind === "url" ? L("The URL is not valid", "URL tidak valid") : L(`No list at “${p.rootPath}”`, `Tidak ada daftar di “${p.rootPath}”`)}
            text={L("Fix the data source in Edit Element to see sample rows.", "Perbaiki sumber data di Edit Element untuk melihat baris contoh.")}
          />
        </div>
      </div>
    )
  }

  const rows = filterRows(p, c.rows, varVal(p.filterVar))
  const shown = rows.slice(0, Math.min(ps, 3))
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <SourceLine p={p} />
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <HeadRow p={p} />
          </TableHeader>
          <TableBody>
            {shown.length ? (
              <BodyRows p={p} rows={shown} />
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={p.columns.length} className="p-0 whitespace-normal">
                  <StateBox icon={InboxIcon} text={p.emptyText} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Footer>
          <span>{t(L(`Sample data · ${rows.length} rows`, `Data contoh · ${rows.length} baris`))}</span>
          <span>{t(L(`${ps} per page`, `${ps} per halaman`))}</span>
        </Footer>
      </div>
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

type Phase = "loading" | "error" | "empty" | "rows"

function ApiTableRuntime({ props: p, value: v, onChange, state, compact, id }: RuntimeProps<ApiTableProps, ApiTableState>) {
  const t = useT()
  const labelId = `${id}-label`

  /* Every change to the request (source, filter value, simulated answer, Reload) refetches. */
  const reqKey = JSON.stringify([srcText(p), p.rootPath, p.filterOn, p.filterVar, p.filterField, v.sim, v.team, v.load])
  const delay = v.sim === "slow" ? SLOW_MS : LOAD_MS
  const [doneKey, setDoneKey] = useState<string | null>(null)
  useEffect(() => {
    const timer = window.setTimeout(() => setDoneKey(reqKey), delay)
    return () => window.clearTimeout(timer)
  }, [reqKey, delay])

  const c = check(p)
  const fv = filterValue(p, v)
  const sortCol = v.sort ? p.columns.find((k) => k.id === v.sort?.id) : undefined
  const rows = c.ok ? sortRows(filterRows(p, c.rows, fv), sortCol, v.sort?.dir ?? "asc") : null
  const phase: Phase = doneKey !== reqKey ? "loading" : v.sim === "error" || !rows ? "error" : v.sim === "empty" || !rows.length ? "empty" : "rows"

  const ps = pageSizeOf(p)
  const total = rows?.length ?? 0
  const pages = Math.max(1, Math.ceil(total / ps))
  const page = Math.min(Math.max(1, v.page), pages)
  const from = (page - 1) * ps
  const view = rows ? rows.slice(from, from + ps) : []
  const off = state === "disabled"

  const toggleSort = (colId: string) => {
    const s = v.sort
    const next: SortState = s && s.id === colId ? (s.dir === "asc" ? { id: colId, dir: "desc" } : null) : { id: colId, dir: "asc" }
    onChange({ ...v, sort: next, page: 1 })
  }

  let box: ReactNode
  if (phase === "loading") {
    const n = Math.min(ps, 5)
    box = (
      <>
        {compact ? (
          <SkeletonRows p={p} n={n} compact />
        ) : (
          <Table aria-labelledby={labelId}>
            <TableHeader className="bg-muted/50">
              <HeadRow p={p} sort={v.sort} onSort={toggleSort} disabled />
            </TableHeader>
            <TableBody>
              <SkeletonRows p={p} n={n} compact={false} />
            </TableBody>
          </Table>
        )}
        <Footer>
          <span>{t(L("Loading…", "Memuat…"))}</span>
          <Spinner aria-hidden className="size-3.5" />
        </Footer>
      </>
    )
  } else if (phase === "error") {
    const name = (p.label.id || p.label.en).toLowerCase()
    box = (
      <div role="alert">
        <StateBox
          bad
          icon={CloudOffIcon}
          title={L(`Couldn’t load ${p.label.en.toLowerCase()}`, `Gagal memuat ${name}`)}
          text={L("The service didn’t respond within 10 seconds. Your other answers are kept.", "Layanan tidak merespons dalam 10 detik. Isian Anda yang lain tetap tersimpan.")}
        >
          <Button variant="outline" size="sm" disabled={off} onClick={() => onChange({ ...v, sim: "ready", load: v.load + 1 })}>
            <HugeiconsIcon icon={Refresh01Icon} />
            {t(L("Retry", "Coba lagi"))}
          </Button>
        </StateBox>
      </div>
    )
  } else if (phase === "empty") {
    box = <StateBox icon={InboxIcon} title={L("Nothing to show", "Belum ada data")} text={p.emptyText} />
  } else {
    box = (
      <>
        {compact ? (
          <>
            <SortBar p={p} sort={v.sort} onSort={(sort) => onChange({ ...v, sort, page: 1 })} disabled={off} id={id} />
            <StackedRows p={p} rows={view} keyBase={from} labelledBy={labelId} />
          </>
        ) : (
          <Table aria-labelledby={labelId}>
            <TableHeader className="bg-muted/50">
              <HeadRow p={p} sort={v.sort} onSort={toggleSort} disabled={off} />
            </TableHeader>
            <TableBody>
              <BodyRows p={p} rows={view} keyBase={from} />
            </TableBody>
          </Table>
        )}
        <Pager page={page} pages={pages} from={from} count={view.length} total={total} onPage={(n) => onChange({ ...v, page: n })} disabled={off} />
      </>
    )
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", off && "opacity-60")} aria-disabled={off || undefined}>
      {p.filterOn && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={FilterIcon} className="size-3.5" />
          {t(p.filterVar === TEAM_VAR.v ? L("Filtered by your team", "Difilter sesuai tim Anda") : L(`Filtered by ${p.filterVar}`, `Difilter sesuai ${p.filterVar}`))}
          <span aria-hidden>·</span>
          <b className="font-mono font-medium text-foreground">{fv ?? "—"}</b>
        </p>
      )}
      <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-busy={phase === "loading" || undefined}>
        {box}
      </div>
    </div>
  )
}

/* ── simulation controls (beside the runtime form) ──────────────────────── */

function ApiTableControls({ props: p, value: v, onChange }: { props: ApiTableProps; value: ApiTableState; onChange: (next: ApiTableState) => void }) {
  const t = useT()
  const id = useId()
  const refetch = (patch: Partial<ApiTableState>) => onChange({ ...v, ...patch, page: 1, load: v.load + 1 })
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span id={`${id}-resp`} className="text-xs text-muted-foreground">
          {t(L("Response", "Respons"))}
        </span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={v.sim}
          aria-labelledby={`${id}-resp`}
          onValueChange={(x) => {
            const sim = SIMS.find(([k]) => k === x)?.[0]
            if (sim) refetch({ sim })
          }}
          className="flex-wrap"
        >
          {SIMS.map(([k, label]) => (
            <ToggleGroupItem key={k} value={k} className="px-3 text-xs">
              {t(label)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => onChange({ ...v, load: v.load + 1 })}>
          <HugeiconsIcon icon={Refresh01Icon} />
          {t(L("Reload", "Muat ulang"))}
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">{t(L("Process variables", "Variabel proses"))}</p>
          <p className="text-xs text-muted-foreground">
            {t(
              p.filterOn
                ? L(`Values this task already has. The table filter reads ${p.filterVar}.`, `Nilai yang sudah dimiliki task ini. Filter tabel membaca ${p.filterVar}.`)
                : L("Values this task already has. The table filter is off.", "Nilai yang sudah dimiliki task ini. Filter tabel nonaktif."),
            )}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-team`} className="font-mono text-xs">
            {TEAM_VAR.v}
          </Label>
          <Select value={v.team} onValueChange={(team) => refetch({ team })}>
            <SelectTrigger id={`${id}-team`} size="sm" className="w-full font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(TEAM_VAR.choices ?? [TEAM_VAR.value]).map((x) => (
                <SelectItem key={x} value={x} className="font-mono text-xs">
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t(L("Change it to see the table refetch and filter.", "Ubah untuk melihat tabel memuat ulang dan memfilter."))}</p>
        </div>
        <dl className="flex flex-col gap-1 font-mono text-xs">
          {VARS.slice(1).map((x) => (
            <div key={x.v} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{x.v}</dt>
              <dd className="text-foreground">{x.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

const initial = (): ApiTableState => ({ sim: "ready", team: TEAM_VAR.value, page: 1, sort: null, load: 0 })

export const apiTable: ComponentDef<ApiTableProps, ApiTableState> = {
  slug: "api-table",
  wave: 1,
  ui: "API_TABLE",
  vk: "none",
  star: true,
  group: "data",
  week: 2,
  icon: Table02Icon,
  label: L("API data table", "Tabel data API"),
  title: L("API data table", "Tabel data API"),
  blurb: L("Read-only table filled from an endpoint, with column formats and paging.", "Tabel baca-saja yang diisi dari endpoint, dengan format kolom dan paginasi."),

  defaults: () => ({
    label: L("Key results this quarter", "Key result kuartal ini"),
    name: "key_results",
    mode: "connection",
    source: "okr",
    url: "https://okr.perusahaan.co.id/api/v1/key-results",
    rootPath: "data.items",
    columns: [
      col("k1", "Key result", "Key result", "title", "text"),
      col("k2", "Owner", "Penanggung jawab", "owner.name", "text"),
      col("k3", "Progress", "Progres", "progress", "progress"),
      col("k4", "Status", "Status", "status", "status"),
      col("k5", "Due", "Tenggat", "due_date", "date"),
    ],
    pageSize: 5,
    emptyText: L("No key results for your team this quarter.", "Belum ada key result untuk tim Anda kuartal ini."),
    filterOn: true,
    filterVar: "team_id",
    filterField: "team.id",
  }),
  schema: (p) => {
    const c = check(p)
    const fields = c.ok ? c.fields : []
    const filterFields = fields.includes(p.filterField) || !p.filterField ? fields : [p.filterField, ...fields]
    return [
      {
        tab: "general",
        fields: [
          F.name(),
          F.key(
            L(
              "Identifies the node. The table sends no value, so nothing is saved under this key.",
              "Identitas node. Tabel tidak mengirim nilai, jadi tidak ada yang tersimpan di key ini.",
            ),
          ),
        ],
      },
      {
        tab: "general",
        title: L("Data source", "Sumber data"),
        fields: [
          {
            t: "seg",
            k: "mode",
            label: L("Get rows from", "Ambil baris dari"),
            options: [
              { v: "connection", label: L("Connection", "Koneksi") },
              { v: "url", label: L("URL", "URL") },
            ],
          },
          { t: "custom", id: "source", when: (o) => o.mode === "connection", render: ({ props, set }) => <SourceField p={props} set={set} /> },
          {
            t: "url",
            k: "url",
            label: L("Endpoint URL", "URL endpoint"),
            placeholder: "https://api.example.co.id/items",
            when: (o) => o.mode === "url",
            validate: (v) => urlErr(v),
            hint: L("Prototype: any valid URL returns the key results sample.", "Prototipe: URL valid apa pun mengembalikan contoh key result."),
          },
          {
            t: "text",
            k: "rootPath",
            label: L("Root path", "Root path"),
            mono: true,
            hint: L("Where the list of rows sits in the response.", "Letak daftar baris di dalam respons."),
            validate: (v) => (!v ? L("Root path is required", "Root path wajib diisi") : null),
          },
          { t: "custom", id: "root-check", render: ({ props, set }) => <RootCheck p={props} set={set} /> },
        ],
      },
      {
        tab: "general",
        title: L("Columns", "Kolom"),
        fields: [
          {
            t: "custom",
            id: "columns",
            render: ({ props, set }) => <ColumnsEditor p={props} set={set} />,
            validate: (_, o) => {
              const n = missingColumns(o).length
              return n ? notInResponse(n) : null
            },
          },
        ],
      },
      {
        tab: "general",
        title: L("Display", "Tampilan"),
        fields: [
          { t: "seg", k: "pageSize", label: L("Rows per page", "Baris per halaman"), options: PAGE_SIZES.map((n) => ({ v: n, label: L(String(n)) })) },
          { t: "i18n", k: "emptyText", label: L("Empty-state text", "Teks saat kosong"), multi: true, rows: 2 },
        ],
      },
      {
        tab: "logic",
        title: L("Filter", "Filter"),
        fields: [
          {
            t: "switch",
            k: "filterOn",
            label: L("Filter by process variable", "Filter dengan variabel proses"),
            hint: L("Optional. Shows only rows that match a value from this task.", "Opsional. Hanya menampilkan baris yang cocok dengan nilai dari task ini."),
          },
          {
            t: "select",
            k: "filterVar",
            label: L("Process variable", "Variabel proses"),
            when: (o) => o.filterOn,
            options: VARS.map((x) => ({ v: x.v, label: L(`${x.v} = “${x.value}”`) })),
          },
          {
            t: "select",
            k: "filterField",
            label: L("Matches field", "Cocok dengan field"),
            when: (o) => o.filterOn,
            options: filterFields.map((f) => ({ v: f, label: fields.includes(f) ? L(f) : L(`${f} (not in response)`, `${f} (tidak ada di respons)`) })),
            validate: (v, o) => {
              const cc = check(o)
              return cc.ok && !cc.fields.includes(String(v ?? "")) ? L("This field is not in the response", "Field ini tidak ada di respons") : null
            },
          },
        ],
      },
      {
        tab: "validation",
        fields: [
          {
            t: "note",
            text: L(
              "Nothing to validate: the table is read-only, so it has no **Required**. A failed request never blocks Submit.",
              "Tidak ada validasi: tabel baca-saja, jadi tidak punya **Wajib diisi**. Request yang gagal tidak pernah menghalangi Submit.",
            ),
          },
        ],
      },
    ]
  },
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  Canvas: ApiTableCanvas,
  canvasWarn: (p) => {
    const c = check(p)
    if (!c.ok) return L("Data source needs attention", "Sumber data perlu diperbaiki")
    const n = missingColumns(p, c).length
    if (n) return notInResponse(n)
    if (p.filterOn && !c.fields.includes(p.filterField)) return L("Filter field not in response", "Field filter tidak ada di respons")
    return null
  },

  Runtime: ApiTableRuntime,
  Controls: ApiTableControls,
  devices: true,
  initial,
  sample: initial,
  /* A failed or empty request must not block Submit for the other fields. */
  validate: () => [],
  value: () => null,

  spec: (p) => ({
    ui_type: "API_TABLE",
    value_kind: "none",
    name: p.name,
    label: p.label,
    config: {
      data_source:
        p.mode === "url"
          ? { type: "url", method: "GET", url: p.url }
          : { type: "connection", connection: SOURCES[p.source].host, method: "GET", path: SOURCES[p.source].path },
      root_path: p.rootPath,
      columns: p.columns.map((k) => ({ title: k.title, field: k.field, format: k.format })),
      page_size: Number(p.pageSize),
      empty_text: p.emptyText,
      filter: p.filterOn ? { variable: p.filterVar, field: p.filterField, operator: "equals" } : null,
    },
  }),
  savedAs: () => L("Nothing. The table only reads; it calls the endpoint each time the form opens.", "Tidak ada. Tabel hanya membaca; endpoint dipanggil setiap form dibuka."),
  notes: [
    L(
      "Read-only with `value_kind: \"none\"`, so submit, draft, history and bulk complete skip it.",
      "Baca-saja dengan `value_kind: \"none\"`, jadi submit, draft, history, dan bulk complete melewatinya.",
    ),
    L(
      "Replaces the second most common MFE patch: 12 uses of “table from API” (shaping §1).",
      "Menggantikan tambalan MFE terbanyak kedua: 12 pemakaian “tabel dari API” (shaping §1).",
    ),
    L(
      "Every property is typed in metadata. Today Remote Select leaks `data_url` and `root_data` as raw textboxes (`EditDefaultInput.tsx:13-35`); this panel must not.",
      "Setiap properti punya tipe di metadata. Hari ini Remote Select membocorkan `data_url` dan `root_data` sebagai textbox mentah (`EditDefaultInput.tsx:13-35`); panel ini tidak boleh.",
    ),
    L(
      "Loading, empty and error states belong to the component. A failed request must not block Submit for the other fields.",
      "State loading, kosong, dan gagal milik komponen. Request yang gagal tidak boleh menghalangi Submit field lain.",
    ),
    L(
      "The filter value is read from the process variable when the form renders and sent as a query parameter.",
      "Nilai filter dibaca dari variabel proses saat form dirender dan dikirim sebagai query parameter.",
    ),
  ],
  dataExtra: (p) => {
    const resp = response(p)
    const req = p.mode === "url" ? `GET ${p.url}` : srcText(p)
    return [
      {
        title: L("Sample response", "Contoh respons"),
        sub: resp
          ? L(`${req} · mock response the canvas and runtime read`, `${req} · respons tiruan yang dibaca kanvas dan runtime`)
          : L("The URL is not valid — nothing is called", "URL tidak valid — tidak ada yang dipanggil"),
        json: resp,
      },
    ]
  },
  story: {
    process: L("Quarterly OKR review", "Review OKR kuartalan"),
    step: L("Manager check-in", "Check-in atasan"),
    ref: "OKR-2026-Q4",
    due: "2026-10-16",
    task: L("Q4 key result check-in", "Check-in key result Q4"),
    after: [
      {
        name: "confidence",
        label: L("Your confidence for this quarter", "Keyakinan Anda untuk kuartal ini"),
        type: "select",
        required: true,
        value: "",
        options: [
          { v: "high", label: L("High — we’ll hit most key results", "Tinggi — sebagian besar key result tercapai") },
          { v: "medium", label: L("Medium — some need help", "Sedang — beberapa butuh bantuan") },
          { v: "low", label: L("Low — we need to re-plan", "Rendah — perlu rencana ulang") },
        ],
      },
      {
        name: "checkin_note",
        label: L("Check-in note", "Catatan check-in"),
        type: "textarea",
        required: true,
        value: "",
        placeholder: L("What moved since last week? What is blocked?", "Apa yang bergerak sejak minggu lalu? Apa yang terhambat?"),
      },
    ],
  },
}

