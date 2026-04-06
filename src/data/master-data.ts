import type { IconSvgElement } from "@hugeicons/react"
import { Building06Icon, UserAccountIcon, Location01Icon } from "@hugeicons/core-free-icons"

export type FieldType = "text" | "number" | "email" | "select" | "date" | "boolean"

export interface FieldDefinition {
  key: string
  label: string
  type: FieldType
  required?: boolean
  options?: string[]
  searchable?: boolean
  showInTable?: boolean
  showInDetail?: boolean
  placeholder?: string
}

export interface MasterDataSchema {
  entity: string
  singular: string
  icon: IconSvgElement
  fields: FieldDefinition[]
}

export type MasterDataRecord = Record<string, unknown> & { id: string }

/* ─── Departments ─── */
export const DEPARTMENTS_SCHEMA: MasterDataSchema = {
  entity: "Departments",
  singular: "Department",
  icon: Building06Icon,
  fields: [
    { key: "name", label: "Name", type: "text", required: true, searchable: true, showInTable: true, showInDetail: true, placeholder: "e.g. Engineering" },
    { key: "code", label: "Code", type: "text", required: true, searchable: true, showInTable: true, showInDetail: true, placeholder: "e.g. ENG" },
    { key: "head", label: "Department Head", type: "text", searchable: true, showInTable: true, showInDetail: true, placeholder: "e.g. Alice Wang" },
    { key: "headCount", label: "Head Count", type: "number", showInTable: true, showInDetail: true, placeholder: "0" },
    { key: "status", label: "Status", type: "select", required: true, options: ["Active", "Inactive"], showInTable: true, showInDetail: true },
  ],
}

export const DEPARTMENTS_DATA: MasterDataRecord[] = [
  { id: "DEPT-001", name: "Engineering", code: "ENG", head: "Alice Wang", headCount: 42, status: "Active" },
  { id: "DEPT-002", name: "Human Resources", code: "HR", head: "David Park", headCount: 12, status: "Active" },
  { id: "DEPT-003", name: "Finance", code: "FIN", head: "Sophie Martin", headCount: 18, status: "Active" },
  { id: "DEPT-004", name: "Marketing", code: "MKT", head: "Carlos Ruiz", headCount: 24, status: "Active" },
  { id: "DEPT-005", name: "Sales", code: "SLS", head: "Ken Watanabe", headCount: 36, status: "Active" },
  { id: "DEPT-006", name: "Operations", code: "OPS", head: "Priya Sharma", headCount: 28, status: "Active" },
  { id: "DEPT-007", name: "Legal", code: "LGL", head: "Tom Brady", headCount: 8, status: "Active" },
  { id: "DEPT-008", name: "Customer Support", code: "SUP", head: "Rachel Kim", headCount: 20, status: "Active" },
  { id: "DEPT-009", name: "Research", code: "RND", head: "Liam O'Brien", headCount: 15, status: "Inactive" },
  { id: "DEPT-010", name: "Design", code: "DSG", head: "Maria Santos", headCount: 10, status: "Active" },
  { id: "DEPT-011", name: "Quality Assurance", code: "QA", head: "Chen Wei", headCount: 14, status: "Active" },
  { id: "DEPT-012", name: "Procurement", code: "PRC", head: "Aisha Kamara", headCount: 6, status: "Inactive" },
]

/* ─── Positions ─── */
export const POSITIONS_SCHEMA: MasterDataSchema = {
  entity: "Positions",
  singular: "Position",
  icon: UserAccountIcon,
  fields: [
    { key: "title", label: "Title", type: "text", required: true, searchable: true, showInTable: true, showInDetail: true, placeholder: "e.g. Senior Engineer" },
    { key: "department", label: "Department", type: "select", required: true, options: ["Engineering", "Human Resources", "Finance", "Marketing", "Sales", "Operations", "Legal", "Customer Support", "Research", "Design", "Quality Assurance", "Procurement"], searchable: true, showInTable: true, showInDetail: true },
    { key: "level", label: "Level", type: "select", required: true, options: ["Junior", "Mid", "Senior", "Lead", "Manager", "Director"], showInTable: true, showInDetail: true },
    { key: "headCount", label: "Head Count", type: "number", showInTable: true, showInDetail: true, placeholder: "0" },
    { key: "status", label: "Status", type: "select", required: true, options: ["Active", "Inactive"], showInTable: true, showInDetail: true },
  ],
}

