/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useId, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Clock01Icon, ViewOffIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { L, useT, type L10n } from "../i18n"
import { F, TODAY } from "../lib"
import type { ComponentDef, RuntimeProps } from "../types"

/* Hidden field — ui_type HIDDEN, value_kind = the chosen value type. Story: an IT asset request
   that quietly carries the requester's cost center. The real form renders nothing; the prototype
   draws a dashed developer strip so the computed value can be seen. */

type HiddenType = "string" | "number" | "boolean" | "json"
type HiddenSource = "fixed" | "variable" | "user" | "today" | "url"
type UserAttr = "id" | "email" | "department" | "position" | "cost_center"
type ReadOn = "open" | "submit"

interface HiddenProps {
  /** Builder only — never shown to the user. */
  label: L10n
  name: string
  valueType: HiddenType
  source: HiddenSource
  /** Raw text of the fixed value, checked against `valueType`. */
  fixed: string
  variable: string
  userAttr: UserAttr
  urlParam: string
  readOn: ReadOn
}

type UserId = "dewi" | "budi"

/** Prototype context the value is read from (who is logged in, the link, process variables). */
interface HiddenValue {
  user: UserId
  /** Value of the URL parameter; "" = not in the link. */
  param: string
  /** Process variables, as raw text. */
  vars: Record<string, string>
}

/* ── mock context ───────────────────────────────────────────────────────── */

const USERS: Record<UserId, { name: string; attrs: Record<UserAttr, string> }> = {
  dewi: {
    name: "Dewi Kartika",
    attrs: { id: "u_1042", email: "dewi.kartika@perusahaan.co.id", department: "Finance", position: "Finance Analyst", cost_center: "CC-410" },
  },
  budi: {
    name: "Budi Santoso",
    attrs: { id: "u_0877", email: "budi.santoso@perusahaan.co.id", department: "IT", position: "IT Support Lead", cost_center: "CC-220" },
  },
}
const USER_IDS = Object.keys(USERS) as UserId[]

const ATTRS: Record<UserAttr, L10n> = {
  id: L("User ID", "ID user"),
  email: L("Email", "Email"),
  department: L("Department", "Departemen"),
  position: L("Position", "Jabatan"),
  cost_center: L("Cost center (of the department)", "Pusat biaya (dari departemen)"),
}
const ATTR_KEYS = Object.keys(ATTRS) as UserAttr[]

const VARS: Record<string, string> = { department_id: "41", cost_center: "CC-410", ticket_priority: "high" }
const VAR_KEYS = Object.keys(VARS)

const TYPES: { v: HiddenType; label: L10n }[] = [
  { v: "string", label: L("Text", "Teks") },
  { v: "number", label: L("Number", "Angka") },
  { v: "boolean", label: L("True / false", "Benar / salah") },
  { v: "json", label: L("JSON") },
]

const SOURCES: { v: HiddenSource; label: L10n }[] = [
  { v: "fixed", label: L("Fixed value", "Nilai tetap") },
  { v: "variable", label: L("Process variable", "Variabel proses") },
  { v: "user", label: L("Current user", "User saat ini") },
  { v: "today", label: L("Today's date", "Tanggal hari ini") },
  { v: "url", label: L("URL parameter", "Parameter URL") },
]

const PLACEHOLDER: Record<HiddenType, L10n> = {
  string: L("e.g. web-form", "mis. web-form"),
  number: L("e.g. 410", "mis. 410"),
  boolean: L("true or false", "true atau false"),
  json: L('e.g. {"tier": "gold"}', 'mis. {"tier": "gold"}'),
}

const URL_WARN = L(
  "Users can change URL parameters. Never trust them for prices, approvals or access.",
  "User bisa mengubah parameter URL. Jangan pernah memercayainya untuk harga, persetujuan, atau akses.",
)

/* ── value: raw text from the source, then converted to the value type ─── */

