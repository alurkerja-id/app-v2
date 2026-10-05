import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { useT } from "../i18n"
import type { FieldState, Issue } from "../types"
import { fieldFid, type Section, type Vals } from "./container-model"
import { CellControl } from "./repeater-runtime"

/* Runtime pieces shared by Tabs, Accordion and Wizard: the fields of one section,
   laid out like the task form (small label on top, message under the control). */

export function SectionFields({
  section,
  vals,
  onVal,
  state,
  issues,
  compact,
  idPrefix,
}: {
  section: Section
  vals: Vals
  onVal: (fieldId: string, v: string) => void
  state: FieldState
  issues: Issue[]
  compact: boolean
  idPrefix: string
}) {
  const t = useT()
  return (
    <div className={cn("grid gap-x-4 gap-y-4", compact ? "grid-cols-1" : "grid-cols-2")}>
      {section.fields.map((f) => {
        const fid = fieldFid(f)
        const mine = issues.filter((i) => i.fid === fid)
        const domId = `${idPrefix}-${f.id}`
        const wide = compact || f.kind === "textarea"
        return (
          <div key={f.id} className={cn("flex min-w-0 flex-col gap-1.5", wide && "col-span-full")} data-fid={fid}>
            <Label htmlFor={domId} className="text-xs text-muted-foreground">
              {t(f.label)}
              {f.required && (
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              )}
            </Label>
            <CellControl
              f={f}
              value={vals[f.id] ?? ""}
              onValue={(v) => onVal(f.id, v)}
              state={state}
              domId={domId}
              cell={`${section.id}:${f.id}`}
              ariaLabel={t(f.label)}
              invalid={mine.length > 0}
              card
              big={compact}
            />
            {mine.map((i) => (
              <p key={i.msg.en} role="alert" className="text-xs font-medium text-destructive">
                {t(i.msg)}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/** Small count badge for a tab / section / step with problems. */
export function IssueBadge({ n, className }: { n: number; className?: string }) {
  if (!n) return null
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white tabular-nums",
        className,
      )}
    >
      {n}
    </span>
  )
}
