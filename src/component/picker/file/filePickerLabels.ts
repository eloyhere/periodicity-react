/**
 * User-facing copy for a file picker.
 * Type: interface.
 * @param choose - Action label shown before and after a selection.
 * @param empty - Placeholder shown while no file has been selected.
 * @example
 * const labels: FilePickerLabels = { choose: "Browse", empty: "Nothing selected" };
 */
export interface FilePickerLabels {
    choose: string;
    empty: string;
}

/**
 * British English defaults for the file picker.
 * The empty label is replaced by the active International dictionary when available.
 * Type: constant.
 * Fields: choose, empty.
 * @example
 * const choose: string = DefaultFilePickerLabels.choose;
 */
export const DefaultFilePickerLabels: FilePickerLabels = {
    choose: "Choose file",
    empty: "No file selected",
};
