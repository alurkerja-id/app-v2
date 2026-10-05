/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useEffectEvent, useLayoutEffect, useRef, type ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, BankIcon, CheckmarkBadge01Icon, CloudOffIcon, Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { GhostInput } from "../field-shell"
import { L, useT, type L10n } from "../i18n"
import { F, ctl, issuesFor, norm, reqMsg } from "../lib"
import type { ComponentDef, DataExtra, FieldState, Issue, RuntimeProps } from "../types"

/* Bank account — ui_type BANK_ACCOUNT, value_kind "json". Story: expense reimbursement, step
   "Payment details": the requester gives the account Finance transfers to. Checking the holder
   name with the bank needs a paid inquiry provider (Wave 4 open decision 5), so the check is simulated. */

/* ── banks ──────────────────────────────────────────────────────────────── */

interface Bank {
  code: string
  name: string
  full: string
  /** Usual number of digits; only these are rules. Others accept 8–16. */
  digits: number | null
  /** How the number is spaced on screen (rest in fours). */
  groups: number[]
}

const BANKS: Bank[] = [
  { code: "014", name: "BCA", full: "Bank Central Asia", digits: 10, groups: [3, 3, 4] },
  { code: "008", name: "Mandiri", full: "Bank Mandiri", digits: 13, groups: [3, 2, 7, 1] },
  { code: "002", name: "BRI", full: "Bank Rakyat Indonesia", digits: 15, groups: [4, 2, 6, 2, 1] },
  { code: "009", name: "BNI", full: "Bank Negara Indonesia", digits: 10, groups: [3, 3, 4] },
  { code: "451", name: "BSI", full: "Bank Syariah Indonesia", digits: null, groups: [] },
  { code: "022", name: "CIMB Niaga", full: "Bank CIMB Niaga", digits: null, groups: [] },
  { code: "013", name: "Permata", full: "Bank Permata", digits: null, groups: [] },
  { code: "011", name: "Danamon", full: "Bank Danamon", digits: null, groups: [] },
  { code: "200", name: "BTN", full: "Bank Tabungan Negara", digits: null, groups: [] },
  { code: "542", name: "Bank Jago", full: "Bank Jago", digits: null, groups: [] },
  { code: "535", name: "SeaBank", full: "SeaBank Indonesia", digits: null, groups: [] },
]
const MIN_DIGITS = 8
const MAX_DIGITS = 16

const bankOf = (code: string) => BANKS.find((b) => b.code === code)

/* ── mock process variables the holder name can be matched against ──────── */

interface NameVar {
  label: L10n
  /** As stored in the process (with titles). */
  raw: string
  /** Shown in the message, without titles. */
  plain: string
  /** "The account must be in the requester's name". */
  whose: L10n
}

const VARS: Record<string, NameVar> = {
  requester_name: { label: L("Requester's name", "Nama pemohon"), raw: "Dewi Kartika, S.Kom.", plain: "Dewi Kartika", whose: L("requester's", "pemohon") },
  beneficiary_name: {
    label: L("Beneficiary (set in step 1)", "Penerima dana (diisi di langkah 1)"),
    raw: "Ir. Budi Santoso",
    plain: "Budi Santoso",
    whose: L("beneficiary's", "penerima dana"),
  },
}
const VAR_KEYS = Object.keys(VARS)

/* ── props + value ──────────────────────────────────────────────────────── */

type NameMode = "typed" | "verified"

interface BankProps {
  label: L10n
  name: string
  bankScope: "all" | "some"
  /** Bank codes offered when `bankScope` is "some". */
  banks: string[]
  nameMode: NameMode
  /** Process variable the holder name must match; "" = no check. */
  matchVariable: string
  required: boolean
}

/** Result of the (simulated) bank inquiry. "down" = service unavailable, the user types the name. */
type Inquiry = "idle" | "checking" | "found" | "not_found" | "down"
type BankSim = "match" | "other" | "not_found" | "down"

interface BankValue {
  /** Bank code, "" = none. */
  bank: string
  /** Digits only, as a string (leading zeros matter). */
  number: string
  /** Holder name in capitals, as typed or as returned by the bank. */
  name: string
  inquiry: Inquiry
  /** Prototype: what the next "Check account" answers. Never submitted. */
  sim: BankSim
}

const allowed = (p: BankProps) => (p.bankScope === "all" ? BANKS : BANKS.filter((b) => p.banks.includes(b.code)))

