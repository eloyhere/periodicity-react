import {
    useId,
    useRef,
    useState,
    type CSSProperties,
    type Dispatch,
    type FC,
    type KeyboardEventHandler,
    type PointerEventHandler,
    type ReactEventHandler,
    type RefObject,
    type SetStateAction,
    type SyntheticEvent,
} from "react";
import cx from "../../foundation/cx";
import {
    clampValue,
    getCropMetrics,
    normalizeRotation,
    type CropMetrics,
    type CropTransform,
    type ImageSize,
} from "./imageCrop";
import type { ImagePickerLabels } from "./imagePickerLabels";
import "./ImageCropper.css";

/**
 * Shape of the crop window.
 * Type: type alias.
 * Values: `rect` for photos, `circle` for avatars.
 * @example
 * const shape: ImageCropperShape = "circle";
 */
export type ImageCropperShape = "rect" | "circle";

/**
 * Pointer drag captured when the user starts panning the image.
 * Type: interface.
 * @param pointerId - Pointer that started the drag.
 * @param startX - Client X at the start of the drag.
 * @param startY - Client Y at the start of the drag.
 * @param panX - Normalised horizontal pan when the drag started.
 * @param panY - Normalised vertical pan when the drag started.
 * @param maxOffsetX - Maximum horizontal offset in CSS pixels.
 * @param maxOffsetY - Maximum vertical offset in CSS pixels.
 * @example
 * const drag: CropDragState = { pointerId: 1, startX: 0, startY: 0, panX: 0, panY: 0, maxOffsetX: 0, maxOffsetY: 0 };
 */
interface CropDragState {
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    maxOffsetX: number;
    maxOffsetY: number;
}

/**
 * Props for the controlled crop stage.
 * Type: interface.
 * Fields: src, aspect, shape, transform, onTransformChange, alt, labels, disabled, className.
 * @example
 * <ImageCropper src={dataUrl} aspect={1} transform={transform} onTransformChange={setTransform} alt="Portrait" labels={labels} />
 */
export interface ImageCropperProps {
    src: string;
    aspect: number;
    shape?: ImageCropperShape;
    transform: CropTransform;
    onTransformChange: (next: CropTransform) => void;
    alt: string;
    labels: ImagePickerLabels;
    disabled?: boolean;
    className?: string;
}

const ArrowStep: number = 0.02;
const ArrowStepLarge: number = 0.1;
const EmptyImageStyle: CSSProperties = {};

/**
 * Renders a fixed crop window over a panning, zooming, and rotating image.
 * The crop window covers the whole stage, so the visible region is always the result;
 * dragging or using the arrow keys repositions the image behind it.
 * @param props - Image source, aspect, transform, labels, and change handlers.
 * @example
 * <ImageCropper src={dataUrl} aspect={1} transform={transform} onTransformChange={setTransform} alt="Avatar" labels={labels} />
 * @returns The crop stage and its instructions.
 */
