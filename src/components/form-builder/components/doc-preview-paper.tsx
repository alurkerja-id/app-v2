/* eslint-disable react-refresh/only-export-components -- Document preview helpers: mock files, the mock contract / policy text and the paper page renderer */
import { Fragment, type CSSProperties } from "react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/* Mock documents for the Document / PDF preview. A page is a list of blocks drawn on
   white "paper" sized like A4; every length inside a page is in em, so one font size
   (derived from the page width) scales the whole page with the zoom. */

/** A4 at 96 dpi: 100 % zoom = 794 px wide. */
export const A4_W = 794
export const A4_RATIO = 297 / 210
/** Body text size at 100 %. */
const BASE_FONT = 14

export interface Signer {
  role: string
  org: string
  name: string
  title: string
  /** Draw the duty-stamp placeholder ("meterai"). */
  stamp?: boolean
}

export type Block =
  | { t: "title"; text: string; sub?: string }
  | { t: "h"; text: string }
  | { t: "p"; text: string }
  | { t: "list"; style: "num" | "alpha"; items: string[] }
  | { t: "sign"; place: string; signers: Signer[] }

export interface MockDoc {
  /** Running header, left and right. */
  header: [string, string]
  pages: Block[][]
}

export interface MockFile {
  id: string
  name: string
  mime: string
  size: number
  /** Present when the file can be previewed (PDF). */
  doc?: MockDoc
}

export const MIME_PDF = "application/pdf"
export const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

/* ── the contract under review (6 pages) ────────────────────────────────── */

const PIHAK_1 = "PT Sinar Nusantara Abadi"
const PIHAK_2 = "CV Mitra Kantor"

