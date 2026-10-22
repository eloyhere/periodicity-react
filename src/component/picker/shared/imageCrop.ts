/**
 * Smallest zoom factor accepted by the crop editor.
 * @example
 * const zoom: number = MinCropZoom;
 */
export const MinCropZoom: number = 1;

/**
 * Largest zoom factor accepted by the crop editor.
 * @example
 * const zoom: number = MaxCropZoom;
 */
export const MaxCropZoom: number = 4;

/**
 * Position and scale of the image inside the crop viewport.
 * Pan values are normalised to `-1…1`, where `1` pins the image to the edge of the viewport.
 * Type: interface.
 * @param zoom - Scale multiplier above the cover fit; `1` shows the smallest allowed view.
 * @param rotation - Clockwise rotation in degrees, constrained to multiples of 90.
 * @param panX - Horizontal pan in the `-1…1` range.
 * @param panY - Vertical pan in the `-1…1` range.
 * @example
 * const transform: CropTransform = { zoom: 1.4, rotation: 90, panX: 0.2, panY: -0.1 };
 */
export interface CropTransform {
    zoom: number;
    rotation: number;
    panX: number;
    panY: number;
}

/**
 * Intrinsic size of an image in pixels.
 * Type: interface.
 * @param width - Natural width.
 * @param height - Natural height.
 * @example
 * const size: ImageSize = { width: 1600, height: 1200 };
 */
export interface ImageSize {
    width: number;
    height: number;
}

/**
 * Derived geometry for one crop viewport.
 * Lengths marked as viewport units are measured with the viewport height fixed at `1`
 * and its width at the crop aspect ratio, so they stay resolution independent.
 * Type: interface.
 * @param effectiveWidth - Image width after rotation.
 * @param effectiveHeight - Image height after rotation.
 * @param scale - Viewport units per image pixel.
 * @param screenWidth - On-screen width of the rotated image in viewport units.
 * @param screenHeight - On-screen height of the rotated image in viewport units.
 * @param maxPanX - Maximum horizontal pan in viewport units.
 * @param maxPanY - Maximum vertical pan in viewport units.
 * @example
 * const metrics: CropMetrics = getCropMetrics(1600, 1200, 1, transform);
 */
export interface CropMetrics {
    effectiveWidth: number;
    effectiveHeight: number;
    scale: number;
    screenWidth: number;
    screenHeight: number;
    maxPanX: number;
    maxPanY: number;
}

/**
 * Source rectangle to copy out of the rotated image.
 * All values are expressed in rotated image pixels.
 * Type: interface.
 * @param x - Left edge of the crop.
 * @param y - Top edge of the crop.
 * @param width - Crop width.
 * @param height - Crop height.
 * @param effectiveWidth - Full rotated image width.
 * @param effectiveHeight - Full rotated image height.
 * @example
 * const rect: CropRect = getCropRect(1600, 1200, 1, transform);
 */
export interface CropRect {
    x: number;
    y: number;
    width: number;
    height: number;
    effectiveWidth: number;
    effectiveHeight: number;
}

/**
 * Result of rendering a crop to a standalone image.
 * Type: interface.
 * @param file - Encoded file ready to upload.
 * @param dataUrl - Base64 preview of the same pixels.
 * @example
 * const cropped: CroppedImage = { file, dataUrl };
 */
export interface CroppedImage {
    file: File;
    dataUrl: string;
}

/**
 * Everything needed to render one crop.
 * Type: interface.
 * @param source - Base64 or object URL of the original image.
 * @param fileName - Original file name, used to name the cropped file.
 * @param mimeType - Original MIME type; unsupported types fall back to PNG.
 * @param transform - Zoom, rotation, and pan of the image.
 * @param aspect - Crop viewport aspect ratio (width divided by height).
 * @param outputWidth - Pixel width of the rendered crop.
 * @example
 * const result = await renderCrop({ source, fileName, mimeType, transform, aspect: 1, outputWidth: 512 });
 */
export interface CropRenderOptions {
    source: string;
    fileName: string;
    mimeType: string;
    transform: CropTransform;
    aspect: number;
    outputWidth: number;
}

