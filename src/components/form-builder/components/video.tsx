/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useEffectEvent, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Alert02Icon,
  Delete02Icon,
  FileVideoIcon,
  FullscreenIcon,
  Link01Icon,
  PauseIcon,
  PlayCircleIcon,
  PlayIcon,
  Refresh01Icon,
  SquareLock02Icon,
  Tick02Icon,
  VariableIcon,
  VideoOffIcon,
  VideoReplayIcon,
  ViewIcon,
  VimeoIcon,
  VolumeHighIcon,
  VolumeMute02Icon,
  WifiDisconnected01Icon,
  YoutubeIcon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, FieldState, Issue, RuntimeProps } from "../types"
import { sizeText } from "./doc-preview-paper"
import { K3_VIDEO, VIDEO_UPLOADS, VIDEO_VARS, VIDEO_VAR_KEYS, VideoFrame, type MockVideo } from "./video-media"

/* Video embed — ui_type VIDEO, value_kind "none". Story: a new hire watches the safety
   induction before their first shift. Same idea as Document preview: a mock viewer (no
   network), simulation controls, and an optional "watched before Complete Task" guard. */

type VideoSource = "link" | "upload" | "variable"
type Aspect = "16:9" | "4:3"

interface VideoProps {
  /** Title above the player (when `showLabel`) and the subject of the watch message. */
  label: L10n
  /** Key: identity of the node only — the player sends no value. */
  name: string
  source: VideoSource
  url: string
  /** Id of the video picked in the builder (VIDEO_UPLOADS); "" = none yet. */
  file: string
  /** `file` process variable set by an earlier step. */
  variable: string
  aspect: Aspect
  caption: L10n
  requireWatch: boolean
  /** 50–100; "" while the stepper is being edited. */
  watchPercent: number | ""
  allowSeekAhead: boolean
  showLabel: boolean
}

type VideoSim = "ok" | "error" | "offline" | "empty"
type Range = [number, number]

/** Prototype state: simulated network, reload counter, playhead and the parts played. Never submitted. */
interface VideoValue {
  sim: VideoSim
  load: number
  /** Playhead, seconds. */
  pos: number
  /** Parts actually played, merged, in seconds. */
  watched: Range[]
}

/* ── links ──────────────────────────────────────────────────────────────── */

type Provider = "youtube" | "vimeo" | "file"

interface Embed {
  provider: "youtube" | "vimeo"
  id: string
  /** Vimeo unlisted-video hash. */
  hash?: string
}

const YT_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"])
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"])
const YT_ID = /^[A-Za-z0-9_-]{11}$/

/** YouTube / Vimeo link → provider and video id, or the message for Edit Element. */
function parseLink(raw: unknown): { embed: Embed } | { err: L10n } {
  const s = String(raw ?? "").trim()
  if (!s) return { err: L("Paste the YouTube or Vimeo link", "Tempel tautan YouTube atau Vimeo") }
  let u: URL
  try {
    u = new URL(s)
  } catch {
    return { err: L("Enter a full link, e.g. https://www.youtube.com/watch?v=…", "Isi tautan lengkap, mis. https://www.youtube.com/watch?v=…") }
  }
  if (u.protocol !== "https:") return { err: L("Use an https:// link", "Gunakan tautan https://") }
  const host = u.hostname.toLowerCase()
  const parts = u.pathname.split("/").filter(Boolean)
  if (host === "youtu.be" || YT_HOSTS.has(host)) {
    const id =
      host === "youtu.be" ? parts[0] : parts[0] === "watch" ? u.searchParams.get("v") : ["embed", "shorts", "live", "v"].includes(parts[0]) ? parts[1] : null
    return id && YT_ID.test(id)
      ? { embed: { provider: "youtube", id } }
      : {
          err: L(
            "This YouTube link doesn't point to one video (playlists and channels can't be embedded)",
            "Tautan YouTube ini tidak menunjuk ke satu video (playlist dan channel tidak bisa disematkan)",
          ),
        }
  }
  if (VIMEO_HOSTS.has(host)) {
    const i = parts.findIndex((x) => /^\d{6,11}$/.test(x))
    if (i < 0) return { err: L("This Vimeo link doesn't point to one video", "Tautan Vimeo ini tidak menunjuk ke satu video") }
    const next = parts[i + 1]
    const hash = u.searchParams.get("h") ?? (next && /^[0-9a-f]{6,}$/i.test(next) ? next : undefined)
    return { embed: { provider: "vimeo", id: parts[i], hash } }
  }
  return {
    err: L(
      "Only YouTube and Vimeo links can be embedded — upload other videos as a file",
      "Hanya tautan YouTube dan Vimeo yang bisa disematkan — unggah video lain sebagai berkas",
    ),
  }
}

/** Privacy-enhanced embed address (Wave 4 open decision 6). */
const embedUrl = (e: Embed) =>
  e.provider === "youtube" ? `https://www.youtube-nocookie.com/embed/${e.id}?rel=0` : `https://player.vimeo.com/video/${e.id}?${e.hash ? `h=${e.hash}&` : ""}dnt=1`
const EMBED_HOST: Record<Embed["provider"], string> = { youtube: "www.youtube-nocookie.com", vimeo: "player.vimeo.com" }

const PROVIDERS: Record<Provider, { icon: IconSvgElement; name: string; badge: L10n }> = {
  youtube: { icon: YoutubeIcon, name: "YouTube", badge: L("YouTube · privacy mode", "YouTube · mode privasi") },
  vimeo: { icon: VimeoIcon, name: "Vimeo", badge: L("Vimeo · do not track", "Vimeo · tanpa pelacakan") },
  file: { icon: FileVideoIcon, name: "MP4", badge: L("Video file · MP4", "Berkas video · MP4") },
}

/* ── sources and simulated answers ──────────────────────────────────────── */

interface Source {
  video: MockVideo
  provider: Provider
  embed: Embed | null
}