const CONTRACT_DOC: MockDoc = {
  header: ["CTR-2026-0098 · Perjanjian Pemeliharaan Peralatan Kantor", "Draf untuk review legal"],
  pages: [
    [
      { t: "title", text: "Perjanjian Pemeliharaan Peralatan Kantor", sub: "Nomor: CTR-2026-0098/LGL/XI/2026" },
      { t: "p", text: "Perjanjian ini dibuat dan ditandatangani di Jakarta pada hari Senin, tanggal 2 November 2026, oleh dan antara:" },
      {
        t: "list",
        style: "num",
        items: [
          `**${PIHAK_1}**, berkedudukan di Jakarta Selatan, dalam hal ini diwakili oleh Rina Wulandari selaku Direktur Operasional, selanjutnya disebut **PIHAK PERTAMA**;`,
          `**${PIHAK_2}**, berkedudukan di Bekasi, dalam hal ini diwakili oleh Hendra Gunawan selaku Direktur, selanjutnya disebut **PIHAK KEDUA**.`,
        ],
      },
      { t: "p", text: "PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut **PARA PIHAK**. PARA PIHAK terlebih dahulu menerangkan hal-hal sebagai berikut:" },
      {
        t: "list",
        style: "alpha",
        items: [
          "bahwa PIHAK PERTAMA membutuhkan jasa pemeliharaan berkala untuk peralatan kantor di kantor pusat Jakarta dan kantor cabang Bandung serta Surabaya;",
          "bahwa PIHAK KEDUA adalah badan usaha yang bergerak di bidang penyediaan dan pemeliharaan peralatan kantor, serta bersedia memberikan jasa tersebut;",
          "bahwa PIHAK KEDUA telah ditetapkan sebagai penyedia melalui proses pengadaan nomor PR-2026-0147 dengan perbandingan tiga penawaran.",
        ],
      },
      { t: "p", text: "Berdasarkan hal-hal tersebut di atas, PARA PIHAK sepakat untuk mengikatkan diri dalam Perjanjian ini dengan syarat dan ketentuan sebagai berikut." },
    ],
    [
      { t: "h", text: "Pasal 1 — Ruang Lingkup Pekerjaan" },
      { t: "p", text: "(1) PIHAK KEDUA wajib melaksanakan pemeliharaan preventif setiap bulan atas peralatan yang tercantum dalam Lampiran I, yaitu 42 unit printer, 6 unit mesin fotokopi, dan 3 unit mesin penghancur kertas." },
      { t: "p", text: "(2) Pemeliharaan preventif mencakup pembersihan, pemeriksaan fungsi, penggantian suku cadang habis pakai ringan, dan pencatatan kondisi setiap unit dalam berita acara pemeliharaan." },
      { t: "p", text: "(3) PIHAK KEDUA wajib menangani perbaikan korektif atas setiap laporan kerusakan dari PIHAK PERTAMA pada hari dan jam kerja, yaitu Senin sampai Jumat pukul 08.00–17.00 WIB." },
      { t: "p", text: "(4) Penggantian suku cadang utama di luar suku cadang habis pakai ringan dilakukan setelah PIHAK PERTAMA menyetujui penawaran harga tertulis dari PIHAK KEDUA." },
      { t: "h", text: "Pasal 2 — Jangka Waktu" },
      { t: "p", text: "(1) Perjanjian ini berlaku selama 12 (dua belas) bulan, terhitung sejak tanggal 1 Januari 2027 sampai dengan tanggal 31 Desember 2027." },
      { t: "p", text: "(2) Perjanjian dapat diperpanjang atas kesepakatan tertulis PARA PIHAK yang dibuat paling lambat 30 (tiga puluh) hari kalender sebelum jangka waktu Perjanjian berakhir." },
    ],
    [
      { t: "h", text: "Pasal 3 — Nilai Perjanjian dan Cara Pembayaran" },
      { t: "p", text: "(1) Nilai Perjanjian adalah **Rp186.000.000** (seratus delapan puluh enam juta rupiah) untuk jangka waktu 12 (dua belas) bulan, sudah termasuk Pajak Pertambahan Nilai." },
      { t: "p", text: "(2) Pembayaran dilakukan setiap bulan sebesar Rp15.500.000 (lima belas juta lima ratus ribu rupiah) setelah PIHAK PERTAMA menerima berita acara pemeliharaan yang telah ditandatangani dan faktur pajak yang sah." },
      { t: "p", text: "(3) PIHAK PERTAMA melakukan pembayaran paling lambat 30 (tiga puluh) hari kalender sejak dokumen tagihan diterima lengkap, melalui transfer ke rekening PIHAK KEDUA yang tercantum dalam Lampiran II." },
      { t: "h", text: "Pasal 4 — Tingkat Layanan" },
      { t: "p", text: "(1) PIHAK KEDUA wajib menanggapi setiap laporan kerusakan paling lambat 4 (empat) jam kerja dan menyelesaikan perbaikan paling lambat 2 (dua) hari kerja sejak laporan diterima." },
      { t: "p", text: "(2) Apabila perbaikan memerlukan waktu lebih dari 2 (dua) hari kerja, PIHAK KEDUA wajib menyediakan unit pengganti dengan spesifikasi setara tanpa biaya tambahan sampai unit yang diperbaiki berfungsi kembali." },
      { t: "p", text: "(3) PIHAK KEDUA menyampaikan laporan tingkat layanan setiap bulan bersama berita acara pemeliharaan." },
    ],
    [
      { t: "h", text: "Pasal 5 — Hak dan Kewajiban" },
      { t: "p", text: "(1) PIHAK PERTAMA berhak menerima laporan pemeliharaan bulanan dan meminta perbaikan ulang tanpa biaya apabila hasil pekerjaan tidak sesuai dengan Perjanjian ini." },
      { t: "p", text: "(2) PIHAK PERTAMA wajib memberikan akses ke lokasi peralatan pada jam kerja dan menunjuk satu orang penanggung jawab di setiap lokasi." },
      { t: "p", text: "(3) PIHAK KEDUA wajib menggunakan suku cadang asli atau yang setara, dan menjamin hasil perbaikan selama 90 (sembilan puluh) hari kalender." },
      { t: "p", text: "(4) PIHAK KEDUA wajib memastikan teknisinya mematuhi tata tertib dan ketentuan keselamatan kerja yang berlaku di lokasi PIHAK PERTAMA." },
      { t: "h", text: "Pasal 6 — Denda" },
      { t: "p", text: "(1) Atas keterlambatan penyelesaian perbaikan sebagaimana dimaksud dalam Pasal 4 ayat (1), PIHAK KEDUA dikenakan denda sebesar 1‰ (satu per mil) dari nilai pembayaran bulan berjalan untuk setiap hari keterlambatan." },
      { t: "p", text: "(2) Jumlah seluruh denda paling banyak 5% (lima persen) dari nilai Perjanjian. Denda diperhitungkan langsung pada pembayaran bulan berikutnya." },
    ],
    [
      { t: "h", text: "Pasal 7 — Kerahasiaan" },
      { t: "p", text: "PIHAK KEDUA wajib menjaga kerahasiaan seluruh data dan informasi milik PIHAK PERTAMA yang diketahuinya selama pelaksanaan pekerjaan, termasuk dokumen yang tersimpan pada memori peralatan yang dipelihara. Kewajiban ini tetap berlaku 2 (dua) tahun setelah Perjanjian berakhir." },
      { t: "h", text: "Pasal 8 — Keadaan Kahar" },
      { t: "p", text: "(1) Keadaan kahar adalah peristiwa di luar kendali PARA PIHAK yang menghalangi pelaksanaan Perjanjian, antara lain bencana alam, kebakaran, huru-hara, dan kebijakan pemerintah." },
      { t: "p", text: "(2) Pihak yang mengalami keadaan kahar wajib memberitahukannya secara tertulis kepada pihak lainnya paling lambat 7 (tujuh) hari kalender sejak kejadian, disertai keterangan dari instansi yang berwenang." },
      { t: "h", text: "Pasal 9 — Pemutusan Perjanjian" },
      { t: "p", text: "PIHAK PERTAMA dapat memutuskan Perjanjian secara sepihak apabila PIHAK KEDUA tidak memenuhi tingkat layanan dalam Pasal 4 sebanyak 3 (tiga) kali dalam 3 (tiga) bulan berturut-turut, dengan pemberitahuan tertulis paling lambat 14 (empat belas) hari kalender sebelumnya." },
    ],
    [
      { t: "h", text: "Pasal 10 — Penyelesaian Perselisihan" },
      { t: "p", text: "(1) Perselisihan yang timbul dari pelaksanaan Perjanjian ini diselesaikan terlebih dahulu secara musyawarah untuk mufakat." },
      { t: "p", text: "(2) Apabila musyawarah tidak mencapai mufakat dalam 30 (tiga puluh) hari kalender, PARA PIHAK sepakat memilih domisili hukum di Kepaniteraan Pengadilan Negeri Jakarta Selatan." },
      { t: "h", text: "Pasal 11 — Penutup" },
      { t: "p", text: "Perjanjian ini dibuat dalam rangkap 2 (dua), masing-masing bermeterai cukup dan mempunyai kekuatan hukum yang sama, satu untuk setiap pihak. Lampiran I dan Lampiran II merupakan bagian yang tidak terpisahkan dari Perjanjian ini." },
      {
        t: "sign",
        place: "Jakarta, 2 November 2026",
        signers: [
          { role: "PIHAK PERTAMA", org: PIHAK_1, name: "Rina Wulandari", title: "Direktur Operasional" },
          { role: "PIHAK KEDUA", org: PIHAK_2, name: "Hendra Gunawan", title: "Direktur", stamp: true },
        ],
      },
    ],
  ],
}

