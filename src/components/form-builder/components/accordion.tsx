/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowUp01Icon, CheckmarkCircle02Icon, ListViewIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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

/* Accordion ★ — ui_type ACCORDION, value_kind "none" (container). Story: facility maintenance request.
   Each section is a child node with its own `children` (shaping §4f). The fields inside keep
   their own keys, so the payload is flat — as if the sections were not there. Folded sections
   are still checked on Complete Task, and the ones with problems open by themselves. */

interface AccordionProps {
  label: L10n
  name: string
  sections: Section[]
  /** "one" = opening a section folds the others; "many" = several may be open. */
  openMode: "one" | "many"
  /** What is open when the task opens. "all" only with openMode "many". */
  defaultOpen: "first" | "all" | "none"
  showLabel: boolean
  /** "2 of 3 required filled" under each section title. */
  showCount: boolean
  showDone: boolean
}

interface AccordionValue {
  vals: Vals
  /** Ids of the open sections. Never saved. */
  open: string[]
}

const NOUN = L("Section", "Bagian")

/** Open sections when the task opens. */
function openAtStart(p: AccordionProps): string[] {
  const ids = p.sections.map((s) => s.id)
  if (!ids.length || p.defaultOpen === "none") return []
  if (p.defaultOpen === "all" && p.openMode === "many") return ids
  return [ids[0]]
}

/** Required fields in the section and how many hold a value. */
function progress(s: Section, vals: Vals) {
  const req = s.fields.filter((f) => f.required)
  return { req: req.length, ok: req.filter((f) => filled(vals[f.id])).length }
}

const progressText = (req: number, ok: number) =>
  req === 0 ? L("Optional", "Opsional") : L(`${ok} of ${req} required filled`, `${ok} dari ${req} wajib terisi`)

/** Every required field in the section is filled and valid. */
const done = (s: Section, vals: Vals) => s.fields.some((f) => f.required) && sectionIssues(s, vals).length === 0 && s.fields.every((f) => !f.required || filled(vals[f.id]))