const ImageCropper: FC<ImageCropperProps> = ({
    src,
    aspect,
    shape = "rect",
    transform,
    onTransformChange,
    alt,
    labels,
    disabled = false,
    className = "",
}: ImageCropperProps) => {
    const hintId: string = useId();
    const viewportRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const dragRef: RefObject<CropDragState | null> = useRef<CropDragState | null>(null);
    const [imageSize, setImageSize]: [
        ImageSize | null,
        Dispatch<SetStateAction<ImageSize | null>>,
    ] = useState<ImageSize | null>(null);
    const safeAspect: number = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
    const metrics: CropMetrics | null =
        imageSize === null
            ? null
            : getCropMetrics(imageSize.width, imageSize.height, safeAspect, transform);
    const offsetX: number =
        metrics === null ? 0 : clampValue(transform.panX, -1, 1) * metrics.maxPanX;
    const offsetY: number =
        metrics === null ? 0 : clampValue(transform.panY, -1, 1) * metrics.maxPanY;
    const rotation: number = normalizeRotation(transform.rotation);

    /**
     * Captures the natural size once the preview decodes.
     * @param event - Load event from the preview image.
     * @example
     * <img onLoad={handleImageLoad} />
     * @returns Nothing.
     */
    const handleImageLoad: ReactEventHandler<HTMLImageElement> = (
        event: SyntheticEvent<HTMLImageElement>,
    ): void => {
        const image: HTMLImageElement = event.currentTarget;
        const next: ImageSize = { width: image.naturalWidth, height: image.naturalHeight };

        setImageSize(next);
    };

    /**
     * Starts a pan drag and remembers the current normalised position.
     * @param event - Pointer down on the crop stage.
     * @example
     * <div onPointerDown={handlePointerDown} />
     * @returns Nothing.
     */
    const handlePointerDown: PointerEventHandler<HTMLDivElement> = (
        event: Parameters<PointerEventHandler<HTMLDivElement>>[0],
    ): void => {
        const viewport: HTMLDivElement | null = viewportRef.current;

        if (disabled || metrics === null || viewport === null) {
            return;
        }

        const rect: DOMRect = viewport.getBoundingClientRect();

        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            panX: transform.panX,
            panY: transform.panY,
            maxOffsetX: metrics.maxPanX * rect.height,
            maxOffsetY: metrics.maxPanY * rect.height,
        };
    };

    /**
     * Moves the image with the pointer while keeping it inside the crop window.
     * @param event - Pointer move on the crop stage.
     * @example
     * <div onPointerMove={handlePointerMove} />
     * @returns Nothing.
     */
    const handlePointerMove: PointerEventHandler<HTMLDivElement> = (
        event: Parameters<PointerEventHandler<HTMLDivElement>>[0],
    ): void => {
        const drag: CropDragState | null = dragRef.current;

        if (drag === null || drag.pointerId !== event.pointerId) {
            return;
        }

        const nextPanX: number =
            drag.maxOffsetX > 0
                ? clampValue(
                      drag.panX + (event.clientX - drag.startX) / drag.maxOffsetX,
                      -1,
                      1,
                  )
                : 0;
        const nextPanY: number =
            drag.maxOffsetY > 0
                ? clampValue(
                      drag.panY + (event.clientY - drag.startY) / drag.maxOffsetY,
                      -1,
                      1,
                  )
                : 0;

        if (nextPanX !== transform.panX || nextPanY !== transform.panY) {
            onTransformChange({ ...transform, panX: nextPanX, panY: nextPanY });
        }
    };

    /**
     * Ends a pan drag and releases the pointer capture.
     * @param event - Pointer up or cancel on the crop stage.
     * @example
     * <div onPointerUp={handlePointerUp} />
     * @returns Nothing.
     */
    const handlePointerUp: PointerEventHandler<HTMLDivElement> = (
        event: Parameters<PointerEventHandler<HTMLDivElement>>[0],
    ): void => {
        const drag: CropDragState | null = dragRef.current;

        if (drag === null || drag.pointerId !== event.pointerId) {
            return;
        }

        dragRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    /**
     * Pans the image with the arrow keys as a pointer-free alternative.
     * @param event - Key down on the crop stage.
     * @example
     * <div onKeyDown={handleKeyDown} tabIndex={0} />
     * @returns Nothing.
     */
    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (
        event: Parameters<KeyboardEventHandler<HTMLDivElement>>[0],
    ): void => {
        if (disabled || metrics === null) {
            return;
        }

        const step: number = event.shiftKey ? ArrowStepLarge : ArrowStep;
        let deltaX: number = 0;
        let deltaY: number = 0;

        if (event.key === "ArrowLeft") {
            deltaX = -step;
        } else if (event.key === "ArrowRight") {
            deltaX = step;
        } else if (event.key === "ArrowUp") {
            deltaY = -step;
        } else if (event.key === "ArrowDown") {
            deltaY = step;
        } else {
            return;
        }

        event.preventDefault();
        onTransformChange({
            ...transform,
            panX: clampValue(transform.panX + deltaX, -1, 1),
            panY: clampValue(transform.panY + deltaY, -1, 1),
        });
    };

    /**
     * Stops the browser from starting a native image drag.
     * @param event - Drag start event from the preview image.
     * @example
     * <img onDragStart={handleImageDragStart} />
     * @returns Nothing.
     */
    const handleImageDragStart: ReactEventHandler<HTMLImageElement> = (
        event: SyntheticEvent<HTMLImageElement>,
    ): void => {
        event.preventDefault();
    };

    const imageStyle: CSSProperties | null =
        imageSize === null || metrics === null
            ? null
            : {
                  left: `calc(50% + ${(offsetX / safeAspect) * 100}%)`,
                  top: `calc(50% + ${offsetY * 100}%)`,
                  width: `${((imageSize.width * metrics.scale) / safeAspect) * 100}%`,
                  height: `${imageSize.height * metrics.scale * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              };

    return (
        <div className={cx("image-cropper", `image-cropper--${shape}`, className)}>
            <div
                ref={viewportRef}
                className="image-cropper__viewport"
                style={{ aspectRatio: safeAspect }}
                role="group"
                aria-label={labels.cropArea}
                aria-describedby={hintId}
                aria-busy={imageSize === null ? "true" : (void 0)}
                tabIndex={disabled ? -1 : 0}
                data-disabled={disabled ? "true" : "false"}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onKeyDown={handleKeyDown}
            >
                <img
                    className={cx(
                        "image-cropper__image",
                        imageStyle === null && "image-cropper__image--loading",
                    )}
                    src={src}
                    alt={alt}
                    style={imageStyle === null ? EmptyImageStyle : imageStyle}
                    draggable={false}
                    onLoad={handleImageLoad}
                    onDragStart={handleImageDragStart}
                />
                <span className="image-cropper__frame" aria-hidden="true" />
            </div>
            <p className="image-cropper__hint" id={hintId}>
                {labels.hint}
            </p>
        </div>
    );
};

export default ImageCropper;
