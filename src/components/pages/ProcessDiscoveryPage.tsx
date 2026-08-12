import { useCallback, useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Analytics01Icon,
  ArrowDown01Icon,
  Calendar03Icon,
  Clock01Icon,
  InformationCircleIcon,
  MinusSignIcon,
  ReloadIcon,
  StopWatchIcon,
  TimeHalfPassIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import NavigatedViewer from "bpmn-js/lib/NavigatedViewer"
import { is } from "bpmn-js/lib/util/ModelUtil"
import "bpmn-js/dist/assets/diagram-js.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import {
  DISCOVERY_NODES,
  PROCESS_OPTIONS,
  TOTAL_INSTANCES,
  VERSION_OPTIONS,
  manhourOf,
  nodeValue,
  slaDelta,
  slaIntensity,
  slaOnTimePct,
  slaStatus,
  type ExecutionStatus,
  type HeatmapType,
} from "@/data/process-discovery"

const DATE_PRESETS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
]

const activityTypes = new Set(["userTask", "serviceTask"])

// Adaptive elapsed-time label from a value in hours (for duration mode).
function formatDuration(hours: number) {
  if (!(hours > 0)) return "0 h"
  if (hours < 1) return `${(hours * 60).toFixed(0)} min`
  if (hours < 24) return `${hours.toFixed(1)} h`
  const days = hours / 24
  if (days < 30) return `${days.toFixed(1)} d`
  return `${(days / 30).toFixed(1)} mo`
}

// Man-hours are a quantity of effort, not an elapsed span, so they are shown as
// a plain hour count with a thousands separator — never scaled to days.
function formatManhour(hours: number) {
  return `${Math.round(hours).toLocaleString("en-US")} mh`
}

// Compact {value, unit} for the diagram badge.
function badgeParts(value: number, heatmap: HeatmapType): { value: string; unit: string } {
  if (heatmap === "frequency") return { value: String(value), unit: "x" }
  if (heatmap === "manhour") return { value: Math.round(value).toLocaleString("en-US"), unit: "mh" }
  if (value < 1) return { value: (value * 60).toFixed(0), unit: "min" }
  if (value < 24) return { value: value.toFixed(1), unit: "h" }
  return { value: (value / 24).toFixed(1), unit: "d" }
}

