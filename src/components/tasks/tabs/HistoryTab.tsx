import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlayIcon,
  Settings01Icon,
  GitBranchIcon,
  UserIcon,
  Calendar01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ActivityFormField {
  label: string
  value: string
}

interface HistoryActivity {
  no: number
  name: string
  type: "Start Event" | "Service Task" | "Exclusive Gateway" | "User Task"
  assignee: string
  startDate: string
  endDate: string
  duration: string
  status: "Completed" | "In Progress"
  formFields?: ActivityFormField[]
}

const ACTIVITIES: HistoryActivity[] = [
  {
    no: 1,
    name: "Izin diajukan",
    type: "Start Event",
    assignee: "Rina Susanti",
    startDate: "18 Mar 2026 21:36",
    endDate: "18 Mar 2026 21:36",
    duration: "-",
    status: "Completed",
    formFields: [
      { label: "Jenis Izin", value: "Izin Sakit" },
      { label: "Tanggal Mulai", value: "19 Mar 2026" },
      { label: "Tanggal Selesai", value: "20 Mar 2026" },
      { label: "Keterangan", value: "Demam tinggi, perlu istirahat 2 hari" },
      { label: "Lampiran", value: "surat_dokter.pdf" },
    ],
  },
  {
    no: 2,
    name: "Cek apakah overlap atau melebihi kuota izin",
    type: "Service Task",
    assignee: "-",
    startDate: "18 Mar 2026 21:36",
    endDate: "18 Mar 2026 21:36",
    duration: "2s",
    status: "Completed",
    formFields: [
      { label: "Sisa Kuota Izin", value: "8 hari" },
      { label: "Overlap", value: "Tidak" },
      { label: "Hasil Pengecekan", value: "Lolos validasi" },
    ],
  },
  {
    no: 3,
    name: "isAllocationRemaining AND isOverlap",
    type: "Exclusive Gateway",
    assignee: "-",
    startDate: "18 Mar 2026 21:36",
    endDate: "18 Mar 2026 21:36",
    duration: "-",
    status: "Completed",
    formFields: [
      { label: "Kondisi", value: "isAllocationRemaining = true AND isOverlap = false" },
      { label: "Hasil", value: "Lanjut ke approval" },
    ],
  },
  {
    no: 4,
    name: "Menyetujui Pengajuan Izin Oleh Lead I",
    type: "User Task",
    assignee: "Bayu Hendra",
    startDate: "18 Mar 2026 21:36",
    endDate: "-",
    duration: "-",
    status: "In Progress",
    formFields: [
      { label: "Approver", value: "Bayu Hendra" },
      { label: "Aksi", value: "Menunggu approval" },
    ],
  },
]

const TYPE_CONFIG: Record<string, { icon: typeof PlayIcon; color: string; iconColor: string; bg: string }> = {
  "Start Event": { icon: PlayIcon, color: "border-blue-500/30 bg-blue-500/10", iconColor: "text-blue-500", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  "Service Task": { icon: Settings01Icon, color: "border-violet-500/30 bg-violet-500/10", iconColor: "text-violet-500", bg: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  "Exclusive Gateway": { icon: GitBranchIcon, color: "border-orange-500/30 bg-orange-500/10", iconColor: "text-orange-500", bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  "User Task": { icon: UserIcon, color: "border-indigo-500/30 bg-indigo-500/10", iconColor: "text-indigo-500", bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
}

export function HistoryTab() {
  const [selected, setSelected] = useState<HistoryActivity | null>(null)

  return (
    <div className="px-4 py-3">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />

        <div className="flex flex-col gap-0">
          {ACTIVITIES.map((a, i) => {
            const config = TYPE_CONFIG[a.type]
            const isLast = i === ACTIVITIES.length - 1

            return (
              <div
                key={a.no}
                className={cn(
                  "relative flex gap-3 cursor-pointer group",
                  !isLast && "pb-3"
                )}
                onClick={() => setSelected(selected?.no === a.no ? null : a)}
              >
                {/* Icon node */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border transition-transform group-hover:scale-110",
                      config.color
                    )}
                  >
                    <HugeiconsIcon icon={config.icon} className={cn("size-3.5", config.iconColor)} />
                  </div>
                </div>

                {/* Card content */}
                <div
                  className={cn(
                    "flex-1 rounded-lg border border-border bg-card px-3 py-2.5 transition-all group-hover:shadow-sm group-hover:border-primary/20",
                    selected?.no === a.no && "ring-1 ring-primary/20"
                  )}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug truncate">{a.name}</p>
                    </div>
                    <Badge variant="secondary" className={cn("shrink-0 font-normal text-[10px] px-1.5 py-0", a.status === "In Progress" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")}>
                      {a.status}
                    </Badge>
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className={cn("font-normal text-[10px] px-1.5 py-0", config.bg)}>
                      {a.type}
                    </Badge>
                    {a.assignee !== "-" && (
                      <span className="text-[11px] text-muted-foreground truncate">{a.assignee}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{a.startDate}</span>
                    {a.duration !== "-" && (a.type === "User Task" || a.type === "Service Task") && (
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0">{a.duration}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail dialog without overlay */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="sm:max-w-md" showOverlay={false}>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected?.formFields && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selected.formFields.map((f) => (
                  <TableRow key={f.label}>
                    <TableCell className="font-medium text-muted-foreground">{f.label}</TableCell>
                    <TableCell>{f.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex items-center gap-5 text-xs pt-3 border-t border-border">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Assignee</span>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <HugeiconsIcon icon={UserIcon} className="size-3 text-muted-foreground/60" />
                {selected?.assignee}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Assigned At</span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <HugeiconsIcon icon={Clock01Icon} className="size-3 text-muted-foreground/60" />
                {selected?.startDate}
              </span>
            </div>
            {selected?.endDate !== "-" && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Completed At</span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <HugeiconsIcon icon={Calendar01Icon} className="size-3 text-muted-foreground/60" />
                  {selected?.endDate}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
