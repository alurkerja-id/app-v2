import { Fragment, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useT, type Text } from "./i18n"

/**
 * Tiny markup for notes and hints: `code` and **bold**. Keeps copy in plain
 * strings (no HTML) while still marking up keys like `items[0].qty`.
 */
export function Rich({ text, className }: { text: Text; className?: string }) {
  const t = useT()
  const parts = t(text).split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return (
    <span className={className}>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") && p.length > 1 ? (
          <code key={i} className="rounded-md bg-muted px-1 py-px font-mono text-[0.85em] text-foreground">
            {p.slice(1, -1)}
          </code>
        ) : p.startsWith("**") && p.endsWith("**") && p.length > 3 ? (
          <b key={i} className="font-semibold text-foreground">
            {p.slice(2, -2)}
          </b>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </span>
  )
}

const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/g

function highlight(src: string) {
  const out: React.ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of src.matchAll(TOKEN)) {
    const at = m.index ?? 0
    if (at > last) out.push(src.slice(last, at))
    if (m[1] && m[2]) {
      out.push(
        <span key={i++} className="text-sky-700 dark:text-sky-300">
          {m[1]}
        </span>,
        m[2],
      )
    } else if (m[1]) {
      out.push(
        <span key={i++} className="text-emerald-700 dark:text-emerald-400">
          {m[1]}
        </span>,
      )
    } else if (m[3]) {
      out.push(
        <span key={i++} className="font-medium text-violet-700 dark:text-violet-300">
          {m[3]}
        </span>,
      )
    } else {
      out.push(
        <span key={i++} className="text-amber-700 dark:text-amber-300">
          {m[4]}
        </span>,
      )
    }
    last = at + m[0].length
  }
  if (last < src.length) out.push(src.slice(last))
  return out
}

/** Pretty JSON with syntax colours and a copy button. */
export function JsonBlock({
  value,
  title,
  sub,
  className,
  maxHeight = "28rem",
}: {
  value: unknown
  title?: Text
  sub?: Text
  className?: string
  maxHeight?: string
}) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  const src = value === undefined ? "—" : JSON.stringify(value, null, 2)
  const copy = () => {
    void navigator.clipboard?.writeText(src).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    })
  }
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {(title || sub) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="min-w-0">
            {title && <p className="text-sm font-semibold text-foreground">{t(title)}</p>}
            {sub && <p className="truncate text-xs text-muted-foreground">{t(sub)}</p>}
          </div>
          <Button variant="ghost" size="xs" onClick={copy} aria-label="Copy JSON">
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} />
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
      <pre
        className="overflow-auto bg-muted/40 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground [overflow-wrap:anywhere] dark:bg-muted/20 dark:[color-scheme:dark]"
        style={{ maxHeight }}
      >
        {highlight(src)}
      </pre>
    </div>
  )
}
