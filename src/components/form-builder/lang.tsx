import { useCallback, useState, type ReactNode } from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { LANG_STORAGE_KEY, LangContext, useLang, type Lang } from "./i18n"

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(LANG_STORAGE_KEY) === "id" ? "id" : "en"))
  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    localStorage.setItem(LANG_STORAGE_KEY, next)
  }, [])
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

/** EN / ID switch for the form-builder copy (labels, hints, messages). */
export function LangToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang()
  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={lang}
      onValueChange={(v) => v && setLang(v as Lang)}
      aria-label="Language"
      className={className}
    >
      <ToggleGroupItem value="en" className="px-2.5 text-xs">
        EN
      </ToggleGroupItem>
      <ToggleGroupItem value="id" className="px-2.5 text-xs">
        ID
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
