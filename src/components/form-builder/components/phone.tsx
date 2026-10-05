/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useLayoutEffect, useRef } from "react"
import { CallIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { L, useT, type L10n } from "../i18n"
import { F, ctl, reqMsg } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"

/* Phone — ui_type INPUT + form_field_type phone, value_kind "string" (E.164). Story: vendor registration. */

const CC = {
  ID: { code: "62", name: L("Indonesia", "Indonesia"), mobile: /^8\d{8,11}$/, any: /^[2-9]\d{7,11}$/, eg: "0812-3456-7890", sample: "81234567890" },
  MY: { code: "60", name: L("Malaysia", "Malaysia"), mobile: /^1\d{8,9}$/, any: /^[1-9]\d{7,9}$/, eg: "012-345 6789", sample: "123456789" },
  SG: { code: "65", name: L("Singapore", "Singapura"), mobile: /^[89]\d{7}$/, any: /^[3689]\d{7}$/, eg: "8123 4567", sample: "81234567" },
}
type CountryCode = keyof typeof CC
const COUNTRIES = Object.keys(CC) as CountryCode[]
const isCC = (s: unknown): s is CountryCode => typeof s === "string" && Object.hasOwn(CC, s)

interface PhoneProps {
  label: L10n
  name: string
  placeholder: L10n
  /** Default country (select in Edit Element). */
  country: string
  allowOther: boolean
  accept: "mobile" | "any"
  required: boolean
}
/** Country + national significant number (digits without country code or trunk 0). */
interface PhoneValue {
  cc: CountryCode
  n: string
}

const country = (p: PhoneProps): CountryCode => (isCC(p.country) ? p.country : "ID")

/** NSN plus how many typed digits were dropped in front (country code, trunk 0) — used to keep the caret. */
function parse(raw: string, cc: CountryCode) {
  const all = raw.replace(/\D/g, "")
  const code = CC[cc].code
  let d = all
  if (d.startsWith(code) && raw.trim().startsWith("+")) d = d.slice(code.length)
  else if (d.startsWith(code) && d.length > 10) d = d.slice(code.length)
  if (d.startsWith("0")) d = d.slice(1)
  return { n: d.slice(0, 13), front: all.length - d.length }
}

/** Shown after the +62 box, without the trunk 0, so typing never shifts the caret. */
function display(n: string, cc: CountryCode) {
  if (!n) return ""
  return cc === "ID"
    ? n.replace(/^(\d{1,3})(\d{0,4})(\d{0,6})$/, (_, a: string, b: string, c: string) => [a, b, c].filter(Boolean).join("-"))
    : n.replace(/^(\d{1,3})(\d{0,4})(\d*)$/, (_, a: string, b: string, c: string) => [a, b, c].filter(Boolean).join(" "))
}

const valid = (p: PhoneProps, n: string, cc: CountryCode) => (p.accept === "mobile" ? CC[cc].mobile : CC[cc].any).test(n)

const acceptHint = (p: PhoneProps) => (p.accept === "mobile" ? L("Mobile numbers only", "Hanya nomor ponsel") : L("Mobile or landline", "Ponsel atau telepon rumah/kantor"))

function CodeBox({ cc, className }: { cc: CountryCode; className?: string }) {
  return (
    <span className={cn("flex items-center gap-1.5 tabular-nums", className)}>
      <span className="font-mono text-xs text-muted-foreground">{cc}</span>
      <span className="text-sm text-foreground">+{CC[cc].code}</span>
    </span>
  )
}

function PhoneCanvas({ props: p }: { props: PhoneProps }) {
  const t = useT()
  const cc = country(p)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-9 min-w-0 items-center rounded-3xl bg-[var(--input-surface)] text-sm shadow-[var(--input-depth)]">
        <CodeBox cc={cc} className="h-full shrink-0 border-r border-border/70 px-3" />
        <span className="truncate px-3 text-muted-foreground">{cc === "ID" ? t(p.placeholder) : CC[cc].eg}</span>
      </div>
      <p className="text-xs text-muted-foreground">{t(acceptHint(p))}</p>
    </div>
  )
}

