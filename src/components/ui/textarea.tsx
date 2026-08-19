import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none rounded-2xl border border-transparent bg-[var(--input-surface)] shadow-[var(--input-depth)] [&:hover:not(:focus-visible):not(:disabled):not([readonly])]:shadow-[var(--input-depth-hover)] focus-visible:shadow-[var(--input-depth-focus)] aria-invalid:shadow-[var(--input-depth-invalid)] [&:read-only:not(:disabled)]:shadow-none [&:read-only:not(:disabled):focus-visible]:shadow-[var(--input-depth-readonly-focus)] disabled:shadow-none px-3 py-3 transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground [&:read-only:not(:disabled)]:border-transparent [&:read-only:not(:disabled)]:bg-muted [&:read-only:not(:disabled)]:cursor-default disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground md:dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
