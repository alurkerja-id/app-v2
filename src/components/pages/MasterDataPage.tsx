import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Add01Icon,
  PencilEdit02Icon,
  Delete02Icon,
  Cancel01Icon,
  ArrowLeft01Icon,
  Database02Icon,
  Building06Icon,
  UserAccountIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { MasterDataSchema, MasterDataRecord, FieldDefinition } from "@/data/master-data"

const PAGE_SIZE = 10

/* ── Status Badge ── */
function StatusBadge({ value }: { value: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs font-medium",
        value === "Active"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400"
      )}
    >
      {value}
    </Badge>
  )
}

/* ── Dynamic Form Field ── */
function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
}) {
  switch (field.type) {
    case "select":
      return (
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case "number":
      return (
        <Input
          type="number"
          placeholder={field.placeholder}
          value={value != null ? String(value) : ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      )
    default:
      return (
        <Input
          type={field.type === "email" ? "email" : "text"}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}

/* ── Record Panel (Sheet) — handles view, edit, and create ── */
type PanelMode = "view" | "edit" | "create"

function RecordPanel({
  record,
  schema,
  mode,
  onClose,
  onSwitchMode,
  onSave,
  onDelete,
}: {
  record: MasterDataRecord | null
  schema: MasterDataSchema
  mode: PanelMode
  onClose: () => void
  onSwitchMode: (mode: PanelMode) => void
  onSave: (data: Record<string, unknown>) => void
  onDelete: () => void
}) {
  const formFields = schema.fields.filter((f) => f.showInDetail)
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    if (mode === "create") {
      const initial: Record<string, unknown> = {}
      formFields.forEach((f) => { initial[f.key] = "" })
      return initial
    }
    if (record) {
      const current: Record<string, unknown> = {}
      formFields.forEach((f) => { current[f.key] = record[f.key] ?? "" })
      return current
    }
    return {}
  })

  const isFormValid = formFields
    .filter((f) => f.required)
    .every((f) => formData[f.key] != null && formData[f.key] !== "")

  const title = mode === "create"
    ? `Add ${schema.singular}`
    : String(record?.[schema.fields[0]?.key] ?? record?.id ?? "")

  const subtitle = mode === "create" ? undefined : record?.id

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
        <div className="min-w-0 flex-1">
          {mode === "edit" && (
            <button
              onClick={() => onSwitchMode("view")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1 transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3" />
              Back to details
            </button>
          )}
          {subtitle && <p className="text-xs text-muted-foreground font-mono">{subtitle}</p>}
          <h2 className="text-lg font-semibold font-heading truncate">
            {mode === "edit" ? `Edit ${schema.singular}` : title}
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {mode === "view" ? (
            <>
              <Button variant="outline" size="sm" onClick={onDelete} className="gap-1.5 text-destructive hover:text-destructive">
                <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                Delete
              </Button>
              <Button size="sm" onClick={() => onSwitchMode("edit")} className="gap-1.5">
                <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => onSave(formData)} disabled={!isFormValid}>
                {mode === "create" ? `Add ${schema.singular}` : "Save Changes"}
              </Button>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} className="shrink-0 sm:hidden">
          <HugeiconsIcon icon={Cancel01Icon} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {mode === "view" ? (
          /* ── View Mode ── */
          <div className="grid gap-4">
            {formFields.map((field) => {
              const value = record?.[field.key]
              return (
                <div key={field.key} className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                  {field.key === "status" ? (
                    <StatusBadge value={String(value ?? "")} />
                  ) : (
                    <p className="text-sm">{value != null && value !== "" ? String(value) : "—"}</p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* ── Edit / Create Mode ── */
          <div className="grid gap-4">
            {formFields.map((field) => (
              <div key={field.key} className="grid gap-2">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                <DynamicField
                  field={field}
                  value={formData[field.key]}
                  onChange={(v) => setFormData((prev) => ({ ...prev, [field.key]: v }))}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer — mobile only */}
      <div className="flex sm:hidden items-center gap-2 border-t border-border bg-muted px-6 py-4">
        {mode === "view" ? (
          <>
            <Button variant="outline" size="sm" onClick={onDelete} className="gap-1.5 text-destructive hover:text-destructive">
              <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
              Delete
            </Button>
            <div className="flex-1" />
            <Button size="sm" onClick={() => onSwitchMode("edit")} className="gap-1.5">
              <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
              Edit
            </Button>
          </>
        ) : (
          <>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => onSave(formData)} disabled={!isFormValid}>
              {mode === "create" ? `Add ${schema.singular}` : "Save Changes"}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Main Page Component ── */
interface MasterDataPageProps {
  schema: MasterDataSchema
  data: MasterDataRecord[]
  onDataChange: (data: MasterDataRecord[]) => void
}

export function MasterDataPage({ schema, data, onDataChange }: MasterDataPageProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<PanelMode>("view")
  const [panelRecord, setPanelRecord] = useState<MasterDataRecord | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<MasterDataRecord | null>(null)

  const tableFields = schema.fields.filter((f) => f.showInTable)
  const formFields = schema.fields.filter((f) => f.showInDetail)

  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    const searchableKeys = schema.fields.filter((f) => f.searchable).map((f) => f.key)
    return data.filter((r) =>
      searchableKeys.some((key) => String(r[key] ?? "").toLowerCase().includes(q))
    )
  }, [search, data, schema.fields])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Open panel
  const openView = (record: MasterDataRecord) => {
    setPanelRecord(record)
    setPanelMode("view")
    setPanelOpen(true)
  }

  const openEdit = (record: MasterDataRecord) => {
    setPanelRecord(record)
    setPanelMode("edit")
    setPanelOpen(true)
  }

  const openCreate = () => {
    setPanelRecord(null)
    setPanelMode("create")
    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
  }

  // Save handler
  const handleSave = (formData: Record<string, unknown>) => {
    if (panelMode === "create") {
      const prefix = schema.singular.toUpperCase().slice(0, 3)
      const maxNum = data.reduce((max, r) => {
        const num = parseInt(r.id.split("-")[1] ?? "0")
        return num > max ? num : max
      }, 0)
      const newId = `${prefix}-${String(maxNum + 1).padStart(3, "0")}`
      const newRecord: MasterDataRecord = { id: newId } as MasterDataRecord
      formFields.forEach((f) => {
        newRecord[f.key] = formData[f.key]
      })
      onDataChange([newRecord, ...data])
    } else if (panelRecord) {
      onDataChange(
        data.map((r) => {
          if (r.id !== panelRecord.id) return r
          const updated = { ...r }
          formFields.forEach((f) => {
            updated[f.key] = formData[f.key]
          })
          return updated
        })
      )
    }
    closePanel()
  }

  // Delete handler
  const handleDelete = (record: MasterDataRecord) => {
    closePanel()
    setDeleteRecord(record)
  }

  const confirmDelete = () => {
    if (deleteRecord) {
      onDataChange(data.filter((r) => r.id !== deleteRecord.id))
      setDeleteRecord(null)
    }
  }

  // Key for remounting RecordPanel when record/mode changes
  const panelKey = `${panelMode}-${panelRecord?.id ?? "new"}`
  const titleIcon =
    schema.entity === "Departments"
      ? Building06Icon
      : schema.entity === "Positions"
        ? UserAccountIcon
        : schema.entity === "Locations"
          ? Location01Icon
          : Database02Icon

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-normal font-heading">
          <HugeiconsIcon icon={titleIcon} className="size-5 text-muted-foreground" />
          {schema.entity}
        </h1>
        <Button size="sm" onClick={openCreate} className="gap-1.5 sm:w-auto">
          <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
          <span className="hidden sm:inline">Add {schema.singular}</span>
        </Button>
      </div>
        <Card className="gap-0 py-0 overflow-hidden">
          {/* Toolbar: search + count + add */}
          <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-5 sm:py-2.5">
            <div className="relative w-full sm:max-w-xs">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Search ${schema.entity.toLowerCase()}...`}
                className="pl-8 h-8 shadow-none border-0 bg-muted/40 focus-visible:ring-0 w-full"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <span className="text-xs text-muted-foreground text-center sm:text-left sm:ml-auto">
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table — single component, responsive via CSS */}
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <HugeiconsIcon icon={Search01Icon} className="size-8 text-muted-foreground mb-2" />
              <p className="font-medium">No {schema.entity.toLowerCase()} found</p>
              <p className="text-sm text-muted-foreground">Adjust your search or add a new {schema.singular.toLowerCase()}</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="hidden sm:[display:table-header-group]">
                <TableRow className="h-8">
                  <TableHead className="w-24 py-1.5 text-xs">ID</TableHead>
                  {tableFields.map((f) => (
                    <TableHead key={f.key} className="py-1.5 text-xs">{f.label}</TableHead>
                  ))}
                  <TableHead className="w-20 py-1.5 text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((record) => (
                  <TableRow
                    key={record.id}
                    className="block sm:[display:table-row] cursor-pointer hover:bg-muted/40 sm:h-9 py-2.5 sm:py-0 px-4 sm:px-0"
                    onClick={() => openView(record)}
                  >
                    <TableCell className="flex items-center justify-between sm:[display:table-cell] p-0 pb-1 sm:p-3 sm:py-1.5">
                      <span className="font-mono text-xs text-muted-foreground">{record.id}</span>
                      <div className="flex items-center gap-1 sm:hidden" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(record)}>
                          <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(record)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    {tableFields.map((f) => (
                      <TableCell key={f.key} className="flex items-center gap-2 sm:[display:table-cell] p-0 py-0.5 sm:p-3 sm:py-1.5 whitespace-normal sm:whitespace-nowrap">
                        <span className="text-[11px] text-muted-foreground/60 min-w-20 shrink-0 sm:hidden">{f.label}</span>
                        {f.key === "status" ? (
                          <StatusBadge value={String(record[f.key] ?? "")} />
                        ) : (
                          <span className="text-xs">{record[f.key] != null ? String(record[f.key]) : "—"}</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="hidden sm:[display:table-cell] p-3 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(record)}
                        >
                          <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(record)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-2 border-t border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <p className="text-[11px] text-muted-foreground text-center sm:text-left">
                Page {page} of {totalPages}
              </p>
              <Pagination className="mx-0 w-full justify-center sm:w-auto sm:justify-end">
                <PaginationContent className="gap-0.5">
                  <PaginationItem>
                    <PaginationPrevious
                      text=""
                      size="icon-xs"
                      className="pl-0! text-[11px]"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (page > 1) setPage((p) => p - 1)
                      }}
                      aria-disabled={page <= 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        size="icon-xs"
                        className="text-[11px]"
                        href="#"
                        isActive={p === page}
                        onClick={(e) => {
                          e.preventDefault()
                          setPage(p)
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      text=""
                      size="icon-xs"
                      className="pr-0! text-[11px]"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        if (page < totalPages) setPage((p) => p + 1)
                      }}
                      aria-disabled={page >= totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>

      {/* Record Sheet — unified view / edit / create */}
      <Sheet open={panelOpen} onOpenChange={(open) => { if (!open) closePanel() }}>
        <SheetContent side="right" showCloseButton={false} className="w-full! sm:max-w-lg! p-0">
          <RecordPanel
            key={panelKey}
            record={panelRecord}
            schema={schema}
            mode={panelMode}
            onClose={closePanel}
            onSwitchMode={setPanelMode}
            onSave={handleSave}
            onDelete={() => panelRecord && handleDelete(panelRecord)}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRecord} onOpenChange={(open) => { if (!open) setDeleteRecord(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {schema.singular}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteRecord ? String(deleteRecord[schema.fields[0]?.key] ?? deleteRecord.id) : ""}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
