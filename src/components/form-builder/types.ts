import type { ReactNode } from "react"
import type { IconSvgElement } from "@hugeicons/react"

import type { L10n, Lang } from "./i18n"

/* ── Shared vocabulary ──────────────────────────────────────────────────── */

/** Same three states as the Form Component page. */
export type FieldState = "active" | "readonly" | "disabled"

/** How the value travels in the payload (shaping: value_kind contract). */
export type ValueKind = "string" | "number" | "boolean" | "list" | "json" | "file" | "none"

export type Wave = 1 | 2 | 3
export type Week = 1 | 2 | 3 | 4 | 5
export type GroupId = "input" | "choice" | "date" | "survey" | "field" | "layout" | "display" | "data" | "advanced"

/** Tabs of Studio's Edit Element modal. */
export type EditorTab = "general" | "logic" | "validation"

/** A validation message. `fid` points at the control it belongs to (e.g. "row-2"). */
export interface Issue {
  fid: string
  msg: L10n
}

export interface Option<V extends string | number = string> {
  v: V
  label: L10n
}

/* ── Edit Element schema ────────────────────────────────────────────────── */

/** One row of a `list` editor. Bilingual rows carry `label`; plain rows carry `text`. */
export interface ListItem {
  label?: L10n
  text?: string
  [key: string]: unknown
}

type Key<P> = Extract<keyof P, string>

interface FieldBase<P> {
  label?: L10n
  hint?: L10n
  /** Hide the field unless this returns true. */
  when?: (p: P) => boolean
  /** Message shown under the field (and blocks Save Changes), or null. */
  validate?: (value: unknown, p: P) => L10n | null
}

export interface CustomCtx<P> {
  props: P
  set: (patch: Partial<P>) => void
  lang: Lang
}

export type PropField<P> =
  /** EN + ID pair. `multi` = textarea. */
  | (FieldBase<P> & { t: "i18n"; k: Key<P>; multi?: boolean; rows?: number })
  | (FieldBase<P> & { t: "text"; k: Key<P>; placeholder?: L10n; mono?: boolean })
  | (FieldBase<P> & { t: "url"; k: Key<P>; placeholder?: string })
  | (FieldBase<P> & { t: "switch"; k: Key<P> })
  /** Stepper. Empty input is stored as "" when `allowEmpty`. */
  | (FieldBase<P> & { t: "number"; k: Key<P>; min?: number; max?: number; step?: number; suffix?: string; allowEmpty?: boolean })
  | (FieldBase<P> & { t: "select"; k: Key<P>; options: Option<string>[] })
  /** Segmented choice. `set` lets one choice reset other props (e.g. Likert scale → labels). */
  | (FieldBase<P> & { t: "seg"; k: Key<P>; options: Option<string | number>[]; set?: (p: P, v: string | number) => P })
  /** Multi-select chips; value is string[]. */
  | (FieldBase<P> & { t: "chips"; k: Key<P>; options: Option<string>[] })
  | (FieldBase<P> & { t: "date"; k: Key<P> })
  /**
   * Rows editor. Bilingual rows (default) edit `label`; `i18n: false` rows edit `text`.
   * `keyField` is derived from the English label (snake_case) and shown small under the row.
   * `fixed` = no add / remove / reorder.
   */
  | (FieldBase<P> & {
      t: "list"
      k: Key<P>
      i18n?: boolean
      keyField?: string
      min?: number
      max?: number
      fixed?: boolean
      addLabel?: L10n
      newItem?: (n: number) => ListItem
    })
  | (FieldBase<P> & { t: "custom"; id: string; render: (ctx: CustomCtx<P>) => ReactNode })
  | { t: "note"; text: L10n; tone?: "info" | "warning"; when?: (p: P) => boolean }

export interface PropSection<P> {
  tab: EditorTab
  title?: L10n
  fields: PropField<P>[]
}

/* ── Runtime ────────────────────────────────────────────────────────────── */

export interface RuntimeProps<P, R> {
  props: P
  value: R
  onChange: (next: R) => void
  state: FieldState
  /** Issues from the last Submit for this component (empty until then). */
  issues: Issue[]
  /** Narrow (phone) layout. */
  compact: boolean
  /** Unique prefix for DOM ids inside this instance. */
  id: string
}

