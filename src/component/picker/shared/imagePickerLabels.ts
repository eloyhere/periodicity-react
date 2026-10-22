/**
 * User-facing copy used by the shared image editor.
 * Every field may be overridden, so consumers can localise the picker without a provider.
 * Type: interface.
 * @param choose - Empty-state action on the trigger.
 * @param edit - Dialog title while editing a chosen image.
 * @param done - Footer action that applies the crop.
 * @param cancel - Footer action that keeps the original image.
 * @param close - Header close action that abandons the selection.
 * @param zoom - Accessible name of the zoom slider.
 * @param rotateLeft - Accessible name of the counter-clockwise rotation action.
 * @param rotateRight - Accessible name of the clockwise rotation action.
 * @param reset - Accessible name of the reset action.
 * @param cropArea - Accessible name of the draggable crop stage.
 * @param hint - Instructions shown under the crop stage.
 * @example
 * const labels: ImagePickerLabels = { ...DefaultImagePickerLabels, done: "完成" };
 */
export interface ImagePickerLabels {
    choose: string;
    edit: string;
    done: string;
    cancel: string;
    close: string;
    zoom: string;
    rotateLeft: string;
    rotateRight: string;
    reset: string;
    cropArea: string;
    hint: string;
}

/**
 * British English defaults for the shared image editor.
 * `cancel`, `close`, and `reset` are replaced by the active International dictionary.
 * Type: constant.
 * Fields: choose, edit, done, cancel, close, zoom, rotateLeft, rotateRight, reset,
 * cropArea, hint.
 * @example
 * const done: string = DefaultImagePickerLabels.done;
 */
export const DefaultImagePickerLabels: ImagePickerLabels = {
    choose: "Choose photo",
    edit: "Edit photo",
    done: "Done",
    cancel: "Cancel",
    close: "Close",
    zoom: "Zoom",
    rotateLeft: "Rotate left",
    rotateRight: "Rotate right",
    reset: "Reset",
    cropArea: "Crop area",
    hint: "Drag the image to reposition it, then adjust the zoom.",
};
