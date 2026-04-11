/* ── Process Groups (Folders) ── */

export interface ProcessGroup {
  id: string
  name: string
}

export const PROCESS_GROUPS: ProcessGroup[] = [
  { id: "hr",          name: "Human Resources" },
  { id: "finance",     name: "Finance & Accounting" },
  { id: "operations",  name: "Operations" },
  { id: "it",          name: "IT & Technology" },
  { id: "admin",       name: "Administration" },
]

/**
 * Maps process id → group id.
 * Processes NOT listed here are treated as "ungrouped" (shown at root level like loose files).
 */
export const PROCESS_GROUP_MAP: Record<string, string> = {
  // Human Resources
  emp:       "hr",
  "emp-off": "hr",
  hire:      "hr",
  lv:        "hr",
  mat:       "hr",
  ovt:       "hr",
  pay:       "hr",
  per:       "hr",
  pro:       "hr",
  ref:       "hr",

  // Finance & Accounting
  exp:       "finance",
  bud:       "finance",
  bon:       "finance",
  inv:       "finance",
  ins:       "finance",
  acc:       "finance",

  // Operations
  pr:        "operations",
  ast:       "operations",
  car:       "operations",
  res:       "operations",
  tr:        "operations",

  // IT & Technology
  it:        "it",
  soft:      "it",
  key:       "it",

  // Administration
  aud:       "admin",
  cli:       "admin",
  con:       "admin",
  train:     "admin",
}

/** Returns the group id for a process, or undefined if ungrouped */
export function getGroupIdForProcess(processId: string): string | undefined {
  return PROCESS_GROUP_MAP[processId]
}

/** Returns the group object for a process, or undefined if ungrouped */
export function getGroupForProcess(processId: string): ProcessGroup | undefined {
  const groupId = PROCESS_GROUP_MAP[processId]
  if (!groupId) return undefined
  return PROCESS_GROUPS.find((g) => g.id === groupId)
}
