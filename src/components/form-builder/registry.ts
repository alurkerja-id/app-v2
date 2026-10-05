import type { IconSvgElement } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Calendar01Icon,
  Calendar02Icon,
  CheckmarkSquare02Icon,
  Clock01Icon,
  Database01Icon,
  FunctionIcon,
  HashtagIcon,
  LayoutGridIcon,
  LayoutTwoColumnIcon,
  LayoutTwoRowIcon,
  Mail01Icon,
  PuzzleIcon,
  RadioButtonIcon,
  ServerStack01Icon,
  TextAlignLeftIcon,
  TextIcon,
  ToggleOnIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons"

import { L, type L10n } from "./i18n"
import type { AnyComponentDef, GroupId, Wave, Week } from "./types"

import { apiTable } from "./components/api-table"
import { autocomplete } from "./components/autocomplete"
import { barcode } from "./components/barcode"
import { cascading } from "./components/cascading"
import { dateRange } from "./components/date-range"
import { likert } from "./components/likert"
import { link } from "./components/link"
import { location } from "./components/location"
import { matrix } from "./components/matrix"
import { nps } from "./components/nps"
import { paragraph } from "./components/paragraph"
import { phone } from "./components/phone"
import { rating } from "./components/rating"
import { repeater } from "./components/repeater"
import { richText } from "./components/rich-text"
import { signature } from "./components/signature"
import { slider } from "./components/slider"
import { tags } from "./components/tags"
import { templateUpload } from "./components/template-upload"
import { wilayah } from "./components/wilayah"

/** Wave 1 (8) then Wave 2 (12), in shaping order. */
export const COMPONENTS: AnyComponentDef[] = [
  repeater,
  apiTable,
  dateRange,
  signature,
  paragraph,
  link,
  richText,
  templateUpload,
  rating,
  slider,
  nps,
  likert,
  matrix,
  phone,
  tags,
  autocomplete,
  cascading,
  barcode,
  location,
  wilayah,
]

export const compBySlug = (slug: string | undefined) => COMPONENTS.find((c) => c.slug === slug)

export const WAVES: Record<Wave, { label: L10n; blurb: L10n; schedule: L10n }> = {
  1: {
    label: L("Wave 1", "Gelombang 1"),
    blurb: L(
      "Eight new components: the two ★ data components plus date, signature, display and template upload.",
      "Delapan komponen baru: dua komponen data ★ plus tanggal, tanda tangan, tampilan, dan unggah template.",
    ),
    schedule: L("9–22 Oct 2026", "9–22 Okt 2026"),
  },
  2: {
    label: L("Wave 2", "Gelombang 2"),
    blurb: L(
      "Twelve survey, input and field components for the Studio form builder.",
      "Dua belas komponen survei, input, dan lapangan untuk form builder Studio.",
    ),
    schedule: L("23 Oct – 5 Nov 2026", "23 Okt – 5 Nov 2026"),
  },
}

export const WEEKS: Record<Week, L10n> = {
  1: L("Week 1 · 9–15 Oct", "Minggu 1 · 9–15 Okt"),
  2: L("Week 2 · 16–22 Oct", "Minggu 2 · 16–22 Okt"),
  3: L("Week 3 · 23–29 Oct", "Minggu 3 · 23–29 Okt"),
  4: L("Week 4 · 30 Oct–5 Nov", "Minggu 4 · 30 Okt–5 Nov"),
}

/** Shaping links shown on the overview. */
export const SHAPING_LINKS = {
  pdf: (wave: Wave) => `https://form-builder-gelombang-1.mie-yaminasin.workers.dev/shaping-gelombang-${wave}.pdf`,
  doc: "https://outline.alurkerja.com/doc/shaping-40-komponen-baru-form-builder-studio-ha9vDQaho4",
}

/* ── palette: regrouped, bilingual, searchable in EN + ID (shaping §6) ───── */

export interface PaletteItem {
  key: string
  label: L10n
  icon: IconSvgElement
  /** Search words in both languages. */
  kw: string
  /** Set for the new components: opens their page. */
  slug?: string
  star?: boolean
}

export interface PaletteGroup {
  id: GroupId
  label: L10n
  items: PaletteItem[]
}

const existing = (key: string, icon: IconSvgElement, label: L10n, kw: string): PaletteItem => ({ key, icon, label, kw })
const fresh = (slug: string, kw: string): PaletteItem => {
  const c = compBySlug(slug)
  if (!c) throw new Error(`Unknown component ${slug}`)
  return { key: slug, slug, icon: c.icon, label: c.label, kw, star: c.star }
}

