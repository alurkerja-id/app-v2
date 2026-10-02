/**
 * Recharts styling shared by every dashboard.
 *
 * Theme tokens are oklch values, so they are referenced as plain `var(--x)`.
 * The previous `hsl(var(--x))` wrapping produced `hsl(oklch(…))` — an invalid
 * colour — which left tooltips transparent and grid lines unstyled.
 */
export const SERIES = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"]

export const gridStroke = "var(--border)"

export const axisTick = { fontSize: 10, fill: "var(--muted-foreground)" }

export const tooltipStyle = {
  fontSize: 12,
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
} as const

export const legendStyle = { fontSize: 11 }
