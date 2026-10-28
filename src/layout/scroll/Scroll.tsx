import type { CSSProperties, FC, HTMLAttributes, ReactNode, Ref } from "react";
import cx from "../../component/foundation/cx";
import "./Scroll.css";

/**
 * Props for the Scroll layout.
 * Type: interface.
 * Extends the native `div` attributes. The Scroll root is the scroll viewport,
 * so native `onScroll`, `id`, `data-*`, and ARIA attributes belong there.
 * Fields: children, height, fillViewport, ariaLabel, className, ref.
 * @example
 * <Scroll height={320} ariaLabel="Release notes">
 *     <LongContent />
 * </Scroll>
 */
export interface ScrollProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    /**
     * Content slot. Like Android's ScrollView, the viewport wraps its children
     * in one content block; the block may contain any number of elements.
     * @example
     * <Scroll><Header /><List /><Footer /></Scroll>
     */
    children: ReactNode;
    /**
     * Height of the scroll viewport. Defaults to `100%`, so a parent with a
     * bounded height controls the scroll area.
     * @example
     * height={320}
     */
    height?: CSSProperties["height"];
    /**
     * Makes the content block at least as tall as the viewport, mirroring
     * Android's `fillViewport`. Defaults to `true`.
     * @example
     * fillViewport={false}
     */
    fillViewport?: boolean;
    /**
     * Accessible name for the scroll region. Defaults to `aria-label`, then to
     * "Scrollable content".
     * @example
     * ariaLabel="Activity log"
     */
    ariaLabel?: string;
    /**
     * Extra class names for the scroll viewport.
     * @example
     * className="project-page__scroll"
     */
    className?: string;
    /**
     * Ref forwarded to the scroll viewport.
     * @example
     * const scrollRef = useRef<HTMLDivElement>(null);
     */
    ref?: Ref<HTMLDivElement>;
}

const DefaultAriaLabel: string = "Scrollable content";

/**
 * Renders an Android-ScrollView-style layout: one vertically scrollable
 * viewport, one content block, and a slot for any number of children. Sticky
 * children placed in the slot resolve this viewport as their scroll container.
 * @param props - Slot children, height, fill behaviour, accessible label, class
 * name, ref, and native div attributes.
 * @example
 * <Scroll height={320} fillViewport ariaLabel="Release notes">
 *     <Toolbar title="Release notes" />
 *     <ReleaseList />
 * </Scroll>
 * @returns A scroll viewport with a single content block around its children.
 */
const Scroll: FC<ScrollProps> = ({
    children,
    height,
    fillViewport = true,
    ariaLabel,
    className = "",
    style,
    ref,
    "aria-label": ariaLabelAttribute,
    ...rest
}: ScrollProps) => {
    const label: string = ariaLabel ?? ariaLabelAttribute ?? DefaultAriaLabel;
    const scrollStyle: CSSProperties = {
        ...style,
        ...(height === (void 0) ? {} : { height }),
    };

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("scroll", className)}
            style={scrollStyle}
            role="region"
            tabIndex={0}
            aria-label={label}
            data-fill-viewport={fillViewport ? "true" : "false"}
        >
            <div className="scroll__content">{children}</div>
        </div>
    );
};

export default Scroll;
