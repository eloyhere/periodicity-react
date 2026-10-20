import {
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    type FC,
    type HTMLAttributes,
    type MouseEvent as ReactMouseEvent,
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
 * Fields: select, getValue, getElement, focus, blur.
 * @example
 * navigation.current?.select("settings");
 */
export interface NavigationViewHandle {
    select(value: string): void;
    getValue(): string;
    getElement(): HTMLElement | null;
    focus(options?: FocusOptions): void;
    blur(): void;
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
 * variant, ariaLabel, disabled, className, ref, plus native landmark attributes and events.
 * Scroll events are observed on the scrolling destination list.
 * @example
 * <NavigationView items={items} defaultValue="today" data-testid="primary-navigation" />
 */
export interface NavigationViewProps
    extends Omit<HTMLAttributes<HTMLElement>, "children" | "defaultValue"> {
    items: readonly NavigationItem[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    onItemClick?: (
        item: NavigationItem,
        index: number,
        event: ReactMouseEvent<HTMLButtonElement>,
    ) => void;
    header?: ReactNode;
    footer?: ReactNode;
    variant?: NavigationVariant;
    ariaLabel?: string;
    disabled?: boolean;
    className?: string;
    ref?: Ref<NavigationViewHandle>;
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Renders a Material sidebar, rail, or bottom navigation with selection state.
 * @param props - Destinations, selected value, slots, variant, and native landmark attributes.
 * @example
 * <NavigationView items={items} variant="bottom" ariaLabel="Primary" />
 * @returns A navigation landmark with a forwarded handle and native event support.
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
    ariaLabel,
    disabled = false,
    className = "",
    ref,
    onScroll,
    "aria-label": ariaLabelAttribute,
    ...rest
}: NavigationViewProps) => {
    const fallback: string = items.find((item: NavigationItem): boolean => !item.disabled)?.value ?? "";
    const [active, setActive]: readonly [
        string,
        (next: string | ((previous: string) => string)) => void,
    ] = useControllableState<string>({
        value,
        defaultValue: defaultValue ?? fallback,
    });
    const navRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const notifyTimerRef: RefObject<number | null> = useRef<number | null>(null);
    const pendingValueRef: RefObject<string | null> = useRef<string | null>(null);
    const resolvedAriaLabel: string = ariaLabel ?? ariaLabelAttribute ?? "Navigation";

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
            if (disabled || next === active) {
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
        [active, disabled, onValueChange, setActive],
    );

    useImperativeHandle(
        ref,
        (): NavigationViewHandle => ({
            select,
            getValue: (): string => active,
            getElement: (): HTMLElement | null => navRef.current,
            focus: (options?: FocusOptions): void => {
                navRef.current?.focus(options);
            },
            blur: (): void => {
                navRef.current?.blur();
            },
        }),
        [active, select],
    );

    return (
        <nav
            {...rest}
            ref={navRef}
            className={cx("navigation-view", `navigation-view--${variant}`, className)}
            aria-label={resolvedAriaLabel}
            aria-disabled={disabled ? true : (void 0)}
            data-disabled={disabled ? "true" : "false"}
        >
            {header === (void 0) ? null : <div className="navigation-view__header">{header}</div>}

            <div className="navigation-view__list" onScroll={onScroll}>
                {items.map((item: NavigationItem, index: number): ReactNode => {
                    const selected: boolean = item.value === active;
                    const itemDisabled: boolean = disabled || item.disabled === true;

                    return (
                        <Surface
                            key={item.value}
                            className={cx(
                                "navigation-view__item",
                                selected && "navigation-view__item--selected",
                            )}
                            tone="accent"
                            disabled={itemDisabled}
                            ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                        >
                            <button
                                type="button"
                                className="navigation-view__button"
                                disabled={itemDisabled}
                                aria-current={selected ? "page" : (void 0)}
                                onClick={(event: ReactMouseEvent<HTMLButtonElement>): void => {
                                    select(item.value);
                                    onItemClick?.(item, index, event);
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
