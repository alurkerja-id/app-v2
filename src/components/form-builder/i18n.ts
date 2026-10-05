import { createContext, useCallback, useContext } from "react"

/* Form-builder copy is bilingual like Studio: every label is { en, id }.
   The page has its own EN / ID switch; the rest of app-v2 stays English. */

export type Lang = "en" | "id"

export interface L10n {
  en: string
  id: string
}

export type Text = L10n | string

/** Bilingual string. `id` falls back to `en` when omitted. */
export const L = (en: string, id: string = en): L10n => ({ en, id })

/** Resolve a bilingual string; an empty side falls back to the other one. */
export function tr(lang: Lang, s: Text | null | undefined): string {
  if (s == null) return ""
  if (typeof s === "string") return s
  return s[lang] || s.en || s.id || ""
}

export const LANG_STORAGE_KEY = "form-builder-lang"

export interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

export const LangContext = createContext<LangContextValue>({ lang: "en", setLang: () => {} })

export function useLang() {
  return useContext(LangContext)
}

/** `t(L("Save", "Simpan"))` → string in the current form-builder language. */
export function useT() {
  const { lang } = useLang()
  return useCallback((s: Text | null | undefined) => tr(lang, s), [lang])
}