function PhoneRuntime({ props: p, value: v, onChange, state, issues, id }: RuntimeProps<PhoneProps, PhoneValue>) {
  const t = useT()
  const live = state === "active"
  const bad = issues.length > 0 || undefined
  const ok = v.n !== "" && valid(p, v.n, v.cc)
  const input = useRef<HTMLInputElement>(null)
  /* Digits before the caret, restored after the value is re-formatted (same as the prototype). */
  const caret = useRef<number | null>(null)

  useLayoutEffect(() => {
    const el = input.current
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

  return (
    <div className="flex flex-col gap-1.5">
      <InputGroup data-disabled={state === "disabled" || undefined}>
        <InputGroupAddon className="h-full self-stretch border-r border-border/70 py-0 pr-3 font-normal">
          {p.allowOther && live ? (
            <Select value={v.cc} onValueChange={(c) => isCC(c) && onChange({ ...v, cc: c })}>
              <SelectTrigger
                size="sm"
                aria-label={t(L("Country code", "Kode negara"))}
                className="-ml-1.5 gap-1 bg-transparent px-1.5 shadow-none! focus-visible:ring-2 focus-visible:ring-ring/40 data-[size=sm]:h-7"
              >
                <CodeBox cc={v.cc} />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((k) => (
                  <SelectItem key={k} value={k}>
                    <span className="tabular-nums">
                      {k} +{CC[k].code}
                    </span>
                    <span className="text-muted-foreground">{t(CC[k].name)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <CodeBox cc={v.cc} />
          )}
        </InputGroupAddon>
        <InputGroupInput
          ref={input}
          id={`${id}-input`}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={display(v.n, v.cc)}
          placeholder={live ? (v.cc === "ID" ? t(p.placeholder) : CC[v.cc].eg) : undefined}
          aria-invalid={bad}
          aria-describedby={`${id}-note`}
          className="pl-3! tabular-nums"
          {...ctl(state)}
          onChange={(e) => {
            if (!live) return
            const raw = e.target.value
            const { n, front } = parse(raw, v.cc)
            const before = (raw.slice(0, e.target.selectionStart ?? raw.length).match(/\d/g) ?? []).length
            caret.current = Math.min(n.length, Math.max(0, before - front))
            onChange({ ...v, n })
          }}
        />
      </InputGroup>
      <p id={`${id}-note`} className="text-xs text-muted-foreground">
        {ok ? (
          <>
            {t(L("Saved as ", "Disimpan sebagai "))}
            <b className="font-mono font-semibold text-foreground">
              +{CC[v.cc].code}
              {v.n}
            </b>
          </>
        ) : (
          t(L(`Example: ${CC[v.cc].eg}`, `Contoh: ${CC[v.cc].eg}`))
        )}
      </p>
    </div>
  )
}

function validate(p: PhoneProps, v: PhoneValue): Issue[] {
  const c = CC[v.cc]
  if (!v.n) return p.required ? [{ fid: "input", msg: reqMsg(p.label) }] : []
  if (!valid(p, v.n, v.cc))
    return [
      {
        fid: "input",
        msg:
          p.accept === "mobile"
            ? L(`Enter a valid mobile number for ${c.name.en}, e.g. ${c.eg}`, `Isi nomor ponsel ${c.name.id} yang valid, mis. ${c.eg}`)
            : L(`Enter a valid phone number for ${c.name.en}`, `Isi nomor telepon ${c.name.id} yang valid`),
      },
    ]
  return []
}

export const phone: ComponentDef<PhoneProps, PhoneValue> = {
  slug: "phone",
  wave: 2,
  ui: "INPUT",
  fft: "phone",
  vk: "string",
  group: "input",
  week: 3,
  icon: CallIcon,
  label: L("Phone", "Telepon"),
  title: L("Phone number", "Nomor telepon"),
  blurb: L("Indonesian numbers with +62, formatted while typing, saved as E.164.", "Nomor Indonesia dengan +62, diformat saat diketik, disimpan sebagai E.164."),

  defaults: () => ({
    label: L("PIC mobile number", "Nomor ponsel PIC"),
    name: "pic_phone",
    placeholder: L("812-3456-7890", "812-3456-7890"),
    country: "ID",
    allowOther: false,
    accept: "mobile",
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(),
        { t: "i18n", k: "placeholder", label: L("Placeholder", "Placeholder") },
        {
          t: "select",
          k: "country",
          label: L("Default country", "Negara bawaan"),
          options: COUNTRIES.map((k) => ({ v: k, label: L(`${CC[k].name.en} (+${CC[k].code})`, `${CC[k].name.id} (+${CC[k].code})`) })),
        },
        { t: "switch", k: "allowOther", label: L("Let users change the country", "User boleh mengganti negara") },
        {
          t: "seg",
          k: "accept",
          label: L("Accept", "Terima"),
          options: [
            { v: "mobile", label: L("Mobile only", "Ponsel saja") },
            { v: "any", label: L("Any number", "Semua nomor") },
          ],
          hint: L("Mobile only matches what WhatsApp and SMS need.", "Ponsel saja cocok untuk kebutuhan WhatsApp dan SMS."),
        },
      ],
    },
    { tab: "validation", fields: [F.required()] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: PhoneCanvas,

  Runtime: PhoneRuntime,
  initial: (p) => ({ cc: country(p), n: "" }),
  sample: (p) => ({ cc: country(p), n: CC[country(p)].sample }),
  validate,
  value: (_, v) => (v.n ? `+${CC[v.cc].code}${v.n}` : ""),

  spec: (p) => ({
    ui_type: "INPUT",
    form_field_type: "phone",
    value_kind: "string",
    name: p.name,
    label: p.label,
    required: p.required,
    placeholder: p.placeholder,
    config: { default_country: p.country, allow_other_countries: p.allowOther, accept: p.accept },
  }),
  savedAs: (p) => L(`One string in \`${p.name}\`, always E.164: \`+6281234567890\`.`, `Satu teks di \`${p.name}\`, selalu E.164: \`+6281234567890\`.`),
  notes: [
    L(
      "Users may type 0812…, 812… or +62 812…; all are saved the same way, **E.164** without spaces.",
      "User boleh mengetik 0812…, 812…, atau +62 812…; semuanya disimpan sama, **E.164** tanpa spasi.",
    ),
    L(
      "It stays `ui_type: INPUT` with `form_field_type: phone`, like Text and Email.",
      "Tetap `ui_type: INPUT` dengan `form_field_type: phone`, seperti Text dan Email.",
    ),
    L(
      "Indonesian mobile: 8 followed by 8–11 digits after +62. The country list is Indonesia, Malaysia and Singapore in this wave.",
      "Ponsel Indonesia: angka 8 lalu 8–11 digit setelah +62. Daftar negara di gelombang ini: Indonesia, Malaysia, dan Singapura.",
    ),
  ],
  story: {
    process: L("Vendor registration", "Pendaftaran vendor"),
    step: L("Vendor details", "Data vendor"),
    ref: "VND-2026-0088",
    due: "2026-10-14",
    task: L("Complete vendor details: CV Mitra Kantor", "Lengkapi data vendor: CV Mitra Kantor"),
    before: [
      { name: "company_name", label: L("Company name", "Nama perusahaan"), type: "text", required: true, value: "CV Mitra Kantor" },
      { name: "pic_name", label: L("PIC name", "Nama PIC"), type: "text", required: true, value: "Dewi Kartika" },
    ],
  },
}