/** "0372615849" → "037 261 5849" (BCA), Mandiri "123 00 1234567 8", others in fours. */
function spaced(n: string, b: Bank | undefined) {
  const out: string[] = []
  let i = 0
  for (const s of b?.groups ?? []) {
    if (i >= n.length) break
    out.push(n.slice(i, i + s))
    i += s
  }
  for (; i < n.length; i += 4) out.push(n.slice(i, i + 4))
  return out.join(" ")
}

/** "••••••5849" — what history shows (Wave 4 open decision 5). */
const masked = (n: string) => (n.length > 4 ? "•".repeat(n.length - 4) + n.slice(-4) : n)

const lengthOk = (n: string, b: Bank | undefined) => (b?.digits ? n.length === b.digits : n.length >= MIN_DIGITS && n.length <= MAX_DIGITS)

const lengthRule = (b: Bank | undefined) =>
  b?.digits ? L(`A ${b.name} account number has ${b.digits} digits`, `Nomor rekening ${b.name} terdiri dari ${b.digits} digit`) : L(`An account number has ${MIN_DIGITS}–${MAX_DIGITS} digits`, `Nomor rekening terdiri dari ${MIN_DIGITS}–${MAX_DIGITS} digit`)

/* Titles ignored when matching names: before the name (Ir. Budi) and degrees after it (Dewi, S.Kom.). */
const PREFIX = new Set(["IR", "DR", "DRS", "DRA", "H", "HJ", "PROF", "KH"])
const DEGREE = new Set([
  "SKOM", "SE", "SH", "ST", "SPD", "SSI", "SAK", "SPSI", "SKM", "SKED", "SIP", "SS", "SSOS", "SFARM", "SIKOM", "SP", "SPT", "SAB",
  "MM", "MT", "MBA", "MKOM", "MSI", "MSC", "MH", "MPD", "ME", "MAK", "MKES", "AMD", "BSC", "BA", "MA", "PHD",
])

