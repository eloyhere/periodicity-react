/**
 * Demo anchors for deep links inside a family page.
 *
 * The showcase uses the URL hash for page routing, so a demo cannot own the
 * hash itself. Instead every `Demo` gets a deterministic DOM id derived from
 * its title, and a component entry scrolls to that id after its family page
 * has rendered.
 *
 * Type: module.
 * Fields: demoAnchor.
 * @example
 * const id: string = demoAnchor("Context menu · empty");
 */

/**
 * Builds the stable DOM id for a demo title.
 * Lower-cases the title, collapses every run of non-alphanumeric characters
 * into a single hyphen, and prefixes the result with `demo-`.
 * @param title - Exact demo title as written in the family page.
 * @example
 * const id: string = demoAnchor("Context menu · empty");
 * @returns The DOM id, such as `demo-context-menu-empty`.
 */
export const demoAnchor: (title: string) => string = (title: string): string => {
    const slug: string = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return `demo-${slug}`;
};
