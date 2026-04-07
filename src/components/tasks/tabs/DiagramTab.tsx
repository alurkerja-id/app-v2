import { useEffect, useRef, useState, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, MinusSignIcon, ReloadIcon } from "@hugeicons/core-free-icons"
import NavigatedViewer from "bpmn-js/lib/NavigatedViewer"
import "bpmn-js/dist/assets/diagram-js.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

interface DiagramTabProps {
  /** BPMN element ID to highlight as the current active task */
  highlightTaskId?: string
  /** Display name for the current task */
  highlightTaskName?: string
}

export function DiagramTab({
  highlightTaskId = "Review_Contract",
  highlightTaskName = "Review Contract",
}: DiagramTabProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const [resolvedTaskName, setResolvedTaskName] = useState(highlightTaskName)

  useEffect(() => {
    if (!containerRef.current) return

    // Destroy previous instance
    if (viewerRef.current) {
      viewerRef.current.destroy()
      viewerRef.current = null
    }

    let isMounted = true
    const timer = setTimeout(async () => {
      if (!containerRef.current || !isMounted) return

      try {
        const viewer = new NavigatedViewer({
          container: containerRef.current,
        }) as any
        viewerRef.current = viewer

        const res = await fetch("/contract.bpmn")
        if (!res.ok) throw new Error("Failed to load BPMN file")

        const xml = await res.text()
        if (!isMounted) return

        await viewer.importXML(xml)
        const canvas = viewer.get("canvas")
        canvas.zoom("fit-viewport")

        // Highlight the current task
        if (highlightTaskId) {
          try {
            const elementRegistry = viewer.get("elementRegistry")
            const element = elementRegistry.get(highlightTaskId)
            if (element) {
              canvas.addMarker(highlightTaskId, "bpmn-highlight-current")
              // Resolve the task name from the BPMN element if not provided
              if (!highlightTaskName && element.businessObject?.name) {
                setResolvedTaskName(element.businessObject.name)
              }
            }
          } catch {
            // Element not found, skip highlighting
          }
        }
      } catch (err: any) {
        console.error("Failed to load or parse BPMN", err)
      }
    }, 50)

    return () => {
      isMounted = false
      clearTimeout(timer)
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [highlightTaskId, highlightTaskName])

  const handleZoomIn = useCallback(() => {
    if (!viewerRef.current) return
    const canvas = viewerRef.current.get("canvas")
    canvas.zoom(canvas.zoom() * 1.25)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!viewerRef.current) return
    const canvas = viewerRef.current.get("canvas")
    canvas.zoom(canvas.zoom() / 1.25)
  }, [])

  const handleZoomReset = useCallback(() => {
    if (!viewerRef.current) return
    const canvas = viewerRef.current.get("canvas")
    canvas.zoom("fit-viewport")
  }, [])

  return (
    <div className="p-4">
      <Card className="py-0 gap-0 overflow-hidden">
        {/* Header: current task indicator + zoom controls */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <span className="size-2.5 shrink-0 rounded-full bg-amber-400 ring-2 ring-amber-500/50" />
          <span className="flex-1 text-sm text-muted-foreground">
            Current Task:{" "}
            <span className="font-semibold text-foreground">{resolvedTaskName}</span>
          </span>

          {/* Zoom controls */}
          <TooltipProvider>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7" onClick={handleZoomOut}>
                    <HugeiconsIcon icon={MinusSignIcon} className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Zoom Out</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7" onClick={handleZoomIn}>
                    <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Zoom In</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7" onClick={handleZoomReset}>
                    <HugeiconsIcon icon={ReloadIcon} className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Reset Zoom</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* BPMN viewer */}
        <div
          ref={containerRef}
          className="bpmn-diagram-container w-full"
          style={{ height: 420 }}
        />
      </Card>

      {/* Highlight CSS for current task */}
      <style>{`
        .bpmn-highlight-current .djs-visual > rect,
        .bpmn-highlight-current .djs-visual > polygon {
          stroke: #f59e0b !important;
          stroke-width: 3px !important;
          fill: #fffbeb !important;
        }
        .bpmn-highlight-current .djs-visual > text {
          fill: #92400e !important;
        }
        .bpmn-highlight-current .djs-outline {
          fill: rgba(245, 158, 11, 0.08) !important;
          stroke: #f59e0b !important;
          stroke-width: 2px !important;
          visibility: visible !important;
        }
      `}</style>
    </div>
  )
}
