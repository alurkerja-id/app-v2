import { useState } from "react"
import { MasterDataPage } from "@/components/pages/MasterDataPage"
import { DEPARTMENTS_SCHEMA, DEPARTMENTS_DATA } from "@/data/master-data"
import type { MasterDataRecord } from "@/data/master-data"

export function DepartmentsPage() {
  const [data, setData] = useState<MasterDataRecord[]>(DEPARTMENTS_DATA)
  return <MasterDataPage schema={DEPARTMENTS_SCHEMA} data={data} onDataChange={setData} />
}
