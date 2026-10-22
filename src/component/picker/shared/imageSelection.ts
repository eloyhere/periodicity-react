/**
 * Final image emitted after the editor closes.
 * Type: interface.
 * @param file - Cropped file, or the original file when the edit was cancelled.
 * @param dataUrl - Base64 preview of `file`.
 * @param cropped - Whether the crop transform was applied.
 * @example
 * const selection: ImageSelection = { file, dataUrl, cropped: true };
 */
export interface ImageSelection {
    file: File;
    dataUrl: string;
    cropped: boolean;
}

/**
 * Image file and its Base64 preview, held while the editor is open.
 * Type: interface.
 * @param file - Original file chosen through the native dialog.
 * @param dataUrl - Base64 preview of `file`.
 * @example
 * const draft: ImageDraft = { file, dataUrl };
 */
export interface ImageDraft {
    file: File;
    dataUrl: string;
}
