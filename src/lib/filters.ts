/* Shared option helpers for filters. The filter model itself (kinds, values,
   summaries, row tests) lives in @/lib/typed-filters. */

export interface FilterOption {
  value: string
  label: string
}

/** Options whose value is their label — for plain string lists. */
export const opts = (labels: readonly string[]): FilterOption[] => labels.map((l) => ({ value: l, label: l }))
