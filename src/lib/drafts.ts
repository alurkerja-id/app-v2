const PREFIX = "alurkerja:draft:"

export interface DraftMeta {
  key: string
  title: string
  context: string
  percent: number
  savedAt: string
}

export interface DraftRecord<T = unknown> extends DraftMeta {
  data: T
}

function storageKey(key: string) {
  return `${PREFIX}${key}`
}

export function saveDraft<T>(
  key: string,
  meta: Omit<DraftRecord<T>, "key" | "savedAt">,
): DraftRecord<T> {
  const record: DraftRecord<T> = { ...meta, key, savedAt: new Date().toISOString() }
  localStorage.setItem(storageKey(key), JSON.stringify(record))
  return record
}

export function loadDraft<T>(key: string): DraftRecord<T> | null {
  const raw = localStorage.getItem(storageKey(key))
  if (!raw) return null
  try {
    return JSON.parse(raw) as DraftRecord<T>
  } catch {
    return null
  }
}

export function deleteDraft(key: string) {
  localStorage.removeItem(storageKey(key))
}

/** All drafts currently stored, newest first. Used by a future "My Drafts" list. */
export function listDrafts(): DraftMeta[] {
  const out: DraftMeta[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith(PREFIX)) continue
    const raw = localStorage.getItem(k)
    if (!raw) continue
    try {
      const rec = JSON.parse(raw) as DraftRecord
      out.push({ key: rec.key, title: rec.title, context: rec.context, percent: rec.percent, savedAt: rec.savedAt })
    } catch {
      continue
    }
  }
  return out.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}
