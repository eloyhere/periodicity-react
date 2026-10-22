import {
    useRef,
    useState,
    type ChangeEventHandler,
    type Dispatch,
    type FC,
    type ReactNode,
    type RefObject,
    type SetStateAction,
} from "react";
import Button from "../../button/Button";
import Dialog from "../../dialog/Dialog";
import { useRipple, type RippleHandlers } from "../../foundation/useRipple";
import Icon from "../../icon/Icon";
import { useInternational, type InternationalContextValue } from "../../../international";
import ImageCropper, { type ImageCropperShape } from "./ImageCropper";
import {
    InitialCropTransform,
    MaxCropZoom,
    MinCropZoom,
    clampValue,
    normalizeRotation,
    renderCrop,
    type CropTransform,
    type CroppedImage,
} from "./imageCrop";
import {
    DefaultImagePickerLabels,
    type ImagePickerLabels,
} from "./imagePickerLabels";
import "./ImageEditorDialog.css";

/**
 * State handed to a custom crop slot. The slot takes over the crop stage and
 * its controls; the Done action still renders the current transform.
 * Type: interface.
 * @param src - Base64 source being edited.
 * @param aspect - Crop aspect ratio.
 * @param shape - Rectangular or circular crop window.
 * @param transform - Current zoom, rotation, and pan.
 * @param onTransformChange - Reports a new transform from the custom crop UI.
 * @param labels - Resolved copy used by the editor.
 * @param disabled - Whether interactions should be blocked while encoding.
 * @example
 * const crop = (context: ImageCropSlotContext): ReactNode => <MyCropper {...context} />;
 */
export interface ImageCropSlotContext {
    src: string;
    aspect: number;
    shape: ImageCropperShape;
    transform: CropTransform;
    onTransformChange: (next: CropTransform) => void;
    labels: ImagePickerLabels;
    disabled: boolean;
}

/**
 * Props for the modal image editor shared by the photo and avatar pickers.
 * Type: interface.
 * Fields: open, src, fileName, mimeType, aspect, shape, outputWidth, title, alt, labels,
 * renderCrop, onDone, onUseOriginal, onAbort.
 * @example
 * <ImageEditorDialog open={open} src={dataUrl} fileName="photo.jpg" mimeType="image/jpeg" aspect={1} shape="rect" outputWidth={1600} title="Edit photo" onDone={handleDone} onUseOriginal={useOriginal} onAbort={abort} />
 */
export interface ImageEditorDialogProps {
    open: boolean;
    src: string;
    fileName: string;
    mimeType: string;
    aspect: number;
    shape: ImageCropperShape;
    outputWidth: number;
    title: string;
    alt?: string;
    labels?: Partial<ImagePickerLabels>;
    renderCrop?: (context: ImageCropSlotContext) => ReactNode;
    onDone: (result: CroppedImage) => void;
    onUseOriginal: () => void;
    onAbort: () => void;
}

/**
 * Renders the crop editor with a live preview, zoom, rotation, and reset controls.
 * `Done` renders the crop, `Cancel` keeps the original image, and every other close
 * path (header button, Escape, backdrop) abandons the selection through `onAbort`.
 * A `renderCrop` slot replaces the built-in crop stage and toolbar while keeping the
 * footer semantics.
 * @param props - Source image, crop shape, copy overrides, crop slot, and close handlers.
 * @example
 * <ImageEditorDialog open={open} src={dataUrl} fileName="photo.jpg" mimeType="image/jpeg" aspect={4 / 3} shape="rect" outputWidth={1600} title="Edit photo" onDone={handleDone} onUseOriginal={handleCancel} onAbort={close} />
 * @returns A modal crop editor.
 */
