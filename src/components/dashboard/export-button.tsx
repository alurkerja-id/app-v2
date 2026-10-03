import { createContext, useContext, useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { XlsIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { exportFileName, exportXlsx, type ExportContext, type ExportTable } from "@/lib/xlsx-export"

/**
 * Dashboard-wide export metadata (name, period, active filters). Provided once by
 * the page so every card's export button stamps the same context into its file.
 */
const DashboardExportContext = createContext<ExportContext | null>(null)

export const DashboardExportProvider = DashboardExportContext.Provider

export function ExportButton<Row>({
  card,
  table,
  className,
}: {
  /** Card title — used for the file name and the Info sheet. */
  card: string
  table: ExportTable<Row> | (() => ExportTable<Row>)
  className?: string
}) {
  const ctx = useContext(DashboardExportContext)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (!ctx || busy) return
    setBusy(true)
    try {
      await exportXlsx(ctx, card, typeof table === "function" ? table() : table)
      toast.success("Downloaded", { description: exportFileName(ctx, card) })
    } catch (e) {
      console.error(e)
      toast.error("Export failed", { description: "Could not create the .xlsx file." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={run}
            disabled={busy}
            aria-label={`Download ${card} as .xlsx`}
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-[opacity,color,background-color] outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-wait",
              className,
            )}
            data-busy={busy}
          >
            {/* File-type glyph rather than a generic download arrow, so it reads as
                "get this as a spreadsheet". The icon set has XLS but no XLSX glyph
                (four letters don't survive 18px); the tooltip states the exact format. */}
            {busy ? <Spinner className="size-3.5" /> : <HugeiconsIcon icon={XlsIcon} className="size-[18px]" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Download .xlsx</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