/**
 * Default transform shown whenever the editor opens.
 * Type: constant.
 * Fields: zoom, rotation, panX, panY.
 * @example
 * const transform: CropTransform = InitialCropTransform;
 */
export const InitialCropTransform: CropTransform = {
    zoom: MinCropZoom,
    rotation: 0,
    panX: 0,
    panY: 0,
};

const SupportedMimeTypes: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
const MimeExtensions: ReadonlyMap<string, string> = new Map<string, string>([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
]);

/**
 * Clamps a number to an inclusive range.
 * @param value - Value to clamp.
 * @param minimum - Lower bound.
 * @param maximum - Upper bound.
 * @example
 * const zoom = clampValue(6, 1, 4);
 * @returns The clamped value.
 */
export const clampValue: (value: number, minimum: number, maximum: number) => number = (
    value: number,
    minimum: number,
    maximum: number,
): number => Math.min(Math.max(value, minimum), maximum);

/**
 * Normalises a rotation to the nearest quarter turn.
 * @param rotation - Rotation in degrees, possibly negative or above a full turn.
 * @example
 * const rotation = normalizeRotation(-90);
 * @returns A rotation of `0`, `90`, `180`, or `270`.
 */
export const normalizeRotation: (rotation: number) => number = (rotation: number): number => {
    const quarterTurns: number = Number.isFinite(rotation) ? Math.round(rotation / 90) : 0;
    const wrapped: number = ((quarterTurns % 4) + 4) % 4;

    return wrapped * 90;
};

/**
 * Resolves a positive crop aspect ratio.
 * @param aspect - Requested width divided by height.
 * @example
 * const safe = resolveAspect(0);
 * @returns The requested aspect, or `1` when it is not a positive finite number.
 */
const resolveAspect: (aspect: number) => number = (aspect: number): number =>
    Number.isFinite(aspect) && aspect > 0 ? aspect : 1;

/**
 * Resolves a supported output MIME type.
 * @param mimeType - MIME type of the original file.
 * @example
 * const type = resolveMimeType("image/gif");
 * @returns A supported type; PNG when the original type cannot be re-encoded.
 */
const resolveMimeType: (mimeType: string) => string = (mimeType: string): string => {
    if (SupportedMimeTypes.includes(mimeType)) {
        return mimeType;
    }

    return mimeType === "image/jpg" ? "image/jpeg" : "image/png";
};

/**
 * Derives the visible geometry for one image and transform.
 * @param imageWidth - Natural image width.
 * @param imageHeight - Natural image height.
 * @param aspect - Crop viewport aspect ratio.
 * @param transform - Zoom, rotation, and pan of the image.
 * @example
 * const metrics = getCropMetrics(1600, 1200, 1, InitialCropTransform);
 * @returns Rotated dimensions, scale, and maximum pan.
 */
export const getCropMetrics: (
    imageWidth: number,
    imageHeight: number,
    aspect: number,
    transform: CropTransform,
) => CropMetrics = (
    imageWidth: number,
    imageHeight: number,
    aspect: number,
    transform: CropTransform,
): CropMetrics => {
    const safeAspect: number = resolveAspect(aspect);

    if (imageWidth <= 0 || imageHeight <= 0) {
        return {
            effectiveWidth: 0,
            effectiveHeight: 0,
            scale: 1,
            screenWidth: 0,
            screenHeight: 0,
            maxPanX: 0,
            maxPanY: 0,
        };
    }

    const rotation: number = normalizeRotation(transform.rotation);
    const swapped: boolean = rotation === 90 || rotation === 270;
    const effectiveWidth: number = swapped ? imageHeight : imageWidth;
    const effectiveHeight: number = swapped ? imageWidth : imageHeight;
    const zoom: number = clampValue(transform.zoom, MinCropZoom, MaxCropZoom);
    const scale: number = Math.max(safeAspect / effectiveWidth, 1 / effectiveHeight) * zoom;
    const screenWidth: number = effectiveWidth * scale;
    const screenHeight: number = effectiveHeight * scale;

    return {
        effectiveWidth,
        effectiveHeight,
        scale,
        screenWidth,
        screenHeight,
        maxPanX: Math.max((screenWidth - safeAspect) / 2, 0),
        maxPanY: Math.max((screenHeight - 1) / 2, 0),
    };
};

