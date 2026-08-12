import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  Rocket01Icon,
  ArrowRight01Icon,
  FloppyDiskIcon,
  InformationCircleIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/drafts"
import { useDraft } from "@/hooks/use-draft"
import { DraftAutosaveStatus } from "@/components/drafts/DraftAutosaveStatus"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert"

/* ────────────────────────────────────────────────────────────────────────
   Start-process form. Toggles between a SHORT form (fits the screen) and a
   LONG form (exceeds screen height). All fields live inside one rounded
   "boxed" form. The submit button is an in-box footer that is `sticky
   bottom-0`: when the form is short it rests at the bottom of the box; when
   the form overflows it stays pinned to the bottom of the viewport — always
   visible, and always visually inside the box. Pure CSS — no height measuring.

   Every field is persisted to a local draft (autosave + a manual "Save
   Draft" button) so the process definition doesn't need to exist yet in
   Camunda for the user's in-progress input to be safe — see the
   "Save as Draft" PRD. Attachments are intentionally excluded: a real
   implementation should stage them separately (see PRD, "Attachments").
   Button copy is deliberately "Save Draft" everywhere (matches the terse
   verb-first labels used elsewhere: Delegate, Unclaim, Complete Task).
──────────────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { value: "procurement", label: "Procurement" },
  { value: "leave", label: "Leave Request" },
  { value: "reimbursement", label: "Reimbursement" },
  { value: "onboarding", label: "Onboarding" },
]

const DEPARTMENTS = [
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" },
  { value: "engineering", label: "Engineering" },
  { value: "operations", label: "Operations" },
]

interface StartProcessDraftData {
  long: boolean
  processName: string
  category: string
  priority: "low" | "medium" | "high"
  notes: string
  requester: string
  department: string
  dueDate: string
  estimatedAmount: string
  description: string
  justification: string
  additionalRecipients: string
  internalReferenceCode: string
  urgent: boolean
}

const EMPTY_DRAFT: StartProcessDraftData = {
  long: false,
  processName: "",
  category: "",
  priority: "medium",
  notes: "",
  requester: "",
  department: "",
  dueDate: "",
  estimatedAmount: "",
  description: "",
  justification: "",
  additionalRecipients: "",
  internalReferenceCode: "",
  urgent: false,
}

const TRACKED_TEXT_FIELDS: (keyof StartProcessDraftData)[] = [
  "processName",
  "category",
  "notes",
  "requester",
  "department",
  "dueDate",
  "estimatedAmount",
  "description",
  "justification",
  "additionalRecipients",
  "internalReferenceCode",
]

function computeStartProcessPercent(data: StartProcessDraftData) {
  const filled = TRACKED_TEXT_FIELDS.filter((k) => String(data[k]).trim() !== "").length
  return Math.round((filled / TRACKED_TEXT_FIELDS.length) * 100)
}

/* ── Layout primitives ───────────────────────────────────────────────── */

function Group({
  title,
  description,
  children,
}: {
  title?: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-5">
      {title && (
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
        {hint && <span className="ml-1.5 font-normal text-muted-foreground">— {hint}</span>}
      </Label>
      {children}
    </div>
  )
}

/* ── Reusable field pieces ───────────────────────────────────────────── */

function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const date = value ? new Date(value) : undefined
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-9 w-full items-center justify-between gap-2 rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-left text-sm transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <span className={cn("truncate", !date && "text-muted-foreground")}>
            {date ? format(date, "dd MMM yyyy") : "Pick a date"}
          </span>
          <HugeiconsIcon icon={Calendar01Icon} className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? d.toISOString() : "")}
        />
      </PopoverContent>
    </Popover>
  )
}

function CurrencyField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const display = value ? Number(value).toLocaleString("id-ID") : ""
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
      <Input
        value={display}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        placeholder="0"
        className="pl-9 tabular-nums"
      />
    </div>
  )
}

