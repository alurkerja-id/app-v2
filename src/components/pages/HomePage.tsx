import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Task01Icon,
  Alert01Icon,
  Calendar01Icon,
  Time01Icon,
  Search01Icon,
  ArrowRight01Icon,
  StarIcon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { processes } from "@/components/processes/ProcessList"

const statCards = [
  {
    label: "All Tasks",
    value: 24,
    description: "Across all processes",
    icon: Task01Icon,
    color: "text-blue-500",
  },
  {
    label: "Overdue",
    value: 3,
    description: "Need immediate attention",
    icon: Alert01Icon,
    color: "text-red-500",
  },
  {
    label: "Due Today",
    value: 5,
    description: "Must complete today",
    icon: Calendar01Icon,
    color: "text-amber-500",
  },
  {
    label: "Upcoming",
    value: 16,
    description: "Next 7 days",
    icon: Time01Icon,
    color: "text-emerald-500",
  },
]

// Default favorites (in real app, persisted per user)
const DEFAULT_FAVORITES = ["exp", "lv", "it"]

export function HomePage() {
  const [search, setSearch] = useState("")
  const [favorites, setFavorites] = useState<string[]>(DEFAULT_FAVORITES)

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const allSorted = [...processes].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  const filtered = allSorted.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  )

  const favoriteProcesses = allSorted.filter((p) => favorites.includes(p.id))

  return (
    <div className="flex flex-col gap-8 px-4 py-10 md:px-6 md:py-12 max-w-4xl mx-auto w-full">
      {/* Welcome */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-xl font-normal font-heading">Good morning, Alice.</h1>
        </div>
        <p className="text-sm text-muted-foreground italic text-right hidden sm:block">
          "The secret of getting ahead is getting started." <span className="not-italic">— Mark Twain</span>
        </p>
      </div>

      {/* Task Summary Banner */}
      <div className="rounded-4xl bg-primary px-6 py-4 text-primary-foreground shadow-md flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 shrink-0">
          <HugeiconsIcon icon={Task01Icon} className="size-4 opacity-70" />
          <span className="font-semibold font-heading text-sm">Task Summary</span>
        </div>
        <div className="w-px h-5 bg-primary-foreground/20 hidden sm:block" />
        {statCards.map((card, i) => (
          <div key={card.label} className="flex items-center gap-4">
            {i > 0 && <div className="w-px h-5 bg-primary-foreground/20 hidden sm:block" />}
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={card.icon} className="size-4 opacity-70" />
              <span className="font-bold text-lg font-heading leading-none">{card.value}</span>
              <span className="text-xs opacity-70">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Process Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Favorites */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <HugeiconsIcon icon={FavouriteIcon} className="size-3.5 text-amber-500" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Favorites
              </h3>
            </div>
            {favoriteProcesses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 px-1">
                Click the star icon to add favorites
              </p>
            ) : (
              <div className="flex flex-col">
                {favoriteProcesses.map((proc) => (
                  <button
                    key={proc.id}
                    onClick={() => { window.history.pushState({}, "", "/start"); window.dispatchEvent(new PopStateEvent("popstate")); }}
                    className={cn("group flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-all duration-200 hover:translate-x-0.5", proc.bgHover)}
                  >
                    <div
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-white text-[9px] font-bold transition-all duration-200 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-md",
                        proc.gradient
                      )}
                    >
                      {proc.abbr}
                    </div>
                    <span className="text-sm font-medium truncate flex-1 transition-all duration-200 group-hover:translate-x-0.5">{proc.name}</span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="size-3.5 shrink-0 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* All Processes */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Start a Process
            </h3>
            <div className="relative mb-3">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search processes..."
                className="pl-8 h-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <HugeiconsIcon icon={Search01Icon} className="size-6 text-muted-foreground mb-1.5" />
                <p className="font-medium text-sm">No processes found</p>
                <p className="text-xs text-muted-foreground">Try a different search term</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filtered.map((proc) => {
                  const isFav = favorites.includes(proc.id)
                  return (
                    <div
                      key={proc.id}
                      className={cn("group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-200 hover:translate-x-0.5", proc.bgHover)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(proc.id)
                        }}
                        className={cn(
                          "shrink-0 transition-all duration-200",
                          isFav
                            ? "text-amber-500 hover:scale-125 hover:rotate-12"
                            : "text-muted-foreground/30 hover:text-amber-400 hover:scale-110"
                        )}
                        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <HugeiconsIcon
                          icon={StarIcon}
                          className="size-3.5"
                          fill={isFav ? "currentColor" : "none"}
                        />
                      </button>
                      <button 
                        onClick={() => { window.history.pushState({}, "", "/start"); window.dispatchEvent(new PopStateEvent("popstate")); }}
                        className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                      >
                        <div
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br text-white text-[9px] font-bold transition-all duration-200 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-md",
                            proc.gradient
                          )}
                        >
                          {proc.abbr}
                        </div>
                        <span className="text-sm font-medium truncate flex-1 transition-all duration-200 group-hover:translate-x-0.5">{proc.name}</span>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          className="size-3.5 shrink-0 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
    </div>
  )
}
