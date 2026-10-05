/* eslint-disable react-refresh/only-export-components -- API data table helpers: mock endpoints, response checks, formats and the cell renderer */
import type { IconSvgElement } from "@hugeicons/react"
import {
  Calendar03Icon,
  CheckmarkCircle02Icon,
  DashboardSpeed01Icon,
  HashtagIcon,
  Money03Icon,
  TextFontIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { L, useLang, useT, type L10n, type Lang } from "../i18n"
import { parseISO, rupiah } from "../lib"

/* ── types ──────────────────────────────────────────────────────────────── */

export type Format = "text" | "number" | "currency" | "date" | "status" | "progress"
export type SourceId = "okr" | "hr" | "finance"
export type Mode = "connection" | "url"
export type Row = Record<string, unknown>

export interface ApiColumn {
  id: string
  title: L10n
  /** Path in one response row, e.g. `owner.name`. Picked from the response, never typed. */
  field: string
  format: Format
}

export interface ApiTableProps {
  label: L10n
  name: string
  mode: Mode
  source: SourceId
  url: string
  rootPath: string
  columns: ApiColumn[]
  pageSize: number
  emptyText: L10n
  filterOn: boolean
  filterVar: string
  filterField: string
}

/** Simulated endpoint answer (Controls). "slow" answers with rows after a long wait. */
export type Sim = "ready" | "empty" | "error" | "slow"
export type SortDir = "asc" | "desc"

/** Runtime state only — the table sends nothing (value_kind "none"). */
export interface ApiTableState {
  sim: Sim
  /** Current value of the process variable `team_id`. */
  team: string
  /** 1-based page. */
  page: number
  sort: { id: string; dir: SortDir } | null
  /** Request counter: bump it to refetch (Reload, Retry, variable change). */
  load: number
}

/* ── mock endpoints ─────────────────────────────────────────────────────── */

type KrTuple = [id: string, title: string, objective: string, owner: string, team: string, progress: number, status: string, due: string, budget: number]
const KR_DATA: KrTuple[] = [
  ["KR-401", "Rilis 8 komponen Gelombang 1 di Studio", "Form builder tanpa MFE", "Dimas Pratama", "product", 35, "on_track", "2026-11-19", 45000000],
  ["KR-402", "Pemakaian MFE generik turun di bawah 50", "Form builder tanpa MFE", "Ayu Lestari", "product", 10, "at_risk", "2026-12-31", 12000000],
  ["KR-403", "Label bahasa Indonesia di semua komponen baru", "Form builder tanpa MFE", "Dimas Pratama", "product", 50, "on_track", "2026-11-19", 8000000],
  ["KR-404", "Test vitest untuk setiap komponen baru", "Kualitas rilis terjaga", "Fajar Nugroho", "product", 20, "at_risk", "2026-11-26", 6500000],
  ["KR-405", "Form task terbuka di bawah 1,5 detik (p75)", "Kualitas rilis terjaga", "Ayu Lestari", "product", 60, "on_track", "2026-12-15", 30000000],
  ["KR-406", "Bulk complete menerima nilai daftar", "Form builder tanpa MFE", "Fajar Nugroho", "product", 45, "on_track", "2026-11-12", 15000000],
  ["KR-407", "Halaman user guide untuk 8 komponen", "Pengguna mandiri", "Sari Hidayat", "product", 0, "not_started", "2026-11-30", 5000000],
  ["KR-408", "Error submit form di bawah 0,5%", "Kualitas rilis terjaga", "Dimas Pratama", "product", 100, "done", "2026-10-02", 10000000],
  ["KR-311", "Pengadaan selesai dalam 5 hari kerja", "Operasional lebih cepat", "Budi Santoso", "operations", 55, "on_track", "2026-12-18", 20000000],
  ["KR-312", "Semua laporan perjalanan dinas lewat AlurKerja", "Operasional lebih cepat", "Rina Wulandari", "operations", 70, "on_track", "2026-11-27", 7500000],
  ["KR-313", "Izin cuti disetujui dalam 2 hari kerja", "Operasional lebih cepat", "Budi Santoso", "operations", 80, "on_track", "2026-12-11", 4000000],
  ["KR-314", "Vendor baru terverifikasi dalam 3 hari", "Operasional lebih cepat", "Rina Wulandari", "operations", 25, "off_track", "2026-12-04", 9000000],
  ["KR-221", "Reimbursement dibayar dalam 7 hari", "Keuangan tertib", "Hendra Wijaya", "finance", 40, "at_risk", "2026-12-23", 3000000],
  ["KR-222", "Serapan anggaran pengadaan Q4 mencapai 90%", "Keuangan tertib", "Hendra Wijaya", "finance", 30, "off_track", "2026-12-31", 250000000],
]
const KR: Row[] = KR_DATA.map(([id, title, objective, owner, team, progress, status, due, budget]) => ({
  id,
  title,
  objective,
  owner: { name: owner },
  team: { id: team, name: team[0].toUpperCase() + team.slice(1) },
  progress,
  status,
  due_date: due,
  budget,
}))

type LeaveTuple = [name: string, department: string, quota: number, used: number]
const LEAVE_DATA: LeaveTuple[] = [
  ["Rina Wulandari", "Operations", 12, 3],
  ["Budi Santoso", "Operations", 12, 7],
  ["Dimas Pratama", "Product", 12, 2],
  ["Ayu Lestari", "Product", 12, 5],
  ["Hendra Wijaya", "Finance", 12, 9],
  ["Sari Hidayat", "Product", 12, 4],
]
const LEAVE: Row[] = LEAVE_DATA.map(([name, department, quota, used]) => ({
  employee: { name },
  department,
  annual_quota: quota,
  used,
  remaining: quota - used,
  updated_at: "2026-10-01",
}))

type PoTuple = [po: string, vendor: string, total: number, status: string, orderedAt: string]
const PO_DATA: PoTuple[] = [
  ["PO-2026-0931", "CV Mitra Kantor", 4900000, "approved", "2026-10-01"],
  ["PO-2026-0932", "PT Data Prima", 30000000, "pending", "2026-10-02"],
  ["PO-2026-0933", "CV Sumber Cetak", 1250000, "approved", "2026-10-02"],
  ["PO-2026-0934", "PT Jaringan Andal", 18500000, "rejected", "2026-10-03"],
  ["PO-2026-0935", "CV Mitra Kantor", 2300000, "pending", "2026-10-05"],
  ["PO-2026-0936", "PT Data Prima", 7800000, "approved", "2026-10-05"],
  ["PO-2026-0937", "PT Meubel Nusantara", 12600000, "pending", "2026-10-05"],
]
const PO: Row[] = PO_DATA.map(([po, vendor, total, status, orderedAt]) => ({
  po_number: po,
  vendor: { name: vendor },
  total,
  status,
  ordered_at: orderedAt,
}))

interface Source {
  label: L10n
  host: string
  path: string
  resp: Row
}

/** Registered connections. In Studio these come from the tenant's connection list. */
export const SOURCES: Record<SourceId, Source> = {
  okr: {
    label: L("OKR service · Key results", "Layanan OKR · Key result"),
    host: "okr-api",
    path: "/v1/key-results",
    resp: { data: { items: KR, total: KR.length }, meta: { quarter: "2026-Q4" } },
  },
  hr: {
    label: L("HRIS · Leave balances", "HRIS · Saldo cuti"),
    host: "hr-api",
    path: "/v1/leave-balances",
    resp: { results: LEAVE, count: LEAVE.length },
  },
  finance: {
    label: L("Finance · Purchase orders", "Keuangan · Purchase order"),
    host: "finance-api",
    path: "/v1/purchase-orders",
    resp: { data: PO, page: 1 },
  },
}
export const SOURCE_IDS: SourceId[] = ["okr", "hr", "finance"]
export const isSourceId = (s: string): s is SourceId => (SOURCE_IDS as string[]).includes(s)

/** Process variables this task already has. */
export interface ProcessVar {
  v: string
  value: string
  choices?: string[]
}
export const VARS: ProcessVar[] = [
  { v: "team_id", value: "product", choices: ["product", "operations", "finance"] },
  { v: "quarter", value: "2026-Q4" },
  { v: "requester_id", value: "EMP-0412" },
]
export const TEAM_VAR = VARS[0]
export const varVal = (name: string) => VARS.find((x) => x.v === name)?.value

/* ── formats ────────────────────────────────────────────────────────────── */

export const FORMATS: Record<Format, { icon: IconSvgElement; label: L10n }> = {
  text: { icon: TextFontIcon, label: L("Text", "Teks") },
  number: { icon: HashtagIcon, label: L("Number", "Angka") },
  currency: { icon: Money03Icon, label: L("Currency (Rupiah)", "Mata uang (Rupiah)") },
  date: { icon: Calendar03Icon, label: L("Date", "Tanggal") },
  status: { icon: CheckmarkCircle02Icon, label: L("Status pill", "Pill status") },
  progress: { icon: DashboardSpeed01Icon, label: L("Progress bar (%)", "Bar progres (%)") },
}
export const FORMAT_IDS: Format[] = ["text", "number", "currency", "date", "status", "progress"]
export const isFormat = (s: string): s is Format => (FORMAT_IDS as string[]).includes(s)
export const isNumFmt = (f: Format) => f === "number" || f === "currency"

type Tone = "success" | "warning" | "danger" | "accent" | "muted"
const STATUS: Record<string, [Tone, L10n]> = {
  on_track: ["success", L("On track", "Sesuai target")],
  at_risk: ["warning", L("At risk", "Berisiko")],
  off_track: ["danger", L("Off track", "Tertinggal")],
  done: ["accent", L("Done", "Selesai")],
  not_started: ["muted", L("Not started", "Belum mulai")],
  approved: ["success", L("Approved", "Disetujui")],
  pending: ["warning", L("Pending", "Menunggu")],
  rejected: ["danger", L("Rejected", "Ditolak")],
}
const TONE: Record<Tone, string> = {
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  accent: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
}

export const NOT_IN_RESPONSE = L("not in response", "tidak ada di respons")

/* ── response helpers ───────────────────────────────────────────────────── */

const isObj = (v: unknown): v is Row => v != null && typeof v === "object" && !Array.isArray(v)

/** `get(row, "owner.name")`. An empty path returns the object itself. */
export function get(o: unknown, path: string): unknown {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((a, k) => (a != null && typeof a === "object" ? (a as Row)[k] : undefined), o)
}

export function urlErr(v: unknown): L10n | null {
  try {
    const u = new URL(String(v ?? ""))
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) throw new Error("bad")
    return u.protocol === "http:" ? L("Use https:// — the app blocks plain http requests", "Pakai https:// — app memblokir request http biasa") : null
  } catch {
    return L("Enter a full URL, e.g. https://api.example.co.id/items", "Isi URL lengkap, mis. https://api.example.co.id/items")
  }
}

