import type { CSSProperties, FC, HTMLAttributes, ReactNode, Ref } from "react";
import cx from "../../component/foundation/cx";
import { useAppBar, type AppBarContextValue } from "../coordinator/context";
import "../coordinator/Coordinator.css";

/**
 * Props for a collapsing app-bar hero and pinned toolbar area.
 * Type: interface.
 * Fields: children, expandedContent, media, expandedTitle, subtitle, progress, fadeContent,
 * className, ref, plus native div attributes.
 * @example
 * <Collapse expandedTitle="Explore" media={<img src="..." alt="" />}>
 *     <Toolbar title="Explore" />
 * </Collapse>
 */
export interface CollapseProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> {
    children?: ReactNode;
    expandedContent?: ReactNode;
    media?: ReactNode;
    expandedTitle?: ReactNode;
    subtitle?: ReactNode;
    progress?: number;
    fadeContent?: boolean;
    className?: string;
    ref?: Ref<HTMLDivElement>;
}

/**
 * Renders a hero that fades and scales away while its pinned toolbar content
 * stays at the bottom of an AppBar.
 * @param props - Expanded content, media, titles, and pinned children.
 * @example
 * <Collapse expandedTitle="Explore" media={<img src="hero.jpg" alt="" />}>
 *     <Toolbar title="Explore" />
 * </Collapse>
 * @returns A collapsing hero with a pinned content row.
 */
const Collapse: FC<CollapseProps> = ({
    children,
    expandedContent,
    media,
    expandedTitle,
    subtitle,
    progress,
    fadeContent = true,
    className = "",
    ref,
    style,
    ...rest
}: CollapseProps) => {
    const appBar: AppBarContextValue = useAppBar();
    const collapseProgress: number =
        progress === (void 0) ? appBar.progress : Math.min(1, Math.max(0, progress));
    const hero: ReactNode = expandedContent ?? media;
    const heroStyle: CSSProperties = {
        opacity: fadeContent ? Math.max(0, 1 - collapseProgress * 1.35) : 1,
        transform: `translateY(${collapseProgress * -18}px) scale(${1 + collapseProgress * 0.04})`,
    };
    const titleStyle: CSSProperties = {
        opacity: Math.max(0, 1 - collapseProgress * 1.8),
        transform: `translateY(${collapseProgress * -12}px)`,
    };

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("collapse", className)}
            style={style}
            data-progress={collapseProgress.toFixed(3)}
        >
            {hero === (void 0) ? null : (
                <div className="collapse__hero" style={heroStyle} aria-hidden="true">
                    {hero}
                </div>
            )}
            <div className="collapse__scrim" aria-hidden="true" />
            <div className="collapse__content">
                {expandedTitle === (void 0) ? null : (
                    <div className="collapse__expanded-title" style={titleStyle}>
                        <span>{expandedTitle}</span>
                        {subtitle === (void 0) ? null : (
                            <span className="collapse__subtitle">{subtitle}</span>
                        )}
                    </div>
                )}
                <div className="collapse__pinned">{children}</div>
            </div>
        </div>
    );
};

export default Collapse;
