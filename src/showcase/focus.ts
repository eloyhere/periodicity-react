/**
 * Focus context shared between the showcase shell and every Demo.
 *
 * The shell puts the selected component entry's demo anchor into this
 * context. A Demo compares its own anchor with the context value and marks
 * itself as the focused demo, which gives the reader a visible target after
 * the automatic scroll.
 *
 * Type: module.
 * Fields: ShowcaseFocusContext.
 * @example
 * <ShowcaseFocusContext.Provider value="demo-field-variants"><Page /></ShowcaseFocusContext.Provider>
 */

import { createContext, type Context } from "react";

/**
 * Anchor id of the demo that the active component entry points at, or an
 * empty string when the active entry is a family page.
 * @example
 * const anchor: string = useContext(ShowcaseFocusContext);
 */
export const ShowcaseFocusContext: Context<string> = createContext<string>("");
