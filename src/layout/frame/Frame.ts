import {
    createElement,
    type FC,
    type HTMLAttributes,
    type ReactNode,
    type Ref,
} from "react";
import cx from "../../component/foundation/cx";
import "./Frame.css";

/**
 * Props for the Android-style frame container.
 * Type: interface.
 * Fields: children, height, clip, ariaLabel, ref, and native `div` attributes.
 * Native `id`, `className`, `style`, `title`, `tabIndex`, `role`, `aria-*`, `data-*`, pointer,
 * mouse, keyboard, and focus handlers are forwarded to the frame container.
 * @example
 * <Frame height={240} ariaLabel="Preview">
 *     <FramePage active>Cover</FramePage>
 * </Frame>
 */
export interface FrameProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children: ReactNode;
    /**
     * Height of the frame. Defaults to `240`. Frame pages are absolutely
     * positioned, so the frame needs a bounded height; pass `"auto"` only when
     * another child establishes the size.
     * @example
     * height={320}
     */
    height?: number | string;
    /**
     * Clips pages that extend outside the frame, matching Android's default
     * `clipChildren`. Defaults to `true`.
     * @example
     * clip={false}
     */
    clip?: boolean;
    /**
     * Accessible name for the frame. Defaults to `aria-label`.
     * @example
     * ariaLabel="Photo composition"
     */
    ariaLabel?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Props for one full-frame page inside a `Frame`.
 * Type: interface.
 * Fields: children, active, zIndex, ref, and native `div` attributes.
 * A page fills the frame and stays mounted when inactive, so its local state
 * survives page switches. Inactive pages are removed with the native `hidden`
 * attribute, which also removes them from focus and the accessibility tree.
 * @example
 * <FramePage active={page === "overview"}>Overview</FramePage>
 */
export interface FramePageProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    children: ReactNode;
    /**
     * Whether this page is visible. Defaults to `true`. Inactive pages remain
     * mounted and keep their state.
     * @example
     * active={route === "details"}
     */
    active?: boolean;
    /**
     * Optional stacking order between pages.
     * @example
     * zIndex={1}
     */
    zIndex?: number;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Android-style frame container. `FramePage` children stack in the same area;
 * the active page fills the frame and inactive pages stay mounted but hidden.
 * Later siblings paint above earlier ones; `zIndex` resolves deliberate
 * overrides.
 * @param props - Children, height, clipping, accessible label, ref, and native attributes.
 * @example
 * <Frame height={240} ariaLabel="Preview">
 *     <FramePage active={page === "overview"}>Overview</FramePage>
 *     <FramePage active={page === "details"}>Details</FramePage>
 * </Frame>
 * @returns A relative frame that layers its sub-view pages.
 */
const Frame: FC<FrameProps> = ({
    children,
    height = 240,
    clip = true,
    className = "",
    style,
    role = "group",
    ariaLabel,
    ref,
    ...rest
}: FrameProps) => {
    const label: string | undefined = rest["aria-label"] ?? ariaLabel;

    return createElement(
        "div",
        {
            ...rest,
            ref,
            className: cx("frame", clip && "frame--clip", className),
            style: { height, ...style },
            role,
            "aria-label": label,
        },
        children,
    );
};

/**
 * One full-frame page in a `Frame`. Pages stack in the same area and stay
 * mounted when inactive, so local state survives a switch.
 * @param props - Children, active state, optional z-order, and native attributes.
 * @example
 * <Frame height={320}>
 *     <FramePage active={page === "overview"}>Overview</FramePage>
 *     <FramePage active={page === "details"}>Details</FramePage>
 * </Frame>
 * @returns A full-frame page layer.
 */
export const FramePage: FC<FramePageProps> = ({
    children,
    active = true,
    zIndex,
    className = "",
    style,
    ref,
    ...rest
}: FramePageProps) =>
    createElement(
        "div",
        {
            ...rest,
            ref,
            className: cx("frame__page", className),
            style: {
                ...(zIndex === (void 0) ? {} : { zIndex }),
                ...style,
            },
            hidden: !active,
        },
        children,
    );

export default Frame;
