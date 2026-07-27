import { useCallback, useEffect, useRef, useState } from "react"
import { deleteDraft, loadDraft, saveDraft, type DraftRecord } from "@/lib/drafts"

export type DraftSaveStatus = "idle" | "saving" | "saved"

interface UseDraftOptions<T> {
  /** Storage key, unique per form instance (e.g. `complete-task:T-004`). */
  key: string
  title: string
  context: string
  computePercent?: (data: T) => number
  autosaveDelay?: number
  /**
   * "auto"    — the form starts blank, so an existing draft is safe to apply
   *             immediately (Start Process).
   * "confirm" — the form starts pre-filled from another source of truth
   *             (a task's current field values), so an existing draft is
   *             surfaced as a choice rather than applied silently (Complete Task).
   */
  mode?: "auto" | "confirm"
}

export function useDraft<T extends object>(
  emptyData: T,
  { key, title, context, computePercent, autosaveDelay = 1000, mode = "auto" }: UseDraftOptions<T>,
) {
  const [existing] = useState<DraftRecord<T> | null>(() => loadDraft<T>(key))
  const autoApplied = mode === "auto" && !!existing

  const [data, setData] = useState<T>(autoApplied ? (existing as DraftRecord<T>).data : emptyData)
  const [status, setStatus] = useState<DraftSaveStatus>("idle")
  const [savedAt, setSavedAt] = useState<string | null>(autoApplied ? (existing as DraftRecord<T>).savedAt : null)
  const [resumedNotice, setResumedNotice] = useState(autoApplied)
  const [pendingDraft, setPendingDraft] = useState<DraftRecord<T> | null>(mode === "confirm" ? existing : null)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback(
    (current: T) => {
      const record = saveDraft<T>(key, {
        title,
        context,
        percent: computePercent ? computePercent(current) : 0,
        data: current,
      })
      setSavedAt(record.savedAt)
      setStatus("saved")
    },
    [key, title, context, computePercent],
  )

  const setField = useCallback(
    (patch: Partial<T>) => {
      const next = { ...data, ...patch }
      setData(next)
      setStatus("saving")
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => persist(next), autosaveDelay)
    },
    [data, persist, autosaveDelay],
  )

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const saveNow = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    persist(data)
  }, [data, persist])

  /** Call after a successful submit — the process/task now lives on the server. */
  const clearDraft = useCallback(() => {
    deleteDraft(key)
    setSavedAt(null)
    setStatus("idle")
  }, [key])

  /** "confirm" mode: apply the pending draft the user chose to resume. */
  const resumeDraft = useCallback(() => {
    if (!pendingDraft) return
    setData(pendingDraft.data)
    setSavedAt(pendingDraft.savedAt)
    setPendingDraft(null)
  }, [pendingDraft])

  /** "confirm" mode: user chose to keep the current (server) values instead. */
  const dismissDraft = useCallback(() => {
    deleteDraft(key)
    setPendingDraft(null)
  }, [key])

  /** "auto" mode: undo the silent auto-apply and start from a blank form. */
  const discardResumed = useCallback(() => {
    deleteDraft(key)
    setData(emptyData)
    setSavedAt(null)
    setStatus("idle")
    setResumedNotice(false)
  }, [key, emptyData])

  const dismissResumedNotice = useCallback(() => setResumedNotice(false), [])

  return {
    data,
    setField,
    status,
    savedAt,
    saveNow,
    clearDraft,
    pendingDraft,
    resumeDraft,
    dismissDraft,
    resumedNotice,
    dismissResumedNotice,
    discardResumed,
  }
}
