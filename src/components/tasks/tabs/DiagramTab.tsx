export function DiagramTab() {
  return (
    <div className="p-4">
      <div className="rounded-none border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-xs font-semibold font-heading">Process Flow Diagram</h3>
          <p className="text-[11px] text-muted-foreground">Employee Onboarding – Current Step: Manager Review</p>
        </div>
        <div className="overflow-x-auto p-4">
          <svg
            viewBox="0 0 680 200"
            className="w-full min-w-[580px]"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background lanes */}
            <rect x="0" y="0" width="680" height="200" fill="transparent" />

            {/* Connectors */}
            {/* Start -> Submit */}
            <line x1="50" y1="100" x2="100" y2="100" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
            {/* Submit -> Manager Review */}
            <line x1="220" y1="100" x2="270" y2="100" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
            {/* Manager Review -> Gateway */}
            <line x1="390" y1="100" x2="440" y2="100" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
            {/* Gateway -> Execute */}
            <line x1="490" y1="100" x2="530" y2="100" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
            {/* Execute -> End */}
            <line x1="630" y1="100" x2="655" y2="100" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#arrow)" />
            {/* Reject loop (dashed) */}
            <path
              d="M 465 78 C 465 40, 160 40, 160 78"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              markerEnd="url(#arrow-red)"
            />
            <text x="280" y="32" textAnchor="middle" fontSize="9" fill="#ef4444">Reject</text>

            {/* Arrow markers */}
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#6b7280" />
              </marker>
              <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Start circle */}
            <circle cx="36" cy="100" r="14" fill="#22c55e" />
            <text x="36" y="125" textAnchor="middle" fontSize="9" fill="#6b7280">Start</text>

            {/* Submit Request task */}
            <rect x="100" y="78" width="120" height="44" rx="0" fill="white" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="160" y="97" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1d4ed8">Submit</text>
            <text x="160" y="110" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1d4ed8">Request</text>

            {/* Manager Review task (current - amber) */}
            <rect x="270" y="78" width="120" height="44" rx="0" fill="#fffbeb" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="282" cy="90" r="4" fill="#f59e0b" opacity="0.8">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <text x="330" y="97" textAnchor="middle" fontSize="10" fontWeight="600" fill="#92400e">Manager</text>
            <text x="330" y="110" textAnchor="middle" fontSize="10" fontWeight="600" fill="#92400e">Review</text>

            {/* Gateway diamond */}
            <polygon points="465,78 490,100 465,122 440,100" fill="white" stroke="#6b7280" strokeWidth="1.5" />
            <text x="465" y="104" textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="700">×</text>

            {/* Execute task (gray - future) */}
            <rect x="530" y="78" width="100" height="44" rx="0" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1.5" />
            <text x="580" y="97" textAnchor="middle" fontSize="10" fill="#9ca3af">Execute</text>
            <text x="580" y="110" textAnchor="middle" fontSize="10" fill="#9ca3af">Process</text>

            {/* End circle */}
            <circle cx="664" cy="100" r="14" fill="white" stroke="#ef4444" strokeWidth="2" />
            <circle cx="664" cy="100" r="9" fill="#ef4444" />
            <text x="664" y="125" textAnchor="middle" fontSize="9" fill="#6b7280">End</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 border-t border-border px-4 py-2.5">
          {[
            { color: "bg-green-500", label: "Start Event" },
            { color: "bg-blue-500", label: "Completed Task" },
            { color: "bg-amber-400 border border-amber-500", label: "Current Task" },
            { color: "bg-gray-300", label: "Upcoming Task" },
            { color: "bg-red-500", label: "End Event" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-full ${color}`} />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <svg width="20" height="8">
              <line x1="0" y1="4" x2="20" y2="4" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
            </svg>
            <span className="text-[11px] text-muted-foreground">Reject Path</span>
          </div>
        </div>
      </div>
    </div>
  )
}
