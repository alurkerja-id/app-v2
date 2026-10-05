import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { L, useT } from "./i18n"
import { PropertyEditor } from "./property-editor"
import { errorsByTab } from "./schema"
import type { ComponentDef, EditorTab } from "./types"

const TABS: { id: EditorTab; label: ReturnType<typeof L> }[] = [
  { id: "general", label: L("General", "Umum") },
  { id: "logic", label: L("Logic", "Logika") },
  { id: "validation", label: L("Validation", "Validasi") },
]

/**
 * Studio's Edit Element modal: General · Logic · Validation. Edits stay in a
 * draft until Save Changes; Discard Changes throws the draft away.
 */
export function EditElementDialog<P extends object, R>({
  def,
  props,
  open,
  onOpenChange,
  onSave,
}: {
  def: ComponentDef<P, R>
  props: P
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (next: P) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(52rem,calc(100dvh-2rem))] flex-col gap-0 p-0 sm:max-w-2xl">
        {/* Mounted only while open, so every opening starts from the saved props. */}
        {open && <EditElementBody def={def} props={props} onClose={() => onOpenChange(false)} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function EditElementBody<P extends object, R>({
  def,
  props,
  onClose,
  onSave,
}: {
  def: ComponentDef<P, R>
  props: P
  onClose: () => void
  onSave: (next: P) => void
}) {
  const t = useT()
  const [draft, setDraft] = useState<P>(props)
  const [tab, setTab] = useState<EditorTab>("general")
  const sections = def.schema(draft)
  const errors = errorsByTab(sections, draft)
  const total = errors.general + errors.logic + errors.validation
  const dirty = JSON.stringify(draft) !== JSON.stringify(props)

  return (
    <>
      <DialogHeader className="gap-1 px-6 pt-6 pb-4">
        <DialogTitle className="font-heading">{t(L("Edit Element", "Edit Elemen"))}</DialogTitle>
        <DialogDescription className="flex flex-wrap items-center gap-2">
          <HugeiconsIcon icon={def.icon} className="size-4" />
          <span className="text-foreground">{t(def.label)}</span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {def.ui}
            {def.fft ? ` · ${def.fft}` : ""}
          </Badge>
        </DialogDescription>
      </DialogHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as EditorTab)} className="px-6">
        <TabsList variant="line" className="w-full justify-start border-b border-border pb-0">
          {TABS.map((x) => (
            <TabsTrigger key={x.id} value={x.id} className="flex-none">
              {t(x.label)}
              {errors[x.id] > 0 && (
                <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px] tabular-nums">
                  {errors[x.id]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <PropertyEditor sections={sections} props={draft} onChange={setDraft} tab={tab} />
      </div>

      <DialogFooter className="flex-row items-center justify-between gap-2 border-t border-border px-6 py-4 sm:justify-between">
        <Button
          variant="destructive"
          size="sm"
          onClick={() =>
            toast.info(t(L("Delete is turned off in this prototype", "Hapus dimatikan di prototipe ini")), {
              description: t(L("In Studio this removes the element from the form.", "Di Studio ini menghapus elemen dari form.")),
            })
          }
        >
          {t(L("Delete Element", "Hapus Elemen"))}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t(L("Discard Changes", "Buang Perubahan"))}
          </Button>
          <Button
            size="sm"
            disabled={total > 0 || !dirty}
            onClick={() => {
              onSave(draft)
              onClose()
              toast.success(t(L("Element saved", "Elemen disimpan")))
            }}
          >
            {t(L("Save Changes", "Simpan Perubahan"))}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}