export const PALETTE: PaletteGroup[] = [
  {
    id: "input",
    label: L("Input", "Input"),
    items: [
      existing("text", TextIcon, L("Text", "Teks"), "short text input isian"),
      existing("email", Mail01Icon, L("Email", "Email"), "surel"),
      existing("number", HashtagIcon, L("Number", "Angka"), "currency rupiah mata uang nominal"),
      existing("textarea", TextAlignLeftIcon, L("Textarea", "Teks panjang"), "long text paragraph catatan"),
      fresh("phone", "phone telepon hp handphone ponsel nomor whatsapp wa mobile"),
      fresh("tags", "tags tag label keyword kata kunci chips multiple"),
    ],
  },
  {
    id: "choice",
    label: L("Choice", "Pilihan"),
    items: [
      existing("dropdown", ArrowDown01Icon, L("Dropdown", "Daftar pilihan"), "select option"),
      existing("radio", RadioButtonIcon, L("Radio", "Pilihan tunggal"), "single option"),
      existing("checkbox", CheckmarkSquare02Icon, L("Checkbox", "Kotak centang"), "centang multiple"),
      existing("switch", ToggleOnIcon, L("Switch", "Sakelar"), "toggle on off ya tidak"),
      fresh("autocomplete", "autocomplete typeahead search cari saran isian otomatis combobox"),
      fresh("cascading", "cascading dependent dropdown bertingkat berantai kategori subkategori"),
    ],
  },
  {
    id: "date",
    label: L("Date", "Tanggal"),
    items: [
      existing("date", Calendar01Icon, L("Date", "Tanggal"), "day hari"),
      existing("time", Clock01Icon, L("Time", "Waktu"), "jam"),
      existing("month", Calendar02Icon, L("Month", "Bulan"), "month year"),
      fresh("date-range", "period periode durasi duration cuti leave start end mulai selesai"),
    ],
  },
  {
    id: "survey",
    label: L("Survey", "Survei"),
    items: [
      fresh("rating", "rating star bintang nilai penilaian ulasan"),
      fresh("slider", "slider range geser rentang persen percent"),
      fresh("nps", "nps net promoter score rekomendasi recommend 0-10"),
      fresh("likert", "likert setuju agree skala scale pernyataan statement"),
      fresh("matrix", "matrix matriks grid kepuasan satisfaction survey survei"),
    ],
  },
  {
    id: "field",
    label: L("Field", "Lapangan"),
    items: [
      existing("upload", Upload01Icon, L("File upload", "Unggah berkas"), "attachment lampiran camera kamera multiple"),
      fresh("signature", "signature sign ttd tanda tangan paraf"),
      fresh("template-upload", "excel xlsx docx word template unduh download unggah upload"),
      fresh("barcode", "barcode qr scan pindai kamera camera kode aset asset"),
      fresh("location", "location lokasi gps map peta koordinat pin titik"),
      fresh("wilayah", "region wilayah provinsi kabupaten kota kecamatan kelurahan desa alamat address"),
    ],
  },
  {
    id: "layout",
    label: L("Layout", "Tata letak"),
    items: [
      existing("row", LayoutTwoRowIcon, L("Row", "Baris"), "container wadah"),
      existing("column", LayoutTwoColumnIcon, L("Column", "Kolom"), "container wadah"),
      existing("grid", LayoutGridIcon, L("Grid", "Grid"), "container wadah kisi"),
    ],
  },
  {
    id: "display",
    label: L("Display", "Tampilan"),
    items: [
      fresh("paragraph", "text teks static statis keterangan description"),
      fresh("link", "url hyperlink button tombol tautan"),
      fresh("rich-text", "html formatted variable variabel catatan notes"),
    ],
  },
  {
    id: "data",
    label: L("Data", "Data"),
    items: [
      existing("remote", ServerStack01Icon, L("Remote select", "Pilihan dari API"), "api endpoint dropdown"),
      existing("masterdata", Database01Icon, L("Master data select", "Pilihan master data"), "master data dropdown"),
      fresh("repeater", "repeat rows array list line items baris berulang daftar rincian tabel input"),
      fresh("api-table", "api endpoint table tabel grid read only baca okr"),
    ],
  },
  {
    id: "advanced",
    label: L("Advanced", "Lanjutan"),
    items: [
      existing("expression", FunctionIcon, L("Expression input", "Input ekspresi"), "formula rumus"),
      existing("mfe", PuzzleIcon, L("External micro frontend", "Micro frontend eksternal"), "mfe addon custom"),
    ],
  },
]

/** What each value_kind looks like in the payload (shaping §C). */
export const VALUE_KINDS: Record<string, { shape: L10n; example: string }> = {
  string: { shape: L("One text value; empty is \"\"", "Satu teks; kosong \"\""), example: '"+6281234567890"' },
  number: { shape: L("One number; empty is null, never 0", "Satu angka; kosong null, tidak pernah 0"), example: "4" },
  boolean: { shape: L("true or false", "true atau false"), example: "true" },
  list: { shape: L("An array", "Satu array"), example: '[{ "qty": 2 }]' },
  json: { shape: L("One object with fixed keys", "Satu objek dengan key tetap"), example: '{ "start": "2026-10-12" }' },
  file: { shape: L("A file object, or an array when multiple", "Objek berkas, atau array bila multiple"), example: '{ "file_name": "signature.png" }' },
  none: { shape: L("Adds no key to the payload", "Tidak menambah key di payload"), example: "—" },
}