/** A field around the new component in the runtime task form. */
export interface StoryField {
  name: string
  /** Field label; for a checkbox, the text beside the box. */
  label: L10n
  type: "text" | "textarea" | "select" | "number" | "date" | "checkbox"
  /** Initial value. A checkbox is checked when "true"; its payload value is a boolean. */
  value?: string
  required?: boolean
  /** Message when a required field is left empty (default "<label> is required"). */
  requiredMsg?: L10n
  /** Text before a number, e.g. "Rp". */
  prefix?: string
  hint?: L10n
  placeholder?: L10n
  rows?: number
  options?: Option<string>[]
  validate?: (value: string) => L10n | null
}

/** The task the runtime tab pretends to be (mock data). */
export interface Story {
  process: L10n
  step: L10n
  ref: string
  due: string
  task: L10n
  before?: StoryField[]
  after?: StoryField[]
}

/** A labelled JSON block shown in the Data tab next to spec and payload. */
export interface DataExtra {
  title: L10n
  sub: L10n
  json: unknown
}

export interface ComponentDef<P, R> {
  slug: string
  wave: Wave
  /** ui_type in the spec. */
  ui: string
  /** form_field_type, when the component is a variant of INPUT. */
  fft?: string
  vk: ValueKind
  /** ★ = built together with a senior. */
  star?: boolean
  group: GroupId
  week: Week
  icon: IconSvgElement
  /** Palette name. */
  label: L10n
  /** Page title. */
  title: L10n
  blurb: L10n

  defaults: () => P
  /** Edit Element content, per tab. */
  schema: (p: P) => PropSection<P>[]
  /** The field label the user sees (usually `p.label`). */
  fieldLabel: (p: P) => L10n
  isRequired: (p: P) => boolean
  /** Builder canvas preview: static, no interaction. */
  Canvas: (props: { props: P }) => ReactNode
  /** Warning badge on the canvas node (e.g. duplicate keys). */
  canvasWarn?: (p: P) => L10n | null

  /** Control only — FieldShell draws the label, required mark and messages. */
  Runtime: (props: RuntimeProps<P, R>) => ReactNode
  /** Runtime state for an empty form. */
  initial: (p: P) => R
  /** A filled-in value for the Read-only / Disabled columns. */
  sample: (p: P) => R
  validate: (p: P, r: R) => Issue[]
  /** Value under `p.name` in the payload. Ignored when vk is "none". */
  value: (p: P, r: R) => unknown
  /** Payload key; defaults to `p.name`. */
  payloadKey?: (p: P) => string
  /**
   * Containers (Tabs, Accordion, Wizard): the child fields' own keys go straight into
   * the payload — flat, one process variable each — instead of one key for the component.
   */
  payloadEntries?: (p: P, r: R) => Record<string, unknown>
  /** value_kind when it depends on a setting (Hidden field); defaults to `vk`. */
  valueKindOf?: (p: P) => ValueKind
  /** Simulation controls (camera, GPS…) shown beside the runtime form. */
  Controls?: (props: { props: P; value: R; onChange: (next: R) => void; state: FieldState }) => ReactNode
  /** Show the simulation card only when this returns true (default: whenever `Controls` is set). */
  hasControls?: (p: P) => boolean
  /** What is simulated, appended to the card title, e.g. "Camera". */
  controlsTitle?: L10n
  /** Context card beside the runtime form (task history, leave balance…). Renders its own card. */
  Aside?: (props: { props: P; value: R }) => ReactNode
  /** Offer the desktop / phone preview switch. */
  devices?: boolean
  /** Runtime draws its own content with no field label above it (Paragraph, Link). */
  bare?: boolean

  spec: (p: P) => Record<string, unknown>
  savedAs: (p: P) => L10n
  notes: L10n[]
  dataExtra?: (p: P, r: R) => DataExtra[]
  story: Story
}

/* Registry erases the generics; each module keeps its own types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyComponentDef = ComponentDef<any, any>
