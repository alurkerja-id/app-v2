import { useState } from "react"
import { MasterDataPage } from "@/components/pages/MasterDataPage"
import { POSITIONS_SCHEMA, POSITIONS_DATA } from "@/data/master-data"
import type { MasterDataRecord } from "@/data/master-data"

export function PositionsPage() {
  const [data, setData] = useState<MasterDataRecord[]>(POSITIONS_DATA)
  return <MasterDataPage schema={POSITIONS_SCHEMA} data={data} onDataChange={setData} />
}
