/**
 * User-facing copy for a file picker.
 * Type: interface.
 * Fields: choose, empty.
 * @example
 * const labels: FilePickerLabels = { choose: "Browse", empty: "Nothing selected" };
 */
export interface FilePickerLabels {
    /** Action label shown before and after a selection. */
    choose: string;
    /** Placeholder shown while no file has been selected. */
    empty: string;
}
