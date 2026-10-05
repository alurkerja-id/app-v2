/* eslint-disable react-refresh/only-export-components -- definition module: exports one ComponentDef whose Canvas / Runtime live here */
import { MapsIcon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { GhostInput } from "../field-shell"
import { L, useT, type L10n } from "../i18n"
import { F, ctl } from "../lib"
import type { ComponentDef, Issue, RuntimeProps } from "../types"

/* Region (Indonesia) — ui_type WILAYAH, value_kind "json". Story: vendor registration address.
   Sample data only (no network; the real source is open decision 3): province and regency/city codes
   follow Kemendagri; district and village codes are format examples. */

type Region = [code: string, name: string]

const PROV: Region[] = [
  ["31", "DKI Jakarta"],
  ["32", "Jawa Barat"],
  ["33", "Jawa Tengah"],
  ["34", "DI Yogyakarta"],
  ["35", "Jawa Timur"],
]
const KAB: Record<string, Region[]> = {
  "31": [
    ["31.71", "Kota Jakarta Pusat"],
    ["31.74", "Kota Jakarta Selatan"],
  ],
  "32": [
    ["32.73", "Kota Bandung"],
    ["32.75", "Kota Bekasi"],
  ],
  "33": [["33.74", "Kota Semarang"]],
  "34": [
    ["34.71", "Kota Yogyakarta"],
    ["34.04", "Kabupaten Sleman"],
  ],
  "35": [
    ["35.78", "Kota Surabaya"],
    ["35.73", "Kota Malang"],
    ["35.15", "Kabupaten Sidoarjo"],
  ],
}
const KEC_N: Record<string, string[]> = {
  "35.78": ["Gubeng", "Sukolilo", "Tegalsari", "Wonokromo"],
  "35.73": ["Klojen", "Lowokwaru"],
  "32.73": ["Coblong", "Sukajadi"],
  "31.74": ["Kebayoran Baru", "Tebet"],
  "34.71": ["Gondokusuman", "Umbulharjo"],
}
const DES_N: Record<string, string[]> = {
  Gubeng: ["Airlangga", "Baratajaya", "Gubeng", "Kertajaya", "Mojo", "Pucang Sewu"],
  Sukolilo: ["Gebang Putih", "Keputih", "Klampis Ngasem", "Menur Pumpungan"],
  Coblong: ["Dago", "Lebak Siliwangi", "Sekeloa"],
  "Kebayoran Baru": ["Gunung", "Kramat Pela", "Senayan"],
  Lowokwaru: ["Dinoyo", "Ketawanggede", "Sumbersari"],
}
const pad = (i: number) => String(i + 1).padStart(2, "0")

type LevelKey = "province" | "regency" | "district" | "village"
const LEVELS: { key: LevelKey; label: L10n }[] = [
  { key: "province", label: L("Province", "Provinsi") },
  { key: "regency", label: L("Regency / city", "Kabupaten/Kota") },
  { key: "district", label: L("District", "Kecamatan") },
  { key: "village", label: L("Village", "Kelurahan/Desa") },
]

/** Options of `level` under the chosen parents in `path` (codes, one per level). */
function optionsFor(level: number, path: string[]): Region[] {
  if (level === 0) return PROV
  if (level === 1) return KAB[path[0]] ?? []
  if (level === 2) return (KEC_N[path[1]] ?? []).map((nm, i): Region => [`${path[1]}.${pad(i)}`, nm])
  const kec = (KEC_N[path[1]] ?? [])[Number(String(path[2]).split(".").pop()) - 1]
  return (DES_N[kec] ?? []).map((nm, i): Region => [`${path[2]}.${1001 + i}`, nm])
}

type Source = "builtin" | "masterdata" | "api"
const SOURCES: Record<Source, L10n> = {
  builtin: L("Built-in dataset", "Dataset bawaan"),
  masterdata: L("Master data", "Master data"),
  api: L("External API", "API luar"),
}

interface WilayahProps {
  label: L10n
  name: string
  depth: number
  source: Source
  defaultProvince: string
  required: boolean
}
/** Chosen code per level, top down. Choosing a level drops everything below it. */
interface WilayahValue {
  path: string[]
}

const levelsOf = (p: WilayahProps) => LEVELS.slice(0, Number(p.depth))
const hit = (path: string[], i: number) => (path[i] ? (optionsFor(i, path).find((o) => o[0] === path[i]) ?? null) : null)
const SELECT = L("Select…", "Pilih…")

function WilayahCanvas({ props: p }: { props: WilayahProps }) {
  const t = useT()
  const prov = PROV.find((x) => x[0] === p.defaultProvince)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-2.5">
        {levelsOf(p).map((l, i) => (
          <div key={l.key} className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-foreground/80">{t(l.label)}</span>
            <GhostInput select>{i === 0 && prov ? prov[1] : t(SELECT)}</GhostInput>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {t(L("Source: ", "Sumber: "))}
        {t(SOURCES[p.source])}
      </p>
    </div>
  )
}

function WilayahRuntime({ props: p, value: v, onChange, state, issues, compact, id }: RuntimeProps<WilayahProps, WilayahValue>) {
  const t = useT()
  const live = state === "active"
  const path = v.path
  const ctlId = (i: number) => (i === 0 ? `${id}-input` : `${id}-wl-${i}`)

  const pick = (i: number, code: string) => {
    if (!live) return
    const next = path.slice(0, i)
    if (code) next[i] = code
    onChange({ path: next })
  }

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-labelledby={`${id}-label`} className={cn("grid gap-2.5", compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
        {levelsOf(p).map((l, i) => {
          const waiting = i > 0 && !path[i - 1]
          const opts = waiting ? [] : optionsFor(i, path)
          const empty = !waiting && opts.length === 0
          const bad = issues.some((x) => x.fid === `wl-${i}`)
          return (
            <div key={l.key} className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor={ctlId(i)} className={cn("text-xs", state === "disabled" ? "text-muted-foreground" : "text-foreground/80")}>
                {t(l.label)}
              </Label>
              {live ? (
                <NativeSelect
                  id={ctlId(i)}
                  className="w-full"
                  value={path[i] ?? ""}
                  disabled={waiting || empty}
                  aria-invalid={bad || undefined}
                  onChange={(e) => pick(i, e.target.value)}
                >
                  <NativeSelectOption value="">
                    {t(
                      waiting
                        ? L(`Pick ${LEVELS[i - 1].label.en.toLowerCase()} first`, `Pilih ${LEVELS[i - 1].label.id.toLowerCase()} dulu`)
                        : empty
                          ? L("No sample data here", "Tidak ada data contoh")
                          : SELECT,
                    )}
                  </NativeSelectOption>
                  {opts.map(([code, name]) => (
                    <NativeSelectOption key={code} value={code}>
                      {name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : (
                // a select has no read-only mode: show the chosen name in a read-only / disabled input
                <Input id={ctlId(i)} value={hit(path, i)?.[1] ?? ""} placeholder="—" {...ctl(state)} />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          L(
            "Sample data: a few provinces and cities; districts and villages only for some cities.",
            "Data contoh: beberapa provinsi dan kota; kecamatan dan kelurahan hanya untuk sebagian kota.",
          ),
        )}
      </p>
    </div>
  )
}

function validate(p: WilayahProps, v: WilayahValue): Issue[] {
  if (!p.required) return []
  const levels = levelsOf(p)
  for (let i = 0; i < levels.length; i++) {
    if (!v.path[i]) {
      // a level with no sample data under the chosen parent is not required
      if (i > 0 && !optionsFor(i, v.path).length) return []
      return [{ fid: `wl-${i}`, msg: L(`Pick a ${LEVELS[i].label.en.toLowerCase()}`, `Pilih ${LEVELS[i].label.id.toLowerCase()}`) }]
    }
  }
  return []
}

/** A filled path: the default province (else Jawa Timur), then the first option of each level. */
function samplePath(p: WilayahProps) {
  const path: string[] = [p.defaultProvince || "35"]
  for (let i = 1; i < levelsOf(p).length; i++) {
    const first = optionsFor(i, path)[0]
    if (!first) break
    path.push(first[0])
  }
  return path
}

export const wilayah: ComponentDef<WilayahProps, WilayahValue> = {
  slug: "wilayah",
  wave: 2,
  ui: "WILAYAH",
  vk: "json",
  group: "field",
  week: 4,
  icon: MapsIcon,
  label: L("Region (Indonesia)", "Wilayah bertingkat"),
  title: L("Region (Indonesia)", "Wilayah bertingkat"),
  blurb: L("Province, regency/city, district and village, each narrowing the next.", "Provinsi, kabupaten/kota, kecamatan, dan kelurahan/desa yang saling menyaring."),

  defaults: () => ({
    label: L("Company address area", "Wilayah alamat perusahaan"),
    name: "company_region",
    depth: 4,
    source: "builtin",
    defaultProvince: "",
    required: true,
  }),
  schema: () => [
    {
      tab: "general",
      fields: [
        F.name(),
        F.key(),
        {
          t: "seg",
          k: "depth",
          label: L("Levels shown", "Tingkat yang tampil"),
          options: [
            { v: 2, label: L("To city", "Sampai kota") },
            { v: 3, label: L("To district", "Sampai kecamatan") },
            { v: 4, label: L("To village", "Sampai kelurahan") },
          ],
        },
        {
          t: "select",
          k: "source",
          label: L("Data source", "Sumber data"),
          options: (Object.keys(SOURCES) as Source[]).map((k) => ({ v: k, label: SOURCES[k] })),
          hint: L("Not decided yet — open decision 3. The prototype uses a small sample.", "Belum diputuskan — keputusan terbuka 3. Prototipe memakai sampel kecil."),
        },
        {
          t: "select",
          k: "defaultProvince",
          label: L("Default province", "Provinsi bawaan"),
          options: [{ v: "", label: L("None", "Tidak ada") }, ...PROV.map(([code, name]) => ({ v: code, label: L(name, name) }))],
        },
      ],
    },
    { tab: "validation", fields: [F.required(L("Every level shown must be filled.", "Semua tingkat yang tampil wajib diisi."))] },
  ],
  fieldLabel: (p) => p.label,
  isRequired: (p) => p.required,
  Canvas: WilayahCanvas,

  Runtime: WilayahRuntime,
  // as the prototype: the default province, else the story's Jawa Timur → Kota Surabaya already chosen
  initial: (p) => ({ path: p.defaultProvince ? [p.defaultProvince] : ["35", "35.78"] }),
  sample: (p) => ({ path: samplePath(p) }),
  validate,
  value: (p, v) =>
    Object.fromEntries(
      levelsOf(p).map((l, i) => {
        const h = hit(v.path, i)
        return [l.key, h ? { code: h[0], name: h[1] } : null]
      }),
    ),

  spec: (p) => ({
    ui_type: "WILAYAH",
    value_kind: "json",
    name: p.name,
    label: p.label,
    required: p.required,
    config: { levels: levelsOf(p).map((l) => l.key), data_source: p.source, default_province: p.defaultProvince || null },
  }),
  savedAs: (p) =>
    L(`One JSON object in \`${p.name}\`: each level as \`{code, name}\`.`, `Satu objek JSON di \`${p.name}\`: setiap tingkat berupa \`{code, name}\`.`),
  notes: [
    L(
      "The data source is open (shaping §10): built-in dataset, master data, or an external API. Pick one before building.",
      "Sumber data masih terbuka (shaping §10): dataset bawaan, master data, atau API luar. Putuskan sebelum mulai.",
    ),
    L(
      "Save both the code and the name, so history still reads correctly if a region is renamed later.",
      "Simpan kode dan nama sekaligus, agar history tetap terbaca benar bila nama wilayah berubah nanti.",
    ),
    L(
      "Province and regency/city codes in the prototype follow Kemendagri; district and village codes are format examples only.",
      "Kode provinsi dan kabupaten/kota di prototipe mengikuti Kemendagri; kode kecamatan dan kelurahan hanya contoh format.",
    ),
    L(
      "Long lists (about 7,000 districts and 80,000+ villages nationally) need a searchable select, not a plain dropdown.",
      "Daftar panjang (sekitar 7.000 kecamatan dan 80.000+ kelurahan/desa secara nasional) butuh select yang bisa dicari, bukan dropdown biasa.",
    ),
  ],
  story: {
    process: L("Vendor registration", "Pendaftaran vendor"),
    step: L("Vendor details", "Data vendor"),
    ref: "VND-2026-0088",
    due: "2026-10-14",
    task: L("Complete vendor address: CV Mitra Kantor", "Lengkapi alamat vendor: CV Mitra Kantor"),
    before: [{ name: "street", label: L("Street address", "Alamat jalan"), type: "textarea", required: true, rows: 2, value: "Jl. Raya Gubeng No. 18" }],
    after: [
      {
        name: "postal_code",
        label: L("Postal code", "Kode pos"),
        type: "text",
        required: true,
        value: "",
        validate: (v) => (v && !/^\d{5}$/.test(v) ? L("Use 5 digits", "Gunakan 5 digit") : null),
      },
    ],
  },
}
