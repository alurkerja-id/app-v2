import { useState } from "react"
import { MasterDataPage } from "@/components/pages/MasterDataPage"
import { LOCATIONS_SCHEMA, LOCATIONS_DATA } from "@/data/master-data"
import type { MasterDataRecord } from "@/data/master-data"

export function LocationsPage() {
  const [data, setData] = useState<MasterDataRecord[]>(LOCATIONS_DATA)
  return <MasterDataPage schema={LOCATIONS_SCHEMA} data={data} onDataChange={setData} />
}