function AccordionCanvas({ props: p }: { props: AccordionProps }) {
  const t = useT()
  const openIdx = p.defaultOpen === "none" ? -1 : 0
  return (
    <div className="flex flex-col gap-3">
      {p.showLabel && <p className="text-sm font-medium">{t(p.label)}</p>}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border">
        {p.sections.map((s, i) => {
          const open = i === openIdx
          const { req } = progress(s, {})
          return (
            <div key={s.id} className={cn("not-last:border-b not-last:border-border", open && "bg-muted/50")}>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t(s.label)}</span>
                  {p.showCount && <span className="block truncate text-xs text-muted-foreground">{t(progressText(req, 0))}</span>}
                </span>
                <HugeiconsIcon icon={open ? ArrowUp01Icon : ArrowDown01Icon} className="size-4 shrink-0 text-muted-foreground" />
              </div>
              {open && (
                <div className="grid grid-cols-2 gap-3 px-4 pb-4">
                  {s.fields.slice(0, 3).map((f) => (
                    <div key={f.id} className={cn("flex min-w-0 flex-col gap-1", f.kind === "textarea" && "col-span-2")}>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {t(f.label)}
                        {f.required && <span className="text-destructive"> *</span>}
                      </span>
                      <GhostInput select={f.kind === "dropdown"} className={cn(f.kind === "textarea" && "h-14 items-start py-2")} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          L(
            `${p.sections.length} section${p.sections.length === 1 ? "" : "s"} · ${allFields(p.sections).length} fields`,
            `${p.sections.length} bagian · ${allFields(p.sections).length} field`,
          ),
        )}
      </p>
    </div>
  )
}

function AccordionRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<AccordionProps, AccordionValue>) {
  const t = useT()
  const counts = issueCounts(p.sections, issues)
  const total = issues.length
  const bad = counts.filter(Boolean).length
  const open = v.open.filter((x) => p.sections.some((s) => s.id === x))

  /* First failed Complete Task: open every section with problems (folded ones too).
     "One at a time": keep the open section if it has problems, else open the first one that does. */
  const prev = useRef(0)
  useEffect(() => {
    if (prev.current === 0 && total > 0) {
      const withIssues = p.sections.filter((_, i) => counts[i] > 0).map((s) => s.id)
      if (withIssues.length) {
        if (p.openMode === "many") {
          const next = [...open, ...withIssues.filter((x) => !open.includes(x))]
          if (next.length !== open.length) onChange({ ...v, open: next })
        } else if (!withIssues.includes(open[0])) {
          onChange({ ...v, open: [withIssues[0]] })
        }
      }
    }
    prev.current = total
    // Only the jump from "no problems" to "some problems" matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  const setVal = (fid: string, x: string) => onChange({ ...v, vals: { ...v.vals, [fid]: x } })
  const setOpen = (next: string[]) => onChange({ ...v, open: next })

  /* Navigation is not editing: sections open and close in every state; the fields follow `state`. */
  const items = p.sections.map((s, i) => {
    const n = counts[i]
    const { req, ok } = progress(s, v.vals)
    const isDone = p.showDone && !n && done(s, v.vals)
    const first = i === 0
    return (
      <AccordionItem key={s.id} value={s.id} className={cn(n > 0 && "shadow-[inset_3px_0_0_var(--destructive)]")}>
        <AccordionTrigger
          id={first ? `${id}-input` : undefined}
          className={cn(
            "items-center gap-3 px-4 py-3 hover:bg-muted/40 hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-inset",
            compact && "min-h-12",
          )}
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-medium">{t(s.label)}</span>
              {n > 0 && (
                <>
                  <span aria-hidden className="flex">
                    <IssueBadge n={n} />
                  </span>
                  <span className="sr-only">{t(L(`, ${n} problem${n === 1 ? "" : "s"}`, `, ${n} masalah`))}</span>
                </>
              )}
              {isDone && (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="sr-only">{t(L(", done", ", selesai"))}</span>
                </>
              )}
            </span>
            {p.showCount && <span className="truncate text-xs font-normal text-muted-foreground">{t(progressText(req, ok))}</span>}
          </span>
        </AccordionTrigger>
        {/* The first trigger carries `${id}-input`, which replaces Radix's own id: point the region at it. */}
        <AccordionContent aria-labelledby={first ? `${id}-input` : undefined} className="h-auto pt-1 pb-4">
          <SectionFields section={s} vals={v.vals} onVal={setVal} state={state} issues={issues} compact={compact} idPrefix={`${id}-${s.id}`} />
        </AccordionContent>
      </AccordionItem>
    )
  })

  return (
    <div className="flex flex-col gap-3" role="group" aria-labelledby={`${id}-name`}>
      <p id={`${id}-name`} className={p.showLabel ? "text-sm font-medium" : "sr-only"}>
        {t(p.label)}
      </p>
      {total > 0 && (
        <p className="text-xs text-destructive">
          {t(
            L(
              `${total} problem${total === 1 ? "" : "s"} in ${bad} section${bad === 1 ? "" : "s"} — sections with a red count need attention.`,
              `${total} masalah di ${bad} bagian — bagian bertanda merah perlu diperbaiki.`,
            ),
          )}
        </p>
      )}
      {p.openMode === "one" ? (
        <Accordion type="single" collapsible value={open[0] ?? ""} onValueChange={(x) => setOpen(x ? [x] : [])}>
          {items}
        </Accordion>
      ) : (
        <Accordion type="multiple" value={open} onValueChange={setOpen}>
          {items}
        </Accordion>
      )}
    </div>
  )
}

const STORY_VALUES: Record<string, string> = {
  building: "main_tower",
  floor: "3",
  room: "Ruang rapat Merapi",
  category: "air_conditioning",
  problem_since: "2026-10-02",
}

export const accordion: ComponentDef<AccordionProps, AccordionValue> = {
  slug: "accordion",
  wave: 3,
  ui: "ACCORDION",
  vk: "none",
  star: true,
  group: "layout",
  week: 5,
  icon: ListViewIcon,
  label: L("Accordion", "Akordeon"),
  title: L("Accordion", "Akordeon"),
  blurb: L("Sections that fold open and closed; sections with problems open on submit.", "Bagian yang bisa dibuka-tutup; bagian yang bermasalah terbuka saat submit."),

  defaults: () => {
    const sections = [
      section("Location", "Lokasi", [
        field("dropdown", "building", "Building", "Gedung", {
          required: true,
          options: [
            { v: "main_tower", label: L("Main tower", "Gedung utama") },
            { v: "annex", label: L("Annex", "Gedung annex") },
            { v: "warehouse", label: L("Warehouse", "Gudang") },
          ],
        }),
        field("number", "floor", "Floor", "Lantai", { required: true }),
        field("text", "room", "Room", "Ruangan", { required: true, placeholder: L("e.g. Merapi meeting room", "mis. Ruang rapat Merapi") }),
      ]),
      section("Problem", "Masalah", [
        field("dropdown", "category", "Category", "Kategori", {
          required: true,
          options: [
            { v: "air_conditioning", label: L("Air conditioning", "AC / pendingin udara") },
            { v: "electrical", label: L("Electrical", "Listrik") },
            { v: "plumbing", label: L("Plumbing", "Pipa & air") },
            { v: "furniture", label: L("Furniture", "Furnitur") },
          ],
        }),
        field("textarea", "description", "Description", "Deskripsi", {
          required: true,
          placeholder: L("What is wrong, and what have you noticed?", "Apa masalahnya, dan apa yang Anda lihat?"),
        }),
        field("date", "problem_since", "Since", "Sejak"),
      ]),
      section("Access & contact", "Akses & kontak", [
        field("text", "contact_person", "Contact person", "Narahubung", { required: true }),
        field("text", "best_time", "Best time to visit", "Waktu kunjungan terbaik", { placeholder: L("e.g. Weekdays 08.00–10.00", "mis. Senin–Jumat 08.00–10.00") }),
        field("textarea", "access_notes", "Access notes", "Catatan akses", { placeholder: L("Keys, badges, who to ask at reception", "Kunci, kartu akses, siapa yang ditanya di resepsionis") }),
      ]),
    ]
    return {
      label: L("Maintenance report", "Laporan perawatan"),
      name: "maintenance_report",
      sections,
      openMode: "many",
      defaultOpen: "first",
      showLabel: false,
      showCount: true,
      showDone: true,
    }
  },
  schema: (p) => [
    {
      tab: "general",
      fields: [
        F.name(L("Name", "Nama"), {
          hint: L("Identifies the accordion in the builder; shown to the user only when “Show the name” is on.", "Identitas akordeon di builder; tampil ke user hanya bila “Tampilkan nama” aktif."),
        }),
        F.key(L("Identity of the node. The fields inside keep their own keys.", "Identitas node. Field di dalamnya tetap memakai key masing-masing.")),
        {
          t: "custom",
          id: "sections",
          label: L("Sections", "Bagian"),
          render: (ctx) => (
            <SectionsEditor
              ctx={ctx}
              o={{
                noun: NOUN,
                min: 1,
                max: 8,
                requiredHint: L("Checked on Complete Task, also when this section is folded.", "Dicek saat Complete Task, juga bila bagian ini sedang tertutup."),
              }}
            />
          ),
          validate: (_v, x) => sectionsError(x.sections, NOUN, 1),
        },
        {
          t: "seg",
          k: "openMode",
          label: L("Open sections", "Bagian terbuka"),
          hint: L("“One at a time” folds the open section when another one opens.", "“Satu per satu” menutup bagian yang terbuka saat bagian lain dibuka."),
          options: [
            { v: "one", label: L("One at a time", "Satu per satu") },
            { v: "many", label: L("Several", "Beberapa sekaligus") },
          ],
          /* "All open" needs Several; switching to One at a time falls back to the first section. */
          set: (x, v) => ({ ...x, openMode: v === "one" ? "one" : "many", defaultOpen: v === "one" && x.defaultOpen === "all" ? "first" : x.defaultOpen }),
        },
        {
          t: "seg",
          k: "defaultOpen",
          label: L("Open when the task opens", "Terbuka saat task dibuka"),
          hint: p.openMode === "one" ? L("“All” is available with “Several”.", "“Semua” tersedia bila memilih “Beberapa sekaligus”.") : undefined,
          options: [
            { v: "first", label: L("First section", "Bagian pertama") },
            ...(p.openMode === "many" ? [{ v: "all", label: L("All", "Semua") }] : []),
            { v: "none", label: L("None", "Tidak ada") },
          ],
        },
        { t: "switch", k: "showLabel", label: L("Show the name above the sections", "Tampilkan nama di atas bagian") },
        {
          t: "switch",
          k: "showCount",
          label: L("Show required progress", "Tampilkan progres field wajib"),
          hint: L("Each header shows e.g. “2 of 3 required filled”, so a folded section still tells what is missing.", "Setiap judul menampilkan mis. “2 dari 3 wajib terisi”, jadi bagian yang tertutup tetap memberi tahu apa yang kurang."),
        },
        {
          t: "switch",
          k: "showDone",
          label: L("Mark finished sections", "Tandai bagian yang selesai"),
          hint: L("A check appears when every required field in the section is filled.", "Tanda centang muncul bila semua field wajib di bagian itu terisi."),
        },
      ],
    },
    {
      tab: "validation",
      fields: [
        {
          t: "note",
          text: L(
            "Required is set per field (open a section above). On Complete Task **every section is checked**, also folded ones; sections with problems get a red count and **open automatically**. See Wave 3 open decision 1.",
            "Wajib diatur per field (buka bagian di atas). Saat Complete Task **semua bagian dicek**, termasuk yang tertutup; bagian bermasalah diberi angka merah dan **terbuka otomatis**. Lihat keputusan terbuka Gelombang 3 no. 1.",
          ),
        },
      ],
    },
  ],
  fieldLabel: (p) => p.label,
  isRequired: () => false,
  bare: true,
  devices: true,
  Canvas: AccordionCanvas,
  canvasWarn: (p) => (sectionsError(p.sections, NOUN, 1) ? L("Check the sections", "Periksa bagian") : null),

  Runtime: AccordionRuntime,
  initial: (p) => ({ vals: valsByKey(p.sections, STORY_VALUES), open: openAtStart(p) }),
  sample: (p) => ({
    vals: fillVals(p.sections, {
      ...STORY_VALUES,
      description: "Unit AC menetes ke meja rapat sejak Jumat; karpet di bawahnya basah.",
      contact_person: "Rina Wulandari",
      best_time: "Senin–Jumat, 08.00–10.00",
      access_notes: "Kunci ruangan dipegang resepsionis lantai 3.",
    }),
    open: openAtStart(p),
  }),
  validate: (p, v) => containerIssues(p.sections, v.vals),
  value: () => undefined,
  payloadEntries: (p, v) => entries(p.sections, v.vals),

  spec: (p) => ({
    ui_type: "ACCORDION",
    value_kind: "none",
    name: p.name,
    label: p.label,
    config: {
      open_mode: p.openMode,
      default_open: p.defaultOpen,
      show_label: p.showLabel,
      show_count: p.showCount,
      mark_done: p.showDone,
      validate_hidden: "on_submit",
    },
    children: sectionsSpec(p.sections, "ACCORDION_SECTION"),
  }),
  savedAs: (p) =>
    L(
      `Nothing under \`${p.name}\` itself: each field inside keeps its own key (${allFields(p.sections).slice(0, 3).map((f) => `\`${f.name}\``).join(", ")}…), as if the sections were not there. Which sections are open is not saved.`,
      `Tidak ada nilai di \`${p.name}\` sendiri: setiap field di dalamnya memakai key masing-masing (${allFields(p.sections).slice(0, 3).map((f) => `\`${f.name}\``).join(", ")}…), seolah bagian tidak ada. Bagian mana yang terbuka tidak disimpan.`,
    ),
  notes: [
    L(
      "★ Shaping §4f: each section is a child node (`ACCORDION_SECTION`) with its own `children`. Readers that already walk `children` (Row, Column, Grid) handle it without a new branch.",
      "★ Shaping §4f: setiap bagian adalah node anak (`ACCORDION_SECTION`) dengan `children` sendiri. Pembaca yang sudah menelusuri `children` (Row, Column, Grid) menanganinya tanpa cabang baru.",
    ),
    L(
      "Keys are unique across the whole form, not per section; the payload stays flat and Camunda sees ordinary variables.",
      "Key unik di seluruh form, bukan per bagian; payload tetap flat dan Camunda melihat variabel biasa.",
    ),
    L(
      "Fields in a folded section are **still required** (Wave 3 open decision 1). Complete Task checks every section, shows a red count in its header and opens every section with problems; with “One at a time” it opens the first one (or keeps the open section if it has problems itself).",
      "Field di bagian yang tertutup **tetap wajib** (keputusan terbuka Gelombang 3 no. 1). Complete Task mengecek semua bagian, memberi angka merah di judulnya, dan membuka semua bagian bermasalah; dengan “Satu per satu” yang dibuka adalah yang pertama (atau bagian yang sedang terbuka bila bermasalah).",
    ),
    L(
      "Which sections are open is **not saved**: the task always opens as set in “Open when the task opens”. Values typed in a section are kept when it folds.",
      "Bagian mana yang terbuka **tidak disimpan**: task selalu dibuka sesuai “Terbuka saat task dibuka”. Nilai yang diketik tetap tersimpan saat bagian ditutup.",
    ),
    L(
      "Read-only and Disabled: sections still open and close — navigation is not editing; the fields inside follow the state.",
      "Read-only dan Disabled: bagian tetap bisa dibuka-tutup — navigasi bukan mengedit; field di dalamnya mengikuti status.",
    ),
    L(
      "Phones: sections stack full width, headers are at least 48 px tall and fields go to one column.",
      "Ponsel: bagian bertumpuk selebar layar, judul minimal 48 px, dan field menjadi satu kolom.",
    ),
    L(
      "Prefer Accordion over Tabs when sections are long or mostly optional (e.g. “Additional details”) or every section title should stay in view; prefer Tabs for a few peer sections of similar weight.",
      "Pilih Akordeon daripada Tab bila bagiannya panjang atau sebagian besar opsional (mis. “Detail tambahan”) atau semua judul bagian perlu tetap terlihat; pilih Tab untuk beberapa bagian setara dengan bobot serupa.",
    ),
  ],
  story: {
    process: L("Facility maintenance request", "Permintaan perawatan fasilitas"),
    step: L("Report details", "Detail laporan"),
    ref: "FMR-2026-0457",
    due: "2026-11-11",
    task: L("Report: AC leaking in Merapi meeting room", "Laporan: AC bocor di ruang rapat Merapi"),
    after: [
      {
        name: "urgency",
        label: L("Urgency", "Tingkat urgensi"),
        type: "select",
        value: "normal",
        required: true,
        options: [
          { v: "low", label: L("Low — within a week", "Rendah — dalam seminggu") },
          { v: "normal", label: L("Normal — within 3 days", "Normal — dalam 3 hari") },
          { v: "high", label: L("High — today", "Tinggi — hari ini") },
        ],
      },
    ],
  },
}
