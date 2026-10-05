/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { Fragment, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { DeliveryTruck01Icon, MinusSignIcon, PasswordValidationIcon, ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons"
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { L, useT, type L10n } from "../i18n"
import { F, reqMsg } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"

/* OTP / PIN — ui_type OTP, value_kind "string". Story: goods receipt at the warehouse, where the
   receiver types the delivery code printed on the delivery note (surat jalan).
   Not authentication: the browser only collects the code; a later service task checks it (open decision 4). */

type Charset = "digits" | "alphanumeric"
/** 0 = one row of boxes; 3 = groups of three ("482 913"). */
type GroupBy = 0 | 3

interface OtpProps {
  label: L10n
  name: string
  /** Number of boxes, 4–8; "" while the stepper is being edited. */
  length: number | ""
  charset: Charset
  /** PIN mode: dots instead of characters, with a show / hide button. */
  mask: boolean
  groupBy: GroupBy
  required: boolean
}

/** The code exactly as typed: no spaces, uppercase letters, leading zeros kept. */
type OtpValue = string

const len = (p: OtpProps) => Math.min(8, Math.max(4, Math.round(Number(p.length)) || 6))
const digitsOnly = (p: OtpProps) => p.charset === "digits"
const charsRe = (p: OtpProps) => (digitsOnly(p) ? /^\d*$/ : /^[A-Z0-9]*$/)

/** "6 digits" / "6 characters". */
const unitText = (p: OtpProps, n = len(p)) => (digitsOnly(p) ? L(`${n} digits`, `${n} digit`) : L(`${n} characters`, `${n} karakter`))

/** Paste and typing: drop spaces and dashes ("482 913", "482-913"), uppercase letters. */
const clean = (s: string) => s.replace(/[\s-]/g, "").toUpperCase()

/** Box sizes per group: 6 → [3, 3], 8 → [3, 3, 2]. */
function groupSizes(p: OtpProps) {
  const n = len(p)
  if (p.groupBy !== 3) return [n]
  const out: number[] = []
  for (let i = 0; i < n; i += 3) out.push(Math.min(3, n - i))
  return out
}

/** [[0,1,2],[3,4,5]] — box indexes per group. */
function groups(p: OtpProps) {
  let start = 0
  return groupSizes(p).map((size) => {
    const idx = Array.from({ length: size }, (_, i) => start + i)
    start += size
    return idx
  })
}

/** "482 913" for display (read-only, Aside), following the grouping setting. */
const spaced = (p: OtpProps, code: string) =>
  groups(p)
    .map((g) => g.map((i) => code[i] ?? "").join(""))
    .filter(Boolean)
    .join(" ")

/** The code printed on the mock delivery note; also the sample value. */
const sampleCode = (p: OtpProps) => (digitsOnly(p) ? "48291375" : "K7Q2M9XD").slice(0, len(p))

/* ── static boxes (canvas, read-only) ───────────────────────────────────── */

/** Same box geometry as `ui/input-otp`, drawn without an input (canvas preview, read-only value). */
const BOX = "flex size-9 items-center justify-center border-r border-border/70 font-mono text-base last:border-r-0"

function StaticBoxes({ p, chars, tone, compact }: { p: OtpProps; chars: string[]; tone: "ghost" | "readonly"; compact?: boolean }) {
  return (
    <div className={cn("flex items-center", compact ? "gap-1.5" : "gap-2")} aria-hidden>
      {groups(p).map((g, gi) => (
        <Fragment key={gi}>
          {gi > 0 && <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} className="size-4 text-muted-foreground" />}
          <div
            className={cn(
              "flex items-center rounded-3xl",
              tone === "ghost" ? "bg-[var(--input-surface)] shadow-[var(--input-depth)]" : "bg-muted text-foreground select-text",
            )}
          >
            {g.map((i) => (
              <span key={i} className={cn(BOX, compact && "max-w-8")}>
                {chars[i] ?? ""}
              </span>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

function OtpCanvas({ props: p }: { props: OtpProps }) {
  const t = useT()
  return (
    <div className="flex flex-col gap-1.5">
      <StaticBoxes p={p} chars={[]} tone="ghost" />
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {t(unitText(p))}
        {p.mask && (
          <Badge variant="secondary" className="text-[10px]">
            {t(L("Hidden like a PIN", "Disamarkan seperti PIN"))}
          </Badge>
        )}
      </p>
    </div>
  )
}

/* ── runtime ────────────────────────────────────────────────────────────── */

/** Filled box in PIN mode: the character is transparent (also when disabled) and a dot is drawn over it. */
const DOT =
  "text-transparent! after:absolute after:inset-0 after:m-auto after:size-2 after:rounded-full after:bg-foreground after:content-[''] group-has-disabled:after:bg-muted-foreground"

function OtpRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<OtpProps, OtpValue>) {
  const t = useT()
  const [reveal, setReveal] = useState(false)
  const n = len(p)
  const bad = issues.length > 0 || undefined
  const hide = p.mask && !reveal

  /* Read-only: the code as selectable text in boxes; PIN mode never puts the code in the page. */
  if (state === "readonly") {
    const chars = p.mask ? Array.from(v, () => "•") : [...v]
    return (
      <div id={`${id}-input`} className="flex flex-col gap-1.5">
        <StaticBoxes p={p} chars={chars} tone="readonly" compact={compact} />
        <span className="sr-only">{p.mask ? t(L(`Hidden PIN, ${v.length} characters`, `PIN tersembunyi, ${v.length} karakter`)) : spaced(p, v)}</span>
        {p.mask && <p className="text-xs text-muted-foreground">{t(L("Hidden like a PIN.", "Disamarkan seperti PIN."))}</p>}
      </div>
    )
  }

  const live = state === "active"
  const complete = v.length === n && charsRe(p).test(v)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <InputOTP
          id={`${id}-input`}
          maxLength={n}
          value={v}
          onChange={(x) => live && onChange(clean(x))}
          pattern={digitsOnly(p) ? REGEXP_ONLY_DIGITS : REGEXP_ONLY_DIGITS_AND_CHARS}
          pasteTransformer={clean}
          inputMode={digitsOnly(p) ? "numeric" : "text"}
          autoCapitalize={digitsOnly(p) ? undefined : "characters"}
          /* PIN: a password-type input, so the value is not read aloud or offered for autofill. */
          type={hide ? "password" : "text"}
          autoComplete={p.mask ? "off" : "one-time-code"}
          data-1p-ignore={p.mask || undefined}
          data-lpignore={p.mask ? "true" : undefined}
          pushPasswordManagerStrategy="none"
          disabled={state === "disabled"}
          aria-invalid={bad}
          aria-describedby={`${id}-note`}
          containerClassName={compact ? "gap-1.5" : "gap-2"}
        >
          {groups(p).map((g, gi) => (
            <Fragment key={gi}>
              {gi > 0 && <InputOTPSeparator />}
              <InputOTPGroup>
                {g.map((i) => (
                  <InputOTPSlot key={i} index={i} aria-invalid={bad} className={cn("font-mono text-base", compact && "max-w-8", hide && i < v.length && DOT)} />
                ))}
              </InputOTPGroup>
            </Fragment>
          ))}
        </InputOTP>
        {p.mask && live && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={reveal}
            aria-controls={`${id}-input`}
            aria-label={t(reveal ? L("Hide the code", "Sembunyikan kode") : L("Show the code", "Tampilkan kode"))}
            onClick={() => setReveal(!reveal)}
            className="text-muted-foreground"
          >
            <HugeiconsIcon icon={reveal ? ViewOffIcon : ViewIcon} />
          </Button>
        )}
      </div>
      <p id={`${id}-note`} className="text-xs text-muted-foreground">
        {complete && !p.mask ? (
          <>
            {t(L("Saved as ", "Disimpan sebagai "))}
            <b className="font-mono font-semibold text-foreground">{v}</b>
          </>
        ) : (
          <>
            {t(unitText(p))}
            {" · "}
            {t(
              p.mask
                ? L("hidden like a PIN, not kept in drafts", "disamarkan seperti PIN, tidak ikut tersimpan di draf")
                : L("type it or paste the whole code", "ketik atau tempel seluruh kode"),
            )}
          </>
        )}
      </p>
    </div>
  )
}

/* ── context: the delivery note the code is printed on ──────────────────── */

function DeliveryNote({ props: p }: { props: OtpProps; value: OtpValue }) {
  const t = useT()
  const rows: [L10n, string][] = [
    [L("Note no.", "No. surat jalan"), "SJ/SKA/2611/0381"],
    [L("Supplier", "Pemasok"), "PT Sinar Kemasan Abadi"],
    [L("Order", "Pesanan"), "PO-2026-1187"],
    [L("Items", "Barang"), t(L("120 boxes of carton sheets", "120 dus lembaran karton"))],
  ]
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <HugeiconsIcon icon={DeliveryTruck01Icon} className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t(L("Delivery note (surat jalan)", "Surat jalan"))}</p>
          <p className="text-xs text-muted-foreground">{t(L("Handed over by the driver. Prototype data.", "Diserahkan sopir. Data prototipe."))}</p>
        </div>
      </div>
      <dl className="flex flex-col gap-1.5 text-xs">
        {rows.map(([k, x]) => (
          <div key={k.en} className="flex items-start justify-between gap-3">
            <dt className="shrink-0 text-muted-foreground">{t(k)}</dt>
            <dd className="text-right font-medium">{x}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-dashed border-border px-3 py-2.5">
        <span className="text-[11px] text-muted-foreground">{t(L("Delivery code", "Kode pengiriman"))}</span>
        <span className="font-mono text-lg font-semibold tracking-widest">{spaced(p, sampleCode(p))}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          L(
            "The code proves the delivery note reached the warehouse. Matching it with the supplier's data happens in a later service task.",
            "Kode ini membuktikan surat jalan sampai di gudang. Pencocokan dengan data pemasok dilakukan di service task berikutnya.",
          ),
        )}
      </p>
    </Card>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

function validate(p: OtpProps, v: OtpValue): Issue[] {
  if (!v) return p.required ? [{ fid: "otp", msg: reqMsg(p.label) }] : []
  if (!charsRe(p).test(v))
    return [
      {
        fid: "otp",
        msg: digitsOnly(p) ? L("Use digits only", "Gunakan angka saja") : L("Use letters A–Z and digits only", "Gunakan huruf A–Z dan angka saja"),
      },
    ]
  const n = len(p)
  if (v.length !== n)
    return [{ fid: "otp", msg: digitsOnly(p) ? L(`Enter all ${n} digits`, `Isi lengkap ${n} digit`) : L(`Enter all ${n} characters`, `Isi lengkap ${n} karakter`) }]
  return []
}

export const otp: ComponentDef<OtpProps, OtpValue> = {
  slug: "otp",
  wave: 4,
  ui: "OTP",
  vk: "string",
  group: "input",
  week: 6,
  icon: PasswordValidationIcon,
  label: L("OTP / PIN", "Kode OTP / PIN"),
  title: L("OTP / PIN code", "Kode OTP / PIN"),
  blurb: L("A short code in separate boxes, optionally hidden like a PIN.", "Kode pendek di kotak terpisah, bisa disamarkan seperti PIN."),

  defaults: () => ({
    label: L("Delivery code on the delivery note", "Kode pengiriman di surat jalan"),
    name: "delivery_code",
    length: 6,
    charset: "digits",
    mask: false,
    groupBy: 3,
    required: true,
  }),
  schema: (p) => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(),
        {
          t: "number",
          k: "length",
          label: L("Length", "Panjang"),
          min: 4,
          max: 8,
          hint: L("4–8 boxes. Delivery and SMS codes usually have 6.", "4–8 kotak. Kode pengiriman dan SMS biasanya 6."),
        },
        {
          t: "seg",
          k: "charset",
          label: L("Characters", "Karakter"),
          options: [
            { v: "digits", label: L("Digits 0–9", "Angka 0–9") },
            { v: "alphanumeric", label: L("Letters and digits", "Huruf dan angka") },
          ],
          hint: L("Letters are saved in uppercase. Phones show the number pad for digits.", "Huruf disimpan sebagai huruf kapital. Ponsel menampilkan papan angka untuk angka."),
        },
        {
          t: "seg",
          k: "groupBy",
          label: L("Group the boxes", "Kelompokkan kotak"),
          options: [
            { v: 0, label: L("No", "Tidak") },
            { v: 3, label: L("In threes (482 913)", "Per tiga (482 913)") },
          ],
          hint:
            p.groupBy === 3
              ? L(`Boxes: ${groupSizes(p).join(" + ")}. Easier to copy from paper. The dash is not saved.`, `Kotak: ${groupSizes(p).join(" + ")}. Lebih mudah disalin dari kertas. Tanda pisah tidak disimpan.`)
              : L("One row of boxes.", "Satu baris kotak."),
        },
        {
          t: "switch",
          k: "mask",
          label: L("Hide like a PIN", "Samarkan seperti PIN"),
          hint: L(
            "Dots instead of characters, with a show / hide button. Masked in task detail and history and not kept in drafts (**Wave 4 open decision 4**).",
            "Titik sebagai ganti karakter, dengan tombol tampilkan / sembunyikan. Disamarkan di detail task dan history, dan tidak ikut tersimpan di draf (**keputusan terbuka Gelombang 4 no. 4**).",
          ),
        },
        {
          t: "note",
          text: L(
            "Not authentication: the browser only collects the code. A later **service task** checks it (Wave 4 open decision 4).",
            "Bukan autentikasi: browser hanya mengumpulkan kode. **Service task** berikutnya yang mengeceknya (keputusan terbuka Gelombang 4 no. 4).",
          ),
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        F.required(),
        {
          t: "note",
          text: L(
            `A partly filled code is always rejected: “Enter all ${len(p)} ${digitsOnly(p) ? "digits" : "characters"}”.`,
            `Kode yang baru terisi sebagian selalu ditolak: “Isi lengkap ${len(p)} ${digitsOnly(p) ? "digit" : "karakter"}”.`,
          ),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: OtpCanvas,

  Runtime: OtpRuntime,
  Aside: DeliveryNote,
  initial: () => "",
  sample: sampleCode,
  validate,
  value: (_, v) => v,

  spec: (p) => ({
    ui_type: "OTP",
    value_kind: "string",
    name: p.name,
    label: p.label,
    required: p.required,
    config: { length: len(p), charset: p.charset, mask: p.mask, group_by: p.groupBy === 3 ? 3 : null },
  }),
  savedAs: (p) =>
    L(
      `The code as text in \`${p.name}\`, e.g. \`${sampleCode(p)}\`: no spaces, leading zeros kept${p.mask ? ". PIN mode hides it in task detail and history, not in the payload" : ""}.`,
      `Kode sebagai teks di \`${p.name}\`, mis. \`${sampleCode(p)}\`: tanpa spasi, angka nol di depan tetap ada${p.mask ? ". Mode PIN menyamarkannya di detail task dan history, bukan di payload" : ""}.`,
    ),
  notes: [
    L(
      "Not authentication: nothing is verified in the browser. A later **service task** checks the code (e.g. against the supplier's delivery data); no new backend for the component (Wave 4 open decision 4).",
      "Bukan autentikasi: tidak ada yang diverifikasi di browser. **Service task** berikutnya yang mengecek kode (mis. dengan data kiriman pemasok); tidak ada backend baru untuk komponen ini (keputusan terbuka Gelombang 4 no. 4).",
    ),
    L(
      "Always a string, never a number, so leading zeros survive (`048291`). Spaces and dashes from a paste are dropped; letters are uppercased.",
      "Selalu teks, bukan angka, supaya nol di depan tidak hilang (`048291`). Spasi dan tanda pisah dari tempelan dibuang; huruf dijadikan kapital.",
    ),
    L(
      "PIN mode (`mask`): dots in task detail and history, a password-type input, and not restored from Save Draft (proposal, Wave 4 open decision 4). The payload still carries the plain code for the service task.",
      "Mode PIN (`mask`): titik di detail task dan history, input bertipe password, dan tidak dipulihkan dari Simpan Draf (usulan, keputusan terbuka Gelombang 4 no. 4). Payload tetap membawa kode asli untuk service task.",
    ),
    L(
      'Built on shadcn `InputOTP` (input-otp): one real input under the boxes, so paste, SMS autofill (`autocomplete="one-time-code"`) and screen readers work.',
      'Memakai shadcn `InputOTP` (input-otp): satu input asli di bawah kotak-kotak, jadi tempel, isi otomatis SMS (`autocomplete="one-time-code"`), dan pembaca layar tetap berfungsi.',
    ),
  ],
  story: {
    process: L("Goods receipt", "Penerimaan barang"),
    step: L("Check the delivery", "Periksa kiriman"),
    ref: "GR-2026-0544",
    due: "2026-11-16",
    task: L("Receive delivery: PT Sinar Kemasan Abadi", "Terima kiriman: PT Sinar Kemasan Abadi"),
    before: [
      { name: "po_number", label: L("PO number", "Nomor PO"), type: "text", required: true, value: "PO-2026-1187" },
      {
        name: "quantity_received",
        label: L("Quantity received (boxes)", "Jumlah diterima (dus)"),
        type: "number",
        required: true,
        value: "",
        placeholder: L("e.g. 120", "mis. 120"),
        validate: (v) => (Number(v) > 0 ? null : L("Enter a quantity above 0", "Isi jumlah lebih dari 0")),
      },
    ],
    after: [
      {
        name: "condition",
        label: L("Condition", "Kondisi"),
        type: "select",
        required: true,
        value: "",
        options: [
          { v: "good", label: L("All good", "Semua baik") },
          { v: "partly_damaged", label: L("Some boxes damaged", "Sebagian dus rusak") },
          { v: "rejected", label: L("Rejected", "Ditolak") },
        ],
      },
      { name: "notes", label: L("Notes", "Catatan"), type: "textarea", rows: 2, value: "", placeholder: L("Optional", "Opsional") },
    ],
  },
}
