/* eslint-disable react-refresh/only-export-components -- helper module for card.tsx */
import { L, type L10n } from "../i18n"
import { FieldList } from "./container-editor"
import type { Section } from "./container-model"
import type { ChildField } from "./repeater-model"

/* Card / fieldset — Edit Element list of the card's fields (one level, no sections).
   It reuses the field list of a Tabs / Accordion section; the card poses as that single
   section, so key checks and messages are the containers' own. */

/** The card seen as the containers' single section (builder only, never in the spec). */
export const asSection = (label: L10n, fields: ChildField[]): Section => ({ id: "card", key: "card", label, fields })

export function CardFieldsEditor({
  fields,
  onFields,
  cardName,
  requiredHint,
}: {
  fields: ChildField[]
  onFields: (next: ChildField[]) => void
  cardName: L10n
  requiredHint: L10n
}) {
  return (
    <FieldList
      fields={fields}
      sections={[asSection(cardName, fields)]}
      onFields={onFields}
      requiredHint={requiredHint}
      sectionName={cardName.en.trim() ? cardName : L("the card", "kartu")}
    />
  )
}
