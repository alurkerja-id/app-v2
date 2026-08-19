import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-3xl border border-transparent bg-[var(--input-surface)] shadow-[var(--input-depth)] [&:hover:not(:focus-visible):not(:disabled):not([readonly])]:shadow-[var(--input-depth-hover)] focus-visible:shadow-[var(--input-depth-focus)] aria-invalid:shadow-[var(--input-depth-invalid)] [&:read-only:not(:disabled)]:shadow-none [&:read-only:not(:disabled):focus-visible]:shadow-[var(--input-depth-readonly-focus)] disabled:shadow-none px-3 py-1 transition-[color,box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:file:font-medium file:text-foreground placeholder:text-muted-foreground [&:read-only:not(:disabled)]:border-transparent [&:read-only:not(:disabled)]:bg-muted [&:read-only:not(:disabled)]:cursor-default disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:placeholder:text-muted-foreground/50 md:dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