const sourceOf = (p: ApiTableProps) => SOURCES[p.source] ?? SOURCES.okr

/** The mock response for the current data source; null when the URL can't be called. */
export function response(p: ApiTableProps): Row | null {
  if (p.mode === "url") return urlErr(p.url) ? null : SOURCES.okr.resp
  return sourceOf(p).resp
}

/** Every path in a response that holds a list (max 3 levels deep). */
export function arrayPaths(o: unknown, base = "", depth = 0, out: string[] = []): string[] {
  if (depth > 3 || o == null || typeof o !== "object") return out
  if (Array.isArray(o)) {
    out.push(base)
    return out
  }
  for (const k of Object.keys(o)) arrayPaths((o as Row)[k], base ? `${base}.${k}` : k, depth + 1, out)
  return out
}

/** Pickable fields of one row; nested objects one level deep (`owner.name`). */
export function fieldPaths(item: unknown): string[] {
  if (!isObj(item)) return []
  const out: string[] = []
  for (const k of Object.keys(item)) {
    const v = item[k]
    if (isObj(v)) for (const k2 of Object.keys(v)) out.push(`${k}.${k2}`)
    else out.push(k)
  }
  return out
}

export type Check =
  | { ok: true; rows: Row[]; fields: string[] }
  | { ok: false; kind: "url" }
  | { ok: false; kind: "root"; lists: string[] }

