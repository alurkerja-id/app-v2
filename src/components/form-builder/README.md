# Form builder revamp — new components (Waves 1–3)

Prototype of the 27 new Studio form components from shaping task 147071, merged into app-v2
from the HTML prototype. Mock data only — nothing here talks to a backend.

- Overview: `/pages/form-builder` (Pages → Form Builder in the sidebar)
- One component: `/pages/form-builder/<slug>?tab=builder|runtime|data`
- Runtime controls also appear on **Pages → Form Component** (Active / Read-only / Disabled columns)

The shaping PDFs are the contract (Edit Element content, validation messages, spec and payload).
The visuals follow app-v2 (shadcn Luma, HugeIcons, light + dark); they are illustrations, not pixel specs.

## Files

| File | What it does |
| --- | --- |
| `types.ts` | `ComponentDef<P, R>`, Edit Element schema (`PropField`), runtime props |
| `i18n.ts`, `lang.tsx` | `{ en, id }` strings, `L()`, `useT()`, the EN / ID switch |
| `lib.ts` | `F.name()` / `F.key()` / `F.required()`, `reqMsg`, `uniqueErr`, `snake`, `ctl`, `inert`, `issuesFor` |
| `schema.ts` | Rules shared by every Edit Element field (number range, list keys, …) |
| `property-editor.tsx` | Typed editors for each `PropField` (never a textbox with a raw key) |
| `edit-element-dialog.tsx` | Studio's Edit Element modal: General · Logic · Validation, Save / Discard |
| `workbench.tsx` | Builder (palette + canvas), Runtime (task form), Data (spec + payload) |
| `palette.tsx` | Regrouped palette, search in EN + ID, "New" badges |
| `registry.ts` | The 27 components, waves, weeks, palette groups, value kinds |
| `components/container-*.tsx` | Shared model, Edit Element list and runtime fields for Tabs, Accordion and Wizard |
| `revamp-field.tsx` | One runtime control for the Form Component page |
| `components/<slug>.tsx` | One module per component; exports one `ComponentDef` |

## Writing a component module

Use `components/rating.tsx` (simple) and `components/matrix.tsx` (lists, JSON value) as the pattern.

1. **First line**: `/* eslint-disable react-refresh/only-export-components -- definition module: … */`
   (the module exports one `ComponentDef` object and keeps its Canvas / Runtime inside).
2. **Types**: an interface for the props `P` (what Edit Element edits) and a type for the runtime value `R`.
   No `any`. `strict` TypeScript, `erasableSyntaxOnly` (no enums).
3. **`schema(p)`** → sections per tab (`general` / `logic` / `validation`). Start General with
   `F.name()`, `F.key()`; put `F.required()` in Validation (decision: same place as existing components).
   Hints and notes use the mini markup of `Rich`: `` `code` `` and `**bold**` (no HTML).
4. **`Canvas`**: static preview for the builder and overview cards (no state, no handlers).
5. **`Runtime`**: the control only — `FieldShell` in the workbench draws the label, `*` and messages.
   - Respect `state`: `active` edits; `readonly` shows the value, selectable, not editable;
     `disabled` muted and not focusable. Use `ctl(state)` on native inputs.
   - Give the main focusable control `id={`${id}-input`}`; group roles use `aria-labelledby={`${id}-label`}`.
   - Use `issues` (fid → message) to mark the failing part (row, level, input) with `aria-invalid`.
   - `compact` = phone layout (< 640 px or the phone preview).
6. **`initial(p)`** = the state the task opens with (usually empty; a story may start partly filled, e.g. the
   Repeater revision), **`sample(p)`** = a realistic filled value (Read-only / Disabled columns).
7. **`validate(p, r)`** → `Issue[]` with the exact EN / ID messages from the prototype.
8. **`value(p, r)`** = what goes in the payload under `p.name`. Empty: `number` → `null`,
   `string` → `""`, `list` → `[]`; `json` keeps every fixed key with `null`. `vk: "none"` adds no key.
9. **`spec(p)`** = the node spec exactly as in the shaping PDF (`ui_type`, `value_kind`, `config`…).
10. **`story`** = the mock task around the field (process, step, ref, due, task, `before` / `after` fields).
    Story fields: `text`, `textarea`, `select`, `number`, `date`, `checkbox` (payload `true` / `false`),
    with optional `prefix` ("Rp"), `hint`, `requiredMsg` and `validate`.
11. Optional:
    - `Controls` — simulation buttons (camera, GPS, API state); receives the field `state`.
      `hasControls(p)` hides the card for some settings, `controlsTitle` names what is simulated.
    - `Aside` — a context card beside the runtime form (task history, leave balance).
    - `dataExtra(p, r)` — extra JSON blocks in the Data tab (e.g. a sample API response).
    - `devices: true` (desktop / phone switch), `bare: true` (no label: Paragraph, Link),
      `canvasWarn` (badge on the canvas node).
    - `valueKindOf(p)` — when the value kind depends on a setting (Hidden field: Value type).

## Containers (Tabs, Accordion, Multi-step wizard)

Each tab / section / step is a child node with its own `children`; the fields inside stay top-level
process variables. Build on `container-model.tsx` (sections, issues per section, flat entries, spec children),
`container-editor.tsx` (`SectionsEditor`: the two-level list in Edit Element) and `container-ui.tsx`
(`SectionFields`, `IssueBadge`).

- `vk: "none"` plus **`payloadEntries(p, r)`**: the container sends no key of its own, only one flat entry per field.
- Field keys are unique across the whole form (`childKeyError`), not per tab.
- `validate` checks every section, also the ones that are not open; issue fids come from `fieldFid`.

Note: `ui/calendar` defines its `Root` and `DayButton` inline, so a calendar that re-renders while the
pointer moves (e.g. a hover preview) must pass stable ones through `components` — see `date-range.tsx`.

Rules from `AGENTS.md`: shadcn/ui components first, HugeIcons only, light + dark mode, accent colours
from theme tokens, and `npx tsc --noEmit -p tsconfig.app.json` must pass.
