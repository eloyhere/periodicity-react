/**
 * User-facing copy used by the shared image editor.
 * Every field may be overridden, so consumers can localise the picker without a provider.
 * Type: interface.
 * Fields: choose, edit, done, cancel, close, zoom, rotateLeft, rotateRight, reset,
 * cropArea, hint.
 * @example
 * const labels: ImagePickerLabels = { choose: "Browse", edit: "Edit", done: "完成" };
 */
export interface ImagePickerLabels {
    /** Empty-state action on the trigger. */
    choose: string;
    /** Dialog title while editing a chosen image. */
    edit: string;
    /** Footer action that applies the crop. */
    done: string;
    /** Footer action that keeps the original image. */
    cancel: string;
    /** Header close action that abandons the selection. */
    close: string;
    /** Accessible name of the zoom slider. */
    zoom: string;
    /** Accessible name of the counter-clockwise rotation action. */
    rotateLeft: string;
    /** Accessible name of the clockwise rotation action. */
    rotateRight: string;
    /** Accessible name of the reset action. */
    reset: string;
    /** Accessible name of the draggable crop stage. */
    cropArea: string;
    /** Instructions shown under the crop stage. */
    hint: string;
}