/**
 * Maps the viewport back onto the rotated image.
 * @param imageWidth - Natural image width.
 * @param imageHeight - Natural image height.
 * @param aspect - Crop viewport aspect ratio.
 * @param transform - Zoom, rotation, and pan of the image.
 * @example
 * const rect = getCropRect(1600, 1200, 1, InitialCropTransform);
 * @returns The source rectangle in rotated image coordinates.
 */
export const getCropRect: (
    imageWidth: number,
    imageHeight: number,
    aspect: number,
    transform: CropTransform,
) => CropRect = (
    imageWidth: number,
    imageHeight: number,
    aspect: number,
    transform: CropTransform,
): CropRect => {
    const safeAspect: number = resolveAspect(aspect);
    const metrics: CropMetrics = getCropMetrics(imageWidth, imageHeight, safeAspect, transform);
    const offsetX: number = clampValue(transform.panX, -1, 1) * metrics.maxPanX;
    const offsetY: number = clampValue(transform.panY, -1, 1) * metrics.maxPanY;
    const width: number = safeAspect / metrics.scale;
    const height: number = 1 / metrics.scale;
    const centerX: number = metrics.effectiveWidth / 2 - offsetX / metrics.scale;
    const centerY: number = metrics.effectiveHeight / 2 - offsetY / metrics.scale;

    return {
        x: clampValue(
            centerX - width / 2,
            0,
            Math.max(metrics.effectiveWidth - width, 0),
        ),
        y: clampValue(
            centerY - height / 2,
            0,
            Math.max(metrics.effectiveHeight - height, 0),
        ),
        width,
        height,
        effectiveWidth: metrics.effectiveWidth,
        effectiveHeight: metrics.effectiveHeight,
    };
};

/**
 * Reads a file as a Base64 data URL for previews and canvas rendering.
 * @param file - File chosen by the user.
 * @example
 * const dataUrl = await readFileAsDataUrl(file);
 * @returns The data URL, or a rejected promise when the file cannot be read.
 */
export const readFileAsDataUrl: (file: File) => Promise<string> = (file: File): Promise<string> =>
    new Promise<string>((resolve: (dataUrl: string) => void, reject: (error: Error) => void): void => {
        if (typeof FileReader === "undefined") {
            reject(new Error("This browser cannot read the selected file."));
            return;
        }

        const reader: FileReader = new FileReader();

        reader.onload = (): void => {
            resolve(typeof reader.result === "string" ? reader.result : "");
        };
        reader.onerror = (): void => {
            reject(reader.error ?? new Error("The selected file could not be read."));
        };
        reader.readAsDataURL(file);
    });

/**
 * Loads an image element from a Base64 or object URL.
 * @param source - Image source already available to the page.
 * @example
 * const image = await loadImage(dataUrl);
 * @returns The decoded image element.
 */
const loadImage: (source: string) => Promise<HTMLImageElement> = (
    source: string,
): Promise<HTMLImageElement> =>
    new Promise<HTMLImageElement>(
        (resolve: (image: HTMLImageElement) => void, reject: (error: Error) => void): void => {
            const image: HTMLImageElement = new Image();

            image.onload = (): void => {
                resolve(image);
            };
            image.onerror = (): void => {
                reject(new Error("The selected image could not be decoded."));
            };
            image.src = source;
        },
    );

/**
 * Encodes a canvas into a blob.
 * @param canvas - Canvas holding the cropped pixels.
 * @param mimeType - Output MIME type.
 * @example
 * const blob = await canvasToBlob(canvas, "image/png");
 * @returns The encoded blob.
 */
