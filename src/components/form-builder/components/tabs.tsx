/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { LayoutTopIcon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GhostInput } from "../field-shell"
import { L, useT, type L10n } from "../i18n"
import { F } from "../lib"
import type { ComponentDef, RuntimeProps } from "../types"
import { SectionsEditor } from "./container-editor"
import {
  allFields,
  containerIssues,
  entries,
  field,
  fillVals,
  issueCounts,
  section,
  sectionIssues,
  sectionsError,
  sectionsSpec,
  valsByKey,
  type Section,
  type Vals,
} from "./container-model"
import { IssueBadge, SectionFields } from "./container-ui"
import { filled } from "./repeater-model"

/* Tabs ★ — ui_type TABS, value_kind "none" (container). Story: vendor onboarding profile.
   Each tab is a child node with its own `children` (shaping §4f). The fields inside keep
   their own keys, so the payload is flat — as if the tabs were not there. */

interface TabsProps {
  label: L10n
  name: string
  sections: Section[]
  showLabel: boolean
  style: "line" | "pills"
  /** Key of the tab that opens first. */
  defaultTab: string
  phoneLayout: "scroll" | "select"
  showDone: boolean
}

interface TabsValue {
  vals: Vals
  /** Id of the open tab. */
  active: string
}

const NOUN = L("Tab", "Tab")

const firstTab = (p: TabsProps) => p.sections.find((s) => s.key === p.defaultTab) ?? p.sections[0]

/** Every required field in the tab is filled. */
const done = (s: Section, vals: Vals) => s.fields.some((f) => f.required) && sectionIssues(s, vals).length === 0 && s.fields.every((f) => !f.required || filled(vals[f.id]))