export const POSITIONS_DATA: MasterDataRecord[] = [
  { id: "POS-001", title: "Senior Frontend Developer", department: "Engineering", level: "Senior", headCount: 8, status: "Active" },
  { id: "POS-002", title: "Backend Engineer", department: "Engineering", level: "Mid", headCount: 12, status: "Active" },
  { id: "POS-003", title: "HR Business Partner", department: "Human Resources", level: "Senior", headCount: 3, status: "Active" },
  { id: "POS-004", title: "Financial Analyst", department: "Finance", level: "Mid", headCount: 5, status: "Active" },
  { id: "POS-005", title: "Marketing Manager", department: "Marketing", level: "Manager", headCount: 4, status: "Active" },
  { id: "POS-006", title: "Sales Representative", department: "Sales", level: "Junior", headCount: 15, status: "Active" },
  { id: "POS-007", title: "DevOps Engineer", department: "Engineering", level: "Senior", headCount: 4, status: "Active" },
  { id: "POS-008", title: "UX Designer", department: "Design", level: "Mid", headCount: 3, status: "Active" },
  { id: "POS-009", title: "QA Lead", department: "Quality Assurance", level: "Lead", headCount: 2, status: "Active" },
  { id: "POS-010", title: "Legal Counsel", department: "Legal", level: "Senior", headCount: 2, status: "Active" },
  { id: "POS-011", title: "Support Specialist", department: "Customer Support", level: "Junior", headCount: 10, status: "Active" },
  { id: "POS-012", title: "Data Scientist", department: "Research", level: "Senior", headCount: 3, status: "Inactive" },
]

/* ─── Locations ─── */
export const LOCATIONS_SCHEMA: MasterDataSchema = {
  entity: "Locations",
  singular: "Location",
  icon: Location01Icon,
  fields: [
    { key: "name", label: "Name", type: "text", required: true, searchable: true, showInTable: true, showInDetail: true, placeholder: "e.g. HQ Jakarta" },
    { key: "city", label: "City", type: "text", required: true, searchable: true, showInTable: true, showInDetail: true, placeholder: "e.g. Jakarta" },
    { key: "country", label: "Country", type: "text", required: true, searchable: true, showInTable: true, showInDetail: true, placeholder: "e.g. Indonesia" },
    { key: "address", label: "Address", type: "text", showInDetail: true, placeholder: "Full address" },
    { key: "timezone", label: "Timezone", type: "text", showInTable: true, showInDetail: true, placeholder: "e.g. Asia/Jakarta" },
    { key: "status", label: "Status", type: "select", required: true, options: ["Active", "Inactive"], showInTable: true, showInDetail: true },
  ],
}

export const LOCATIONS_DATA: MasterDataRecord[] = [
  { id: "LOC-001", name: "HQ Jakarta", city: "Jakarta", country: "Indonesia", address: "Jl. Sudirman No. 1, Jakarta Selatan", timezone: "Asia/Jakarta", status: "Active" },
  { id: "LOC-002", name: "Singapore Office", city: "Singapore", country: "Singapore", address: "1 Raffles Place, Tower 2", timezone: "Asia/Singapore", status: "Active" },
  { id: "LOC-003", name: "Tokyo Branch", city: "Tokyo", country: "Japan", address: "Shibuya-ku, Tokyo 150-0002", timezone: "Asia/Tokyo", status: "Active" },
  { id: "LOC-004", name: "London Office", city: "London", country: "United Kingdom", address: "30 St Mary Axe, London EC3A 8BF", timezone: "Europe/London", status: "Active" },
  { id: "LOC-005", name: "San Francisco Hub", city: "San Francisco", country: "United States", address: "525 Market St, San Francisco, CA", timezone: "America/Los_Angeles", status: "Active" },
  { id: "LOC-006", name: "Sydney Office", city: "Sydney", country: "Australia", address: "200 George St, Sydney NSW 2000", timezone: "Australia/Sydney", status: "Inactive" },
  { id: "LOC-007", name: "Berlin Branch", city: "Berlin", country: "Germany", address: "Friedrichstraße 43-45, 10117 Berlin", timezone: "Europe/Berlin", status: "Active" },
  { id: "LOC-008", name: "Mumbai Office", city: "Mumbai", country: "India", address: "Bandra Kurla Complex, Mumbai", timezone: "Asia/Kolkata", status: "Active" },
]
