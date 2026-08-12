// Mock data for the Process Discovery prototype.
//
// Mirrors the shape the real backend returns (see alurkerja-app-react's
// process-discovery.service), but computed here so the page runs without an API.
// Node ids match public/contract.bpmn so the heatmap paints onto real elements.

export type HeatmapType =
  | "duration"
  | "frequency"
  | "manhour"
  | "slaStatus"
  | "slaRate"
export type ExecutionStatus = "all" | "running" | "completed"

export interface DiscoveryNode {
  id: string
  name: string
  type: string
  /** How many times this node was executed in the range (loops count each pass). */
  frequency: number
  /** Average wall-clock hours an instance spent at this node. null = no data. */
  avgDurationHours: number | null
  /**
   * SLA target in working hours, only for user tasks that carry one. The clock
   * is set in Studio per user task; here it is the number the actual duration
   * is measured against.
   */
  sla?: number
  /**
   * Share of instances (0–1) that finished this task within its SLA. Captures
   * the consistency the average hides: a task can be "Met" on average yet still
   * miss its target on many individual runs. Only for tasks that carry an SLA.
   */
  onTimeRate?: number
}

export interface ProcessOption {
  key: string
  name: string
}

export interface VersionOption {
  id: string
  version: number
}

export const PROCESS_OPTIONS: ProcessOption[] = [
  { key: "contract-approval", name: "Contract Approval" },
]

export const VERSION_OPTIONS: VersionOption[] = [
  { id: "v3", version: 3 },
  { id: "v2", version: 2 },
  { id: "v1", version: 1 },
]

// The six user tasks of the contract process plus its gateways and events.
// Numbers are chosen so the three heatmaps disagree on purpose — the whole
// point of offering all three is that each surfaces a different problem.
export const DISCOVERY_NODES: DiscoveryNode[] = [
  { id: "StartEvent_1", name: "Contract Request Received", type: "startEvent", frequency: 120, avgDurationHours: null },
  { id: "Activity_0qtkj7h", name: "Assess Contract Classification", type: "userTask", frequency: 120, avgDurationHours: 3.2, sla: 8, onTimeRate: 0.96 },
  // Met on average (14.5 ≤ 16) yet nearly a third of runs still overshoot — the
  // gap the compliance heatmap exposes that the status heatmap hides.
  { id: "Activity_1wwntyt", name: "Draft Initial Contract", type: "userTask", frequency: 118, avgDurationHours: 14.5, sla: 16, onTimeRate: 0.71 },
  { id: "Gateway_1h0c06u", name: "Approval for internal review?", type: "exclusiveGateway", frequency: 118, avgDurationHours: null },
  // Frequent because rejected reviews loop back here — the frequency heatmap's headline.
  { id: "Review_Contract", name: "Review Contract", type: "userTask", frequency: 205, avgDurationHours: 6.8, sla: 8, onTimeRate: 0.84 },
  { id: "Gateway_1oiatoq", name: "Agreement reached?", type: "exclusiveGateway", frequency: 205, avgDurationHours: null },
  // Slowest per run and biggest total effort — the duration and manhour headline.
  // Also the worst on-time rate: most runs blow the target.
  { id: "Activity_01ujojm", name: "Contract Negotiation", type: "userTask", frequency: 96, avgDurationHours: 41.0, sla: 24, onTimeRate: 0.27 },
  { id: "Activity_17ihl0u", name: "Internal Signing", type: "userTask", frequency: 88, avgDurationHours: 5.5, sla: 8, onTimeRate: 0.9 },
  // Second by avg duration and low frequency, yet its total man-hours are huge —
  // the case only the manhour heatmap tells honestly.
  { id: "Activity_1frrm75", name: "External Signing", type: "userTask", frequency: 84, avgDurationHours: 30.2, sla: 24, onTimeRate: 0.46 },
  { id: "Gateway_14j7pmu", name: "Agreement Reached?", type: "exclusiveGateway", frequency: 84, avgDurationHours: null },
  { id: "Event_0rj9f9x", name: "Contract Signed", type: "endEvent", frequency: 84, avgDurationHours: null },
]

/** End-to-end case count for the range (drives the summary tiles). */
export const TOTAL_INSTANCES = 120

// ── Derivations ──────────────────────────────────────────────────────────

/** Man-hours accumulated at a node: how often × how long each time. */
export function manhourOf(node: DiscoveryNode): number | null {
  if (node.avgDurationHours == null) return null
  return node.frequency * node.avgDurationHours
}

/** The value a given heatmap paints for a node. null = no data / not applicable. */
export function nodeValue(node: DiscoveryNode, heatmap: HeatmapType): number | null {
  if (heatmap === "frequency") return node.frequency
  if (heatmap === "manhour") return manhourOf(node)
  if (heatmap === "slaRate") return slaOnTimePct(node)
  // Duration and SLA-status both key off the average working time at the node;
  // SLA-status just judges it against the target on top.
  return node.avgDurationHours
}

/** On-time attainment as a 0–100 percentage, or null with no SLA / no data. */
export function slaOnTimePct(node: DiscoveryNode): number | null {
  if (node.onTimeRate == null || node.sla == null) return null
  return node.onTimeRate * 100
}

/** Met when the average stays within the SLA, breached when it spills over. */
export function slaStatus(node: DiscoveryNode): "Met" | "Breached" | null {
  if (node.sla == null || node.avgDurationHours == null) return null
  return node.avgDurationHours > node.sla ? "Breached" : "Met"
}

/** Signed gap between average and SLA, in hours. Negative = comfortably inside. */
export function slaDelta(node: DiscoveryNode): number | null {
  if (node.sla == null || node.avgDurationHours == null) return null
  return node.avgDurationHours - node.sla
}

/**
 * Colour intensity (0–1) for a node in SLA mode, scaled *within its own verdict
 * group*: darkest red = worst overshoot among the breaches, darkest green =
 * widest margin among the met. Kept group-relative so a large breach never
 * dilutes the shading of the met tasks (and vice versa). Returns null for nodes
 * with no verdict (no SLA / no data) — they stay neutral.
 */
export function slaIntensity(node: DiscoveryNode, nodes: DiscoveryNode[]): number | null {
  const delta = slaDelta(node)
  const status = slaStatus(node)
  if (delta == null || status == null) return null

  const peerDeltas = nodes
    .map(slaDelta)
    .filter((d): d is number => d != null)

  // Magnitudes within the same verdict: overshoots (>0) for breaches, margins
  // (|delta|) for met.
  const groupMags =
    status === "Breached"
      ? peerDeltas.filter((d) => d > 0)
      : peerDeltas.filter((d) => d <= 0).map((d) => Math.abs(d))

  const max = Math.max(...groupMags, 0)
  if (max === 0) return 1
  return Math.abs(delta) / max
}
