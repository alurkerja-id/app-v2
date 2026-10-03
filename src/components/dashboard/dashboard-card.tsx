import { cn } from "@/lib/utils"
import { ExportButton } from "@/components/dashboard/export-button"
import { trayClass, trayPanelClass } from "@/components/dashboard/tray"
import type { ExportTable } from "@/lib/xlsx-export"

/**
 * Chart / table card for dashboards, drawn as a tray: title, description and
 * actions + the .xlsx download on the tinted tray; the content on the panel.
 * Every card exports the data behind it — the table, not the picture — so what
 * lands in Excel is what the card shows under the current period and filters.
 */
export function DashboardCard<Row>({
  title,
  description,
  exportTable,
  actions,
  className,
  contentClassName,
  children,
}: {
  title: string
  description?: React.ReactNode
  exportTable: ExportTable<Row> | (() => ExportTable<Row>)
  /** Extra header controls, placed before the download icon. */
  actions?: React.ReactNode
  className?: string
  contentClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn(trayClass, className)}>
      <div className="flex items-start gap-2 py-1 pr-1 pl-3">
        <div className="min-w-0 flex-1 py-1">
          <h3 className="text-[13px] leading-5 font-medium text-muted-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground/80">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          <ExportButton card={title} table={exportTable} />
        </div>
      </div>
      <div className={cn(trayPanelClass, "p-3", contentClassName)}>{children}</div>
    </section>
  )
}