const canvasToBlob: (canvas: HTMLCanvasElement, mimeType: string) => Promise<Blob> = (
    canvas: HTMLCanvasElement,
    mimeType: string,
): Promise<Blob> =>
    new Promise<Blob>((resolve: (blob: Blob) => void, reject: (error: Error) => void): void => {
        canvas.toBlob(
            (blob: Blob | null): void => {
                if (blob === null) {
                    reject(new Error("The cropped image could not be encoded."));
                    return;
                }

                resolve(blob);
            },
            mimeType,
            0.92,
        );
    });

/**
 * Builds the cropped file name with an extension matching the output type.
 * @param fileName - Original file name.
 * @param mimeType - Output MIME type.
 * @example
 * const name = buildFileName("portrait.gif", "image/png");
 * @returns The file name with the matching extension.
 */
const buildFileName: (fileName: string, mimeType: string) => string = (
    fileName: string,
    mimeType: string,
): string => {
    const dot: number = fileName.lastIndexOf(".");
    const base: string = dot > 0 ? fileName.slice(0, dot) : fileName;
    const safeBase: string = base.length > 0 ? base : "image";
    const extension: string = MimeExtensions.get(mimeType) ?? "png";

    return `${safeBase}.${extension}`;
};

/**
 * Renders the visible crop to a Base64 data URL and an encoded file.
 * The original image is never mutated; the function decodes it again so callers can
 * retry with a different transform without keeping a canvas alive.
 * @param options - Source image, transform, aspect, and output width.
 * @example
 * const cropped = await renderCrop({ source, fileName: "photo.jpg", mimeType: "image/jpeg", transform, aspect: 1, outputWidth: 512 });
 * @returns The cropped file and its Base64 preview.
 */
export const renderCrop: (options: CropRenderOptions) => Promise<CroppedImage> = (
    options: CropRenderOptions,
): Promise<CroppedImage> => {
    const imagePromise: Promise<HTMLImageElement> = loadImage(options.source);

    return imagePromise.then((image: HTMLImageElement): Promise<CroppedImage> => {
        const safeAspect: number = resolveAspect(options.aspect);
        const mimeType: string = resolveMimeType(options.mimeType);
        const requestedWidth: number = Number.isFinite(options.outputWidth)
            ? options.outputWidth
            : 1600;
        const outputWidth: number = Math.max(1, Math.round(requestedWidth));
        const outputHeight: number = Math.max(1, Math.round(outputWidth / safeAspect));
        const crop: CropRect = getCropRect(
            image.naturalWidth,
            image.naturalHeight,
            safeAspect,
            options.transform,
        );

        if (
            image.naturalWidth <= 0 ||
            image.naturalHeight <= 0 ||
            crop.width <= 0 ||
            crop.height <= 0
        ) {
            return Promise.reject(new Error("The selected image has no croppable area."));
        }

        const canvas: HTMLCanvasElement = document.createElement("canvas");
        canvas.width = outputWidth;
        canvas.height = outputHeight;

        const context: CanvasRenderingContext2D | null = canvas.getContext("2d");

        if (context === null) {
            return Promise.reject(new Error("This browser cannot render the crop."));
        }

        if (mimeType === "image/jpeg") {
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, outputWidth, outputHeight);
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.save();
        context.translate(outputWidth / 2, outputHeight / 2);
        context.scale(outputWidth / crop.width, outputHeight / crop.height);
        context.translate(
            crop.effectiveWidth / 2 - crop.x - crop.width / 2,
            crop.effectiveHeight / 2 - crop.y - crop.height / 2,
        );
        context.rotate((normalizeRotation(options.transform.rotation) * Math.PI) / 180);
        context.drawImage(
            image,
            -image.naturalWidth / 2,
            -image.naturalHeight / 2,
        );
        context.restore();

        const quality: number | undefined = mimeType === "image/png" ? (void 0) : 0.92;
        const dataUrl: string = canvas.toDataURL(mimeType, quality);

        return canvasToBlob(canvas, mimeType).then(
            (blob: Blob): CroppedImage => ({
                file: new File([blob], buildFileName(options.fileName, mimeType), {
                    type: mimeType,
                    lastModified: Date.now(),
                }),
                dataUrl,
            }),
        );
    });
};