/* ── a fixed policy file picked in the builder (3 pages) ────────────────── */

const POLICY_DOC: MockDoc = {
  header: ["KEB-04/DIR/I/2026 · Kebijakan Pengadaan Barang dan Jasa", "Internal"],
  pages: [
    [
      { t: "title", text: "Kebijakan Pengadaan Barang dan Jasa", sub: "Nomor: KEB-04/DIR/I/2026 · berlaku sejak 2 Januari 2026" },
      { t: "h", text: "Bab I — Ketentuan Umum" },
      { t: "p", text: `(1) Kebijakan ini menjadi pedoman pengadaan barang dan jasa di seluruh unit kerja ${PIHAK_1}, termasuk kantor cabang.` },
      { t: "p", text: "(2) Setiap pengadaan diajukan melalui aplikasi alur kerja agar permintaan, persetujuan, dan dokumen pendukungnya tercatat." },
      { t: "h", text: "Bab II — Prinsip Pengadaan" },
      { t: "p", text: "Setiap pengadaan wajib memenuhi prinsip berikut:" },
      {
        t: "list",
        style: "alpha",
        items: [
          "**efisien**: memakai dana dan sumber daya seminimal mungkin untuk hasil yang ditetapkan;",
          "**efektif**: sesuai kebutuhan dan memberi manfaat sebesar-besarnya;",
          "**transparan**: ketentuan dan informasi pengadaan terbuka bagi penyedia yang memenuhi syarat;",
          "**adil**: tidak memberi perlakuan istimewa kepada penyedia tertentu;",
          "**akuntabel**: dapat dipertanggungjawabkan sesuai ketentuan perusahaan.",
        ],
      },
    ],
    [
      { t: "h", text: "Bab III — Batas Nilai dan Metode" },
      {
        t: "list",
        style: "num",
        items: [
          "Sampai dengan Rp50.000.000: pembelian langsung dengan minimal 1 (satu) penawaran tertulis.",
          "Di atas Rp50.000.000 sampai dengan Rp500.000.000: perbandingan harga dengan minimal 3 (tiga) penawaran.",
          "Di atas Rp500.000.000: tender terbatas yang diumumkan kepada penyedia terdaftar.",
        ],
      },
      { t: "h", text: "Bab IV — Persetujuan" },
      { t: "p", text: "(1) Permintaan pengadaan disetujui oleh atasan langsung, lalu diverifikasi oleh fungsi Pengadaan terhadap anggaran yang tersedia." },
      { t: "p", text: "(2) Pengadaan dengan nilai di atas Rp100.000.000 memerlukan persetujuan Direktur Keuangan." },
      { t: "p", text: "(3) Pemohon dilarang memecah satu kebutuhan menjadi beberapa permintaan untuk menghindari batas nilai dalam Bab III." },
    ],
    [
      { t: "h", text: "Bab V — Kontrak" },
      { t: "p", text: "(1) Setiap kontrak dengan nilai di atas Rp100.000.000 wajib direview oleh fungsi Legal sebelum ditandatangani." },
      { t: "p", text: "(2) Kontrak pemeliharaan sekurang-kurangnya memuat tingkat layanan, denda keterlambatan, dan ketentuan kerahasiaan data." },
      { t: "h", text: "Bab VI — Penutup" },
      { t: "p", text: "Kebijakan ini berlaku sejak tanggal ditetapkan dan ditinjau kembali paling lambat setiap 2 (dua) tahun." },
      {
        t: "sign",
        place: "Ditetapkan di Jakarta, 2 Januari 2026",
        signers: [{ role: "DIREKSI", org: PIHAK_1, name: "Bambang Prasetyo", title: "Direktur Utama" }],
      },
    ],
  ],
}