function TabsCanvas({ props: p }: { props: TabsProps }) {
  const t = useT()
  const open = firstTab(p)
  return (
    <div className="flex flex-col gap-3">
      {p.showLabel && <p className="text-sm font-medium">{t(p.label)}</p>}
      <div className={cn("flex gap-1 overflow-hidden", p.style === "line" ? "border-b border-border" : "w-fit rounded-full bg-muted p-1")}>
        {p.sections.map((s) => (
          <span
            key={s.id}
            className={cn(
              "shrink-0 px-3 py-1.5 text-xs font-medium whitespace-nowrap",
              p.style === "line"
                ? s.id === open?.id
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground"
                : s.id === open?.id
                  ? "rounded-full bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
            )}
          >
            {t(s.label)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(open?.fields ?? []).slice(0, 4).map((f) => (
          <div key={f.id} className="flex flex-col gap-1">
            <span className="text-[11px] text-muted-foreground">
              {t(f.label)}
              {f.required && <span className="text-destructive"> *</span>}
            </span>
            <GhostInput select={f.kind === "dropdown"} />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {t(L(`${p.sections.length} tabs · ${allFields(p.sections).length} fields`, `${p.sections.length} tab · ${allFields(p.sections).length} field`))}
      </p>
    </div>
  )
}

function TabsRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<TabsProps, TabsValue>) {
  const t = useT()
  const counts = issueCounts(p.sections, issues)
  const active = p.sections.find((s) => s.id === v.active) ?? firstTab(p)
  const activeIdx = p.sections.indexOf(active)
  const total = issues.length

  /* First failed Complete Task: if the open tab is fine, open the first tab with problems. */
  const prev = useRef(0)
  useEffect(() => {
    if (prev.current === 0 && total > 0 && counts[activeIdx] === 0) {
      const first = counts.findIndex((n) => n > 0)
      if (first >= 0) onChange({ ...v, active: p.sections[first].id })
    }
    prev.current = total
    // Only the jump from "no problems" to "some problems" matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  const setVal = (fid: string, x: string) => onChange({ ...v, vals: { ...v.vals, [fid]: x } })
  const select = (sid: string) => onChange({ ...v, active: sid })
  const useSelect = compact && p.phoneLayout === "select"

  return (
    <div className="flex flex-col gap-3" role="group" aria-labelledby={`${id}-name`}>
      {/* The group's name: visible with "Show the name", otherwise only for screen readers. */}
      <p id={`${id}-name`} className={p.showLabel ? "text-sm font-medium" : "sr-only"}>
        {t(p.label)}
      </p>
      {total > 0 && (
        <p className="text-xs text-destructive">
          {t(
            L(
              `${total} problem${total === 1 ? "" : "s"} in ${counts.filter(Boolean).length} tab${counts.filter(Boolean).length === 1 ? "" : "s"} — tabs with a red count need attention.`,
              `${total} masalah di ${counts.filter(Boolean).length} tab — tab bertanda merah perlu diperbaiki.`,
            ),
          )}
        </p>
      )}
      <Tabs value={active.id} onValueChange={select} className="gap-4">
        {useSelect ? (
          <NativeSelect
            id={`${id}-input`}
            value={active.id}
            onChange={(e) => select(e.target.value)}
            aria-label={t(L("Tab", "Tab"))}
            className="w-full [&_select]:h-11 [&_select]:text-base"
          >
            {p.sections.map((s, i) => (
              <NativeSelectOption key={s.id} value={s.id}>
                {t(s.label)}
                {counts[i] ? ` (${counts[i]})` : ""}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : (
          <div className={cn(p.style === "line" && "border-b border-border", compact && "-mx-1 overflow-x-auto px-1")}>
            <TabsList variant={p.style === "line" ? "line" : "default"} className={cn(p.style === "line" && "h-auto pb-1.5", compact && "w-max")}>
              {p.sections.map((s, i) => (
                <TabsTrigger key={s.id} value={s.id} className="gap-1.5 px-3">
                  {t(s.label)}
                  <IssueBadge n={counts[i]} />
                  {p.showDone && !counts[i] && done(s, v.vals) && <HugeiconsIcon icon={Tick02Icon} className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-label={t(L("Done", "Selesai"))} />}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        )}
        {p.sections.map((s) => (
          <TabsContent key={s.id} value={s.id} className="outline-none">
            <SectionFields section={s} vals={v.vals} onVal={setVal} state={state} issues={issues} compact={compact} idPrefix={`${id}-${s.id}`} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

const STORY_VALUES: Record<string, string> = {
  company_name: "CV Mitra Kantor",
  npwp: "01.234.567.8-901.000",
  business_type: "supplier",
  pic_name: "Dewi Kartika",
}

export const tabs: ComponentDef<TabsProps, TabsValue> = {
  slug: "tabs",
  wave: 3,
  ui: "TABS",
  vk: "none",
  star: true,
  group: "layout",
  week: 5,
  icon: LayoutTopIcon,
  label: L("Tabs", "Tab"),
  title: L("Tabs", "Tab"),
  blurb: L("Split a long form into tabs; every field keeps its own key.", "Membagi form panjang ke dalam tab; setiap field tetap punya key sendiri."),

  defaults: () => {
    const sections = [
      section("Company", "Perusahaan", [
        field("text", "company_name", "Company name", "Nama perusahaan", { required: true }),
        field("text", "npwp", "NPWP", "NPWP", { required: true }),
        field("dropdown", "business_type", "Business type", "Jenis usaha", {
          required: true,
          options: [
            { v: "supplier", label: L("Supplier", "Pemasok") },
            { v: "contractor", label: L("Contractor", "Kontraktor") },
            { v: "consultant", label: L("Consultant", "Konsultan") },
          ],
        }),
      ]),
      section("Contact", "Kontak", [
        field("text", "pic_name", "PIC name", "Nama PIC", { required: true }),
        field("text", "pic_email", "PIC email", "Email PIC", { required: true }),
        field("text", "pic_phone", "PIC phone", "Telepon PIC"),
      ]),
      section("Bank account", "Rekening bank", [
        field("dropdown", "bank", "Bank", "Bank", {
          required: true,
          options: [
            { v: "bca", label: L("BCA", "BCA") },
            { v: "mandiri", label: L("Mandiri", "Mandiri") },
            { v: "bri", label: L("BRI", "BRI") },
          ],
        }),
        field("text", "account_number", "Account number", "Nomor rekening", { required: true }),
        field("text", "account_holder", "Account holder", "Nama pemilik rekening", { required: true }),
      ]),
    ]
    return {
      label: L("Vendor profile", "Profil vendor"),
      name: "vendor_profile",
      sections,
      showLabel: false,
      style: "line",
      defaultTab: "company",
      phoneLayout: "scroll",
      showDone: true,
    }
  },
  schema: (p) => [
    {
      tab: "general",
      fields: [
        F.name(L("Name", "Nama"), { hint: L("Identifies the tab set in the builder; shown to the user only when “Show the name” is on.", "Identitas set tab di builder; tampil ke user hanya bila “Tampilkan nama” aktif.") }),
        F.key(L("Identity of the node. The fields inside keep their own keys.", "Identitas node. Field di dalamnya tetap memakai key masing-masing.")),
        {
          t: "custom",
          id: "sections",
          label: L("Tabs", "Tab"),
          render: (ctx) => (
            <SectionsEditor
              ctx={ctx}
              o={{
                noun: NOUN,
                min: 2,
                max: 6,
                requiredHint: L("Checked on Complete Task, also when this tab was never opened.", "Dicek saat Complete Task, juga bila tab ini tidak pernah dibuka."),
              }}
            />
          ),
          validate: (_v, x) => sectionsError(x.sections, NOUN, 2),
        },
        {
          t: "select",
          k: "defaultTab",
          label: L("Open first", "Dibuka pertama"),
          options: p.sections.map((s) => ({ v: s.key, label: s.label })),
          validate: (v, x) => (x.sections.some((s) => s.key === v) ? null : L("Pick a tab", "Pilih tab")),
        },
        {
          t: "seg",
          k: "style",
          label: L("Tab style", "Gaya tab"),
          options: [
            { v: "line", label: L("Underline", "Garis bawah") },
            { v: "pills", label: L("Pills", "Kapsul") },
          ],
        },
        {
          t: "seg",
          k: "phoneLayout",
          label: L("On phones", "Di ponsel"),
          options: [
            { v: "scroll", label: L("Scrolling tabs", "Tab bergeser") },
            { v: "select", label: L("Dropdown", "Daftar pilihan") },
          ],
        },
        { t: "switch", k: "showLabel", label: L("Show the name above the tabs", "Tampilkan nama di atas tab") },
        {
          t: "switch",
          k: "showDone",
          label: L("Mark finished tabs", "Tandai tab yang selesai"),
          hint: L("A check appears when every required field in the tab is filled.", "Tanda centang muncul bila semua field wajib di tab itu terisi."),
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        {
          t: "note",
          text: L(
            "Required is set per field (open a tab above). On Complete Task **every tab is checked**, also tabs the user never opened; tabs with problems get a red count and the first one opens. See Wave 3 open decision 1.",
            "Wajib diatur per field (buka tab di atas). Saat Complete Task **semua tab dicek**, termasuk tab yang tidak pernah dibuka; tab bermasalah diberi angka merah dan yang pertama terbuka. Lihat keputusan terbuka Gelombang 3 no. 1.",
          ),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  bare: true,
  Canvas: TabsCanvas,
  canvasWarn: (p) => (sectionsError(p.sections, NOUN, 2) ? L("Check the tabs", "Periksa tab") : null),

  Runtime: TabsRuntime,
  initial: (p) => ({ vals: valsByKey(p.sections, STORY_VALUES), active: firstTab(p)?.id ?? "" }),
  sample: (p) => ({ vals: fillVals(p.sections, { ...STORY_VALUES, pic_email: "dewi@mitrakantor.co.id", bank: "bca", account_number: "1320012345678", account_holder: "CV Mitra Kantor" }), active: firstTab(p)?.id ?? "" }),
  validate: (p, v) => containerIssues(p.sections, v.vals),
  value: () => undefined,
  payloadEntries: (p, v) => entries(p.sections, v.vals),

  spec: (p) => ({
    ui_type: "TABS",
    value_kind: "none",
    name: p.name,
    label: p.label,
    config: {
      style: p.style,
      default_tab: p.defaultTab,
      phone_layout: p.phoneLayout,
      show_label: p.showLabel,
      mark_done: p.showDone,
      validate_hidden: "on_submit",
    },
    children: sectionsSpec(p.sections, "TAB"),
  }),
  savedAs: (p) =>
    L(
      `Nothing under \`${p.name}\` itself: each field inside keeps its own key (${allFields(p.sections).slice(0, 3).map((f) => `\`${f.name}\``).join(", ")}…), as if the tabs were not there.`,
      `Tidak ada nilai di \`${p.name}\` sendiri: setiap field di dalamnya memakai key masing-masing (${allFields(p.sections).slice(0, 3).map((f) => `\`${f.name}\``).join(", ")}…), seolah tab tidak ada.`,
    ),
  notes: [
    L(
      "★ Shaping §4f: each tab is a child node with its own `children`. Readers that already walk `children` (Row, Column, Grid) handle it without a new branch.",
      "★ Shaping §4f: setiap tab adalah node anak dengan `children` sendiri. Pembaca yang sudah menelusuri `children` (Row, Column, Grid) menanganinya tanpa cabang baru.",
    ),
    L(
      "Keys are unique across the whole form, not per tab; the payload stays flat and Camunda sees ordinary variables.",
      "Key unik di seluruh form, bukan per tab; payload tetap flat dan Camunda melihat variabel biasa.",
    ),
    L(
      "Fields in a tab the user never opened are still required (Wave 3 open decision 1). Complete Task checks every tab, shows a red count per tab and opens the first one with problems.",
      "Field di tab yang tidak pernah dibuka tetap wajib (keputusan terbuka Gelombang 3 no. 1). Complete Task mengecek semua tab, memberi angka merah per tab, dan membuka tab bermasalah pertama.",
    ),
    L("Values typed in a tab are kept when switching tabs; nothing is reset.", "Nilai yang diketik di satu tab tetap tersimpan saat berpindah tab; tidak ada yang direset."),
    L("Phones: the tab row scrolls sideways, or becomes a dropdown when “On phones” = Dropdown.", "Ponsel: deretan tab bisa digeser ke samping, atau menjadi dropdown bila “Di ponsel” = Daftar pilihan."),
  ],
  story: {
    process: L("Vendor onboarding", "Onboarding vendor"),
    step: L("Complete vendor profile", "Lengkapi profil vendor"),
    ref: "VND-2026-0142",
    due: "2026-11-12",
    task: L("Vendor profile: CV Mitra Kantor", "Profil vendor: CV Mitra Kantor"),
    after: [{ name: "procurement_note", label: L("Note for procurement", "Catatan untuk pengadaan"), type: "textarea", placeholder: L("Optional", "Opsional"), rows: 2 }],
  },
}
