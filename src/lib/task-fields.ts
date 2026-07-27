import { format } from "date-fns"
import type { TaskField } from "@/data/tasks"

/** Editable field values, keyed by field id — the shape persisted to a local draft. */
export type FormValues = Record<string, string | boolean>

export function fieldsToValues(fields: TaskField[]): FormValues {
  const values: FormValues = {}
  for (const field of fields) {
    if (field.type === "file" || field.type === "images") continue
    if (field.type === "boolean") {
      values[field.id] = Boolean(field.value)
    } else if (field.type === "json") {
      values[field.id] = JSON.stringify(field.value, null, 2)
    } else {
      values[field.id] = field.value == null ? "" : String(field.value)
    }
  }
  return values
}

/** Share of fields the user has actually changed from the task's current values. */
export function computeEditedPercent(original: FormValues, current: FormValues) {
  const keys = Object.keys(original)
  if (keys.length === 0) return 0
  const changed = keys.filter((k) => String(current[k]) !== String(original[k])).length
  return Math.round((changed / keys.length) * 100)
}

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