const ImageEditorDialog: FC<ImageEditorDialogProps> = ({
    open,
    src,
    fileName,
    mimeType,
    aspect,
    shape,
    outputWidth,
    title,
    alt,
    labels,
    renderCrop: renderCropSlot,
    onDone,
    onUseOriginal,
    onAbort,
}: ImageEditorDialogProps) => {
    const { t }: InternationalContextValue = useInternational();
    const [transform, setTransform]: [CropTransform, Dispatch<SetStateAction<CropTransform>>] =
        useState<CropTransform>(InitialCropTransform);
    const [busy, setBusy]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const workingRef: RefObject<boolean> = useRef<boolean>(false);
    const ripple: RippleHandlers = useRipple({
        trigger: "both",
        disabled: busy,
    });
    const resolved: ImagePickerLabels = {
        ...DefaultImagePickerLabels,
        ...labels,
        cancel: labels?.cancel ?? t("cancel"),
        close: labels?.close ?? t("close"),
        reset: labels?.reset ?? t("reset"),
    };

    /**
     * Renders the current crop, falling back to the original image when encoding fails.
     * @example
     * void finishCrop();
     * @returns Nothing.
     */
    const finishCrop: () => Promise<void> = async (): Promise<void> => {
        if (busy || workingRef.current) {
            return;
        }

        workingRef.current = true;
        setBusy(true);

        let result: CroppedImage | null;

        try {
            result = await renderCrop({
                source: src,
                fileName,
                mimeType,
                transform,
                aspect,
                outputWidth,
            });
        } catch {
            // A browser without canvas support keeps the original image instead of
            // losing the user's selection.
            result = null;
        }

        workingRef.current = false;
        setBusy(false);

        if (result === null) {
            onUseOriginal();
            return;
        }

        onDone(result);
    };

    /**
     * Starts the crop render from the footer action.
     * @example
     * <Button onClick={handleDoneClick}>Done</Button>
     * @returns Nothing.
     */
    const handleDoneClick: () => void = (): void => {
        void finishCrop();
    };

    /**
     * Applies the zoom slider value to the crop transform.
     * @param event - Change event from the zoom slider.
     * @example
     * <input type="range" onChange={handleZoomChange} />
     * @returns Nothing.
     */
    const handleZoomChange: ChangeEventHandler<HTMLInputElement> = (
        event: Parameters<ChangeEventHandler<HTMLInputElement>>[0],
    ): void => {
        const next: number = Number.parseFloat(event.target.value);

        if (Number.isFinite(next)) {
            setTransform(
                (current: CropTransform): CropTransform => ({
                    ...current,
                    zoom: clampValue(next, MinCropZoom, MaxCropZoom),
                }),
            );
        }
    };

    /**
     * Rotates the image by a quarter turn.
     * @param delta - Degrees to add; positive values rotate clockwise.
     * @example
     * rotateBy(-90);
     * @returns Nothing.
     */
    const rotateBy: (delta: number) => void = (delta: number): void => {
        setTransform(
            (current: CropTransform): CropTransform => ({
                ...current,
                rotation: normalizeRotation(current.rotation + delta),
            }),
        );
    };

    /**
     * Returns the image to its initial zoom, rotation, and position.
     * @example
     * resetCrop();
     * @returns Nothing.
     */
    const resetCrop: () => void = (): void => {
        setTransform(InitialCropTransform);
    };

    const controlsDisabled: boolean = busy;

    const footer: ReactNode = (
        <>
            <Button variant="ghost" onClick={onUseOriginal} disabled={busy}>
                {resolved.cancel}
            </Button>
            <Button
                prefix="Check"
                onClick={handleDoneClick}
                disabled={controlsDisabled}
                aria-busy={busy ? "true" : (void 0)}
            >
                {resolved.done}
            </Button>
        </>
    );

    const cropContext: ImageCropSlotContext = {
        src,
        aspect,
        shape,
        transform,
        onTransformChange: setTransform,
        labels: resolved,
        disabled: busy,
    };

    const cropContent: ReactNode =
        renderCropSlot === (void 0) ? (
            <>
                <ImageCropper
                    key={src}
                    src={src}
                    aspect={aspect}
                    shape={shape}
                    transform={transform}
                    onTransformChange={setTransform}
                    alt={alt ?? title}
                    labels={resolved}
                    disabled={busy}
                />
                <div className="image-editor__toolbar">
                    <div className="image-editor__zoom">
                        <Icon name="Zoom" size={16} />
                        <input
                            className="image-editor__range"
                            type="range"
                            min={MinCropZoom}
                            max={MaxCropZoom}
                            step={0.01}
                            value={transform.zoom}
                            aria-label={resolved.zoom}
                            onChange={handleZoomChange}
                            disabled={controlsDisabled}
                        />
                    </div>
                    <div className="image-editor__actions">
                        <button
                            type="button"
                            className="image-editor__action"
                            aria-label={resolved.rotateLeft}
                            title={resolved.rotateLeft}
                            disabled={controlsDisabled}
                            onPointerDown={ripple.onPointerDown}
                            onPointerEnter={ripple.onPointerEnter}
                            onKeyDown={ripple.onKeyDown}
                            onClick={(): void => rotateBy(-90)}
                        >
                            <Icon name="RotateLeft" size={18} />
                        </button>
                        <button
                            type="button"
                            className="image-editor__action"
                            aria-label={resolved.rotateRight}
                            title={resolved.rotateRight}
                            disabled={controlsDisabled}
                            onPointerDown={ripple.onPointerDown}
                            onPointerEnter={ripple.onPointerEnter}
                            onKeyDown={ripple.onKeyDown}
                            onClick={(): void => rotateBy(90)}
                        >
                            <Icon name="RotateRight" size={18} />
                        </button>
                        <button
                            type="button"
                            className="image-editor__action"
                            aria-label={resolved.reset}
                            title={resolved.reset}
                            disabled={controlsDisabled}
                            onPointerDown={ripple.onPointerDown}
                            onPointerEnter={ripple.onPointerEnter}
                            onKeyDown={ripple.onKeyDown}
                            onClick={resetCrop}
                        >
                            <Icon name="Refresh" size={18} />
                        </button>
                    </div>
                </div>
            </>
        ) : (
            renderCropSlot(cropContext)
        );

    return (
        <Dialog
            open={open}
            title={title}
            size="md"
            closeLabel={resolved.close}
            onClose={onAbort}
            footer={footer}
            className="image-editor-dialog"
        >
            <div className="image-editor">{cropContent}</div>
        </Dialog>
    );
};

export default ImageEditorDialog;
