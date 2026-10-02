import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportButton } from "@/components/dashboard/export-button"
import type { ExportTable } from "@/lib/xlsx-export"

/**
 * Chart / table card for dashboards: title on the left, actions + the .xlsx
 * download on the right. Every card exports the data behind it — the table, not
 * the picture — so what lands in Excel is what the card shows under the current
 * period and filters.
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
    <Card className={cn("gap-3", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="-mt-1 -mr-2 flex shrink-0 items-center gap-1">
          {actions}
          <ExportButton card={title} table={exportTable} />
        </div>
      </CardHeader>
      <CardContent className={cn("pt-0", contentClassName)}>{children}</CardContent>
    </Card>
  )
}