/* ── files ──────────────────────────────────────────────────────────────── */

/** What the earlier "Draft contract" step uploaded into `contract_file`. */
export const CONTRACT_PDF: MockFile = {
  id: "fl_8c21d7",
  name: "Kontrak Perawatan CV Mitra Kantor 2027.pdf",
  mime: MIME_PDF,
  size: 412876,
  doc: CONTRACT_DOC,
}

/** Files offered by the builder file picker (prototype: no real upload). */
export const UPLOADS: MockFile[] = [
  { id: "fl_3a90b2", name: "Kebijakan Pengadaan 2026.pdf", mime: MIME_PDF, size: 268410, doc: POLICY_DOC },
  { id: "fl_8c21d7", name: CONTRACT_PDF.name, mime: MIME_PDF, size: CONTRACT_PDF.size, doc: CONTRACT_DOC },
  { id: "fl_3a90c4", name: "SOP Serah Terima Barang.docx", mime: MIME_DOCX, size: 54272 },
]

/** The same file saved as Word (simulation "Word file"): no preview, download only. */
export const asDocx = (f: MockFile): MockFile => ({
  id: `${f.id}_docx`,
  name: f.name.replace(/\.[^.]+$/, "") + ".docx",
  mime: MIME_DOCX,
  size: Math.round(f.size * 0.21),
})

const OFFICE = /\.(docx?|xlsx?|pptx?|odt|ods|csv|zip)$/i

/** URL source: name from the last path segment; any non-Office link shows the sample contract. */
export function fileFromUrl(url: string): MockFile {
  let name = "document.pdf"
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean).pop()
    if (seg) name = decodeURIComponent(seg)
  } catch {
    /* validated elsewhere */
  }
  if (OFFICE.test(name)) return { id: "url", name, mime: MIME_DOCX, size: 61440 }
  return { id: "url", name: /\.pdf$/i.test(name) ? name : `${name}.pdf`, mime: MIME_PDF, size: CONTRACT_PDF.size, doc: CONTRACT_DOC }
}

function bytesIn(n: number, loc: string) {
  if (n < 1048576) return `${new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(n / 1024)} KB`
  return `${new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }).format(n / 1048576)} MB`
}
/** "403 KB" in both languages; MB gets a locale decimal mark. */
export const sizeText = (n: number) => ({ en: bytesIn(n, "en-GB"), id: bytesIn(n, "id-ID") })

/* ── paper ──────────────────────────────────────────────────────────────── */

/** Page box: width as a CSS length (px at runtime, container units on the canvas). */
export function pageBox(width: string): CSSProperties {
  return { width, aspectRatio: `210 / 297`, fontSize: `calc(${width} * ${BASE_FONT / A4_W})` }
}

