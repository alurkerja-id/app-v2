import { createContext } from "react"

/**
 * DOM node of the header's second row. A page can portal a toolbar into it to
 * merge its controls with the top navbar (Studio-style two-row header). null
 * until the header has mounted.
 */
export const HeaderToolbarContext = createContext<HTMLElement | null>(null)