type Typed = string | number | boolean | Record<string, unknown> | null

const NUM_RE = /^-?\d+(\.\d+)?$/

const isObject = (x: unknown): x is Record<string, unknown> => x != null && typeof x === "object" && !Array.isArray(x)

function parseJson(s: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(s) as unknown }
  } catch {
    return { ok: false }
  }
}

/** Converts like the server will: what can't be read becomes `null` (boolean: `false`), with the reason. */
function convert(type: HiddenType, raw: string): { value: Typed; problem: L10n | null } {
  const s = raw.trim()
  if (type === "string") return { value: raw, problem: null }
  if (type === "number") {
    if (!s) return { value: null, problem: null }
    return NUM_RE.test(s)
      ? { value: Number(s), problem: null }
      : { value: null, problem: L(`“${raw}” is not a number — sent as null`, `“${raw}” bukan angka — dikirim sebagai null`) }
  }
  if (type === "boolean") {
    const b = s.toLowerCase()
    if (b === "true") return { value: true, problem: null }
    if (b === "false" || !b) return { value: false, problem: null }
    return { value: false, problem: L(`“${raw}” is not true or false — sent as false`, `“${raw}” bukan true atau false — dikirim sebagai false`) }
  }
  if (!s) return { value: null, problem: null }
  const j = parseJson(s)
  if (j.ok && isObject(j.value)) return { value: j.value, problem: null }
  return { value: null, problem: L("Not a JSON object — sent as null", "Bukan objek JSON — dikirim sebagai null") }
}

/** Edit Element check for the fixed value. */
function fixedErr(type: HiddenType, raw: string): L10n | null {
  const s = raw.trim()
  if (!s) return L("Enter the fixed value", "Isi nilai tetap")
  if (type === "number" && !NUM_RE.test(s)) return L("Enter a number, e.g. 410 or 12.5 (a dot for decimals)", "Isi angka, mis. 410 atau 12.5 (titik untuk desimal)")
  if (type === "boolean" && !["true", "false"].includes(s.toLowerCase())) return L("Enter true or false", "Isi true atau false")
  if (type === "json") {
    const j = parseJson(s)
    if (!j.ok) return L('Not valid JSON — check the quotes and commas, e.g. {"tier": "gold"}', 'JSON tidak valid — cek tanda kutip dan koma, mis. {"tier": "gold"}')
    if (!isObject(j.value)) return L('Enter a JSON object in { }, e.g. {"tier": "gold"}', 'Isi objek JSON di dalam { }, mis. {"tier": "gold"}')
  }
  return null
}

function rawOf(p: HiddenProps, v: HiddenValue): string {
  switch (p.source) {
    case "fixed":
      return p.fixed
    case "variable":
      return v.vars[p.variable] ?? ""
    case "user":
      return USERS[v.user].attrs[p.userAttr]
    case "today":
      return TODAY
    case "url":
      return v.param
  }
}

const valueOf = (p: HiddenProps, v: HiddenValue) => convert(p.valueType, rawOf(p, v))

function sourceText(p: HiddenProps, v?: HiddenValue): L10n {
  switch (p.source) {
    case "fixed":
      return L("Fixed value", "Nilai tetap")
    case "variable":
      return L(`Variable ${p.variable}`, `Variabel ${p.variable}`)
    case "user": {
      const a = ATTRS[p.userAttr]
      const who = v ? ` · ${USERS[v.user].name}` : ""
      return L(`User · ${a.en}${who}`, `User · ${a.id}${who}`)
    }
    case "today":
      return L("Today · Asia/Jakarta", "Hari ini · Asia/Jakarta")
    case "url":
      return L(`URL ?${p.urlParam}=`)
  }
}

const readOnText = (p: HiddenProps) =>
  p.source === "fixed"
    ? L("from the form spec", "dari spec form")
    : p.readOn === "open"
      ? L("when the form opens", "saat form dibuka")
      : L("on Complete Task", "saat Selesaikan Task")

