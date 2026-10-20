import { useMemo, type FC, type ReactNode } from "react";
import { createListAdapter, type ListAdapter, type ListEntry } from "../../layout/list/adapter";
import cx from "../foundation/cx";
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
 * @example
 * const step: StepItem = { value: "account", label: "Account" };
 */
export interface StepItem {
    value: string;
    label: string;
    description?: ReactNode;
    icon?: IconName;
    optional?: boolean;
}

/**
 * Props for the Stepper component.
 * Type: interface.
 * Fields:
 * - `steps`: Steps in display order.
 * - `current`: Zero-based index of the current step.
 * - `orientation`: Layout direction; defaults to `horizontal`.
 * - `onStepClick`: Called with the clicked step index; omitted means read-only.
 * - `className`: Extra class names for the root element.
 * @example
 * <Stepper steps={steps} current={1} onStepClick={setStep} />
 */
export interface StepperProps {
    steps: StepItem[];
    current: number;
    orientation?: "horizontal" | "vertical";
    onStepClick?: (index: number) => void;
    className?: string;
}

/**
 * Renders an ordered stepper with completed, current, and upcoming states.
 * @param props - Steps, current index, orientation, click handler, and class name.
 * @example
 * <Stepper steps={steps} current={1} orientation="vertical" />
 * @returns An ordered list of steps with decorative connectors.
 */
const Stepper: FC<StepperProps> = ({
    steps,
    current,
    orientation = "horizontal",
    onStepClick,
    className = "",
}: StepperProps): ReactNode => {
    const adapter: ListAdapter<StepItem> = useMemo<ListAdapter<StepItem>>(
        () => createListAdapter<StepItem>(steps, { getKey: (step: StepItem): string => step.value }),
        [steps],
    );
    const entries: readonly ListEntry<StepItem>[] = useMemo<readonly ListEntry<StepItem>[]>(
        () => adapter.getRange(0, adapter.size),
        [adapter],
    );
    const safeCurrent: number = Number.isFinite(current) ? Math.floor(current) : 0;
    const activeIndex: number =
        steps.length === 0 ? -1 : Math.min(Math.max(0, safeCurrent), steps.length - 1);
    const isInteractive: boolean = onStepClick !== (void 0);

    const handleStepClick: (index: number) => void = (index: number): void => {
        if (onStepClick === (void 0) || index === activeIndex) {
            return;
        }

        onStepClick(index);
    };

    return (
        <div className={cx("stepper", `stepper--${orientation}`, className)}>
            <ol className="stepper__list">
                {entries.map((entry: ListEntry<StepItem>): ReactNode => {
                    const step: StepItem = entry.item;
                    const index: number = entry.index;
                    const isCompleted: boolean = index < activeIndex;
                    const isCurrent: boolean = index === activeIndex;
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
                            )}
                        >
                            {isInteractive ? (
                                <Surface
                                    className="stepper__surface"
                                    ripple={{ layer: "foreground", trigger: ["hover", "click"] }}
                                >
                                    <button
                                        type="button"
                                        className="stepper__step"
                                        aria-current={isCurrent ? "step" : (void 0)}
                                        onClick={(): void => {
                                            handleStepClick(index);
                                        }}
                                    >
                                        {body}
                                    </button>
                                </Surface>
                            ) : (
                                <div
                                    className="stepper__step stepper__step--static"
                                    aria-current={isCurrent ? "step" : (void 0)}
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