/** What the source plays. `null` = the variable is still empty; `undefined` = not set up. */
function sourceOf(p: VideoProps): Source | null | undefined {
  if (p.source === "link") {
    const r = parseLink(p.url)
    // Prototype: every valid link plays the sample induction video.
    return "embed" in r ? { video: K3_VIDEO, provider: r.embed.provider, embed: r.embed } : undefined
  }
  if (p.source === "upload") {
    const f = VIDEO_UPLOADS.find((x) => x.id === p.file)
    return f ? { video: f, provider: "file", embed: null } : undefined
  }
  const v = VIDEO_VARS[p.variable]
  if (!v) return undefined
  return v.video ? { video: v.video, provider: "file", embed: null } : null
}

type View = { kind: "video" | "error" | "offline"; src: Source } | { kind: "empty" } | { kind: "unset" }

function viewOf(p: VideoProps, sim: VideoSim): View {
  const src = sourceOf(p)
  if (src === undefined) return { kind: "unset" }
  if (src === null || (p.source === "variable" && sim === "empty")) return { kind: "empty" }
  if (sim === "error") return { kind: "error", src }
  if (sim === "offline") return { kind: "offline", src }
  return { kind: "video", src }
}

const SIMS: { v: VideoSim; label: L10n; desc: L10n; varOnly?: boolean }[] = [
  { v: "ok", label: L("Plays", "Lancar"), desc: L("The video loads in about a second.", "Video termuat dalam sekitar satu detik.") },
  {
    v: "error",
    label: L("Load error", "Gagal muat"),
    desc: L("The host refuses the video: removed, made private, or blocked by the app's CSP.", "Host menolak video: dihapus, dijadikan privat, atau diblokir CSP aplikasi."),
  },
  { v: "offline", label: L("Offline", "Offline"), desc: L("The user's device has no connection.", "Perangkat user tidak tersambung internet.") },
  { v: "empty", label: L("Empty", "Kosong"), desc: L("Nothing uploaded yet.", "Belum ada yang diunggah."), varOnly: true },
]
const simsFor = (p: VideoProps) => SIMS.filter((s) => !s.varOnly || p.source === "variable")

const LOAD_MS = 900
const TICK_MS = 250
const NUDGE_MS = 2600
/** Seconds the mock player "buffers" ahead of what was played. */
const BUFFER_S = 45

/* ── watch maths ────────────────────────────────────────────────────────── */

const pctOf = (p: VideoProps) => Math.min(100, Math.max(50, Number(p.watchPercent) || 90))

function addRange(rs: Range[], a: number, b: number): Range[] {
  if (b <= a) return rs
  const out: Range[] = []
  for (const r of [...rs, [a, b] as Range].sort((x, y) => x[0] - y[0])) {
    const last = out[out.length - 1]
    if (last && r[0] <= last[1] + 0.01) last[1] = Math.max(last[1], r[1])
    else out.push([r[0], r[1]])
  }
  return out
}
const watchedSec = (rs: Range[]) => rs.reduce((n, [a, b]) => n + (b - a), 0)
/** Furthest point played (the seek limit when skipping ahead is off). */
const reachOf = (rs: Range[]) => rs.reduce((n, r) => Math.max(n, r[1]), 0)
const isDone = (p: VideoProps, v: VideoValue, dur: number) => dur > 0 && watchedSec(v.watched) >= (dur * pctOf(p)) / 100 - 1e-6

