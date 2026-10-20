import {
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    type FC,
    type ReactNode,
    type Ref,
    type RefObject,
} from "react";
import Surface from "../../component/surface/Surface";
import Icon, { type IconName } from "../../component/icon/Icon";
import cx from "../../component/foundation/cx";
import useControllableState from "../../component/foundation/useControllableState";
import "./NavigationView.css";

/**
 * Imperative navigation controls exposed through a ref.
 * Type: interface.
 * Fields: select, getValue.
 * @example
 * navigation.current?.select("settings");
 */
export interface NavigationViewHandle {
    select(value: string): void;
    getValue(): string;
}

/**
 * One destination in a navigation view.
 * Type: interface.
 * Fields: value, label, icon, badge, disabled.
 * @example
 * const item: NavigationItem = { value: "today", label: "Today", icon: "Calendar" };
 */
export interface NavigationItem {
    value: string;
    label: string;
    icon?: IconName;
    badge?: ReactNode;
    disabled?: boolean;
}

/**
 * Visual form of the navigation view.
 * Type: type alias.
 * Fields: none.
 * @example
 * const variant: NavigationVariant = "bottom";
 */
export type NavigationVariant = "sidebar" | "rail" | "bottom";

/**
 * Props for the Material navigation view.
 * Type: interface.
 * Fields: items, value, defaultValue, onValueChange, onItemClick, header, footer,
 * variant, ariaLabel, className, ref.
 * @example
 * <NavigationView items={items} defaultValue="today" />
 */
export interface NavigationViewProps {
    items: readonly NavigationItem[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    onItemClick?: (item: NavigationItem, index: number) => void;
    header?: ReactNode;
    footer?: ReactNode;
    variant?: NavigationVariant;
    ariaLabel?: string;
    className?: string;
    ref?: Ref<NavigationViewHandle>;
}

/**
 * Renders a Material sidebar, rail, or bottom navigation with selection state.
 * @param props - Destinations, selected value, slots, and variant.
 * @example
 * <NavigationView items={items} variant="bottom" />
 * @returns A navigation landmark.
 */
const NavigationView: FC<NavigationViewProps> = ({
    items,
    value,
    defaultValue,
    onValueChange,
    onItemClick,
    header,
    footer,
    variant = "sidebar",
    ariaLabel = "Navigation",
    className = "",
    ref,
}: NavigationViewProps) => {
    const fallback: string = items.find((item: NavigationItem): boolean => !item.disabled)?.value ?? "";
    const [active, setActive]: readonly [
        string,
        (next: string | ((previous: string) => string)) => void,
    ] = useControllableState<string>({
        value,
        defaultValue: defaultValue ?? fallback,
    });
    const notifyTimerRef: RefObject<number | null> = useRef<number | null>(null);
    const pendingValueRef: RefObject<string | null> = useRef<string | null>(null);

    useEffect(
        (): (() => void) => (): void => {
            if (notifyTimerRef.current !== null) {
                window.clearTimeout(notifyTimerRef.current);
            }
        },
        [],
    );

    useEffect((): void => {
        if (value !== (void 0) && pendingValueRef.current !== null) {
            if (notifyTimerRef.current !== null) {
                window.clearTimeout(notifyTimerRef.current);
            }

            notifyTimerRef.current = null;
            pendingValueRef.current = null;
        }
    }, [value]);

    const select: (next: string) => void = useCallback(
        (next: string): void => {
            if (next === active) {
                return;
            }

            setActive(next);
            pendingValueRef.current = next;

            if (notifyTimerRef.current !== null) {
                window.clearTimeout(notifyTimerRef.current);
            }

            notifyTimerRef.current = window.setTimeout((): void => {
                notifyTimerRef.current = null;
                pendingValueRef.current = null;
                onValueChange?.(next);
            }, 80);
        },
        [active, onValueChange, setActive],
    );

    useImperativeHandle(
        ref,
        (): NavigationViewHandle => ({
            select,
            getValue: (): string => active,
        }),
        [active, select],
    );

    return (
        <nav
            className={cx("navigation-view", `navigation-view--${variant}`, className)}
            aria-label={ariaLabel}
        >
            {header === (void 0) ? null : <div className="navigation-view__header">{header}</div>}

            <div className="navigation-view__list">
                {items.map((item: NavigationItem, index: number): ReactNode => {
                    const selected: boolean = item.value === active;

                    return (
                        <Surface
                            key={item.value}
                            className={cx(
                                "navigation-view__item",
                                selected && "navigation-view__item--selected",
                            )}
                            tone="accent"
                            disabled={item.disabled}
                            ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                        >
                            <button
                                type="button"
                                className="navigation-view__button"
                                disabled={item.disabled}
                                aria-current={selected ? "page" : (void 0)}
                                onClick={(): void => {
                                    select(item.value);
                                    onItemClick?.(item, index);
                                }}
                            >
                                <span className="navigation-view__indicator" aria-hidden="true" />
                                {item.icon === (void 0) ? null : (
                                    <span className="navigation-view__icon" aria-hidden="true">
                                        <Icon name={item.icon} size={20} />
                                    </span>
                                )}
                                <span className="navigation-view__label">{item.label}</span>
                                {item.badge === (void 0) ? null : (
                                    <span className="navigation-view__badge">{item.badge}</span>
                                )}
                            </button>
                        </Surface>
                    );
                })}
            </div>

            {footer === (void 0) ? null : <div className="navigation-view__footer">{footer}</div>}
        </nav>
    );
};

export default NavigationView;
