import { format } from "date-fns"
import type { TaskField } from "@/data/tasks"

export function formatFieldValue(field: TaskField): string {
  const { type, value } = field
  if (value === null || value === undefined || value === "") return "—"
  switch (type) {
    case "boolean":
      return value ? "Yes" : "No"
    case "date":
      return format(new Date(value as string), "MMM d, yyyy")
    case "file":
    case "images":
      return Array.isArray(value) ? `${value.length} file${value.length !== 1 ? "s" : ""}` : String(value)
    case "json":
      return typeof value === "object" ? `${Object.keys(value as object).length} fields` : String(value)
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value)
    default:
      return String(value)
  }
}
