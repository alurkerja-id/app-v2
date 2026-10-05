import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon, UndoIcon, WorkHistoryIcon } from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { L, useLang, useT } from "../i18n"
import { rupiah } from "../lib"
import type { RepeaterProps, RepeaterValue } from "./repeater-model"

/* Task history beside the revision form: the manager's note and the earlier
   submission as a read-only table — how a Repeater value reads in history. */

/** The earlier submission: item, qty, unit price, note. */
const ROWS: { item: string; qty: number; price: number; note: string }[] = [
  { item: "Laptop", qty: 3, price: 15000000, note: "Untuk 3 staf baru tim desain" },
  { item: "Monitor 24 inci", qty: 3, price: 2450000, note: "" },
]

/* Narrow side card: qty × unit price and the note sit under the item name. */
function HistoryTable() {
  const t = useT()
  const { lang } = useLang()
  const total = ROWS.reduce((s, r) => s + r.qty * r.price, 0)
  const head = "px-2 py-1.5 font-medium"
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className={`${head} text-right`}>#</th>
            <th className={`${head} text-left`}>{t(L("Item name", "Nama barang"))}</th>
            <th className={`${head} text-right`}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r, i) => (
            <tr key={r.item} className="border-t border-border align-top">
              <td className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">{i + 1}</td>
              <td className="px-2 py-1.5">
                {r.item}
                <span className="block text-[11px] text-muted-foreground tabular-nums">
                  {r.qty.toLocaleString(lang === "id" ? "id-ID" : "en-GB")} × {rupiah(r.price)}
                </span>
                {r.note && <span className="block text-[11px] text-muted-foreground">{r.note}</span>}
              </td>
              <td className="px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{rupiah(r.qty * r.price)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-medium">
            <td className="px-2 py-1.5" colSpan={2}>
              Total
            </td>
            <td className="px-2 py-1.5 text-right whitespace-nowrap tabular-nums">{rupiah(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export function RepeaterHistory({ props: p }: { props: RepeaterProps; value: RepeaterValue }) {
  const t = useT()
  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{t(L("Task history", "Riwayat task"))}</p>
          <p className="text-xs text-muted-foreground">
            {t(L("Read-only. This is how a Repeater value appears in history after submit.", "Baca-saja. Begini nilai Repeater tampil di riwayat setelah dikirim."))}
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <HugeiconsIcon icon={WorkHistoryIcon} />2
        </Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <HugeiconsIcon icon={UndoIcon} className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t(L("Returned for revision", "Dikembalikan untuk revisi"))}</p>
            <p className="text-xs text-muted-foreground">Budi Santoso · {t(L("Manager", "Atasan"))} · {t(L("3 Oct 2026, 09:25", "3 Okt 2026, 09.25"))}</p>
          </div>
        </div>
        <p className="ml-8 rounded-xl bg-muted/60 px-3 py-2 text-xs italic">
          “Kurangi laptop jadi 2 unit, monitor juga 2 unit. Staf ketiga baru bergabung Januari.”
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
            <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {t(L("Submitted", "Dikirim"))} · {t(p.label)}
            </p>
            <p className="text-xs text-muted-foreground">Rina Wulandari · {t(L("2 Oct 2026, 14:10", "2 Okt 2026, 14.10"))}</p>
          </div>
        </div>
        <HistoryTable />
      </div>
    </Card>
  )
}