/** `**bold**` inside document text. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((s, i) =>
        s.startsWith("**") && s.endsWith("**") && s.length > 4 ? <b key={i}>{s.slice(2, -2)}</b> : <Fragment key={i}>{s}</Fragment>,
      )}
    </>
  )
}

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "title":
      return (
        <div className="mb-[1.8em] text-center">
          <p className="text-[1.3em] leading-snug font-bold tracking-[0.04em] uppercase">{b.text}</p>
          {b.sub && <p className="mt-[0.4em] text-[0.9em]">{b.sub}</p>}
        </div>
      )
    case "h":
      return <p className="mt-[1.3em] mb-[0.45em] font-bold first:mt-0">{b.text}</p>
    case "p":
      return (
        <p className="mb-[0.6em] text-justify leading-[1.6] hyphens-auto">
          <Inline text={b.text} />
        </p>
      )
    case "list":
      return (
        <ol className={cn("mb-[0.7em] pl-[1.7em] leading-[1.6]", b.style === "num" ? "list-decimal" : "list-[lower-alpha]")}>
          {b.items.map((it) => (
            <li key={it} className="mb-[0.3em] pl-[0.3em] text-justify">
              <Inline text={it} />
            </li>
          ))}
        </ol>
      )
    case "sign":
      return (
        <div className="mt-[2em]">
          <p className={cn("mb-[1em]", b.signers.length === 1 && "text-right")}>{b.place}</p>
          <div className="grid grid-cols-2 gap-[3em] text-center">
            {b.signers.map((s) => (
              <div key={s.name} className={cn(b.signers.length === 1 && "col-start-2")}>
                <p className="font-bold">{s.role}</p>
                <p>{s.org}</p>
                <div className="flex h-[5.6em] items-center justify-center">
                  {s.stamp && (
                    <span className="rounded-[0.25em] border border-dashed border-zinc-400 px-[0.7em] py-[0.35em] font-sans text-[0.6em] tracking-wider text-zinc-500">
                      METERAI 10000
                    </span>
                  )}
                </div>
                <p className="font-bold underline underline-offset-[0.25em]">{s.name}</p>
                <p className="text-[0.88em]">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      )
  }
}

/**
 * One A4 page. Paper stays white in dark mode (like a printed page); the desk around it
 * follows the theme. `data-page` is what the viewer measures for page tracking.
 */
export function PaperPage({ doc, n, width, className }: { doc: MockDoc; n: number; width: string; className?: string }) {
  const total = doc.pages.length
  return (
    <div
      data-page={n}
      lang="id"
      className={cn(
        "relative shrink-0 overflow-hidden bg-white font-serif text-zinc-900 shadow-[0_1px_2px_rgb(0_0_0/0.12),0_6px_16px_-4px_rgb(0_0_0/0.12)] ring-1 ring-black/5 [color-scheme:light] selection:bg-sky-200 selection:text-zinc-900",
        className,
      )}
      style={pageBox(width)}
    >
      <div className="flex justify-between gap-[2em] px-[4.4em] pt-[2.4em] pb-[2em] font-sans text-[0.62em] text-zinc-400">
        <span className="truncate">{doc.header[0]}</span>
        <span className="shrink-0">{doc.header[1]}</span>
      </div>
      <div className="px-[4.4em]">
        {doc.pages[n - 1]?.map((b, i) => (
          <BlockView key={i} b={b} />
        ))}
      </div>
      <p className="absolute inset-x-0 bottom-[2.6em] text-center font-sans text-[0.62em] text-zinc-400">
        Halaman {n} dari {total}
      </p>
    </div>
  )
}

const SKEL_W = [92, 100, 96, 70, 100, 88, 94, 60, 100, 85, 97, 74]

/** Placeholder page while the file loads (theme colours: it is not paper yet). */
export function SkeletonPage({ width }: { width: string }) {
  return (
    <div className="flex shrink-0 flex-col gap-[0.9em] rounded-sm bg-card px-[4.4em] pt-[4.6em] ring-1 ring-border" style={pageBox(width)} aria-hidden>
      <Skeleton className="mx-auto h-[1.1em] w-3/5 rounded-full" />
      <Skeleton className="mx-auto mb-[1.6em] h-[0.8em] w-2/5 rounded-full" />
      {SKEL_W.map((w, i) => (
        <Skeleton key={i} className={cn("h-[0.75em] rounded-full", i % 4 === 3 && "mb-[1em]")} style={{ width: `${w}%` }} />
      ))}
    </div>
  )
}
