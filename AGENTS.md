# AI Instructions

Instruksi ini berlaku untuk semua AI assistant yang bekerja di project ini.

## UI Components

- Setiap halaman baru wajib menggunakan komponen dari **shadcn/ui** sebisa mungkin.
- Design system default yang digunakan adalah **shadcn Luma** theme.
- Semua halaman wajib mendukung **light mode dan dark mode**.

## Accent Color

- Setiap komponen yang memiliki warna accent wajib menggunakan CSS variable accent dari theme, bukan nilai warna hardcoded.
- Ini memastikan tampilan menyesuaikan secara otomatis dengan pilihan warna accent yang dipilih user.
- Gunakan class Tailwind berbasis CSS variable seperti `bg-accent`, `text-accent-foreground`, `border-accent`, dll — jangan gunakan warna statis seperti `bg-blue-500` atau `text-indigo-600` untuk elemen accent.

## Icon Library

- Icon library yang digunakan adalah **HugeIcons** (`hugeicons-react`).
- Dilarang menggunakan icon set lain (Lucide, Heroicons, FontAwesome, dll).
