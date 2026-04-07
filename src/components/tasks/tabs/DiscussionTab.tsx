import { useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { SentIcon } from "@hugeicons/core-free-icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Comment {
  id: number
  author: string
  initials: string
  gradient: string
  time: string
  message: string
  bullets?: string[]
  mentions?: string[]
  isSystem?: boolean
}

const comments: Comment[] = [
  {
    id: 1,
    author: "Alice Wang",
    initials: "AW",
    gradient: "from-violet-500 to-purple-600",
    time: "Mar 28 · 9:20 AM",
    message: "I've submitted the onboarding request for Sarah. Please review and confirm the start date.",
  },
  {
    id: 2,
    author: "Raj Patel",
    initials: "RP",
    gradient: "from-blue-500 to-indigo-600",
    time: "Mar 28 · 10:45 AM",
    message: "Created the HRIS record. A few things still needed:",
    bullets: [
      "Equipment requisition form",
      "Badge photo submission",
      "IT access provisioning checklist",
    ],
  },
  {
    id: 3,
    author: "David Park",
    initials: "DP",
    gradient: "from-amber-500 to-orange-600",
    time: "Mar 29 · 2:15 PM",
    message:
      "I'll review the documents today. @Alice Wang — can you confirm if Sarah has signed the NDA? I don't see it in the attachments.",
    mentions: ["Alice Wang"],
  },
  {
    id: 4,
    author: "Alice Wang",
    initials: "AW",
    gradient: "from-violet-500 to-purple-600",
    time: "Mar 29 · 3:02 PM",
    message:
      "@David Park — Yes, the NDA is signed. I'll upload it right away. Sorry for the oversight!",
    mentions: ["David Park"],
  },
  {
    id: 5,
    author: "HR System",
    initials: "HR",
    gradient: "from-emerald-500 to-teal-600",
    time: "Mar 29 · 3:10 PM",
    message: "Document verification completed successfully. All 3 documents passed automated checks.",
    isSystem: true,
  },
]

function formatMessage(comment: Comment) {
  const parts: React.ReactNode[] = []
  let text = comment.message

  if (comment.mentions) {
    comment.mentions.forEach((m) => {
      text = text.replace(
        `@${m}`,
        `<mention>@${m}</mention>`
      )
    })
  }

  const segments = text.split(/(<mention>.*?<\/mention>)/)
  segments.forEach((seg, i) => {
    if (seg.startsWith("<mention>")) {
      const name = seg.replace("<mention>", "").replace("</mention>", "")
      parts.push(
        <span key={i} className="font-semibold text-primary">
          {name}
        </span>
      )
    } else {
      parts.push(<span key={i}>{seg}</span>)
    }
  })
  return parts
}

export function DiscussionTab() {
  const [draft, setDraft] = useState("")

  const participantCount = useMemo(() => {
    const authors = new Set(comments.map((c) => c.author))
    return authors.size
  }, [])

  return (
    <div className="flex flex-col p-4 sm:p-5 overflow-x-hidden">
      {/* Compose area */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mb-6">
        <div className="flex items-start gap-2.5 px-4 pt-3.5 pb-1">
          <Avatar size="sm" className="shrink-0 mt-3">
            <AvatarFallback className="bg-foreground/[0.08] text-foreground text-[10px]">
              AW
            </AvatarFallback>
          </Avatar>
          <Textarea
            placeholder="Write a comment..."
            rows={2}
            className="resize-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 text-sm min-h-0"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-end border-t border-border px-3 py-2 bg-muted/30">
          <Button size="sm" disabled={!draft.trim()} className="gap-1.5">
            <HugeiconsIcon icon={SentIcon} className="size-3.5" />
            Comment
          </Button>
        </div>
      </div>

      {/* Comments header */}
      <p className="text-sm text-muted-foreground mb-4">
        {comments.length} comment{comments.length !== 1 ? "s" : ""} from {participantCount} participant{participantCount !== 1 ? "s" : ""}
      </p>

      {/* Comments list */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />

        <div className="flex flex-col gap-0">
          {comments.map((c, index) => (
            <div key={c.id}>
              <div className={cn(
                "relative flex gap-3.5 py-3",
                c.isSystem && "opacity-80"
              )}>
                {/* Avatar with timeline dot */}
                <div className="relative z-10 shrink-0">
                  <Avatar size="sm">
                    <AvatarFallback
                      className={cn(
                        "text-white text-[10px]",
                        c.isSystem
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                          : `bg-gradient-to-br ${c.gradient}`
                      )}
                    >
                      {c.initials}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Comment content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                    <span className={cn(
                      "text-sm font-semibold",
                      c.isSystem && "text-muted-foreground"
                    )}>
                      {c.author}
                    </span>
                    <span className="text-[11px] text-muted-foreground/70">{c.time}</span>
                  </div>

                  {c.isSystem ? (
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 px-3 py-1.5 max-w-full">
                      <div className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 break-words min-w-0">{c.message}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed text-foreground/90 break-words">{formatMessage(c)}</p>
                      {c.bullets && (
                        <ul className="mt-2 ml-0 space-y-1">
                          {c.bullets.map((b) => (
                            <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="mt-2 size-1 rounded-full bg-muted-foreground/50 shrink-0" />
                              <span className="break-words min-w-0">{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Separator between comments (not after last) */}
              {index < comments.length - 1 && (
                <Separator className="ml-9.5" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