export function ProcessDiscoveryPage() {
  const viewerRef = useRef<HTMLDivElement>(null)
  const viewerInstance = useRef<any>(null)
  const heatmapTypeRef = useRef<HeatmapType>("duration")

  const [procKey, setProcKey] = useState(PROCESS_OPTIONS[0]?.key ?? "")
  const [versionId, setVersionId] = useState(VERSION_OPTIONS[0]?.id ?? "")
  const [rangeDays, setRangeDays] = useState("30")
  const [instanceType, setInstanceType] = useState<ExecutionStatus>("all")
  const [heatmapType, setHeatmapType] = useState<HeatmapType>("duration")
  const [deltaSort, setDeltaSort] = useState<"none" | "asc" | "desc">("none")
  const [bpmnLoaded, setBpmnLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Paint per-activity heatmap markers + value badges onto the BPMN diagram.
  const renderHeatmap = useCallback(() => {
    if (!viewerInstance.current) return
    const elementRegistry = viewerInstance.current.get("elementRegistry")
    const overlays = viewerInstance.current.get("overlays")
    const canvas = viewerInstance.current.get("canvas")

    // Clear previous markers + overlays.
    elementRegistry.forEach((element: any) => {
      for (let i = 0; i <= 10; i++) {
        canvas.removeMarker(element.id, "hm-frequency-" + i)
        canvas.removeMarker(element.id, "hm-manhour-" + i)
        canvas.removeMarker(element.id, "hm-duration-" + i)
        canvas.removeMarker(element.id, "hm-sla-met-" + i)
        canvas.removeMarker(element.id, "hm-sla-breached-" + i)
        canvas.removeMarker(element.id, "hm-slarate-" + i)
      }
      try {
        overlays.remove({ element: element.id })
      } catch {
        // no overlay here
      }
    })

    // Range of values across nodes that have data — sets the colour scale.
    let minVal = Infinity
    let maxVal = -Infinity
    const byId: Record<string, (typeof DISCOVERY_NODES)[number]> = {}
    DISCOVERY_NODES.forEach((n) => {
      byId[n.id] = n
      const v = nodeValue(n, heatmapType)
      if (v == null) return
      if (v < minVal) minVal = v
      if (v > maxVal) maxVal = v
    })

    const neutralBadge = (id: string, inner: string) =>
      overlays.add(id, "heatmap-badge", {
        position: { bottom: 0, right: 0 },
        html: `<div class="flex items-baseline gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-zinc-400 shadow-md ring-1 ring-zinc-200/60">${inner}</div>`,
      })

    elementRegistry.forEach((element: any) => {
      const node = byId[element.id]
      if (!node) return

      // Every mode except frequency measures work steps only; gateways and
      // events have no duration or SLA, so they stay uncoloured there.
      if (heatmapType !== "frequency" && !is(element, "bpmn:Activity")) return

      // ── SLA Status: colour by verdict (green Met / red Breached), intensity
      // by how far the average sits from the target. Nodes without a verdict
      // (no SLA target, or no execution data) stay neutral. ────────────────
      if (heatmapType === "slaStatus") {
        const status = slaStatus(node)
        const intensity = slaIntensity(node, DISCOVERY_NODES)
        const delta = slaDelta(node)
        if (status == null || intensity == null || delta == null) {
          neutralBadge(element.id, `<span>—</span>`)
          return
        }
        const step = Math.round(intensity * 10)
        canvas.addMarker(element.id, `hm-sla-${status.toLowerCase()}-${step}`)

        const textColor = status === "Breached" ? "text-red-600" : "text-emerald-600"
        const ringColor = status === "Breached" ? "ring-red-200" : "ring-emerald-200"
        const label = `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`
        overlays.add(element.id, "heatmap-badge", {
          position: { bottom: 0, right: 0 },
          html: `<div class="flex items-baseline gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold ${textColor} shadow-md ring-1 ${ringColor}"><span>${label}</span><span class="text-[10px] font-medium text-zinc-500">h</span></div>`,
        })
        return
      }

      // ── SLA Compliance: colour by the share of instances that finished on
      // time — a traffic scale on the absolute 0–100% (red = few on time,
      // green = nearly all). Shows the consistency the average verdict hides. ─
      if (heatmapType === "slaRate") {
        const pct = slaOnTimePct(node)
        if (pct == null) {
          neutralBadge(element.id, `<span>—</span>`)
          return
        }
        const step = Math.round((pct / 100) * 10)
        canvas.addMarker(element.id, `hm-slarate-${step}`)

        const textColor =
          pct >= 80 ? "text-emerald-600" : pct < 60 ? "text-red-600" : "text-zinc-900"
        const ringColor =
          pct >= 80 ? "ring-emerald-200" : pct < 60 ? "ring-red-200" : "ring-zinc-200/60"
        overlays.add(element.id, "heatmap-badge", {
          position: { bottom: 0, right: 0 },
          html: `<div class="flex items-baseline gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold ${textColor} shadow-md ring-1 ${ringColor}"><span>${pct.toFixed(0)}</span><span class="text-[10px] font-medium text-zinc-500">%</span></div>`,
        })
        return
      }

      // ── Magnitude modes (duration / frequency / man-hours): a single ramp
      // scaled to the biggest value in the process — no SLA verdict mixed in. ─
      const val = nodeValue(node, heatmapType)
      if (val == null) {
        neutralBadge(element.id, `<span>—</span>`)
        return
      }

      const intensity = maxVal === minVal ? 1 : (val - minVal) / (maxVal - minVal || 1)
      const step = Math.round(intensity * 10)
      canvas.addMarker(element.id, `hm-${heatmapType}-${step}`)

      const b = badgeParts(val, heatmapType)
      overlays.add(element.id, "heatmap-badge", {
        position: { bottom: 0, right: 0 },
        html: `<div class="flex items-baseline gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-zinc-900 shadow-md ring-1 ring-zinc-200/60"><span>${b.value}</span><span class="text-[10px] font-medium text-zinc-500">${b.unit}</span></div>`,
      })
    })
  }, [heatmapType])

  // Load the contract diagram once.
  useEffect(() => {
    if (!viewerRef.current) return
    setBpmnLoaded(false)
    if (viewerInstance.current) {
      viewerInstance.current.destroy()
      viewerInstance.current = null
    }
    const viewer = new NavigatedViewer({ container: viewerRef.current }) as any
    viewerInstance.current = viewer

    let mounted = true
    fetch("/contract.bpmn")
      .then((r) => r.text())
      .then(async (xml) => {
        if (!mounted) return
        await viewer.importXML(xml)
        viewer.get("canvas").zoom("fit-viewport")
        setBpmnLoaded(true)
      })
      .catch((err) => {
        console.error("Failed to load BPMN", err)
        setBpmnLoaded(true)
      })

    return () => {
      mounted = false
      if (viewerInstance.current) {
        viewerInstance.current.destroy()
        viewerInstance.current = null
      }
    }
  }, [procKey, versionId])

  // Simulate the "updating…" flicker every filter change, then repaint.
  useEffect(() => {
    heatmapTypeRef.current = heatmapType
    if (!bpmnLoaded) return
    setIsLoading(true)
    const t = setTimeout(() => {
      renderHeatmap()
      setIsLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [bpmnLoaded, heatmapType, instanceType, rangeDays, versionId, renderHeatmap])

  const zoom = (factor: number) => {
    const canvas = viewerInstance.current?.get("canvas")
    if (canvas) canvas.zoom(canvas.zoom() * factor)
  }
  const zoomReset = () => viewerInstance.current?.get("canvas")?.zoom("fit-viewport")

  // ── Derived summaries ────────────────────────────────────────────────
  const userTasks = DISCOVERY_NODES.filter((n) => activityTypes.has(n.type) && n.avgDurationHours != null)
  const slaTasks = userTasks.filter((n) => n.sla != null)
  const withinSla = slaTasks.filter((n) => slaStatus(n) === "Met").length
  const breaches = slaTasks.length - withinSla

  const slowest = [...userTasks].sort((a, b) => (b.avgDurationHours ?? 0) - (a.avgDurationHours ?? 0))[0]
  const fastest = [...userTasks].sort((a, b) => (a.avgDurationHours ?? 0) - (b.avgDurationHours ?? 0))[0]
  const mostFrequent = [...DISCOVERY_NODES].filter((n) => activityTypes.has(n.type)).sort((a, b) => b.frequency - a.frequency)[0]
  const totalManhour = userTasks.reduce((sum, n) => sum + (manhourOf(n) ?? 0), 0)
  const biggestEffort = [...userTasks].sort((a, b) => (manhourOf(b) ?? 0) - (manhourOf(a) ?? 0))[0]
  const totalExecutions = userTasks.reduce((sum, n) => sum + n.frequency, 0)
  const worstBreach = slaTasks
    .filter((n) => slaStatus(n) === "Breached")
    .sort((a, b) => (slaDelta(b) ?? 0) - (slaDelta(a) ?? 0))[0]

  // Within-SLA as a percentage (the count-only card gains a % companion).
  const withinPct = slaTasks.length ? Math.round((withinSla / slaTasks.length) * 100) : 0

  // Compliance mode: instance-level on-time attainment.
  const rateTasks = slaTasks.filter((n) => n.onTimeRate != null)
  // Overall on-time weighted by how often each step runs — one run, one vote.
  const totalRateFreq = rateTasks.reduce((s, n) => s + n.frequency, 0)
  const overallOnTime = totalRateFreq
    ? Math.round((rateTasks.reduce((s, n) => s + (n.onTimeRate ?? 0) * n.frequency, 0) / totalRateFreq) * 100)
    : 0
  const atRisk = rateTasks.filter((n) => (n.onTimeRate ?? 1) < 0.8).length
  const lowestCompliance = [...rateTasks].sort((a, b) => (a.onTimeRate ?? 1) - (b.onTimeRate ?? 1))[0]

  const tiles =
    heatmapType === "frequency"
      ? [
          { tint: "neutral", icon: Analytics01Icon, label: "Process Instances", value: String(TOTAL_INSTANCES) },
          { tint: "violet", icon: ReloadIcon, label: "Most Repeated", value: mostFrequent?.name ?? "—", sub: `${mostFrequent?.frequency}x` },
          { tint: "purple", icon: TimeHalfPassIcon, label: "Total Executions", value: String(totalExecutions) },
          { tint: "fuchsia", icon: UserGroupIcon, label: "Activities", value: String(userTasks.length) },
          { tint: "pink", icon: StopWatchIcon, label: "Avg per Activity", value: (totalExecutions / userTasks.length).toFixed(0) + "x" },
        ]
      : heatmapType === "manhour"
        ? [
            { tint: "neutral", icon: Analytics01Icon, label: "Process Instances", value: String(TOTAL_INSTANCES) },
            { tint: "violet", icon: UserGroupIcon, label: "Total Man-hours", value: formatManhour(totalManhour) },
            { tint: "purple", icon: StopWatchIcon, label: "Biggest Effort", value: biggestEffort?.name ?? "—", sub: formatManhour(manhourOf(biggestEffort!) ?? 0) },
            { tint: "fuchsia", icon: TimeHalfPassIcon, label: "Avg per Activity", value: formatManhour(totalManhour / userTasks.length) },
            { tint: "pink", icon: Analytics01Icon, label: "Activities", value: String(userTasks.length) },
          ]
        : heatmapType === "slaStatus"
          ? [
              { tint: "neutral", icon: Analytics01Icon, label: "Process Instances", value: String(TOTAL_INSTANCES) },
              { tint: withinSla === slaTasks.length ? "emerald" : "violet", icon: Clock01Icon, label: "Within SLA", value: `${withinSla} / ${slaTasks.length}`, sub: `${withinPct}% of activities` },
              { tint: breaches > 0 ? "red" : "pink", icon: InformationCircleIcon, label: "SLA Breaches", value: String(breaches) },
              { tint: "purple", icon: StopWatchIcon, label: "Worst Breach", value: worstBreach?.name ?? "—", sub: worstBreach ? `+${(slaDelta(worstBreach) ?? 0).toFixed(1)} h` : "—" },
              { tint: "fuchsia", icon: TimeHalfPassIcon, label: "Avg Activity Duration", value: formatDuration(userTasks.reduce((s, n) => s + (n.avgDurationHours ?? 0), 0) / userTasks.length) },
            ]
          : heatmapType === "slaRate"
          ? [
              { tint: "neutral", icon: Analytics01Icon, label: "Process Instances", value: String(TOTAL_INSTANCES) },
              { tint: overallOnTime >= 80 ? "emerald" : "violet", icon: Clock01Icon, label: "Overall On-time", value: `${overallOnTime}%`, sub: "of all runs within SLA" },
              { tint: atRisk > 0 ? "red" : "pink", icon: InformationCircleIcon, label: "At Risk (<80%)", value: String(atRisk), sub: `of ${rateTasks.length} activities` },
              { tint: "purple", icon: StopWatchIcon, label: "Lowest Compliance", value: lowestCompliance?.name ?? "—", sub: lowestCompliance ? `${Math.round((lowestCompliance.onTimeRate ?? 0) * 100)}% on time` : "—" },
              { tint: "fuchsia", icon: TimeHalfPassIcon, label: "Within SLA (avg)", value: `${withinSla} / ${slaTasks.length}`, sub: `${withinPct}% of activities` },
            ]
          : [
              { tint: "neutral", icon: Analytics01Icon, label: "Process Instances", value: String(TOTAL_INSTANCES) },
              { tint: "violet", icon: TimeHalfPassIcon, label: "Avg Activity Duration", value: formatDuration(userTasks.reduce((s, n) => s + (n.avgDurationHours ?? 0), 0) / userTasks.length) },
              { tint: "purple", icon: StopWatchIcon, label: "Slowest Activity", value: slowest?.name ?? "—", sub: formatDuration(slowest?.avgDurationHours ?? 0) },
              { tint: "fuchsia", icon: StopWatchIcon, label: "Fastest Activity", value: fastest?.name ?? "—", sub: formatDuration(fastest?.avgDurationHours ?? 0) },
              { tint: "pink", icon: UserGroupIcon, label: "Activities", value: String(userTasks.length) },
            ]

  // Activity table rows — user tasks (+ service tasks) only, in diagram order.
  const rows = DISCOVERY_NODES.filter((n) =>
    heatmapType === "frequency" ? true : activityTypes.has(n.type),
  )

  const showSlaColumns = heatmapType === "slaStatus" || heatmapType === "slaRate"

  // Δ column is sortable in the SLA modes so the worst overshoots float to the
  // top; otherwise rows keep their diagram order.
  const displayRows =
    showSlaColumns && deltaSort !== "none"
      ? [...rows].sort((a, b) => {
          const da = slaDelta(a)
          const db = slaDelta(b)
          if (da == null && db == null) return 0
          if (da == null) return 1 // no-data rows sink to the bottom
          if (db == null) return -1
          return deltaSort === "asc" ? da - db : db - da
        })
      : rows

  const cycleDeltaSort = () =>
    setDeltaSort((s) => (s === "none" ? "desc" : s === "desc" ? "asc" : "none"))

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-7 shrink-0 items-center">
            <HugeiconsIcon icon={Analytics01Icon} className="size-5 text-muted-foreground" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Process Discovery</h1>
            <p className="text-sm text-muted-foreground">
              Visualize process performance on the diagram — by duration, frequency, man-hours, SLA status, or SLA compliance.
            </p>
          </div>
        </div>
        {isLoading && (
          <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Updating…
          </div>
        )}
      </div>

      {/* Filter bar */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <FilterField label="Process">
            <FilterCombobox
              value={procKey}
              onValueChange={setProcKey}
              options={PROCESS_OPTIONS.map((p) => ({ value: p.key, label: p.name }))}
              placeholder="Select a process…"
            />
          </FilterField>
          <FilterField label="Version">
            <FilterCombobox
              value={versionId}
              onValueChange={setVersionId}
              options={VERSION_OPTIONS.map((v, i) => ({
                value: v.id,
                label: i === 0 ? `Latest (v${v.version})` : `v${v.version}`,
              }))}
              placeholder="—"
            />
          </FilterField>
          <FilterField label="Creation Date">
            <FilterCombobox
              value={rangeDays}
              onValueChange={setRangeDays}
              options={DATE_PRESETS}
              placeholder="Last 30 days"
              icon={Calendar03Icon}
            />
          </FilterField>
          <FilterField label="Instances">
            <FilterCombobox
              value={instanceType}
              onValueChange={(v) => setInstanceType(v as ExecutionStatus)}
              options={[
                { value: "all", label: "All Instances" },
                { value: "running", label: "Only Active" },
                { value: "completed", label: "Only Completed" },
              ]}
              placeholder="All Instances"
            />
          </FilterField>
          <FilterField label="Heatmap">
            <FilterCombobox
              value={heatmapType}
              onValueChange={(v) => setHeatmapType(v as HeatmapType)}
              options={[
                { value: "duration", label: "By Duration (hrs)" },
                { value: "frequency", label: "By Frequency (x)" },
                { value: "manhour", label: "By Man-hours (mh)" },
                { value: "slaStatus", label: "By SLA Status" },
                { value: "slaRate", label: "By SLA Compliance (%)" },
              ]}
              placeholder="By Duration (hrs)"
            />
          </FilterField>
        </div>
      </Card>

      {/* Summary tiles */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <SummaryCell key={t.label} {...(t as SummaryProps)} />
        ))}
      </div>

      {/* Heatmap + table */}
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <h3 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Heatmap Analysis
          </h3>
          <TooltipProvider>
            <div className="flex items-center gap-0.5">
              <ZoomBtn onClick={() => zoom(1 / 1.25)} icon={MinusSignIcon} tip="Zoom Out" />
              <ZoomBtn onClick={zoomReset} icon={ReloadIcon} tip="Reset Zoom" />
              <ZoomBtn onClick={() => zoom(1.25)} icon={Add01Icon} tip="Zoom In" />
            </div>
          </TooltipProvider>
        </div>
        <div className="h-[320px] w-full p-4 sm:h-[400px] md:h-[460px]">
          <div ref={viewerRef} className="h-full w-full rounded-lg border border-border bg-card" />
        </div>

        <div className="border-t border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center justify-end gap-1">
                    {(heatmapType === "duration" || heatmapType === "slaStatus") && "Avg Duration"}
                    {heatmapType === "frequency" && "Frequency"}
                    {heatmapType === "manhour" && "Man-hours"}
                    {heatmapType === "slaRate" && "On-time %"}
                    {heatmapType === "manhour" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex cursor-help">
                              <HugeiconsIcon icon={InformationCircleIcon} className="size-3.5 text-muted-foreground" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs font-normal">
                            Total effort at this step: how often it ran × how long each run took (frequency × avg duration).
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </span>
                </TableHead>
                {showSlaColumns && <TableHead className="text-right">SLA Target</TableHead>}
                {showSlaColumns && <TableHead className="text-center">Status</TableHead>}
                {showSlaColumns && (
                  <TableHead
                    className="group cursor-pointer text-right select-none"
                    onClick={cycleDeltaSort}
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      Δ vs SLA
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        className={cn(
                          "size-3 transition-transform",
                          deltaSort === "none" && "opacity-0 group-hover:opacity-40",
                          deltaSort !== "none" && "text-primary",
                          deltaSort === "asc" && "rotate-180",
                        )}
                      />
                    </span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((n) => {
                const val = nodeValue(n, heatmapType)
                const status = slaStatus(n)
                const delta = slaDelta(n)
                return (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium text-foreground">{n.name}</TableCell>
                    <TableCell className="text-muted-foreground">{n.type}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {val == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : heatmapType === "frequency" ? (
                        `${val}x`
                      ) : heatmapType === "manhour" ? (
                        formatManhour(val)
                      ) : heatmapType === "slaRate" ? (
                        `${val.toFixed(0)}%`
                      ) : (
                        formatDuration(val)
                      )}
                    </TableCell>
                    {showSlaColumns && (
                      <TableCell className="text-right text-muted-foreground">
                        {n.sla != null ? formatDuration(n.sla) : "—"}
                      </TableCell>
                    )}
                    {showSlaColumns && (
                      <TableCell className="text-center">
                        {status ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-medium",
                              status === "Met"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700",
                            )}
                          >
                            {status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    )}
                    {showSlaColumns && (
                      <TableCell
                        className={cn(
                          "text-right font-medium",
                          delta == null ? "text-muted-foreground" : delta > 0 ? "text-red-600" : "text-emerald-600",
                        )}
                      >
                        {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} h`}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {displayRows.length === 0 && (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={Analytics01Icon} />
                </EmptyMedia>
                <EmptyTitle>No Analytics Data</EmptyTitle>
                <EmptyDescription>Adjust the filters to see activity metrics.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </Card>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Prototype — sample data for the Contract Approval process.
      </p>

      <style>{heatmapStyles}</style>
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

function ZoomBtn({ onClick, icon, tip }: { onClick: () => void; icon: typeof Add01Icon; tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClick}>
          <HugeiconsIcon icon={icon} className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tip}</TooltipContent>
    </Tooltip>
  )
}

function FilterCombobox({
  value,
  onValueChange,
  options,
  placeholder,
  icon,
}: {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  icon?: typeof Add01Icon
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-8 w-full justify-between gap-1.5 px-2.5 text-xs font-normal"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            {icon && <HugeiconsIcon icon={icon} className="size-3.5 shrink-0 text-muted-foreground" />}
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.label : placeholder}
            </span>
          </span>
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-44 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.value}`}
                  keywords={[option.label]}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "rounded-lg px-2 py-1.5 text-sm font-normal",
                    value === option.value && "font-medium text-primary",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type SummaryTint = "neutral" | "violet" | "purple" | "fuchsia" | "pink" | "emerald" | "red"
interface SummaryProps {
  label: string
  value: string
  sub?: string
  icon: typeof Analytics01Icon
  tint: SummaryTint
}

const SUMMARY_TINTS: Record<SummaryTint, { card: string; ring: string; chip: string }> = {
  neutral: { card: "from-slate-500/10", ring: "ring-slate-500/15", chip: "from-slate-400 to-slate-600" },
  violet: { card: "from-violet-500/10", ring: "ring-violet-500/15", chip: "from-violet-400 to-violet-600" },
  purple: { card: "from-purple-500/10", ring: "ring-purple-500/15", chip: "from-purple-400 to-purple-600" },
  fuchsia: { card: "from-fuchsia-500/10", ring: "ring-fuchsia-500/15", chip: "from-fuchsia-400 to-fuchsia-600" },
  pink: { card: "from-pink-500/10", ring: "ring-pink-500/15", chip: "from-pink-400 to-pink-600" },
  emerald: { card: "from-emerald-500/10", ring: "ring-emerald-500/15", chip: "from-emerald-400 to-emerald-600" },
  red: { card: "from-red-500/10", ring: "ring-red-500/15", chip: "from-red-400 to-red-600" },
}

function SummaryCell({ label, value, sub, icon, tint }: SummaryProps) {
  const tones = SUMMARY_TINTS[tint]
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-gradient-to-br to-card px-3 py-2.5 ring-1 ring-inset", tones.card, tones.ring)}>
      <div className="flex items-start gap-2.5">
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm", tones.chip)}>
          <HugeiconsIcon icon={icon} className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold leading-5 tracking-wider text-muted-foreground uppercase">{label}</p>
          <p className="mt-0.5 truncate text-lg font-bold leading-tight text-foreground" title={value}>{value}</p>
          {sub && <p className="truncate text-[11px] font-medium text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

// Three ramps: frequency (blue), man-hours (violet), duration (green when the
// SLA is met, red when breached). Kept as a template string like the reference.
const heatmapStyles = `
  ${ramp("hm-frequency", ["#eff6ff", "#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"])}
  ${ramp("hm-manhour", ["#f5f3ff", "#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6", "#4c1d95", "#2e1065"])}
  ${ramp("hm-sla-met", ["#f0fdf4", "#dcfce7", "#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#052e16"])}
  ${ramp("hm-sla-breached", ["#fef2f2", "#fee2e2", "#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#450a0a"])}
  ${ramp("hm-duration", ["#fff7ed", "#ffedd5", "#fed7aa", "#fdba74", "#fb923c", "#f97316", "#ea580c", "#c2410c", "#9a3412", "#7c2d12", "#431407"])}
  ${/* Traffic scale for SLA compliance %: 0% red → 50% orange → 100% green. */ ""}
  ${ramp("hm-slarate", ["#7f1d1d", "#991b1b", "#b91c1c", "#dc2626", "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#16a34a"])}

  /* White label text on the dark half of every ramp so badges stay legible. */
  ${["hm-frequency", "hm-manhour", "hm-sla-met", "hm-sla-breached", "hm-duration"]
    .flatMap((base) => [5, 6, 7, 8, 9, 10].map((i) => `.${base}-${i} .djs-visual > text`))
    .join(", ")} { fill: #ffffff !important; }

  /* Compliance ramp is dark at both ends (deep red, deep green) — white text
     there, dark text through the amber/lime middle. */
  ${[0, 1, 2, 3, 4, 9, 10].map((i) => `.hm-slarate-${i} .djs-visual > text`).join(", ")} { fill: #ffffff !important; }

  .bjs-powered-by { display: none; }
`

// One 0–10 colour ramp: fills the node shape, leaves inner glyphs (task person,
// gateway marks) with a contrasting stroke.
function ramp(base: string, colors: string[]): string {
  return colors
    .map((c, i) => `.${base}-${i} .djs-visual > :not(text) { fill: ${c} !important; stroke: ${shade(c)} !important; }`)
    .join("\n")
}

// Slightly darker stroke than the fill — good enough for a mock, avoids a colour lib.
function shade(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, ((n >> 16) & 255) - 24)
  const g = Math.max(0, ((n >> 8) & 255) - 24)
  const b = Math.max(0, (n & 255) - 24)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
