import { useState } from "react"
import { RiAttachmentLine, RiSendPlaneLine } from "@remixicon/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Comment {
  id: number
  author: string
  initials: string
  gradient: string
  time: string
  message: string
  bullets?: string[]
  mentions?: string[]
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
  },
]

function formatMessage(comment: Comment) {
  const parts: React.ReactNode[] = []
  let text = comment.message

  // Highlight @mentions
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
        <span key={i} className="font-semibold text-blue-600 dark:text-blue-400">
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

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Comment form */}
      <div className="flex gap-2.5">
        <Avatar size="sm" className="mt-0.5 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[10px]">
            AW
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex flex-col gap-2">
          <Textarea
            placeholder="Write a comment..."
            rows={3}
            className="resize-none text-xs"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon-sm">
              <RiAttachmentLine />
            </Button>
            <Button size="sm" disabled={!draft.trim()}>
              <RiSendPlaneLine />
              Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs font-semibold">Comments</h3>
          <span className="flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
            {comments.length}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar size="sm" className="shrink-0 mt-0.5">
                <AvatarFallback
                  className={`bg-gradient-to-br ${c.gradient} text-white text-[10px]`}
                >
                  {c.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold">{c.author}</span>
                  <span className="text-[11px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-xs leading-relaxed">{formatMessage(c)}</p>
                {c.bullets && (
                  <ul className="mt-1.5 ml-3 list-disc text-xs space-y-0.5 text-muted-foreground">
                    {c.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
