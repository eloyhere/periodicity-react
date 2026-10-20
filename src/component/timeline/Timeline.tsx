import type { ReactNode } from "react";
import Icon, { type IconName } from "../icon/Icon";
import cx from "../foundation/cx";
import "./Timeline.css";

/**
 * Visual tone of a timeline marker.
 * Type: type alias.
 * Fields: none.
 * @example
 * const tone: TimelineTone = "success";
 */
export type TimelineTone = "neutral" | "accent" | "success" | "warning" | "danger";

/**
 * One timeline event.
 * Type: interface.
 * Fields: id, title, time, description, icon, tone, active.
 * @example
 * const item: TimelineItem = { id: "saved", title: "Draft saved", time: "09:30" };
 */
export interface TimelineItem {
    id: string;
    title: ReactNode;
    time?: ReactNode;
    description?: ReactNode;
    icon?: IconName;
    tone?: TimelineTone;
    active?: boolean;
}

/**
 * State passed to a timeline item slot.
 * Type: interface.
 * Fields: index, last, active.
 * @example
 * const state: TimelineItemState = { index: 0, last: false, active: true };
 */
export interface TimelineItemState {
    index: number;
    last: boolean;
    active: boolean;
}

/**
 * Props for the Material timeline.
 * Type: interface.
 * Fields: items, slots, className.
 * @example
 * <Timeline items={items} />
 */
export interface TimelineProps {
    items: readonly TimelineItem[];
    slots?: {
        item?: (item: TimelineItem, state: TimelineItemState) => ReactNode;
    };
    className?: string;
}

/**
 * Renders a vertical Material timeline with tone markers and item slots.
 * @param props - Events and optional item renderer.
 * @example
 * <Timeline items={events} />
 * @returns A timeline list.
 */
const Timeline: (props: TimelineProps) => ReactNode = ({
    items,
    slots,
    className = "",
}: TimelineProps): ReactNode => (
    <ol className={cx("timeline", className)}>
        {items.map((item: TimelineItem, index: number): ReactNode => {
            const last: boolean = index === items.length - 1;
            const active: boolean = item.active === true;

            return (
                <li
                    key={item.id}
                    className={cx(
                        "timeline__item",
                        last && "timeline__item--last",
                        active && "timeline__item--active",
                    )}
                    data-tone={item.tone ?? "neutral"}
                >
                    <span className="timeline__marker" aria-hidden="true">
                        {item.icon === (void 0) ? (
                            <span className="timeline__dot" />
                        ) : (
                            <Icon name={item.icon} size={14} />
                        )}
                    </span>
                    <div className="timeline__body">
                        {slots?.item === (void 0) ? (
                            <>
                                <div className="timeline__head">
                                    <span className="timeline__title">{item.title}</span>
                                    {item.time === (void 0) ? null : (
                                        <time className="timeline__time">{item.time}</time>
                                    )}
                                </div>
                                {item.description === (void 0) ? null : (
                                    <div className="timeline__description">
                                        {item.description}
                                    </div>
                                )}
                            </>
                        ) : (
                            slots.item(item, { index, last, active })
                        )}
                    </div>
                </li>
            );
        })}
    </ol>
);

export default Timeline;