/** Live check of the data source + root path against the (mock) response. */
export function check(p: ApiTableProps): Check {
  const resp = response(p)
  if (!resp) return { ok: false, kind: "url" }
  const rows = get(resp, p.rootPath)
  if (!Array.isArray(rows)) return { ok: false, kind: "root", lists: arrayPaths(resp) }
  const list = rows.filter(isObj)
  return { ok: true, rows: list, fields: fieldPaths(list[0]) }
}

/** "GET okr-api/v1/key-results" or the endpoint URL. */
export const srcText = (p: ApiTableProps) => (p.mode === "url" ? p.url || "" : `GET ${sourceOf(p).host}${sourceOf(p).path}`)

/** Columns whose field is not in the response (only when the response can be read). */
export function missingColumns(p: ApiTableProps, c: Check = check(p)): ApiColumn[] {
  return c.ok ? p.columns.filter((k) => !c.fields.includes(k.field)) : []
}

export function filterRows(p: ApiTableProps, rows: Row[], val: string | undefined): Row[] {
  if (!p.filterOn) return rows
  return rows.filter((r) => String(get(r, p.filterField)) === String(val))
}

export function sortRows(rows: Row[], col: ApiColumn | undefined, dir: SortDir): Row[] {
  if (!col) return rows
  return rows.slice().sort((a, b) => {
    const x = get(a, col.field)
    const y = get(b, col.field)
    const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "id")
    return dir === "asc" ? r : -r
  })
}

