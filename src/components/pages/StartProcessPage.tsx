import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  PlayIcon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  ListViewIcon,
  Flowchart01Icon,
  LayoutTwoColumnIcon,
  LinkSquare02Icon,
} from "@hugeicons/core-free-icons"
import NavigatedViewer from "bpmn-js/lib/NavigatedViewer"
import "bpmn-js/dist/assets/diagram-js.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { processes } from "@/components/processes/ProcessList"

type LayoutMode = "form" | "bpmn" | "split"

const CURRENT_PROCESS_ID = "con"

export function StartProcessPage() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("form")
  const [date, setDate] = useState<Date>()
  const viewerRef = useRef<HTMLDivElement>(null)
  const bpmnInstance = useRef<any>(null)

  const process = processes.find((p) => p.id === CURRENT_PROCESS_ID) ?? processes[0]

  const handleStartProcess = () => {
    toast.success("Process Started", {
      description: `${process.name} has been successfully initiated.`
    })
    setTimeout(() => {
      window.history.pushState({}, "", "/tasks")
      window.dispatchEvent(new PopStateEvent("popstate"))
    }, 1000)
  }

  useEffect(() => {
    if (layoutMode === "form") return

    // Destroy previous instance since the DOM container is new after React re-render
    if (bpmnInstance.current) {
      bpmnInstance.current.destroy()
      bpmnInstance.current = null
    }

    let isMounted = true
    const timer = setTimeout(async () => {
      if (!viewerRef.current || !isMounted) return

      try {
        const viewer = new NavigatedViewer({
          container: viewerRef.current
        }) as any
        bpmnInstance.current = viewer

        const res = await fetch("/contract.bpmn")
        if (!res.ok) throw new Error("Failed to load BPMN file")

        const xml = await res.text()
        if (!isMounted) return

        await viewer.importXML(xml)
        viewer.get("canvas").zoom("fit-viewport")
      } catch (err: any) {
        console.error("Failed to load or parse BPMN", err)
      }
    }, 50) // Small delay to ensure DOM is mounted

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [layoutMode])

  useEffect(() => {
    return () => {
      if (bpmnInstance.current) {
        bpmnInstance.current.destroy()
        bpmnInstance.current = null
      }
    }
  }, [])

  const toggleItems: { value: LayoutMode; label: string; icon: any; hiddenOnMobile?: boolean }[] = [
    { value: "form", label: "Form", icon: ListViewIcon },
    { value: "bpmn", label: "BPMN Diagram", icon: Flowchart01Icon },
    { value: "split", label: "Split Layout", icon: LayoutTwoColumnIcon, hiddenOnMobile: true },
  ]

  return (
    <div className="p-6 md:p-10">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="flex items-center gap-2.5 text-xl font-normal font-heading min-w-0">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white text-[10px] font-bold shadow-sm",
              process.gradient
            )}
          >
            {process.abbr}
          </span>
          <span className="truncate">Start {process.name}</span>
        </h1>

        <Button onClick={handleStartProcess} className="shrink-0 hidden sm:inline-flex">
          Start Process
          <HugeiconsIcon icon={PlayIcon} className="ml-1.5 size-4" />
        </Button>
      </div>

      {/* Main Card — contains toggle + content */}
      <Card className="p-0 overflow-hidden">
        <div className="flex min-h-[520px] md:min-h-[580px]">
          {/* Left: Vertical toggle rail */}
          <TooltipProvider>
            <div className="flex flex-col items-center gap-1 border-r border-border bg-muted/30 p-1.5 pt-8">
              {toggleItems.map(({ value, label, icon, hiddenOnMobile }) => (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setLayoutMode(value)}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg transition-colors",
                        layoutMode === value
                          ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                        hiddenOnMobile && "hidden md:flex"
                      )}
                    >
                      <HugeiconsIcon icon={icon} className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <span className="text-xs">{label}</span>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          {/* Right: Content area */}
          <div className="flex flex-1 min-w-0 overflow-hidden">
            {/* Form Panel */}
            {(layoutMode === "form" || layoutMode === "split") && (
              <div className={cn(
                "flex-1 overflow-y-auto p-6 md:p-8",
                layoutMode === "split" && "max-w-xl border-r border-border"
              )}>
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-2">
                    <Label htmlFor="title">Contract Title</Label>
                    <Input id="title" placeholder="e.g., Q3 Vendor NDA" />
                  </div>

                  <div className="space-y-2">
                    <Label>Type of Contract</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                        <SelectItem value="employment">Employment Contract</SelectItem>
                        <SelectItem value="service">Service Agreement</SelectItem>
                        <SelectItem value="vendor">Vendor Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Agreement</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <HugeiconsIcon icon={Calendar01Icon} className="mr-2 size-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Contract Abstract / Summary</Label>
                    <div className="border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-shadow bg-background">
                      <div className="bg-muted/50 border-b border-border p-1.5 flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" className="size-7"><HugeiconsIcon icon={TextBoldIcon} className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" className="size-7"><HugeiconsIcon icon={TextItalicIcon} className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" className="size-7"><HugeiconsIcon icon={TextUnderlineIcon} className="size-4" /></Button>
                        <div className="w-px h-4 bg-border mx-1" />
                        <Button variant="ghost" size="icon-sm" className="size-7"><HugeiconsIcon icon={LinkSquare02Icon} className="size-4" /></Button>
                      </div>
                      <Textarea className="border-0 focus-visible:ring-0 rounded-none min-h-[160px] resize-y shadow-none bg-transparent p-3" placeholder="Enter abstract details here..." />
                    </div>
                  </div>

                  {/* Mobile-only Start Process button */}
                  <div className="pt-2 sm:hidden">
                    <Button className="w-full" size="lg" onClick={handleStartProcess}>
                      Start Process
                      <HugeiconsIcon icon={PlayIcon} className="ml-1.5 size-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* BPMN Panel */}
            {(layoutMode === "bpmn" || layoutMode === "split") && (
              <div className="flex-1 relative bg-white dark:bg-zinc-900 min-h-0">
                <div className="absolute inset-0" ref={viewerRef} />
                <div className="absolute top-3 left-3 pointer-events-none z-10">
                  <div className="bg-background/80 backdrop-blur-md border border-border px-2.5 py-1 rounded-lg shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">contract.bpmn</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