/* ── canvas + runtime strip ─────────────────────────────────────────────── */

const stripClass = "flex min-w-0 flex-col gap-2 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground dark:bg-muted/20"

function Warn({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
      <HugeiconsIcon icon={Alert02Icon} className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

function HiddenCanvas({ props: p }: { props: HiddenProps }) {
  const t = useT()
  return (
    <div className={stripClass}>
      <div className="flex min-w-0 items-center gap-2">
        <HugeiconsIcon icon={ViewOffIcon} className="size-4 shrink-0" />
        <span className="min-w-0 truncate text-sm font-medium text-foreground">{t(p.label)}</span>
        <Badge variant="secondary" className="text-[10px]">
          {t(L("Hidden", "Tersembunyi"))}
        </Badge>
        <Badge variant="outline" className="ml-auto font-mono text-[10px]">
          {p.valueType}
        </Badge>
      </div>
      <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className="font-mono text-foreground">{p.name}</span>
        <span aria-hidden>←</span>
        <span>{t(sourceText(p))}</span>
        {p.source === "fixed" ? (
          <span className="font-mono text-foreground [overflow-wrap:anywhere]">{p.fixed || "—"}</span>
        ) : (
          <span>· {t(L(`read ${readOnText(p).en}`, `dibaca ${readOnText(p).id}`))}</span>
        )}
      </p>
    </div>
  )
}

/** Prototype only: the real form renders nothing here (not even a focusable element). */
function HiddenRuntime({ props: p, value: v, state }: RuntimeProps<HiddenProps, HiddenValue>) {
  const t = useT()
  const { value, problem } = valueOf(p, v)
  const later = p.source !== "fixed" && p.readOn === "submit"
  return (
    <div className={cn(stripClass, state === "disabled" && "opacity-60")}>
      <div className="flex min-w-0 items-center gap-2">
        <HugeiconsIcon icon={ViewOffIcon} className="size-4 shrink-0" />
        <span className="min-w-0 font-medium text-foreground">{t(L("Hidden field — not shown to the user", "Field tersembunyi — tidak tampil ke user"))}</span>
        <Badge variant="outline" className="ml-auto font-mono text-[10px]">
          {p.valueType}
        </Badge>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
        <dt>{t(L("Key", "Key"))}</dt>
        <dd className="font-mono text-foreground [overflow-wrap:anywhere]">{p.name}</dd>
        <dt>{t(L("Source", "Sumber"))}</dt>
        <dd>{t(sourceText(p, v))}</dd>
        <dt>{t(later ? L("Would send", "Akan terkirim") : L("Value", "Nilai"))}</dt>
        <dd className="font-mono text-foreground [overflow-wrap:anywhere]">{JSON.stringify(value)}</dd>
      </dl>
      {later && (
        <p className="flex items-start gap-1.5">
          <HugeiconsIcon icon={Clock01Icon} className="mt-px size-3.5 shrink-0" />
          {t(L("Read on Complete Task; this is the value it would take now.", "Dibaca saat Selesaikan Task; ini nilai yang akan diambil sekarang."))}
        </p>
      )}
      {problem && <Warn>{t(problem)}</Warn>}
      {p.source === "url" && <Warn>{t(URL_WARN)}</Warn>}
    </div>
  )
}

/* ── simulation: the context the value is read from ─────────────────────── */

function HiddenControls({ props: p, value: v, onChange }: { props: HiddenProps; value: HiddenValue; onChange: (next: HiddenValue) => void }) {
  const t = useT()
  const id = useId()
  const used = (s: HiddenSource) =>
    p.source === s && (
      <Badge className="text-[10px]">
        {t(L("used", "dipakai"))}
      </Badge>
    )
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">{t(L("Change the context; the value recomputes.", "Ubah konteksnya; nilai dihitung ulang."))}</p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span id={`${id}-user`} className="text-xs font-semibold text-foreground">
            {t(L("Current user", "User saat ini"))}
          </span>
          {used("user")}
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={1}
          value={v.user}
          aria-labelledby={`${id}-user`}
          onValueChange={(x) => {
            const u = USER_IDS.find((k) => k === x)
            if (u) onChange({ ...v, user: u })
          }}
          className="w-full flex-col items-stretch"
        >
          {USER_IDS.map((u) => (
            <ToggleGroupItem key={u} value={u} className="justify-start px-3 text-xs">
              {USERS[u].name} · {USERS[u].attrs.department} · {USERS[u].attrs.cost_center}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Separator />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Label htmlFor={`${id}-param`} className="text-xs font-semibold">
            {t(L("Link", "Tautan"))} <span className="font-mono font-normal">?{p.urlParam || "utm_source"}=</span>
          </Label>
          {used("url")}
        </div>
        <Input
          id={`${id}-param`}
          value={v.param}
          spellCheck={false}
          placeholder={t(L("Not in the link", "Tidak ada di tautan"))}
          onChange={(e) => onChange({ ...v, param: e.target.value })}
          className="h-8 font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">{t(L("Only public start forms have URL parameters.", "Hanya form mulai publik yang punya parameter URL."))}</p>
      </div>

      <Separator />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Label htmlFor={`${id}-var`} className="text-xs font-semibold">
            {t(L("Variable", "Variabel"))} <span className="font-mono font-normal">{p.variable}</span>
          </Label>
          {used("variable")}
        </div>
        <Input
          id={`${id}-var`}
          value={v.vars[p.variable] ?? ""}
          spellCheck={false}
          onChange={(e) => onChange({ ...v, vars: { ...v.vars, [p.variable]: e.target.value } })}
          className="h-8 font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">{t(L("Set by an earlier step of the process.", "Diisi langkah sebelumnya di proses."))}</p>
      </div>
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

const context = (user: UserId): HiddenValue => ({ user, param: "newsletter", vars: { ...VARS } })

function sourceSpec(p: HiddenProps): Record<string, unknown> {
  switch (p.source) {
    case "fixed":
      return { type: "fixed", value: fixedErr(p.valueType, p.fixed) ? p.fixed : convert(p.valueType, p.fixed).value }
    case "variable":
      return { type: "variable", variable: p.variable }
    case "user":
      return { type: "user", attribute: p.userAttr }
    case "today":
      return { type: "today" }
    case "url":
      return { type: "url", param: p.urlParam }
  }
}

const KIND: Record<HiddenType, L10n> = {
  string: L("Text", "Teks"),
  number: L("A number (or `null`)", "Angka (atau `null`)"),
  boolean: L("`true` or `false`", "`true` atau `false`"),
  json: L("A JSON object (or `null`)", "Objek JSON (atau `null`)"),
}

export const hidden: ComponentDef<HiddenProps, HiddenValue> = {
  slug: "hidden",
  wave: 3,
  ui: "HIDDEN",
  vk: "string",
  group: "data",
  week: 5,
  icon: ViewOffIcon,
  label: L("Hidden field", "Field tersembunyi"),
  title: L("Hidden field", "Field tersembunyi"),
  blurb: L("A value sent with the form but never shown: fixed, from a variable or the user.", "Nilai yang ikut terkirim tetapi tidak pernah tampil: tetap, dari variabel, atau dari user."),

  defaults: () => ({
    label: L("Cost center", "Pusat biaya"),
    name: "cost_center",
    valueType: "string",
    source: "user",
    fixed: "",
    variable: "department_id",
    userAttr: "cost_center",
    urlParam: "utm_source",
    readOn: "open",
  }),
  schema: (p) => [
    {
      tab: "general",
      fields: [F.name(L("Name", "Nama"), { hint: L("Builder only — users never see a hidden field.", "Hanya di builder — user tidak pernah melihat field tersembunyi.") }), F.key()],
    },
    {
      tab: "general",
      title: L("Value", "Nilai"),
      fields: [
        {
          t: "seg",
          k: "valueType",
          label: L("Value type", "Tipe nilai"),
          options: TYPES,
          hint: L(
            "Sets `value_kind`. The value is converted before it is sent; a number that can't be read becomes `null`.",
            "Menentukan `value_kind`. Nilai dikonversi sebelum dikirim; angka yang tidak terbaca menjadi `null`.",
          ),
        },
        {
          t: "select",
          k: "source",
          label: L("Source", "Sumber"),
          options: SOURCES,
          validate: (v, o) =>
            v === "today" && o.valueType !== "string" ? L("Today's date is text — set Value type to Text", "Tanggal hari ini berupa teks — ubah Tipe nilai ke Teks") : null,
        },
        {
          t: "text",
          k: "fixed",
          label: L("Fixed value", "Nilai tetap"),
          mono: true,
          placeholder: PLACEHOLDER[p.valueType],
          when: (o) => o.source === "fixed",
          validate: (v, o) => fixedErr(o.valueType, String(v ?? "")),
        },
        {
          t: "select",
          k: "variable",
          label: L("Process variable", "Variabel proses"),
          when: (o) => o.source === "variable",
          options: VAR_KEYS.map((k) => ({ v: k, label: L(`${k} — e.g. ${VARS[k]}`, `${k} — mis. ${VARS[k]}`) })),
          hint: L("Read from the process when the value is taken.", "Dibaca dari proses saat nilai diambil."),
        },
        {
          t: "select",
          k: "userAttr",
          label: L("User attribute", "Atribut user"),
          when: (o) => o.source === "user",
          options: ATTR_KEYS.map((k) => ({ v: k, label: ATTRS[k] })),
          hint: L("Of the user who has the task open.", "Milik user yang membuka task."),
        },
        {
          t: "note",
          when: (o) => o.source === "today",
          text: L(
            "The server date in Asia/Jakarta when the value is read, as `YYYY-MM-DD` — not the browser's clock.",
            "Tanggal server zona Asia/Jakarta saat nilai dibaca, format `YYYY-MM-DD` — bukan jam browser.",
          ),
        },
        {
          t: "text",
          k: "urlParam",
          label: L("URL parameter", "Parameter URL"),
          mono: true,
          placeholder: L("utm_source"),
          when: (o) => o.source === "url",
          validate: (v) => {
            const s = String(v ?? "")
            return !s
              ? L("Enter the parameter name", "Isi nama parameter")
              : !/^[A-Za-z0-9_.-]+$/.test(s)
                ? L("Use letters, numbers, _ . or -", "Pakai huruf, angka, _ . atau -")
                : null
          },
          hint: L("Only on public start forms, e.g. `?utm_source=newsletter`.", "Hanya di form mulai publik, mis. `?utm_source=newsletter`."),
        },
        { t: "note", tone: "warning", when: (o) => o.source === "url", text: URL_WARN },
        {
          t: "seg",
          k: "readOn",
          label: L("Take the value", "Ambil nilai"),
          when: (o) => o.source !== "fixed",
          options: [
            { v: "open", label: L("When the form opens", "Saat form dibuka") },
            { v: "submit", label: L("On Complete Task", "Saat Selesaikan Task") },
          ],
          hint: L(
            "When the form opens: kept for the whole task and saved with the draft. On Complete Task: the latest value, e.g. after the task was reassigned.",
            "Saat form dibuka: tetap selama task dan ikut tersimpan di draf. Saat Selesaikan Task: nilai terbaru, mis. setelah task dialihkan.",
          ),
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        {
          t: "note",
          text: L(
            "Hidden fields are not checked in the browser — the user can't fix them. Validate on the server if the value matters.",
            "Field tersembunyi tidak dicek di browser — user tidak bisa memperbaikinya. Validasi di server jika nilainya penting.",
          ),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  Canvas: HiddenCanvas,
  bare: true,

  Runtime: HiddenRuntime,
  Controls: HiddenControls,
  hasControls: (p) => p.source === "variable" || p.source === "user" || p.source === "url",
  controlsTitle: L("Context", "Konteks"),
  initial: () => context("dewi"),
  sample: () => context("budi"),
  /* Never blocks Complete Task: the user can't see or fix a hidden value. */
  validate: () => [],
  value: (p, v) => valueOf(p, v).value,
  valueKindOf: (p) => p.valueType,

  spec: (p) => ({
    ui_type: "HIDDEN",
    value_kind: p.valueType,
    name: p.name,
    label: p.label,
    config: { source: sourceSpec(p), read_on: p.readOn },
  }),
  savedAs: (p) =>
    L(
      `${KIND[p.valueType].en} in \`${p.name}\`, taken ${readOnText(p).en}. The user never sees it, but it is in the payload, the draft and history.`,
      `${KIND[p.valueType].id} di \`${p.name}\`, diambil ${readOnText(p).id}. User tidak pernah melihatnya, tetapi nilainya ada di payload, draf, dan history.`,
    ),
  notes: [
    L(
      "Not rendered and not focusable, but still in the payload, the draft and history.",
      "Tidak dirender dan tidak bisa difokus, tetapi tetap ada di payload, draf, dan history.",
    ),
    L(
      "Who may see hidden values in history is **Wave 3 open decision 6** (proposal: process admins only).",
      "Siapa yang boleh melihat nilai tersembunyi di history adalah **keputusan terbuka Gelombang 3 no. 6** (usulan: hanya admin proses).",
    ),
    L(
      "URL parameters exist only on public start forms and are untrusted: anyone can edit the link. Never use them for prices, approvals or access.",
      "Parameter URL hanya ada di form mulai publik dan tidak tepercaya: siapa pun bisa mengubah tautannya. Jangan pakai untuk harga, persetujuan, atau akses.",
    ),
    L(
      "`today` is the server date in Asia/Jakarta at read time (`read_on`), as `YYYY-MM-DD` — not the browser's clock.",
      "`today` adalah tanggal server zona Asia/Jakarta saat dibaca (`read_on`), format `YYYY-MM-DD` — bukan jam browser.",
    ),
    L(
      "The value is converted to `value_kind` before sending: a number or JSON that can't be read becomes `null`; a boolean is `true` only for “true”.",
      "Nilai dikonversi ke `value_kind` sebelum dikirim: angka atau JSON yang tidak terbaca menjadi `null`; boolean hanya `true` untuk “true”.",
    ),
    L("Telegram ignores it, which is fine: there is nothing to ask the user.", "Telegram mengabaikannya, dan itu tidak masalah: tidak ada yang perlu ditanyakan ke user."),
  ],
  story: {
    process: L("IT asset request", "Permintaan aset TI"),
    step: L("Request form", "Form permintaan"),
    ref: "ITA-2026-0789",
    due: "2026-11-12",
    task: L("Request a laptop", "Minta laptop"),
    before: [
      {
        name: "item",
        label: L("Item", "Barang"),
        type: "select",
        required: true,
        value: "laptop",
        options: [
          { v: "laptop", label: L("Laptop") },
          { v: "monitor", label: L("Monitor") },
          { v: "headset", label: L("Headset") },
        ],
      },
      {
        name: "reason",
        label: L("Why do you need it?", "Untuk apa?"),
        type: "textarea",
        required: true,
        value: "",
        rows: 3,
        placeholder: L(
          "e.g. My laptop is six years old and can't run the new ERP client.",
          "mis. Laptop saya sudah enam tahun dan tidak kuat menjalankan aplikasi ERP yang baru.",
        ),
      },
    ],
  },
}
