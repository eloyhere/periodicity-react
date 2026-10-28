import type { CSSProperties, FC, HTMLAttributes, ReactNode, Ref } from "react";
import cx from "../foundation/cx";
import Scroll from "../../layout/scroll/Scroll";
import "./StickyPage.css";

/**
 * Props for the StickyPage component.
 * Type: interface.
 * Extends the native `div` attributes, so `id`, `title`, `aria-*`, `data-*`,
 * `tabIndex`, and pointer, mouse, keyboard, and focus handlers are forwarded to
 * the page frame. The inner viewport owns scrolling and receives the region
 * role and the accessible label.
 * Fields: children, height, ariaLabel, viewportRef, viewportClassName,
 * className.
 * @example
 * <StickyPage height={480} ariaLabel="Project page">
 *     <Sticky offset={0}><Toolbar title="Project" /></Sticky>
 *     <Article />
 *     <Sticky edge="bottom"><ActionBar /></Sticky>
 * </StickyPage>
 */
export interface StickyPageProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    /**
     * Slot for any number of page children. Put `Sticky` elements around the
     * components that should pin, and leave the rest as normal flow content.
     * @example
     * <StickyPage><Sticky><Header /></Sticky><Article /></StickyPage>
     */
    children: ReactNode;
    /**
     * Height of the scroll viewport. Defaults to the `--sticky-page-height`
     * token, which is 480px unless the theme overrides it. A number is treated
     * as pixels by React.
     * @example
     * height={520}
     */
    height?: CSSProperties["height"];
    /**
     * Accessible name for the scrollable region. Defaults to `aria-label`, then
     * to "Sticky page".
     * @example
     * ariaLabel="Release notes"
     */
    ariaLabel?: string;
    /**
     * Ref forwarded to the inner scroll viewport, ready for imperative
     * scrolling such as returning a sub-page to the top.
     * @example
     * const viewportRef = useRef<HTMLDivElement>(null);
     */
    viewportRef?: Ref<HTMLDivElement>;
    /**
     * Extra class names for the scroll viewport.
     * @example
     * viewportClassName="project-page__viewport"
     */
    viewportClassName?: string;
    /**
     * Extra class names for the page frame.
     * @example
     * className="project-page"
     */
    className?: string;
    /**
     * Ref forwarded to the page frame.
     * @example
     * const pageRef = useRef<HTMLDivElement>(null);
     */
    ref?: Ref<HTMLDivElement>;
}

const DefaultAriaLabel: string = "Sticky page";

/**
 * Renders the outer level of a sticky page: a bounded, scrollable viewport with
 * one content slot. `Sticky` children placed in the slot pin against this
 * viewport, so a page can mix several sticky layers with ordinary content.
 * @param props - Slot children, height, accessible label, viewport ref, class
 * names, and native div attributes.
 * @example
 * <StickyPage height={480} ariaLabel="Release notes">
 *     <Sticky offset={0}><Toolbar title="Release notes" /></Sticky>
 *     <ReleaseList />
 *     <Sticky edge="bottom"><SaveBar /></Sticky>
 * </StickyPage>
 * @returns A page frame with an inner scroll viewport and a content slot.
 */
const StickyPage: FC<StickyPageProps> = ({
    children,
    height,
    ariaLabel,
    viewportRef,
    viewportClassName = "",
    className = "",
    style,
    ref,
    "aria-label": ariaLabelAttribute,
    ...rest
}: StickyPageProps) => {
    const label: string = ariaLabel ?? ariaLabelAttribute ?? DefaultAriaLabel;
    const pageStyle: CSSProperties = {
        ...style,
        ...(height === (void 0) ? {} : { height }),
    };

    return (
        <div {...rest} ref={ref} className={cx("sticky-page", className)} style={pageStyle}>
            <Scroll
                className={cx("sticky-page__scroll", viewportClassName)}
                ref={viewportRef}
                height="100%"
                fillViewport
                ariaLabel={label}
            >
                {children}
            </Scroll>
        </div>
    );
};

export default StickyPage;