function AttachmentField() {
  const [files, setFiles] = useState<string[]>([])
  const onDrop = useCallback((accepted: File[]) => setFiles((p) => [...p, ...accepted.map((f) => f.name)]), [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })
  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed border-input px-4 py-6 text-center text-sm cursor-pointer hover:border-primary/50 hover:bg-muted/40",
          isDragActive && "border-primary bg-primary/5",
        )}
      >
        <input {...getInputProps()} />
        <p className="text-muted-foreground">{isDragActive ? "Drop files here…" : "Drag files or click to upload"}</p>
      </div>
      {files.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-1.5 text-xs">
              <span className="truncate">📄 {f}</span>
              <button type="button" onClick={() => setFiles(files.filter((_, x) => x !== i))} className="text-muted-foreground hover:text-foreground">×</button>
            </div>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">Not saved in the draft — re-attach if you resume this later.</p>
    </div>
  )
}

const CHECKLIST = [
  "Requester information verified",
  "Budget availability confirmed",
  "Manager approval obtained",
  "Supporting documents attached",
  "Compliance review completed",
]

/* ── Page ────────────────────────────────────────────────────────────── */

export function StartProcessPage() {
  const {
    data,
    setField,
    status,
    savedAt,
    saveNow,
    clearDraft,
    resumedNotice,
    dismissResumedNotice,
    discardResumed,
  } = useDraft(EMPTY_DRAFT, {
    key: "start-process",
    title: "Start a Process",
    context: "New process — not yet started",
    computePercent: computeStartProcessPercent,
    mode: "auto",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const long = data.long

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setIsSubmitting(false)
    clearDraft()
    toast.success("Process started", {
      description: data.processName ? `"${data.processName}" is now running.` : "Your process is now running.",
    })
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/70 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm">
              <HugeiconsIcon icon={Rocket01Icon} className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-heading text-lg font-semibold text-foreground">Start a Process</h1>
              <p className="truncate text-xs text-muted-foreground">
                Fill in the details below, then submit to begin the workflow.
              </p>
            </div>
          </div>
          <Label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-normal text-muted-foreground">
            <span className={cn(!long && "font-medium text-foreground")}>Short</span>
            <Switch checked={long} onCheckedChange={(v) => setField({ long: v })} />
            <span className={cn(long && "font-medium text-foreground")}>Long</span>
          </Label>
        </div>
      </div>

      {/* Form body */}
      <form className="mx-auto max-w-3xl px-4 pb-6 pt-2 sm:px-6" onSubmit={handleSubmit}>
        {resumedNotice && (
          <Alert className="mb-4">
            <HugeiconsIcon icon={InformationCircleIcon} />
            <AlertTitle>Resumed your draft</AlertTitle>
            <AlertDescription>
              {savedAt ? `Restored what you had saved ${formatRelativeTime(savedAt)}.` : "Restored your last saved draft."}{" "}
              <button type="button" onClick={discardResumed} className="underline underline-offset-3 hover:text-foreground">
                Discard and start blank
              </button>
              .
            </AlertDescription>
            <AlertAction>
              <Button variant="ghost" size="icon-sm" onClick={dismissResumedNotice}>
                <HugeiconsIcon icon={Cancel01Icon} />
              </Button>
            </AlertAction>
          </Alert>
        )}

        {/* The boxed form — no overflow-hidden so the in-box footer can stick */}
        <div className="rounded-4xl bg-card shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10">
          <div className="space-y-6 p-6 sm:p-8">
            <Group
              title={long ? "Request details" : undefined}
              description={long ? "What are you asking for?" : undefined}
            >
              <Field label="Process name" required>
                <Input
                  placeholder="e.g. Purchase of office equipment"
                  value={data.processName}
                  onChange={(e) => setField({ processName: e.target.value })}
                />
              </Field>

              <Field label="Category" required>
                <Select value={data.category} onValueChange={(v) => setField({ category: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Priority">
                <RadioGroup
                  value={data.priority}
                  onValueChange={(v) => setField({ priority: v as StartProcessDraftData["priority"] })}
                  className="flex gap-4 pt-1"
                >
                  {["low", "medium", "high"].map((v) => (
                    <Label key={v} className="flex items-center gap-1.5 font-normal capitalize">
                      <RadioGroupItem value={v} /> {v}
                    </Label>
                  ))}
                </RadioGroup>
              </Field>

              <Field label="Notes">
                <Textarea
                  rows={3}
                  placeholder="Add any context for the approver…"
                  value={data.notes}
                  onChange={(e) => setField({ notes: e.target.value })}
                />
              </Field>
            </Group>

            {/* Extra groups — only in the long form */}
            {long && (
              <>
                <div className="border-t border-border/60" />

                <Group title="Requester & budget" description="Who is requesting, and how much.">
                  <Field label="Requester" required>
                    <Input
                      placeholder="Full name"
                      value={data.requester}
                      onChange={(e) => setField({ requester: e.target.value })}
                    />
                  </Field>

                  <Field label="Department">
                    <Select value={data.department} onValueChange={(v) => setField({ department: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select a department" /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                    <Field label="Due date">
                      <DateField value={data.dueDate} onChange={(v) => setField({ dueDate: v })} />
                    </Field>
                    <Field label="Estimated amount" hint="Rupiah">
                      <CurrencyField value={data.estimatedAmount} onChange={(v) => setField({ estimatedAmount: v })} />
                    </Field>
                  </div>

                  <Field label="Description" hint="detailed">
                    <Textarea
                      rows={5}
                      placeholder="Describe the purpose and scope of this process…"
                      value={data.description}
                      onChange={(e) => setField({ description: e.target.value })}
                    />
                  </Field>

                  <Field label="Justification">
                    <Textarea
                      rows={4}
                      placeholder="Why is this needed now?"
                      value={data.justification}
                      onChange={(e) => setField({ justification: e.target.value })}
                    />
                  </Field>
                </Group>

                <div className="border-t border-border/60" />

                <Group title="Attachments & review" description="Supporting files and final checks.">
                  <Field label="Attachments">
                    <AttachmentField />
                  </Field>

                  <Field label="Pre-submission checklist">
                    <div className="flex flex-col gap-2 pt-1">
                      {CHECKLIST.map((item) => (
                        <Label key={item} className="flex items-center gap-2 font-normal">
                          <Checkbox /> {item}
                        </Label>
                      ))}
                    </div>
                  </Field>

                  <Field label="Additional recipients" hint="notified on completion">
                    <Textarea
                      rows={3}
                      placeholder="One email per line…"
                      value={data.additionalRecipients}
                      onChange={(e) => setField({ additionalRecipients: e.target.value })}
                    />
                  </Field>

                  <Field label="Internal reference code">
                    <Input
                      placeholder="e.g. PRC-2026-0142"
                      value={data.internalReferenceCode}
                      onChange={(e) => setField({ internalReferenceCode: e.target.value })}
                    />
                  </Field>

                  <div className="flex items-center gap-2 pt-1">
                    <Switch id="urgent" checked={data.urgent} onCheckedChange={(v) => setField({ urgent: v })} />
                    <Label htmlFor="urgent" className="font-normal">Flag as urgent — skips the queue</Label>
                  </div>
                </Group>
              </>
            )}
          </div>

          {/* In-box submit footer — rests at the box bottom, sticks to the
              viewport when the form overflows so it is always visible */}
          <div className="sticky bottom-0 z-10 rounded-b-4xl border-t border-border/60 bg-card/95 px-6 py-4 backdrop-blur sm:px-8">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="gap-2" onClick={() => { saveNow(); toast.success("Draft saved") }}>
                  <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
                  Save Draft
                </Button>
                <Button type="submit" size="lg" className="min-w-40 gap-2 rounded-full shadow-sm" disabled={isSubmitting}>
                  {isSubmitting ? "Starting…" : "Start Process"}
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                </Button>
              </div>
              <DraftAutosaveStatus status={status} savedAt={savedAt} />
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
