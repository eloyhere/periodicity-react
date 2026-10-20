/**
 * Builds the DOM id shared by a tab trigger and its panel pair.
 * @param value - Tab value supplied by the caller.
 * @example
 * const id: string = tabDomId("today");
 * @returns An id that is stable for the same value across renders.
 */
export const tabDomId: (value: string) => string = (value: string): string =>
    `tabs-tab-${encodeURIComponent(value)}`;

/**
 * Builds the DOM id of the panel paired with a tab value.
 * @param value - Tab value supplied by the caller.
 * @example
 * const id: string = panelDomId("today");
 * @returns An id that matches `aria-controls` on the trigger.
 */
export const panelDomId: (value: string) => string = (value: string): string =>
    `tabs-panel-${encodeURIComponent(value)}`;
