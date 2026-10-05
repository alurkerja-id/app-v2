/* eslint-disable react-refresh/only-export-components -- private helper of date-range.tsx: Input Date's Date Validation block plus its value helpers */
import { useId } from "react"

import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { L, useT, type L10n } from "../i18n"
import { KEY_RE, TODAY } from "../lib"
import { Rich } from "../rich"

/*
 * Same shape as Input Date's `dateValidation.minDate / maxDate` in Studio
 * (EditMinMaxDate.tsx): two switches and a value. With From Other Field the
 * value is the other field's key as `${key}`, exactly like Input Date
 * (shaping decision 3); otherwise it is an ISO date or "".
 */
export interface DateLimit {
  isToday: boolean
  fromField: boolean
  value: string
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

export const dateLimit = (value = "", isToday = false): DateLimit => ({ isToday, fromField: false, value })

/** The key inside `${key}`, or "". */
export const fieldOf = (l: DateLimit) => /^\$\{([^}]*)\}$/.exec(l.value)?.[1] ?? ""

/**
 * The ISO date this limit stands for in the prototype, or "" for no limit.
 * From Other Field is read from that field when the form runs; the mock task
 * has no such field, so it adds no limit here.
 */
export const limitISO = (l: DateLimit) => (l.isToday ? TODAY : l.fromField ? "" : ISO_RE.test(l.value) ? l.value : "")

/** What goes in `config.min_date` / `config.max_date`: "today", "${key}", "yyyy-mm-dd" or null. */
export const limitSpec = (l: DateLimit): string | null => (l.isToday ? "today" : l.value || null)

/** From Other Field needs a valid key. */
export function limitError(l: DateLimit): L10n | null {
  if (!l.fromField) return null
  const k = fieldOf(l)
  if (!k) return L("Please provide a field", "Isi key field asalnya")
  if (!KEY_RE.test(k)) return L("Use lowercase letters, numbers and _ and start with a letter", "Pakai huruf kecil, angka, dan _ serta diawali huruf")
  return null
}

/** One row of the Date Validation block: Today · From Other Field · a date. */
export function LimitEditor({
  label,
  hint,
  limit,
  invalid,
  onChange,
}: {
  label: L10n
  hint?: L10n
  limit: DateLimit
  invalid?: boolean
  onChange: (next: DateLimit) => void
}) {
  const t = useT()
  const id = useId()
  const key = fieldOf(limit)
  return (
    <div className="flex flex-col gap-2.5" role="group" aria-labelledby={`${id}-l`}>
      <span id={`${id}-l`} className="text-sm font-medium">
        {t(label)}
      </span>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <Switch
            id={`${id}-today`}
            size="sm"
            checked={limit.isToday}
            // Same rule as Input Date: the two switches exclude each other and reset the value.
            onCheckedChange={(c) => onChange({ isToday: c, fromField: c ? false : limit.fromField, value: "" })}
          />
          <Label htmlFor={`${id}-today`} className="text-sm font-normal">
            {t(L("Today", "Hari ini"))}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={`${id}-field`}
            size="sm"
            checked={limit.fromField}
            onCheckedChange={(c) => onChange({ fromField: c, isToday: c ? false : limit.isToday, value: "" })}
          />
          <Label htmlFor={`${id}-field`} className="text-sm font-normal">
            {t(L("From Other Field", "Dari field lain"))}
          </Label>
        </div>
      </div>
      {limit.fromField ? (
        <InputGroup className="w-64">
          <InputGroupAddon>
            <InputGroupText className="font-mono text-[13px]">{"${"}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            value={key}
            placeholder="key_field"
            spellCheck={false}
            aria-invalid={invalid || undefined}
            aria-label={`${t(label)} · ${t(L("Key of the other field", "Key field lain"))}`}
            className="font-mono text-[13px]"
            onChange={(e) => {
              const k = e.target.value.trim()
              onChange({ ...limit, value: k ? `\${${k}}` : "" })
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText className="font-mono text-[13px]">{"}"}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        !limit.isToday && (
          <Input
            type="date"
            value={limit.value}
            aria-invalid={invalid || undefined}
            aria-label={t(label)}
            className="w-48"
            onChange={(e) => onChange({ ...limit, value: e.target.value })}
          />
        )
      )}
      {hint && !limit.isToday && !limit.fromField && (
        <p className="text-xs text-muted-foreground">
          <Rich text={hint} />
        </p>
      )}
    </div>
  )
}
