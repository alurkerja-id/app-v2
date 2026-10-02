import { Button } from "@/components/ui/button"

/**
 * Footer for a filter editor. Edits stay in a draft until Apply (or Enter, since
 * the editor is a <form>) — applying on every keystroke flipped the filter on
 * mid-typing, re-laid out the bar under the open popover and flickered results.
 * Render inside a <form onSubmit={apply}>.
 */
export function ApplyFooter({
  onClear,
  clearDisabled,
  applyDisabled,
  applyLabel = "Apply",
}: {
  onClear: () => void
  clearDisabled?: boolean
  applyDisabled?: boolean
  applyLabel?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border p-2">
      <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full text-muted-foreground" onClick={onClear} disabled={clearDisabled}>
        Clear
      </Button>
      <Button type="submit" size="sm" className="h-8 rounded-full px-4" disabled={applyDisabled}>
        {applyLabel}
      </Button>
    </div>
  )
}
