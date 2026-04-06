import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlayIcon,
  Settings01Icon,
  GitBranchIcon,
  UserIcon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
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

function getPendingDuration(startDate: string): string {
  const start = new Date(startDate)
  const diff = Date.now() - start.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  if (hours < 24) return remainMinutes > 0 ? `${hours}h ${remainMinutes}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours > 0 ? `${days}d ${remainHours}h` : `${days}d`
}

export function HistoryTab() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggle(no: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(no)) next.delete(no)
      else next.add(no)
      return next
    })
  }

  const allExpanded = expanded.size === ACTIVITIES.length

  function toggleAll() {
    if (allExpanded) {
      setExpanded(new Set())
    } else {
      setExpanded(new Set(ACTIVITIES.map(a => a.no)))
    }
  }

  return (
    <div className="px-4 py-3">
      <div className="flex justify-end mb-2">
        <button
          onClick={toggleAll}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />

        <div className="flex flex-col gap-0">
          {ACTIVITIES.map((a, i) => {
            const config = TYPE_CONFIG[a.type]
            const isLast = i === ACTIVITIES.length - 1
            const isExpanded = expanded.has(a.no)

            return (
              <div
                key={a.no}
                className={cn("relative flex gap-3", !isLast && "pb-3")}
              >
                {/* Icon node */}
                <div className="relative z-10 flex flex-col items-center pt-2.5">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border transition-transform",
                      config.color,
                      isExpanded && "scale-110"
                    )}
                  >
                    <HugeiconsIcon icon={config.icon} className={cn("size-3.5", config.iconColor)} />
                  </div>
                </div>

                {/* Card + accordion */}
                <div className="flex-1 min-w-0">
                  {/* Card header — clickable */}
                  <button
                    className={cn(
                      "w-full text-left rounded-2xl border border-border bg-card px-3 py-2.5 transition-all hover:shadow-sm hover:bg-muted/40",
                      isExpanded && "rounded-b-none border-b-transparent shadow-sm"
                    )}
                    onClick={() => toggle(a.no)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug truncate">{a.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-normal text-[10px] px-1.5 py-0",
                            a.status === "In Progress"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {a.status === "Completed" && a.duration !== "-"
                            ? `Completed in ${a.duration}`
                            : a.status === "In Progress"
                            ? `Pending for ${getPendingDuration(a.startDate)}`
                            : a.status}
                        </Badge>
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          className={cn(
                            "size-3.5 text-muted-foreground/50 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 sm:gap-x-2 mt-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="secondary" className={cn("font-normal text-[10px] px-1.5 py-0 shrink-0", config.bg)}>
                          {a.type}
                        </Badge>
                        {a.assignee !== "-" && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0 truncate">
                            <HugeiconsIcon icon={UserIcon} className="size-3 shrink-0" />
                            {a.assignee}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 sm:ml-auto shrink-0">
                        <span className="text-[11px] text-muted-foreground">{a.startDate}</span>
                      </div>
                    </div>
                  </button>

                  {/* Accordion content */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-200 ease-in-out",
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="rounded-b-2xl border border-t-0 border-border bg-muted/30 px-3 pt-2.5 pb-3">
                      {/* Form fields */}
                      {a.formFields && a.formFields.length > 0 && (
                        <div className="flex flex-col gap-0">
                          <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-2">
                            Input Variables
                          </p>
                          {a.formFields.map((f) => (
                            <div key={f.label} className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
                              <span className="text-[11px] text-muted-foreground w-24 shrink-0 pt-px leading-relaxed">
                                {f.label}
                              </span>
                              <span className="text-[11px] font-medium text-foreground flex-1 min-w-0 leading-relaxed break-words">
                                {f.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
