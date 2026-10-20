import {
    useMemo,
    type FC,
    type HTMLAttributes,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type Ref,
} from "react";
import { createListAdapter, type ListAdapter, type ListEntry } from "../../layout/list/adapter";
import cx from "../foundation/cx";
import useControllableState from "../foundation/useControllableState";
import VisuallyHidden from "../foundation/VisuallyHidden";
import Icon, { type IconName } from "../icon/Icon";
import Surface from "../surface/Surface";
import "./Stepper.css";

/**
 * A single step in a stepper.
 * Type: interface.
 * Fields:
 * - `value`: Stable identifier for the step.
 * - `label`: Short step name.
 * - `description`: Optional supporting copy under the label.
 * - `icon`: Optional glyph shown instead of the step number.
 * - `optional`: Marks the step as optional.
 * - `disabled`: Keeps the step visible but prevents selection.
 * @example
 * const step: StepItem = { value: "account", label: "Account" };
 */
export interface StepItem {
    value: string;
    label: string;
    description?: ReactNode;
    icon?: IconName;
    optional?: boolean;
    disabled?: boolean;
}

/**
 * Props for the Stepper component.
 * Type: interface.
 * Fields:
 * - `steps`: Steps in display order.
 * - `current`: Controlled zero-based index of the current step.
 * - `defaultCurrent`: Uncontrolled initial step index; defaults to `0`.
 * - `onCurrentChange`: Called with the next step index.
 * - `orientation`: Layout direction; defaults to `horizontal`.
 * - `onStepClick`: Called with the clicked step index; omitted means read-only.
 * - `disabled`: Disables every step without removing it from the list.
 * - `ariaLabel`: Accessible name for the ordered step list.
 * - `className`: Extra class names for the root element.
 * - `ref`: Ref forwarded to the root element.
 * @example
 * <Stepper steps={steps} defaultCurrent={1} onStepClick={setStep} />
 */
export interface StepperProps
    extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
    steps: readonly StepItem[];
    current?: number;
    defaultCurrent?: number;
    onCurrentChange?: (index: number) => void;
    orientation?: "horizontal" | "vertical";
    onStepClick?: (index: number, step: StepItem, event: ReactMouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    ariaLabel?: string;
    className?: string;
    ref?: Ref<HTMLDivElement>;
    [dataAttribute: `data-${string}`]: string | number | boolean | undefined;
}

/**
 * Renders an ordered stepper with completed, current, and upcoming states.
 * @param props - Steps, current index, orientation, callbacks, disabled state, and native attributes.
 * @example
 * <Stepper steps={steps} defaultCurrent={1} orientation="vertical" />
 * @returns An ordered list of steps with decorative connectors.
 */
const Stepper: FC<StepperProps> = ({
    steps,
    current,
    defaultCurrent,
    onCurrentChange,
    orientation = "horizontal",
    onStepClick,
    disabled = false,
    ariaLabel,
    className = "",
    ref,
    "aria-label": ariaLabelAttribute,
    ...rest
}: StepperProps): ReactNode => {
    const adapter: ListAdapter<StepItem> = useMemo<ListAdapter<StepItem>>(
        () => createListAdapter<StepItem>(steps, { getKey: (step: StepItem): string => step.value }),
        [steps],
    );
    const entries: readonly ListEntry<StepItem>[] = useMemo<readonly ListEntry<StepItem>[]>(
        () => adapter.getRange(0, adapter.size),
        [adapter],
    );
    const [active, setActive]: readonly [number, (next: number | ((previous: number) => number)) => void] =
        useControllableState<number>({
            value: current,
            defaultValue: defaultCurrent ?? 0,
            onChange: onCurrentChange,
        });
    const safeCurrent: number = Number.isFinite(active) ? Math.floor(active) : 0;
    const activeIndex: number =
        steps.length === 0 ? -1 : Math.min(Math.max(0, safeCurrent), steps.length - 1);
    const isInteractive: boolean = onStepClick !== (void 0) && !disabled;
    const resolvedAriaLabel: string = ariaLabel ?? ariaLabelAttribute ?? "Progress";

    const handleStepClick: (
        index: number,
        step: StepItem,
        event: ReactMouseEvent<HTMLButtonElement>,
    ) => void = (
        index: number,
        step: StepItem,
        event: ReactMouseEvent<HTMLButtonElement>,
    ): void => {
        if (onStepClick === (void 0) || disabled || step.disabled === true || index === activeIndex) {
            return;
        }

        setActive(index);
        onStepClick(index, step, event);
    };

    return (
        <div
            {...rest}
            ref={ref}
            className={cx("stepper", `stepper--${orientation}`, className)}
            data-disabled={disabled ? "true" : "false"}
        >
            <ol className="stepper__list" aria-label={resolvedAriaLabel}>
                {entries.map((entry: ListEntry<StepItem>): ReactNode => {
                    const step: StepItem = entry.item;
                    const index: number = entry.index;
                    const isCompleted: boolean = index < activeIndex;
                    const isCurrent: boolean = index === activeIndex;
                    const stepDisabled: boolean = disabled || step.disabled === true;
                    const canActivate: boolean = isInteractive && !stepDisabled;
                    const markerNode: ReactNode = isCompleted ? (
                        <Icon name="Check" size={15} />
                    ) : step.icon ? (
                        <Icon name={step.icon} size={15} />
                    ) : (
                        <span className="stepper__number">{index + 1}</span>
                    );
                    const descriptionNode: ReactNode =
                        step.description !== (void 0) && step.description !== null ? (
                            <span className="stepper__description">{step.description}</span>
                        ) : null;
                    const body: ReactNode = (
                        <>
                            <span className="stepper__marker" aria-hidden="true">
                                {markerNode}
                            </span>
                            {isCompleted ? <VisuallyHidden>Completed</VisuallyHidden> : null}
                            <span className="stepper__text">
                                <span className="stepper__label-row">
                                    <span className="stepper__label">{step.label}</span>
                                    {step.optional ? <span className="stepper__optional">Optional</span> : null}
                                </span>
                                {descriptionNode}
                            </span>
                        </>
                    );

                    return (
                        <li
                            key={entry.key}
                            className={cx(
                                "stepper__item",
                                isCompleted && "stepper__item--completed",
                                isCurrent && "stepper__item--current",
                                stepDisabled && "stepper__item--disabled",
                            )}
                        >
                            {canActivate ? (
                                <Surface
                                    className="stepper__surface"
                                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                                >
                                    <button
                                        type="button"
                                        className="stepper__step"
                                        aria-current={isCurrent ? "step" : (void 0)}
                                        onClick={(event: ReactMouseEvent<HTMLButtonElement>): void => {
                                            handleStepClick(index, step, event);
                                        }}
                                    >
                                        {body}
                                    </button>
                                </Surface>
                            ) : (
                                <div
                                    className="stepper__step stepper__step--static"
                                    aria-current={isCurrent ? "step" : (void 0)}
                                    aria-disabled={stepDisabled ? true : (void 0)}
                                >
                                    {body}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};

export default Stepper;