export const guessFormat = (f: string, v: unknown): Format =>
  /date|_at$/.test(f)
    ? "date"
    : f === "status"
      ? "status"
      : f === "progress"
        ? "progress"
        : /total|budget|price|amount/.test(f)
          ? "currency"
          : typeof v === "number"
            ? "number"
            : "text"

/** "owner.name" → "Owner name". */
export const humanize = (f: string) => {
  const s = f.split(".").join(" ").replace(/_/g, " ")
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/* ── cells ──────────────────────────────────────────────────────────────── */

const locale = (lang: Lang) => (lang === "id" ? "id-ID" : "en-GB")

export function fmtDate(iso: string, lang: Lang): string {
  const d = parseISO(iso.slice(0, 10))
  return d ? new Intl.DateTimeFormat(locale(lang), { day: "numeric", month: "short", year: "numeric" }).format(d) : ""
}

/** Alignment / wrapping for a column's <th> and <td>. */
export const cellClass = (f: Format) =>
  isNumFmt(f) ? "text-right tabular-nums" : f === "date" ? "tabular-nums" : f === "text" ? "min-w-40 whitespace-normal" : undefined

/** One formatted value. A field missing from the row says so instead of showing an empty cell. */
export function CellValue({ col, row }: { col: ApiColumn; row: Row }) {
  const t = useT()
  const { lang } = useLang()
  const v = get(row, col.field)
  if (v === undefined) return <span className="text-xs text-destructive">{t(NOT_IN_RESPONSE)}</span>
  const n = Number(v)
  switch (col.format) {
    case "number":
      return <>{v === null || v === "" || Number.isNaN(n) ? String(v) : new Intl.NumberFormat(locale(lang)).format(n)}</>
    case "currency":
      return <>{v === null || v === "" || Number.isNaN(n) ? String(v) : rupiah(n)}</>
    case "date":
      return <>{fmtDate(String(v), lang) || String(v)}</>
    case "status": {
      const s = STATUS[String(v)]
      return (
        <Badge variant="secondary" className={cn("text-xs", TONE[s ? s[0] : "muted"])}>
          {s ? t(s[1]) : String(v).replace(/_/g, " ")}
        </Badge>
      )
    }
    case "progress": {
      const pct = Math.max(0, Math.min(100, Number(v) || 0))
      return (
        <div className="flex min-w-32 items-center gap-2" role="img" aria-label={`${pct}%`}>
          <Progress
            value={pct}
            aria-hidden
            className={cn("h-1.5 flex-1", pct >= 100 && "*:data-[slot=progress-indicator]:bg-emerald-500")}
          />
          <span className="min-w-9 text-right text-xs font-semibold text-foreground tabular-nums">{pct}%</span>
        </div>
      )
    }
    default:
      return <>{String(v)}</>
  }
}