const clock = (s: number) => {
  const n = Math.max(0, Math.floor(s))
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`
}

/** "Safety induction video" → "safety induction video"; keeps acronyms such as "K3". */
const lower = (s: string) => (/^\p{Lu}\p{Ll}/u.test(s) ? s[0].toLowerCase() + s.slice(1) : s)
const watchMsg = (p: VideoProps) =>
  L(
    `Watch at least ${pctOf(p)}% of the ${lower(p.label.en.trim() || "video")} before completing`,
    `Tonton minimal ${pctOf(p)}% ${lower(p.label.id.trim() || p.label.en.trim() || "video")} sebelum menyelesaikan`,
  )

const aspectClass = (p: VideoProps) => (p.aspect === "4:3" ? "aspect-[4/3]" : "aspect-video")
const hasCaption = (p: VideoProps) => Boolean(p.caption.en.trim() || p.caption.id.trim())

/* ── shared bits ────────────────────────────────────────────────────────── */

function StateBox({ icon, title, text, bad, children }: { icon: IconSvgElement; title?: L10n; text: L10n; bad?: boolean; children?: ReactNode }) {
  const t = useT()
  return (
    <Empty className="gap-3 p-6 sm:p-8">
      <EmptyHeader className="gap-1.5">
        <EmptyMedia variant="icon" className={cn(bad && "bg-destructive/10 text-destructive")}>
          <HugeiconsIcon icon={icon} />
        </EmptyMedia>
        {title && <EmptyTitle className="text-sm">{t(title)}</EmptyTitle>}
        <EmptyDescription className="text-xs">{t(text)}</EmptyDescription>
      </EmptyHeader>
      {children}
    </Empty>
  )
}

function Frame({ bad, off, children }: { bad?: boolean; off?: boolean; children: ReactNode }) {
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-2xl border border-border bg-card", bad && "border-destructive ring-3 ring-destructive/20", off && "opacity-60")}>
      {children}
    </div>
  )
}

function ProviderChip({ provider }: { provider: Provider }) {
  const t = useT()
  return (
    <span className="pointer-events-none absolute top-2.5 left-2.5 inline-flex max-w-[calc(100%-1.25rem)] items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
      <HugeiconsIcon icon={PROVIDERS[provider].icon} className="size-3.5 shrink-0" />
      <span className="truncate">{t(PROVIDERS[provider].badge)}</span>
    </span>
  )
}

function Title({ p, id }: { p: VideoProps; id?: string }) {
  const t = useT()
  if (!p.showLabel || !p.label.en.trim()) return null
  return (
    <p id={id} className="text-sm font-medium text-foreground">
      {t(p.label)}
      {p.requireWatch && (
        <span className="text-destructive" aria-hidden>
          {" *"}
        </span>
      )}
    </p>
  )
}

/** Builder: where the video comes from. */
function SourceLine({ p }: { p: VideoProps }) {
  const t = useT()
  const src = sourceOf(p)
  const link = p.source === "link" ? parseLink(p.url) : null
  const [icon, text]: [IconSvgElement, ReactNode] =
    p.source === "link"
      ? [
          link && "embed" in link ? PROVIDERS[link.embed.provider].icon : Link01Icon,
          <span className="font-mono">{link && "embed" in link ? `${PROVIDERS[link.embed.provider].name} · ${link.embed.id}` : t(L("Link not valid", "Tautan tidak valid"))}</span>,
        ]
      : p.source === "upload"
        ? [FileVideoIcon, src ? `${src.video.file_name} · ${clock(src.video.duration)}` : t(L("No video chosen", "Belum ada video"))]
        : [VariableIcon, <>{t(L("From ", "Dari "))}<span className="font-mono">{p.variable}</span></>]
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      <HugeiconsIcon icon={icon} className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate">{text}</span>
      {p.requireWatch && (
        <Badge variant="secondary" className="text-[10px]">
          {t(L(`Must watch ${pctOf(p)}%`, `Wajib ditonton ${pctOf(p)}%`))}
        </Badge>
      )}
    </div>
  )
}

/* ── builder ────────────────────────────────────────────────────────────── */

function VideoCanvas({ props: p }: { props: VideoProps }) {
  const t = useT()
  const src = sourceOf(p)
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Title p={p} />
      {src ? (
        <div className={cn("relative overflow-hidden rounded-2xl bg-black", aspectClass(p))}>
          <VideoFrame video={src.video} at={0} className="absolute inset-0 size-full" />
          <ProviderChip provider={src.provider} />
          <span className="absolute bottom-12 left-4 grid size-14 place-items-center rounded-full bg-black/55 text-white ring-1 ring-white/30">
            <HugeiconsIcon icon={PlayIcon} className="size-6" />
          </span>
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-2.5 text-[11px] text-white tabular-nums">
            <span className="h-1 flex-1 rounded-full bg-white/30" />
            0:00 / {clock(src.video.duration)}
          </div>
        </div>
      ) : (
        <Frame>
          {src === null ? (
            <StateBox icon={VideoOffIcon} text={L("No video yet — it is uploaded in an earlier step.", "Belum ada video — diunggah di langkah sebelumnya.")} />
          ) : (
            <StateBox bad icon={Alert02Icon} text={L("Set the video in Edit Element.", "Atur videonya di Edit Element.")} />
          )}
        </Frame>
      )}
      {hasCaption(p) && <p className="text-xs text-pretty text-muted-foreground">{t(p.caption)}</p>}
      <SourceLine p={p} />
    </div>
  )
}

/** Edit Element: what a valid link resolves to. */
function LinkCheck({ url }: { url: string }) {
  const t = useT()
  const r = parseLink(url)
  if (!("embed" in r)) return null
  const pv = PROVIDERS[r.embed.provider]
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <HugeiconsIcon icon={pv.icon} className="mt-px size-3.5 shrink-0" />
      <span>
        {t(L(`${pv.name} video `, `Video ${pv.name} `))}
        <span className="font-mono text-foreground">{r.embed.id}</span>
        {t(L(" · plays from ", " · diputar dari "))}
        <span className="font-mono">{EMBED_HOST[r.embed.provider]}</span>
      </span>
    </p>
  )
}

/** Edit Element: the fixed video (prototype: pick one of the mock files). */
function VideoPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const t = useT()
  const cur = VIDEO_UPLOADS.find((f) => f.id === value)
  return (
    <div className="flex flex-col gap-2">
      {cur && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card py-2 pr-2 pl-2.5">
          <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-lg bg-black">
            <VideoFrame video={cur} at={0} className="absolute inset-0 size-full" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <b className="block truncate text-[13px] font-medium" title={cur.file_name}>
              {cur.file_name}
            </b>
            <small className="text-xs text-muted-foreground">
              {t(sizeText(cur.size))} · {clock(cur.duration)}
            </small>
          </span>
          <Button variant="ghost" size="icon-sm" aria-label={t(L("Remove video", "Hapus video"))} onClick={() => onChange("")} className="text-muted-foreground hover:text-destructive">
            <HugeiconsIcon icon={Delete02Icon} />
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{t(L("Prototype: pick a file to “upload”.", "Prototipe: pilih berkas untuk “diunggah”."))}</p>
      <div className="flex flex-wrap gap-1.5">
        {VIDEO_UPLOADS.map((f) => (
          <Button
            key={f.id}
            variant="outline"
            size="xs"
            aria-pressed={f.id === value}
            onClick={() => onChange(f.id)}
            className={cn("max-w-full", f.id === value && "border-primary/40 bg-primary/5 text-foreground")}
          >
            <HugeiconsIcon icon={FileVideoIcon} />
            <span className="truncate">{f.file_name}</span>
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {t(L("Saved with the form, so every task plays the same video.", "Disimpan bersama form, jadi setiap task memutar video yang sama."))}
      </p>
    </div>
  )
}

/* ── runtime player ─────────────────────────────────────────────────────── */

/** Icon button on the dark video frame. */
function BarButton({ label, icon, onClick, disabled, pressed, id, invalid }: { label: string; icon: IconSvgElement; onClick: () => void; disabled?: boolean; pressed?: boolean; id?: string; invalid?: boolean }) {
  return (
    <Button
      id={id}
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={pressed}
      aria-invalid={invalid || undefined}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="text-white hover:bg-white/15 hover:text-white focus-visible:ring-white/50 dark:hover:bg-white/15"
    >
      <HugeiconsIcon icon={icon} />
    </Button>
  )
}

interface PlayerProps {
  p: VideoProps
  v: VideoValue
  onChange: (next: VideoValue) => void
  state: FieldState
  bad: boolean
  compact: boolean
  id: string
  src: Source
  loading: boolean
}

function Player({ p, v, onChange, state, bad, compact, id, src, loading }: PlayerProps) {
  const t = useT()
  const bar = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const nudgeTimer = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [nudge, setNudge] = useState(false)
  const dur = src.video.duration
  const off = state === "disabled"
  const canPlay = !off && !loading
  const lockAhead = state === "active" && p.requireWatch && !p.allowSeekAhead
  const reach = reachOf(v.watched)
  const ended = v.pos >= dur
  const pos = Math.min(dur, v.pos)
  const buffered = loading ? 0 : Math.min(dur, Math.max(pos, reach) + BUFFER_S)
  const pct = (s: number) => `${(Math.min(dur, Math.max(0, s)) / dur) * 100}%`

  /* Simulated playback: the playhead moves while playing; played parts are remembered. */
  const tick = useEffectEvent(() => {
    const next = Math.min(dur, v.pos + TICK_MS / 1000)
    onChange({ ...v, pos: next, watched: addRange(v.watched, v.pos, next) })
    if (next >= dur) setPlaying(false)
  })
  useEffect(() => {
    if (!playing || !canPlay) return
    const timer = window.setInterval(() => tick(), TICK_MS)
    return () => window.clearInterval(timer)
  }, [playing, canPlay])
  useEffect(() => () => window.clearTimeout(nudgeTimer.current), [])

  const flashNudge = () => {
    window.clearTimeout(nudgeTimer.current)
    setNudge(true)
    nudgeTimer.current = window.setTimeout(() => setNudge(false), NUDGE_MS)
  }
  const seek = (to: number) => {
    let x = Math.min(dur, Math.max(0, to))
    if (lockAhead && x > reach + 0.25) {
      x = reach
      flashNudge()
    }
    onChange({ ...v, pos: x })
  }
  const toggle = () => {
    if (!canPlay) return
    if (ended) {
      onChange({ ...v, pos: 0 })
      setPlaying(true)
    } else setPlaying((x) => !x)
  }
  const timeAt = (clientX: number) => {
    const r = bar.current?.getBoundingClientRect()
    return r && r.width ? ((clientX - r.left) / r.width) * dur : 0
  }
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!canPlay) return
    const k = e.key
    const step = k === "PageUp" || k === "PageDown" ? 30 : 5
    if (k === " " || k === "k" || k === "K") toggle()
    else if (k === "ArrowRight" || k === "ArrowUp" || k === "PageUp") seek(pos + step)
    else if (k === "ArrowLeft" || k === "ArrowDown" || k === "PageDown") seek(pos - step)
    else if (k === "Home") seek(0)
    else if (k === "End") seek(dur)
    else return
    e.preventDefault()
  }

  const playLabel = t(ended ? L("Replay", "Putar ulang") : playing ? L("Pause", "Jeda") : L("Play", "Putar"))

  return (
    <div className={cn("relative min-w-0 overflow-hidden rounded-2xl bg-black", aspectClass(p), bad && "ring-3 ring-destructive/40", off && "opacity-60")}>
      <VideoFrame video={src.video} at={pos} className="absolute inset-0 size-full" />
      {/* Click anywhere on the picture to play / pause (keyboard: the buttons below). */}
      <div className={cn("absolute inset-0", canPlay && "cursor-pointer")} onClick={toggle} aria-hidden />
      {nudge ? (
        <span className="pointer-events-none absolute top-2.5 left-2.5 inline-flex max-w-[calc(100%-1.25rem)] items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-medium text-white">
          <HugeiconsIcon icon={SquareLock02Icon} className="size-3.5 shrink-0" />
          <span className="truncate">{t(L("Skipping ahead is off", "Tidak bisa melompat ke depan"))}</span>
        </span>
      ) : (
        <ProviderChip provider={src.provider} />
      )}
      {loading ? (
        <span role="status" className="absolute top-1/2 left-1/2 flex -translate-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-xs text-white">
          <Spinner aria-hidden className="size-4" />
          {t(L("Loading video…", "Memuat video…"))}
        </span>
      ) : (
        !playing &&
        !off && (
          <span
            className={cn(
              /* bottom-left, like most players, so it never covers the poster's title */
              "pointer-events-none absolute grid place-items-center rounded-full bg-black/55 text-white ring-1 ring-white/30 backdrop-blur-sm",
              compact ? "bottom-12 left-3 size-12" : "bottom-16 left-5 size-16",
            )}
            aria-hidden
          >
            <HugeiconsIcon icon={ended ? VideoReplayIcon : PlayIcon} className={compact ? "size-5" : "size-7"} />
          </span>
        )
      )}
      <span role="status" className="sr-only">
        {nudge ? t(L(`Skipping ahead is off. Keep watching from ${clock(reach)}.`, `Tidak bisa melompat ke depan. Lanjutkan menonton dari ${clock(reach)}.`)) : ""}
      </span>

      <div className={cn("absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent", compact ? "px-2 pt-6 pb-1" : "px-3 pt-8 pb-1.5")}>
        <div
          ref={bar}
          role="slider"
          tabIndex={canPlay ? 0 : -1}
          aria-label={t(L("Seek", "Posisi video"))}
          aria-valuemin={0}
          aria-valuemax={dur}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={t(L(`${clock(pos)} of ${clock(dur)}`, `${clock(pos)} dari ${clock(dur)}`))}
          aria-disabled={!canPlay || undefined}
          onKeyDown={onKey}
          onPointerDown={(e) => {
            if (!canPlay || (e.pointerType === "mouse" && e.button !== 0)) return
            e.currentTarget.setPointerCapture(e.pointerId)
            dragging.current = true
            seek(timeAt(e.clientX))
          }}
          onPointerMove={(e) => dragging.current && seek(timeAt(e.clientX))}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
          className={cn(
            "group/seek relative flex h-4 touch-none items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60",
            canPlay ? "cursor-pointer" : "cursor-default",
          )}
        >
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <span className="absolute inset-y-0 left-0 bg-white/25" style={{ width: pct(buffered) }} />
            {v.watched.map(([a, b], i) => (
              <span key={i} className="absolute inset-y-0 bg-white/55" style={{ left: pct(a), width: pct(b - a) }} />
            ))}
            <span className="absolute inset-y-0 left-0 bg-primary" style={{ width: pct(pos) }} />
          </div>
          {p.requireWatch && <span className="pointer-events-none absolute top-0.5 h-3 w-0.5 rounded-full bg-white/90" style={{ left: `${pctOf(p)}%` }} aria-hidden />}
          <span
            className="pointer-events-none absolute size-3.5 -translate-x-1/2 rounded-full bg-white shadow ring-1 ring-black/20 transition-transform group-hover/seek:scale-110"
            style={{ left: pct(pos) }}
            aria-hidden
          />
        </div>
        <div className="flex items-center gap-1 text-white">
          <BarButton id={`${id}-input`} label={playLabel} icon={ended ? VideoReplayIcon : playing ? PauseIcon : PlayIcon} onClick={toggle} disabled={!canPlay} invalid={bad} />
          <span className="text-xs whitespace-nowrap tabular-nums">
            {clock(pos)} / {clock(dur)}
          </span>
          <span className="ml-auto flex items-center">
            <BarButton
              label={t(muted ? L("Unmute", "Bunyikan") : L("Mute", "Bisukan"))}
              icon={muted ? VolumeMute02Icon : VolumeHighIcon}
              pressed={muted}
              onClick={() => setMuted((m) => !m)}
              disabled={off}
            />
            <BarButton
              label={t(L("Full screen", "Layar penuh"))}
              icon={FullscreenIcon}
              onClick={() => toast.info(t(L("Prototype: the player would go full screen", "Prototipe: pemutar akan tampil layar penuh")))}
              disabled={off}
            />
          </span>
        </div>
      </div>
    </div>
  )
}

function VideoRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<VideoProps, VideoValue>) {
  const t = useT()
  const view = viewOf(p, v.sim)
  const loads = view.kind === "video" || view.kind === "error"
  /* Every change to the source or the simulation (and Retry / Reload) loads again. */
  const reqKey = JSON.stringify([p.source, p.url, p.file, p.variable, v.sim, v.load])
  const [doneKey, setDoneKey] = useState<string | null>(null)
  useEffect(() => {
    if (!loads) return
    const timer = window.setTimeout(() => setDoneKey(reqKey), LOAD_MS)
    return () => window.clearTimeout(timer)
  }, [reqKey, loads])
  const loading = loads && doneKey !== reqKey
  const bad = issues.length > 0
  const off = state === "disabled"
  const msgs = [...new Set(issues.map((i) => t(i.msg)))]
  const retry = () => onChange({ ...v, sim: "ok", load: v.load + 1 })

  let body: ReactNode
  if (view.kind === "video" || (view.kind === "error" && loading)) {
    body = <Player key={`${reqKey}|${state}`} p={p} v={v} onChange={onChange} state={state} bad={bad} compact={compact} id={id} src={view.src} loading={loading} />
  } else if (view.kind === "error" || view.kind === "offline") {
    const offline = view.kind === "offline"
    body = (
      <Frame bad={bad} off={off}>
        <div role="alert">
          <StateBox
            bad
            icon={offline ? WifiDisconnected01Icon : VideoOffIcon}
            title={offline ? L("You're offline", "Anda sedang offline") : L("Couldn't load the video", "Video gagal dimuat")}
            text={
              offline
                ? L("The video needs an internet connection. Your other answers are kept.", "Video butuh koneksi internet. Isian Anda yang lain tetap tersimpan.")
                : L(
                    "It may have been removed or made private, or the app blocks this host. Your other answers are kept.",
                    "Video mungkin sudah dihapus atau dijadikan privat, atau aplikasi memblokir host ini. Isian Anda yang lain tetap tersimpan.",
                  )
            }
          >
            <Button id={`${id}-input`} variant="outline" size="sm" disabled={off} onClick={retry}>
              <HugeiconsIcon icon={Refresh01Icon} />
              {t(L("Retry", "Coba lagi"))}
            </Button>
          </StateBox>
        </div>
      </Frame>
    )
  } else {
    body = (
      <Frame off={off}>
        {view.kind === "empty" ? (
          <StateBox icon={VideoOffIcon} text={L("No video yet — it is uploaded in an earlier step.", "Belum ada video — diunggah di langkah sebelumnya.")} />
        ) : (
          <StateBox icon={Alert02Icon} text={L("The form owner hasn't set the video yet.", "Pemilik form belum mengatur videonya.")} />
        )}
      </Frame>
    )
  }

  const dur = view.kind === "video" ? view.src.video.duration : 0
  const showWatch = p.requireWatch && state === "active" && view.kind === "video" && !loading
  const done = isDone(p, v, dur)
  const seen = watchedSec(v.watched)
  const share = dur ? Math.floor((Math.min(seen, dur) / dur) * 100) : 0

  return (
    <div role="region" aria-labelledby={p.showLabel && p.label.en.trim() ? `${id}-label` : undefined} aria-label={p.showLabel && p.label.en.trim() ? undefined : t(p.label)} className="flex min-w-0 flex-col gap-2">
      <Title p={p} id={`${id}-label`} />
      {body}
      {hasCaption(p) && <p className="text-xs text-pretty text-muted-foreground">{t(p.caption)}</p>}
      {showWatch && (
        <p className={cn("flex items-start gap-1.5 text-xs", done ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>
          <HugeiconsIcon icon={done ? Tick02Icon : ViewIcon} className="mt-px size-3.5 shrink-0" />
          <span>
            {t(
              done
                ? L(`Watched enough to continue (${share}%).`, `Sudah cukup ditonton untuk lanjut (${share}%).`)
                : L(
                    `Watched ${clock(seen)} of ${clock(dur)} (${share}%) · at least ${pctOf(p)}% before Complete Task`,
                    `Sudah ditonton ${clock(seen)} dari ${clock(dur)} (${share}%) · minimal ${pctOf(p)}% sebelum Selesaikan Task`,
                  ),
            )}
            {!done && !p.allowSeekAhead && ` · ${t(L("skipping ahead is off", "tidak bisa melompat ke depan"))}`}
          </span>
        </p>
      )}
      {msgs.map((m) => (
        <p key={m} role="alert" className="text-xs font-medium text-destructive">
          {m}
        </p>
      ))}
    </div>
  )
}

/* ── simulation controls ────────────────────────────────────────────────── */

function VideoControls({ props: p, value: v, onChange, state }: { props: VideoProps; value: VideoValue; onChange: (next: VideoValue) => void; state: FieldState }) {
  const t = useT()
  const id = useId()
  const view = viewOf(p, v.sim)
  const dur = view.kind === "video" ? view.src.video.duration : 0
  const sims = simsFor(p)
  const cur = sims.find((s) => s.v === v.sim) ?? sims[0]
  const jump = (f: number) => {
    const x = Math.min(dur, dur * f)
    onChange({ ...v, pos: x, watched: addRange(v.watched, 0, x) })
  }
  const jumps: [number, L10n][] = [
    [0.5, L("50%")],
    [0.89, L("89%")],
    [1, L("End", "Akhir")],
  ]
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <span id={`${id}-jump`} className="text-xs text-muted-foreground">
          {t(L("Pretend the user has watched up to", "Anggap user sudah menonton sampai"))}
        </span>
        <div role="group" aria-labelledby={`${id}-jump`} className="flex flex-wrap gap-1.5">
          {jumps.map(([f, label]) => (
            <Button key={f} variant="outline" size="sm" disabled={!dur || state === "disabled"} onClick={() => jump(f)}>
              {t(label)}
            </Button>
          ))}
        </div>
        {p.requireWatch && (
          <p className="text-xs text-muted-foreground">
            {t(L(`Complete Task needs ${pctOf(p)}% watched.`, `Selesaikan Task butuh ${pctOf(p)}% ditonton.`))}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span id={`${id}-sim`} className="text-xs text-muted-foreground">
          {p.source === "variable" ? (
            <>
              {t(L("Network, or what ", "Jaringan, atau isi "))}
              <span className="font-mono">{p.variable}</span>
              {t(L(" holds", ""))}
            </>
          ) : (
            t(L("What the network does", "Kondisi jaringan"))
          )}
        </span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={1}
          value={v.sim}
          aria-labelledby={`${id}-sim`}
          onValueChange={(x) => {
            const s = sims.find((o) => o.v === x)
            if (s) onChange({ ...v, sim: s.v, load: v.load + 1 })
          }}
          className="flex-wrap"
        >
          {sims.map((s) => (
            <ToggleGroupItem key={s.v} value={s.v} className="px-3 text-xs">
              {t(s.label)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">{t(cur.desc)}</p>
      </div>
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => onChange({ ...v, load: v.load + 1 })}>
        <HugeiconsIcon icon={Refresh01Icon} />
        {t(L("Reload", "Muat ulang"))}
      </Button>
    </div>
  )
}

/* ── definition ─────────────────────────────────────────────────────────── */

function validate(p: VideoProps, v: VideoValue): Issue[] {
  if (!p.requireWatch) return []
  const view = viewOf(p, v.sim)
  // Nothing to watch (empty variable) never blocks; a failed load or offline does — Retry is right there.
  const short = (view.kind === "video" && !isDone(p, v, view.src.video.duration)) || view.kind === "error" || view.kind === "offline"
  return short ? [{ fid: "video-watch", msg: watchMsg(p) }] : []
}

const initial = (): VideoValue => ({ sim: "ok", load: 0, pos: 0, watched: [] })

function sourceSpec(p: VideoProps) {
  if (p.source === "link") {
    const r = parseLink(p.url)
    const e = "embed" in r ? r.embed : null
    return { type: "link", url: p.url, provider: e?.provider ?? null, video_id: e?.id ?? null, embed_url: e ? embedUrl(e) : null }
  }
  if (p.source === "upload") {
    const f = VIDEO_UPLOADS.find((x) => x.id === p.file)
    return { type: "upload", provider: "file", file: f ? { file_id: f.id, file_name: f.file_name, mime: f.mime, size: f.size, duration_s: f.duration } : null }
  }
  return { type: "variable", provider: "file", variable: p.variable }
}

export const video: ComponentDef<VideoProps, VideoValue> = {
  slug: "video",
  wave: 4,
  week: 6,
  ui: "VIDEO",
  vk: "none",
  group: "display",
  icon: PlayCircleIcon,
  label: L("Video embed", "Sematan video"),
  title: L("Video embed", "Sematan video"),
  blurb: L(
    "Plays a YouTube, Vimeo or uploaded video in the task, optionally watched before Complete Task.",
    "Memutar video YouTube, Vimeo, atau unggahan di dalam task, opsional wajib ditonton sebelum Selesaikan Task.",
  ),

  defaults: () => ({
    label: L("Safety induction video", "Video induksi K3"),
    name: "safety_induction_video",
    source: "link",
    url: "https://www.youtube.com/watch?v=K3jk9Wq2xLs",
    file: K3_VIDEO.id,
    variable: "induction_video",
    aspect: "16:9",
    caption: L(
      "Watch the whole video (5½ minutes). The questions below are about it.",
      "Tonton videonya sampai habis (5½ menit). Pertanyaan di bawah membahas isinya.",
    ),
    requireWatch: true,
    watchPercent: 90,
    allowSeekAhead: false,
    showLabel: true,
  }),
  schema: (p) => [
    {
      tab: "general",
      fields: [
        F.name(L("Name", "Nama"), {
          hint: L(
            "Title above the player when **Show the name** is on; also used in the watch message.",
            "Judul di atas pemutar bila **Tampilkan nama** aktif; juga dipakai di pesan wajib tonton.",
          ),
        }),
        F.key(
          L(
            "Identity of the node. The video sends no value, so nothing is saved under this key.",
            "Identitas node. Video tidak mengirim nilai, jadi tidak ada yang tersimpan di key ini.",
          ),
        ),
      ],
    },
    {
      tab: "general",
      title: L("Video", "Video"),
      fields: [
        {
          t: "seg",
          k: "source",
          label: L("Play the video from", "Putar video dari"),
          options: [
            { v: "link", label: L("Link", "Tautan") },
            { v: "upload", label: L("Uploaded file", "Berkas unggahan") },
            { v: "variable", label: L("File variable", "Variabel berkas") },
          ],
        },
        {
          t: "url",
          k: "url",
          label: L("YouTube or Vimeo link", "Tautan YouTube atau Vimeo"),
          placeholder: "https://www.youtube.com/watch?v=…",
          when: (o) => o.source === "link",
          validate: (v) => {
            const r = parseLink(v)
            return "err" in r ? r.err : null
          },
          hint: L(
            "Watch, share, Shorts and embed links all work. Plays from `youtube-nocookie.com` or Vimeo with do-not-track (**Wave 4 open decision 6**).",
            "Tautan watch, share, Shorts, dan embed bisa dipakai. Diputar dari `youtube-nocookie.com` atau Vimeo tanpa pelacakan (**keputusan terbuka Gelombang 4 no. 6**).",
          ),
        },
        { t: "custom", id: "link-check", when: (o) => o.source === "link", render: ({ props }) => <LinkCheck url={props.url} /> },
        {
          t: "custom",
          id: "file",
          label: L("Video file", "Berkas video"),
          when: (o) => o.source === "upload",
          render: ({ props, set }) => <VideoPicker value={props.file} onChange={(file) => set({ file })} />,
          validate: (_, o) => (VIDEO_UPLOADS.some((f) => f.id === o.file) ? null : L("Pick the video to play", "Pilih video yang diputar")),
        },
        {
          t: "select",
          k: "variable",
          label: L("File variable", "Variabel berkas"),
          when: (o) => o.source === "variable",
          options: VIDEO_VAR_KEYS.map((k) => ({
            v: k,
            label: L(`${k} — ${VIDEO_VARS[k].step.en}${VIDEO_VARS[k].video ? "" : " · empty"}`, `${k} — ${VIDEO_VARS[k].step.id}${VIDEO_VARS[k].video ? "" : " · kosong"}`),
          })),
          hint: L("`file` variables set by earlier steps, e.g. a video HSE uploaded.", "Variabel `file` yang diisi langkah sebelumnya, mis. video yang diunggah HSE."),
        },
      ],
    },
    {
      tab: "general",
      title: L("Player", "Pemutar"),
      fields: [
        {
          t: "seg",
          k: "aspect",
          label: L("Shape", "Bentuk"),
          options: [
            { v: "16:9", label: L("16:9 wide", "16:9 lebar") },
            { v: "4:3", label: L("4:3") },
          ],
          hint: L("Width always follows the form.", "Lebarnya selalu mengikuti form."),
        },
        { t: "i18n", k: "caption", label: L("Caption", "Keterangan"), multi: true, rows: 2, hint: L("Optional, under the player.", "Opsional, di bawah pemutar.") },
        { t: "switch", k: "showLabel", label: L("Show the name", "Tampilkan nama"), hint: L("A title above the player.", "Judul di atas pemutar.") },
      ],
    },
    {
      tab: "validation",
      fields: [
        {
          t: "switch",
          k: "requireWatch",
          label: L("Must watch before Complete Task", "Wajib ditonton sebelum Selesaikan Task"),
          hint: L(
            `Message: “${watchMsg(p).en}”. Skipped when the variable has no video yet.`,
            `Pesan: “${watchMsg(p).id}”. Dilewati bila variabel belum berisi video.`,
          ),
        },
        {
          t: "number",
          k: "watchPercent",
          label: L("Watch at least", "Minimal ditonton"),
          min: 50,
          max: 100,
          step: 5,
          suffix: "%",
          when: (o) => o.requireWatch,
          validate: (v) => {
            const n = Number(v)
            return v === "" || v == null || Number.isNaN(n) || n < 50 || n > 100 ? L("Use 50–100%", "Gunakan 50–100%") : null
          },
          hint: L("Counts only the parts actually played.", "Hanya bagian yang benar-benar diputar yang dihitung."),
        },
        {
          t: "switch",
          k: "allowSeekAhead",
          label: L("Allow skipping ahead", "Boleh melompat ke depan"),
          when: (o) => o.requireWatch,
          hint: L(
            "Off: the seek bar stops at the furthest point watched. Either way, skipped parts never count as watched.",
            "Nonaktif: bilah posisi berhenti di titik terjauh yang sudah ditonton. Bagaimanapun, bagian yang dilompati tidak dihitung ditonton.",
          ),
        },
        {
          t: "note",
          when: (o) => o.requireWatch,
          text: L(
            "A UX guard, not proof of watching. Progress is not saved: reopening the task or a draft starts from 0 (**Wave 4 open decision 6**).",
            "Pengaman UX, bukan bukti sudah menonton. Progres tidak disimpan: membuka ulang task atau draft mulai dari 0 (**keputusan terbuka Gelombang 4 no. 6**).",
          ),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.requireWatch,
  Canvas: VideoCanvas,
  canvasWarn: (p) => {
    if (sourceOf(p) !== undefined) return null
    if (p.source === "link") return L("The video link is not valid", "Tautan video tidak valid")
    return p.source === "upload" ? L("No video chosen", "Belum ada video") : L("Pick the file variable", "Pilih variabel berkas")
  },

  Runtime: VideoRuntime,
  Controls: VideoControls,
  hasControls: (p) => sourceOf(p) != null,
  controlsTitle: L("Video", "Video"),
  devices: true,
  bare: true,
  initial,
  sample: initial,
  validate,
  value: () => undefined,

  spec: (p) => ({
    ui_type: "VIDEO",
    value_kind: "none",
    name: p.name,
    label: p.label,
    required: p.requireWatch,
    config: {
      source: sourceSpec(p),
      aspect: p.aspect,
      caption: hasCaption(p) ? p.caption : null,
      require_watch: p.requireWatch,
      watch_percent: p.requireWatch ? Number(p.watchPercent) : null,
      allow_seek_ahead: p.requireWatch ? p.allowSeekAhead : true,
      show_label: p.showLabel,
    },
  }),
  savedAs: (p) =>
    p.requireWatch
      ? L(
          "Nothing. The share watched is checked on Complete Task, then dropped (Wave 4 open decision 6).",
          "Tidak ada. Bagian yang ditonton dicek saat Selesaikan Task, lalu dibuang (keputusan terbuka Gelombang 4 no. 6).",
        )
      : L("Nothing. The player only shows the video.", "Tidak ada. Pemutar hanya menampilkan video."),
  dataExtra: (p) => {
    const src = sourceOf(p)
    if (!src) return []
    return [
      {
        title: L("Embed check", "Cek sematan"),
        sub: L("What the renderer needs · not saved", "Yang dibutuhkan renderer · tidak disimpan"),
        json: src.embed
          ? { provider: src.embed.provider, embed_url: embedUrl(src.embed), csp_frame_src: ["https://www.youtube-nocookie.com", "https://player.vimeo.com"], watched_saved: false }
          : { provider: "file", player: "<video> + short-lived signed URL", csp_media_src: ["'self'"], watched_saved: false },
      },
    ]
  },
  notes: [
    L(
      "Embeds use privacy-enhanced hosts: YouTube through `www.youtube-nocookie.com/embed/<id>`, Vimeo through `player.vimeo.com/video/<id>?dnt=1`. The app's CSP `frame-src` must allow both; other hosts are rejected in Edit Element (**Wave 4 open decision 6**).",
      "Sematan memakai host yang menjaga privasi: YouTube lewat `www.youtube-nocookie.com/embed/<id>`, Vimeo lewat `player.vimeo.com/video/<id>?dnt=1`. CSP `frame-src` aplikasi harus mengizinkan keduanya; host lain ditolak di Edit Element (**keputusan terbuka Gelombang 4 no. 6**).",
    ),
    L(
      "Uploaded and variable videos play in a native `<video>` through a short-lived signed URL, like Document preview files. Watch tracking reads the player's time updates (YouTube IFrame API / Vimeo Player SDK for embeds).",
      "Video unggahan dan variabel diputar di `<video>` bawaan lewat signed URL berumur pendek, seperti berkas Document preview. Pelacakan tonton membaca update waktu pemutar (YouTube IFrame API / Vimeo Player SDK untuk sematan).",
    ),
    L(
      "Nothing is saved (`value_kind: \"none\"`). “Watched” counts only the parts actually played, so skipping never counts; progress lives in the page and resets when the task is reopened, like Document preview read-to-end (**Wave 4 open decision 6**).",
      "Tidak ada yang disimpan (`value_kind: \"none\"`). “Ditonton” hanya menghitung bagian yang benar-benar diputar, jadi melompat tidak pernah terhitung; progres hanya ada di halaman dan kembali ke 0 saat task dibuka ulang, sama seperti baca-sampai-akhir di Document preview (**keputusan terbuka Gelombang 4 no. 6**).",
    ),
    L(
      "Same rule as Document preview: with Must watch on, a failed load or offline blocks Complete Task (Retry is right there); an empty variable never blocks.",
      "Aturannya sama dengan Document preview: dengan Wajib ditonton aktif, gagal muat atau offline memblokir Selesaikan Task (Coba lagi tersedia); variabel kosong tidak pernah memblokir.",
    ),
    L(
      "Keyboard on the seek bar: Space / K play-pause, arrows ±5 s, PageUp / PageDown ±30 s, Home / End. Read-only can still play; Disabled shows the first frame only.",
      "Keyboard di bilah posisi: Spasi / K putar-jeda, panah ±5 dtk, PageUp / PageDown ±30 dtk, Home / End. Baca-saja tetap bisa diputar; Nonaktif hanya menampilkan frame pertama.",
    ),
  ],
  story: {
    process: L("New-hire safety induction", "Induksi K3 karyawan baru"),
    step: L("Watch the induction video", "Tonton video induksi"),
    ref: "HSE-2026-0731",
    due: "2026-11-16",
    task: L("Safety induction before your first shift — Rizky Pratama", "Induksi K3 sebelum shift pertama — Rizky Pratama"),
    after: [
      {
        name: "safety_rules_understood",
        label: L("I understand the safety rules and will follow them.", "Saya memahami aturan K3 dan akan mematuhinya."),
        type: "checkbox",
        required: true,
        value: "",
        requiredMsg: L("Confirm that you understand the safety rules", "Centang bahwa Anda memahami aturan K3"),
      },
      {
        name: "assembly_point",
        label: L("Where is the assembly point?", "Di mana titik kumpul?"),
        type: "select",
        required: true,
        value: "",
        hint: L("It's in the video, around 3:10.", "Ada di video, sekitar menit 3:10."),
        options: [
          { v: "canteen", label: L("Canteen", "Kantin") },
          { v: "gate_2_car_park", label: L("Car park by Gate 2", "Parkiran dekat Gerbang 2") },
          { v: "building_a_lobby", label: L("Building A lobby", "Lobi Gedung A") },
          { v: "production_floor", label: L("Production floor", "Lantai produksi") },
        ],
      },
    ],
  },
}
