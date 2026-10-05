import { useId, useState } from "react"

import { useT } from "./i18n"
import type { AnyComponentDef, FieldState } from "./types"

/**
 * One new component on the Form Component page: its runtime control with the
 * default props, filled with a sample value for the Read-only / Disabled columns.
 */
export function RevampField({ def, state }: { def: AnyComponentDef; state: FieldState }) {
  const t = useT()
  const [props] = useState(() => def.defaults())
  const [value, setValue] = useState(() => (state === "active" ? def.initial(props) : def.sample(props)))
  const id = useId().replace(/:/g, "")
  const Runtime = def.Runtime
  return (
    <div className="min-w-0">
      <span id={`${id}-label`} className="sr-only">
        {t(def.fieldLabel(props))}
      </span>
      <Runtime props={props} value={value} onChange={setValue} state={state} issues={[]} compact={false} id={id} />
    </div>
  )
}