/** "Dewi Kartika, S.Kom." and "DEWI  KARTIKA" → "DEWI KARTIKA". */
function canon(s: string) {
  const words = norm(s.split(",")[0]).toUpperCase().split(" ").filter(Boolean)
  const bare = words.map((w) => w.replace(/[^A-Z0-9'-]/g, ""))
  let i = 0
  while (i < bare.length && PREFIX.has(bare[i])) i++
  let j = bare.length
  while (j > i && DEGREE.has(bare[j - 1]) && words[j - 1].includes(".")) j--
  return bare.slice(i, j).filter(Boolean).join(" ")
}

const squash = (s: string) => s.trim().replace(/\s+/g, " ")
const typedName = (p: BankProps, v: BankValue) => p.nameMode === "typed" || v.inquiry === "down"
const isVerified = (p: BankProps, v: BankValue) => p.nameMode === "verified" && v.inquiry === "found"

/** Name the mock bank returns. */
function inquiryName(p: BankProps, sim: BankSim) {
  if (sim === "other") return "RIZKY PRATAMA"
  return (VARS[p.matchVariable]?.plain ?? "Dewi Kartika").toUpperCase()
}

const CHECK_MS = 1200

/* Bank and number side by side when the field is wide enough (task form); stacked on phones and narrow columns. */
const TWO_COLS = "@md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]"

/* ── canvas ─────────────────────────────────────────────────────────────── */

function SubLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground/80">
      {children}
    </Label>
  )
}

function BankCanvas({ props: p }: { props: BankProps }) {
  const t = useT()
  const n = allowed(p).length
  const mv = VARS[p.matchVariable]
  return (
    <div className="@container flex flex-col gap-2">
      <div className={cn("grid gap-2", TWO_COLS)}>
        <GhostInput select>{t(L("Choose bank", "Pilih bank"))}</GhostInput>
        <GhostInput className="font-mono">{t(L("Account number", "Nomor rekening"))}</GhostInput>
      </div>
      <div className="flex gap-2">
        <GhostInput className="flex-1">{t(L("Account holder name", "Nama pemilik rekening"))}</GhostInput>
        {p.nameMode === "verified" && (
          <span className={buttonVariants({ variant: "outline" })}>
            <HugeiconsIcon icon={Search01Icon} />
            {t(L("Check account", "Cek rekening"))}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          L(
            `${p.bankScope === "all" ? "All" : n} bank${n === 1 ? "" : "s"} · ${p.nameMode === "verified" ? "name from the bank check" : "name typed by the user"}${mv ? ` · must match ${p.matchVariable}` : ""}`,
            `${p.bankScope === "all" ? "Semua" : n} bank · ${p.nameMode === "verified" ? "nama dari cek bank" : "nama diketik user"}${mv ? ` · harus sama dengan ${p.matchVariable}` : ""}`,
          ),
        )}
      </p>
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

function VerifiedBadge() {
  const t = useT()
  return (
    <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
      <HugeiconsIcon icon={CheckmarkBadge01Icon} />
      {t(L("Verified", "Terverifikasi"))}
    </Badge>
  )
}

/** Read-only / Disabled: the three parts as plain values. */
function BankStatic({ p, v, state, compact, id }: { p: BankProps; v: BankValue; state: FieldState; compact: boolean; id: string }) {
  const t = useT()
  const b = bankOf(v.bank)
  return (
    <div role="group" aria-labelledby={`${id}-label`} className="@container flex flex-col gap-3">
      <div className={cn("grid gap-3", !compact && TWO_COLS)}>
        <div className="flex min-w-0 flex-col gap-1.5">
          <SubLabel htmlFor={`${id}-input`}>{t(L("Bank", "Bank"))}</SubLabel>
          <Input id={`${id}-input`} value={b ? `${b.name} · ${b.code}` : ""} {...ctl(state)} />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <SubLabel htmlFor={`${id}-number`}>{t(L("Account number", "Nomor rekening"))}</SubLabel>
          <Input id={`${id}-number`} value={spaced(v.number, b)} className="font-mono tabular-nums" {...ctl(state)} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <SubLabel htmlFor={`${id}-name`}>{t(L("Account holder name", "Nama pemilik rekening"))}</SubLabel>
        <InputGroup data-disabled={state === "disabled" || undefined}>
          <InputGroupInput id={`${id}-name`} value={v.name} {...ctl(state)} />
          {isVerified(p, v) && (
            <InputGroupAddon align="inline-end">
              <VerifiedBadge />
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>
    </div>
  )
}

function BankRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<BankProps, BankValue>) {
  const t = useT()
  const numberRef = useRef<HTMLInputElement>(null)
  /* Digits before the caret, restored after the number is re-spaced (same as Phone). */
  const caret = useRef<number | null>(null)

  useLayoutEffect(() => {
    const el = numberRef.current
    const dig = caret.current
    if (!el || dig == null || document.activeElement !== el) return
    caret.current = null
    let pos = 0
    let seen = 0
    while (pos < el.value.length && seen < dig) {
      if (/\d/.test(el.value[pos])) seen++
      pos++
    }
    el.setSelectionRange(pos, pos)
  })

  const live = state === "active"
  const verifiedMode = p.nameMode === "verified"
  const checking = live && v.inquiry === "checking"

  /* The mock bank answers after 1.2 s. Editing the bank or number, a state change or unmount clears the timer. */
  const answer = useEffectEvent(() => {
    if (v.sim === "not_found") onChange({ ...v, inquiry: "not_found", name: "" })
    else if (v.sim === "down") onChange({ ...v, inquiry: "down" })
    else onChange({ ...v, inquiry: "found", name: inquiryName(p, v.sim) })
  })
  useEffect(() => {
    if (!checking) return
    const timer = window.setTimeout(() => answer(), CHECK_MS)
    return () => window.clearTimeout(timer)
  }, [checking])

  if (!live) return <BankStatic p={p} v={v} state={state} compact={compact} id={id} />

  const list = allowed(p)
  const b = bankOf(v.bank)
  const all = issuesFor(issues, "all").length > 0
  const bad = (fid: string) => all || issuesFor(issues, fid).length > 0 || undefined
  const canCheck = Boolean(b) && /^\d+$/.test(v.number) && lengthOk(v.number, b)

  /* Changing the bank or the number voids an earlier check (and the name the bank returned). */
  const edited = (patch: Partial<BankValue>) => {
    const keepTyped = !verifiedMode || v.inquiry === "down"
    onChange({ ...v, ...patch, ...(keepTyped ? {} : { inquiry: "idle", name: "" }) })
  }

  const status: { tone: "muted" | "ok" | "bad" | "warn"; icon?: typeof Tick02Icon; text: L10n } = !verifiedMode
    ? { tone: "muted", text: L("As written in the bank book, e.g. DEWI KARTIKA.", "Sesuai buku tabungan, mis. DEWI KARTIKA.") }
    : v.inquiry === "checking"
      ? { tone: "muted", text: L(`Checking with ${b?.name ?? "the bank"}…`, `Mengecek ke ${b?.name ?? "bank"}…`) }
      : v.inquiry === "found"
        ? {
            tone: "ok",
            icon: Tick02Icon,
            text: L(`Account found at ${b?.name ?? "the bank"}. The name comes from the bank and can't be edited.`, `Rekening ditemukan di ${b?.name ?? "bank"}. Nama berasal dari bank dan tidak bisa diubah.`),
          }
        : v.inquiry === "not_found"
          ? {
              tone: "bad",
              icon: Alert02Icon,
              text: L(`No ${b?.name ?? ""} account has this number. Check the number and try again.`, `Tidak ada rekening ${b?.name ?? ""} dengan nomor ini. Periksa nomornya lalu coba lagi.`),
            }
          : v.inquiry === "down"
            ? {
                tone: "warn",
                icon: CloudOffIcon,
                text: L(
                  "The bank check isn't available right now. Type the name as in the bank book; Finance checks it before paying.",
                  "Cek rekening sedang tidak tersedia. Ketik nama sesuai buku tabungan; Finance mengeceknya sebelum membayar.",
                ),
              }
            : canCheck
              ? { tone: "muted", text: L("Press Check account: the name comes from the bank.", "Tekan Cek rekening: nama diisi dari bank.") }
              : { tone: "muted", text: L("Choose the bank and enter the full account number, then check it.", "Pilih bank dan isi nomor rekening lengkap, lalu cek.") }

  const nameEditable = typedName(p, v)

  return (
    <div role="group" aria-labelledby={`${id}-label`} className="@container flex flex-col gap-3">
      <div className={cn("grid gap-3", !compact && TWO_COLS)}>
        <div className="flex min-w-0 flex-col gap-1.5">
          <SubLabel htmlFor={`${id}-input`}>{t(L("Bank", "Bank"))}</SubLabel>
          <Combobox
            items={list}
            value={b ?? null}
            onValueChange={(x: Bank | null) => {
              if ((x?.code ?? "") !== v.bank) edited({ bank: x?.code ?? "" })
            }}
            itemToStringLabel={(x: Bank) => x.name}
            isItemEqualToValue={(x: Bank, y: Bank) => x.code === y.code}
            filter={(x: Bank, q: string) => norm(`${x.name} ${x.full} ${x.code}`).includes(norm(q))}
            autoHighlight
          >
            <ComboboxInput
              id={`${id}-input`}
              placeholder={t(L("Search bank or code", "Cari bank atau kode"))}
              showClear
              aria-invalid={bad("bank")}
              className="w-full"
            />
            <ComboboxContent>
              <ComboboxEmpty>{t(L("No bank matches", "Bank tidak ditemukan"))}</ComboboxEmpty>
              <ComboboxList>
                {(x: Bank) => (
                  <ComboboxItem key={x.code} value={x}>
                    <span className="min-w-0 flex-1 truncate">
                      {x.name}
                      {x.full !== x.name && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{x.full}</span>}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">{x.code}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <SubLabel htmlFor={`${id}-number`}>{t(L("Account number", "Nomor rekening"))}</SubLabel>
          <Input
            ref={numberRef}
            id={`${id}-number`}
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            value={spaced(v.number, b)}
            placeholder={b?.digits ? spaced("0".repeat(b.digits), b) : "0000 0000 0000"}
            aria-invalid={bad("number")}
            aria-describedby={`${id}-number-rule`}
            className="font-mono tabular-nums placeholder:text-muted-foreground/50"
            onChange={(e) => {
              const raw = e.target.value
              const digits = raw.replace(/\D/g, "").slice(0, MAX_DIGITS)
              const before = (raw.slice(0, e.target.selectionStart ?? raw.length).match(/\d/g) ?? []).length
              caret.current = Math.min(digits.length, before)
              if (digits !== v.number) edited({ number: digits })
            }}
          />
          <p id={`${id}-number-rule`} className="flex justify-between gap-2 text-xs text-muted-foreground">
            <span>{b?.digits ? t(L(`${b.name}: ${b.digits} digits`, `${b.name}: ${b.digits} digit`)) : t(L(`${MIN_DIGITS}–${MAX_DIGITS} digits`, `${MIN_DIGITS}–${MAX_DIGITS} digit`))}</span>
            <span className="tabular-nums">
              {v.number.length}
              {b?.digits ? `/${b.digits}` : ""}
            </span>
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5">
        <SubLabel htmlFor={`${id}-name`}>{t(L("Account holder name", "Nama pemilik rekening"))}</SubLabel>
        <div className={cn("flex flex-col gap-2", !compact && "@md:flex-row @md:items-center")}>
          <InputGroup className={cn("min-w-0", !compact && "@md:flex-1")}>
            <InputGroupInput
              id={`${id}-name`}
              value={v.name}
              readOnly={!nameEditable}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={t(nameEditable ? L("e.g. DEWI KARTIKA", "mis. DEWI KARTIKA") : L("Filled in by the bank check", "Diisi dari hasil cek bank"))}
              aria-invalid={bad("name")}
              aria-describedby={`${id}-status`}
              onChange={(e) => {
                if (!nameEditable) return
                /* Uppercase in place so React doesn't reset the value and move the caret to the end. */
                const el = e.target
                const { selectionStart: from, selectionEnd: to } = el
                el.value = el.value.toUpperCase()
                if (from != null) el.setSelectionRange(from, to ?? from)
                onChange({ ...v, name: el.value })
              }}
            />
            {isVerified(p, v) && (
              <InputGroupAddon align="inline-end">
                <VerifiedBadge />
              </InputGroupAddon>
            )}
          </InputGroup>
          {verifiedMode && v.inquiry !== "found" && (
            <Button
              variant="outline"
              disabled={!canCheck || checking}
              aria-invalid={bad("check")}
              aria-describedby={`${id}-status`}
              onClick={() => onChange({ ...v, inquiry: "checking" })}
              className={cn("w-full", !compact && "@md:w-auto")}
            >
              {checking ? <Spinner /> : <HugeiconsIcon icon={Search01Icon} />}
              {t(
                checking
                  ? L("Checking…", "Mengecek…")
                  : v.inquiry === "not_found" || v.inquiry === "down"
                    ? L("Check again", "Cek lagi")
                    : L("Check account", "Cek rekening"),
              )}
            </Button>
          )}
        </div>
        <p
          id={`${id}-status`}
          aria-live="polite"
          className={cn(
            "flex items-start gap-1.5 text-xs",
            status.tone === "ok" && "text-emerald-700 dark:text-emerald-400",
            status.tone === "bad" && "text-destructive",
            status.tone === "warn" && "text-amber-700 dark:text-amber-400",
            status.tone === "muted" && "text-muted-foreground",
          )}
        >
          {status.icon && <HugeiconsIcon icon={status.icon} className="mt-px size-3.5 shrink-0" />}
          <span>{t(status.text)}</span>
        </p>
      </div>
    </div>
  )
}

/* ── simulation: the bank inquiry answer ────────────────────────────────── */

function BankControls({ props: p, value: v, onChange }: { props: BankProps; value: BankValue; onChange: (next: BankValue) => void }) {
  const t = useT()
  const who = VARS[p.matchVariable]?.plain ?? "Dewi Kartika"
  const sims: { v: BankSim; label: L10n }[] = [
    { v: "match", label: L(`Account found · ${who}`, `Rekening ditemukan · ${who}`) },
    { v: "other", label: L("Found · in another name (Rizky Pratama)", "Ditemukan · atas nama lain (Rizky Pratama)") },
    { v: "not_found", label: L("Account not found", "Rekening tidak ditemukan") },
    { v: "down", label: L("Check service down", "Layanan cek sedang mati") },
  ]
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">{t(L("What the bank answers on the next “Check account”.", "Jawaban bank untuk “Cek rekening” berikutnya."))}</p>
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        spacing={1}
        value={v.sim}
        aria-label={t(L("Prototype · simulate bank check", "Prototipe · simulasi cek rekening"))}
        onValueChange={(s) => {
          const next = sims.find((x) => x.v === s)
          if (next) onChange({ ...v, sim: next.v })
        }}
        className="w-full flex-col items-stretch"
      >
        {sims.map((s) => (
          <ToggleGroupItem key={s.v} value={s.v} className="justify-start px-3 text-xs">
            {t(s.label)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

/* ── context: the requester, the name check and how history shows it ───── */

function RequesterCard({ props: p, value: v }: { props: BankProps; value: BankValue }) {
  const t = useT()
  const mv = VARS[p.matchVariable]
  const name = squash(v.name)
  const b = bankOf(v.bank)
  const match = !mv || !name ? null : canon(name) === canon(mv.raw)
  return (
    <Card className="gap-3 p-4">
      <div>
        <p className="text-sm font-semibold">{t(L("Requester", "Pemohon"))}</p>
        <p className="text-xs text-muted-foreground">{t(L("From the start of the process. Prototype data.", "Dari awal proses. Data prototipe."))}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">DK</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Dewi Kartika, S.Kom.</p>
          <p className="text-xs text-muted-foreground">Finance · Finance Analyst</p>
        </div>
      </div>
      <dl className="flex flex-col gap-1.5 text-xs">
        {VAR_KEYS.map((k) => (
          <div key={k} className="flex items-start justify-between gap-3">
            <dt className="font-mono text-muted-foreground">{k}</dt>
            <dd className={cn("text-right", k === p.matchVariable ? "font-semibold" : "text-muted-foreground")}>{VARS[k].raw}</dd>
          </div>
        ))}
      </dl>
      <p
        className={cn(
          "flex items-start gap-1.5 text-xs",
          match === true ? "text-emerald-700 dark:text-emerald-400" : match === false ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {match != null && <HugeiconsIcon icon={match ? Tick02Icon : Alert02Icon} className="mt-px size-3.5 shrink-0" />}
        <span>
          {t(
            !mv
              ? L("Name check is off (Edit Element → Validation).", "Pengecekan nama mati (Edit Element → Validasi).")
              : match == null
                ? L(`The holder name must match ${p.matchVariable}; titles are ignored.`, `Nama pemilik harus sama dengan ${p.matchVariable}; gelar diabaikan.`)
                : match
                  ? L(`${name} matches ${mv.plain} (titles ignored).`, `${name} sama dengan ${mv.plain} (gelar diabaikan).`)
                  : L(`${name} is not ${mv.plain}.`, `${name} bukan ${mv.plain}.`),
          )}
        </span>
      </p>
      <Separator />
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold">{t(L("In history (proposal)", "Di history (usulan)"))}</p>
        <p className="flex min-w-0 items-center gap-1.5 text-sm">
          <HugeiconsIcon icon={BankIcon} className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono tabular-nums">{b && v.number ? `${b.name} · ${masked(v.number)}` : "—"}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {t(L("Only the last 4 digits (Wave 4 open decision 5).", "Hanya 4 digit terakhir (keputusan terbuka Gelombang 4 no. 5)."))}
        </p>
      </div>
    </Card>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

function validate(p: BankProps, v: BankValue): Issue[] {
  const b = bankOf(v.bank)
  if (!b && !v.number && !squash(v.name)) return p.required ? [{ fid: "all", msg: reqMsg(p.label) }] : []
  const out: Issue[] = []
  if (!b) out.push({ fid: "bank", msg: L("Choose the bank", "Pilih bank") })
  if (!v.number) out.push({ fid: "number", msg: L("Enter the account number", "Isi nomor rekening") })
  else if (!/^\d+$/.test(v.number)) out.push({ fid: "number", msg: L("Use digits only", "Gunakan angka saja") })
  else if (!lengthOk(v.number, b)) out.push({ fid: "number", msg: lengthRule(b) })

  if (!typedName(p, v) && v.inquiry !== "found") {
    if (!out.length)
      out.push({
        fid: "check",
        msg:
          v.inquiry === "not_found"
            ? L(`No ${b?.name ?? ""} account has this number`, `Tidak ada rekening ${b?.name ?? ""} dengan nomor ini`)
            : L("Check the account before completing", "Cek rekening sebelum menyelesaikan task"),
      })
    return out
  }
  const name = squash(v.name)
  const mv = VARS[p.matchVariable]
  if (!name) out.push({ fid: "name", msg: L("Enter the account holder name", "Isi nama pemilik rekening") })
  else if (mv && canon(name) !== canon(mv.raw))
    out.push({ fid: "name", msg: L(`The account must be in the ${mv.whose.en} name (${mv.plain})`, `Rekening harus atas nama ${mv.whose.id} (${mv.plain})`) })
  return out
}

function payload(p: BankProps, v: BankValue) {
  const b = bankOf(v.bank)
  const name = squash(v.name)
  return {
    bank_code: b ? b.code : null,
    bank_name: b ? b.name : null,
    account_number: v.number || null,
    account_name: name || null,
    verified: isVerified(p, v),
  }
}

function sample(p: BankProps): BankValue {
  const b = allowed(p).find((x) => x.code === "014") ?? allowed(p)[0] ?? BANKS[0]
  return {
    bank: b.code,
    number: "0372615849123456".slice(0, b.digits ?? 12),
    name: (VARS[p.matchVariable]?.plain ?? "Dewi Kartika").toUpperCase(),
    inquiry: p.nameMode === "verified" ? "found" : "idle",
    sim: "match",
  }
}

export const bankAccount: ComponentDef<BankProps, BankValue> = {
  slug: "bank-account",
  wave: 4,
  ui: "BANK_ACCOUNT",
  vk: "json",
  group: "input",
  week: 6,
  icon: BankIcon,
  label: L("Bank account", "Rekening bank"),
  title: L("Bank account", "Rekening bank"),
  blurb: L("Bank, account number and account holder, checked per bank.", "Bank, nomor rekening, dan nama pemilik, dicek per bank."),

  defaults: () => ({
    label: L("Account for the transfer", "Rekening tujuan transfer"),
    name: "payment_account",
    bankScope: "all",
    banks: ["014", "008", "002", "009"],
    nameMode: "typed",
    matchVariable: "requester_name",
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
          k: "bankScope",
          label: L("Banks", "Bank"),
          options: [
            { v: "all", label: L(`All banks (${BANKS.length})`, `Semua bank (${BANKS.length})`) },
            { v: "some", label: L("Only some", "Sebagian saja") },
          ],
        },
        {
          t: "chips",
          k: "banks",
          label: L("Banks offered", "Bank yang ditawarkan"),
          when: (p) => p.bankScope === "some",
          options: BANKS.map((b) => ({ v: b.code, label: L(`${b.name} · ${b.code}`) })),
          validate: (v) => (!Array.isArray(v) || !v.length ? L("Pick at least one bank", "Pilih minimal satu bank") : null),
          hint: L("E.g. only the banks Finance pays from at no fee.", "Mis. hanya bank yang bisa dibayar Finance tanpa biaya."),
        },
        {
          t: "seg",
          k: "nameMode",
          label: L("Account holder name", "Nama pemilik rekening"),
          options: [
            { v: "typed", label: L("Typed by the user", "Diketik user") },
            { v: "verified", label: L("Checked with the bank", "Dicek ke bank") },
          ],
          hint: L(
            "Checking with the bank needs a paid bank-inquiry provider. Proposal: typed for now, the check later (**Wave 4 open decision 5**).",
            "Cek ke bank butuh penyedia inquiry rekening berbayar. Usulan: diketik dulu, cek menyusul (**keputusan terbuka Gelombang 4 no. 5**).",
          ),
        },
        {
          t: "note",
          tone: "warning",
          when: (p) => p.nameMode === "verified",
          text: L(
            "Prototype: the check is simulated. When the service is down, the user types the name and `verified` stays `false`.",
            "Prototipe: cek rekening disimulasikan. Bila layanannya mati, user mengetik nama dan `verified` tetap `false`.",
          ),
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        F.required(L("Bank, number and name must all be filled.", "Bank, nomor, dan nama wajib terisi semua.")),
        {
          t: "select",
          k: "matchVariable",
          label: L("Holder name must match", "Nama pemilik harus sama dengan"),
          options: [
            { v: "", label: L("No check", "Tidak dicek") },
            ...VAR_KEYS.map((k) => ({ v: k, label: L(`${VARS[k].label.en} · ${k}`, `${VARS[k].label.id} · ${k}`) })),
          ],
          hint: L(
            "Case-insensitive; extra spaces and titles like `Ir.` or `S.Kom` are ignored. E.g. reimbursements are paid only to the requester's own account.",
            "Tidak membedakan huruf besar-kecil; spasi berlebih dan gelar seperti `Ir.` atau `S.Kom` diabaikan. Mis. reimburse hanya dibayar ke rekening pemohon sendiri.",
          ),
        },
        {
          t: "note",
          text: L(
            "Number length per bank: BCA 10, Mandiri 13, BRI 15, BNI 10 digits; other banks 8–16 digits. To confirm with Finance (Wave 4 open decision 5).",
            "Panjang nomor per bank: BCA 10, Mandiri 13, BRI 15, BNI 10 digit; bank lain 8–16 digit. Dikonfirmasi ke Finance (keputusan terbuka Gelombang 4 no. 5).",
          ),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: BankCanvas,
  canvasWarn: (p) => (p.bankScope === "some" && !p.banks.length ? L("No bank chosen", "Belum ada bank") : null),

  Runtime: BankRuntime,
  Controls: BankControls,
  hasControls: (p) => p.nameMode === "verified",
  controlsTitle: L("Bank check", "Cek rekening"),
  Aside: RequesterCard,
  initial: () => ({ bank: "", number: "", name: "", inquiry: "idle", sim: "match" }),
  sample,
  validate,
  value: payload,

  spec: (p) => ({
    ui_type: "BANK_ACCOUNT",
    value_kind: "json",
    name: p.name,
    label: p.label,
    required: p.required,
    config: {
      banks: p.bankScope === "all" ? "all" : allowed(p).map((b) => b.code),
      name_mode: p.nameMode,
      match_variable: p.matchVariable || null,
    },
  }),
  savedAs: (p) =>
    L(
      `One JSON object in \`${p.name}\`: \`bank_code\`, \`bank_name\`, \`account_number\` (text, leading zeros kept), \`account_name\` in capitals and \`verified\`. Empty keeps every key with \`null\` and \`verified: false\`.`,
      `Satu objek JSON di \`${p.name}\`: \`bank_code\`, \`bank_name\`, \`account_number\` (teks, nol di depan tetap ada), \`account_name\` dalam huruf kapital, dan \`verified\`. Bila kosong, semua key tetap ada dengan \`null\` dan \`verified: false\`.`,
    ),
  notes: [
    L(
      "Checking the holder name needs a paid bank-inquiry provider. Proposal: typed name now, inquiry later; when the check is down the user types the name and `verified` stays `false` (Wave 4 open decision 5).",
      "Cek nama pemilik butuh penyedia inquiry rekening berbayar. Usulan: nama diketik dulu, inquiry menyusul; bila cek sedang mati user mengetik nama dan `verified` tetap `false` (keputusan terbuka Gelombang 4 no. 5).",
    ),
    L(
      "History shows the number masked except the last 4 digits (`••••••5849`) (proposal, Wave 4 open decision 5). The payload keeps the full number for the payment step.",
      "History menampilkan nomor tersamar kecuali 4 digit terakhir (`••••••5849`) (usulan, keputusan terbuka Gelombang 4 no. 5). Payload tetap menyimpan nomor lengkap untuk langkah pembayaran.",
    ),
    L(
      "`account_number` is a string: leading zeros matter, and 16-digit numbers lose precision as JavaScript numbers.",
      "`account_number` berupa teks: nol di depan penting, dan nomor 16 digit kehilangan presisi bila disimpan sebagai angka JavaScript.",
    ),
    L(
      "Length rules only for BCA 10, Mandiri 13, BRI 15 and BNI 10 digits; other banks accept 8–16 digits. Per-bank lengths to confirm with Finance (decision 5).",
      "Aturan panjang hanya untuk BCA 10, Mandiri 13, BRI 15, dan BNI 10 digit; bank lain menerima 8–16 digit. Panjang per bank dikonfirmasi ke Finance (keputusan no. 5).",
    ),
    L(
      "The name match ignores case, extra spaces and titles (Ir., Dr., S.Kom, S.E.…). It compares names only; that the account really belongs to that person needs the inquiry.",
      "Pencocokan nama mengabaikan huruf besar-kecil, spasi berlebih, dan gelar (Ir., Dr., S.Kom, S.E.…). Yang dibandingkan hanya nama; bukti rekening benar milik orang itu butuh inquiry.",
    ),
  ],
  dataExtra: (p, v) => {
    const shown = v.bank && v.number ? v : sample(p)
    const b = bankOf(shown.bank)
    const out: DataExtra[] = [
      {
        title: L("In history (proposal)", "Di history (usulan)"),
        sub: L("Number masked except the last 4 digits · Wave 4 open decision 5", "Nomor tersamar kecuali 4 digit terakhir · keputusan terbuka Gelombang 4 no. 5"),
        json: { bank_name: b?.name ?? null, account_number: masked(shown.number), account_name: squash(shown.name) || null, verified: isVerified(p, shown) },
      },
    ]
    if (p.nameMode === "verified")
      out.push({
        title: L("Bank inquiry · mock", "Inquiry rekening · tiruan"),
        sub: L("Request and answer; the real shape depends on the provider (decision 5)", "Permintaan dan jawaban; bentuk aslinya tergantung penyedia (keputusan no. 5)"),
        json: {
          request: { bank_code: b?.code ?? null, account_number: shown.number },
          response: { status: "FOUND", account_name: inquiryName(p, "match") },
        },
      })
    return out
  },
  story: {
    process: L("Expense reimbursement", "Reimburse biaya"),
    step: L("Payment details", "Data pembayaran"),
    ref: "RMB-2026-0632",
    due: "2026-11-17",
    task: L("Add the account for your reimbursement", "Isi rekening untuk reimburse Anda"),
    before: [
      {
        name: "total_amount",
        label: L("Total amount", "Total biaya"),
        type: "number",
        prefix: "Rp",
        required: true,
        value: "1250000",
        validate: (x) => (Number(x) > 0 ? null : L("Enter an amount above 0", "Isi jumlah lebih dari 0")),
      },
    ],
    after: [{ name: "note", label: L("Note", "Catatan"), type: "textarea", rows: 2, value: "", placeholder: L("Optional", "Opsional") }],
  },
}
