import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type CompositionEvent as ReactCompositionEvent,
    type CSSProperties,
    type Dispatch,
    type DragEvent as ReactDragEvent,
    type FC,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
    type RefObject,
    type SetStateAction,
} from "react";
import Button from "../../button/Button";
import Icon from "../../icon/Icon";
import cx from "../../foundation/cx";
import useControllableState from "../../foundation/useControllableState";
import {
    createNumberPickerAdapter,
    resolveWheelNotch,
    type NumberPickerAdapter,
    type WheelAccumulatorState,
    type WheelNotchResult,
} from "./adapter";
import "./NumberPicker.css";

/**
 * Props for the Android-style number picker.
 * Type: interface.
 * Fields: value, defaultValue, onChange, min, max, step, label, hint, error, disabled,
 * disabledValues, formatter, className, id.
 * @example
 * <NumberPicker label="Minutes" value={minutes} onChange={setMinutes} min={0} max={59} />
 */
export interface NumberPickerProps {
    value?: number;
    defaultValue?: number;
    onChange?: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    disabledValues?: readonly number[];
    formatter?: (value: number) => string;
    className?: string;
    id?: string;
}

/**
 * Mutable drag session for one wheel pointer.
 * Type: interface.
 * Fields: pointerId, startY, lastY, startValue, offset, itemHeight, moved, committedValue, residual.
 * @example
 * const drag: NumberPickerDragState = {
 *     pointerId: 1,
 *     startY: 0,
 *     lastY: 0,
 *     startValue: 12,
 *     offset: 0,
 *     itemHeight: 32,
 *     moved: false,
 *     committedValue: 12,
 *     residual: 0,
 * };
 */
interface NumberPickerDragState {
    pointerId: number;
    startY: number;
    lastY: number;
    startValue: number;
    offset: number;
    itemHeight: number;
    moved: boolean;
    committedValue: number;
    residual: number;
}

/**
 * Pixel height of one wheel row before the browser has measured it.
 * @example
 * const fallback = DefaultItemHeight;
 */
const DefaultItemHeight: number = 32;

/**
 * Vertical travel required before a press becomes a drag.
 * @example
 * const slop = DragStartThreshold;
 */
const DragStartThreshold: number = 4;

/**
 * Number of steps applied by PageUp and PageDown.
 * @example
 * const page = PageStepCount;
 */
const PageStepCount: number = 5;

/**
 * Maximum number of autocomplete suggestions.
 * @example
 * const limit = SuggestionLimit;
 */
const SuggestionLimit: number = 5;

/**
 * Wheel height used for page-mode deltas before layout.
 * @example
 * const height = WheelFallbackHeight;
 */
const WheelFallbackHeight: number = 160;

/**
 * Rows rendered by the wheel; the outer rows cover the drag offset.
 * @example
 * const offsets = WheelOffsets;
 */
const WheelOffsets: readonly number[] = [-3, -2, -1, 0, 1, 2, 3];

/**
 * Decimal text accepted by the editable value field.
 * @example
 * const valid = NumericTextPattern.test("-12.5");
 */
const NumericTextPattern: RegExp = /^-?(?:\d+\.?\d*|\.\d+)$/;

/**
 * Rounds a fractional step count away from zero on ties.
 * @param value - Fractional number of wheel steps.
 * @example
 * const steps = snapSteps(-1.5);
 * @returns The nearest integer step count.
 */
const snapSteps: (value: number) => number = (value: number): number =>
    value < 0 ? -Math.round(-value) : Math.round(value);

/**
 * Measures one wheel row, falling back to the CSS row height before layout.
 * @param wheel - Wheel element that contains the rows.
 * @example
 * const height = measureItemHeight(wheel);
 * @returns The row height in CSS pixels.
 */
const measureItemHeight: (wheel: HTMLDivElement) => number = (wheel: HTMLDivElement): number => {
    const item: HTMLElement | null = wheel.querySelector<HTMLElement>(".number-picker__item");
    const height: number = item === null ? 0 : item.getBoundingClientRect().height;

    return height > 0 ? height : DefaultItemHeight;
};

/**
 * Renders a Material number picker with a centred wheel, stepper buttons, and editable value field.
 * @param props - Value, bounds, step, field state, and disabled values.
 * @example
 * <NumberPicker label="Sessions" value={12} onChange={setSessions} min={1} max={30} />
 * @returns An accessible spinbutton-style picker with autocomplete.
 */
const NumberPicker: FC<NumberPickerProps> = ({
    value,
    defaultValue,
    onChange,
    min = 0,
    max = 99,
    step = 1,
    label,
    hint,
    error,
    disabled = false,
    disabledValues,
    formatter,
    className = "",
    id,
}: NumberPickerProps) => {
    const generatedId: string = useId();
    const pickerId: string = id ?? generatedId;
    const invalid: boolean = error !== (void 0) && error.length > 0;
    const safeStep: number = Math.max(1, step);
    const adapter: NumberPickerAdapter = useMemo<NumberPickerAdapter>(
        (): NumberPickerAdapter =>
            createNumberPickerAdapter({
                min,
                max,
                step: safeStep,
                disabledValues,
            }),
        [disabledValues, max, min, safeStep],
    );
    const [currentValue, setValue]: readonly [
        number,
        (next: number | ((previous: number) => number)) => void,
    ] = useControllableState<number>({
        value,
        defaultValue: defaultValue ?? min,
        onChange,
    });
    const clamped: number = adapter.clamp(currentValue);
    const interactive: boolean = !disabled && (value === (void 0) || onChange !== (void 0));
    const format: (next: number) => string = formatter ?? ((next: number): string => `${next}`);
    const canDecrease: boolean = interactive && adapter.step(clamped, -1) !== null;
    const canIncrease: boolean = interactive && adapter.step(clamped, 1) !== null;
    const describedBy: string | undefined = invalid
        ? `${pickerId}-error`
        : hint === (void 0)
          ? (void 0)
          : `${pickerId}-hint`;
    const suggestionsId: string = `${pickerId}-suggestions`;
    const pickerRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const wheelRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const shellRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null);
    const adapterRef: RefObject<NumberPickerAdapter> = useRef<NumberPickerAdapter>(adapter);
    const valueRef: RefObject<number> = useRef<number>(clamped);
    const interactiveRef: RefObject<boolean> = useRef<boolean>(interactive);
    const setValueRef: RefObject<(next: number) => void> = useRef<(next: number) => void>(setValue);
    const dragRef: RefObject<NumberPickerDragState | null> = useRef<NumberPickerDragState | null>(null);
    const wheelAccumulatorRef: RefObject<WheelAccumulatorState> = useRef<WheelAccumulatorState>({
        amount: 0,
        lastAt: 0,
    });
    const clickTimerRef: RefObject<number | null> = useRef<number | null>(null);
    const suppressClickRef: RefObject<boolean> = useRef<boolean>(false);
    const composingRef: RefObject<boolean> = useRef<boolean>(false);
    const [dragOffset, setDragOffset]: [number, Dispatch<SetStateAction<number>>] = useState<number>(0);
    const [dragging, setDragging]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [draft, setDraft]: [string | null, Dispatch<SetStateAction<string | null>>] = useState<string | null>(
        null,
    );
    const [editing, setEditing]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [suggestionsOpen, setSuggestionsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [activeSuggestion, setActiveSuggestion]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(-1);
    const suggestions: readonly number[] = useMemo<readonly number[]>(
        (): readonly number[] => adapter.suggest(draft ?? "", SuggestionLimit),
        [adapter, draft],
    );
    const showSuggestions: boolean = suggestionsOpen && suggestions.length > 0;
    const activeIndex: number =
        activeSuggestion >= 0 && activeSuggestion < suggestions.length ? activeSuggestion : -1;
    const trackStyle: CSSProperties = { transform: `translateY(${dragOffset}px)` };
    const inputValue: string = draft ?? (editing ? `${clamped}` : format(clamped));

    useLayoutEffect((): void => {
        adapterRef.current = adapter;
        valueRef.current = clamped;
        interactiveRef.current = interactive;
        setValueRef.current = setValue;
    });

    useLayoutEffect((): void => {
        if (editing) {
            inputRef.current?.select();
        }
    }, [editing]);

    /**
     * Ends a drag session, releases pointer capture, and suppresses the trailing click.
     * @param pointerId - Pointer that ended.
     * @param releaseCapture - Whether to release capture on the wheel shell.
     * @example
     * finishDrag(event.pointerId, true);
     * @returns Nothing.
     */
    const finishDrag: (pointerId: number, releaseCapture: boolean) => void = useCallback(
        (pointerId: number, releaseCapture: boolean): void => {
            const drag: NumberPickerDragState | null = dragRef.current;

            if (drag === null || drag.pointerId !== pointerId) {
                return;
            }

            dragRef.current = null;

            if (drag.moved) {
                suppressClickRef.current = true;

                if (clickTimerRef.current !== null) {
                    window.clearTimeout(clickTimerRef.current);
                }

                clickTimerRef.current = window.setTimeout((): void => {
                    suppressClickRef.current = false;
                    clickTimerRef.current = null;
                }, 0);
            }

            setDragOffset(0);
            setDragging(false);

            const element: HTMLDivElement | null = shellRef.current;

            if (
                releaseCapture &&
                element !== null &&
                typeof element.hasPointerCapture === "function"
            ) {
                try {
                    if (element.hasPointerCapture(pointerId)) {
                        element.releasePointerCapture(pointerId);
                    }
                } catch {
                    // The browser has already released the pointer.
                }
            }

            wheelAccumulatorRef.current = { amount: 0, lastAt: 0 };
        },
        [setDragOffset, setDragging],
    );

    useEffect((): (() => void) | void => {
        if (!dragging) {
            return;
        }

        const previousUserSelect: string = document.body.style.userSelect;
        document.body.style.userSelect = "none";
        document.getSelection()?.removeAllRanges();

        return (): void => {
            document.body.style.userSelect = previousUserSelect;
        };
    }, [dragging]);

    useEffect((): (() => void) => {
        /**
         * Ends a pointer session that left the wheel before capture was taken.
         * @param event - Native pointer event.
         * @example
         * window.addEventListener("pointerup", handleWindowPointerEnd);
         * @returns Nothing.
         */
        const handleWindowPointerEnd: (event: PointerEvent) => void = (event: PointerEvent): void => {
            finishDrag(event.pointerId, true);
        };

        window.addEventListener("pointerup", handleWindowPointerEnd);
        window.addEventListener("pointercancel", handleWindowPointerEnd);

        return (): void => {
            window.removeEventListener("pointerup", handleWindowPointerEnd);
            window.removeEventListener("pointercancel", handleWindowPointerEnd);
        };
    }, [finishDrag]);

    useEffect((): (() => void) => {
        const element: HTMLDivElement | null = shellRef.current;

        return (): void => {
            const drag: NumberPickerDragState | null = dragRef.current;

            if (
                drag !== null &&
                element !== null &&
                typeof element.hasPointerCapture === "function"
            ) {
                try {
                    if (element.hasPointerCapture(drag.pointerId)) {
                        element.releasePointerCapture(drag.pointerId);
                    }
                } catch {
                    // The browser has already released the pointer.
                }
            }

            dragRef.current = null;

            if (clickTimerRef.current !== null) {
                window.clearTimeout(clickTimerRef.current);
                clickTimerRef.current = null;
            }

            wheelAccumulatorRef.current = { amount: 0, lastAt: 0 };
        };
    }, []);

    useEffect((): (() => void) | void => {
        const element: HTMLDivElement | null = pickerRef.current;

        if (element === null) {
            return;
        }

        // React's delegated wheel listener is passive, so preventDefault() needs a direct non-passive listener.
        /**
         * Handles a native, cancellable wheel event over the whole picker.
         * @param event - Native wheel event.
         * @example
         * element.addEventListener("wheel", handleWheel, { passive: false });
         * @returns Nothing.
         */
        const handleWheel: (event: WheelEvent) => void = (event: WheelEvent): void => {
            if (!interactiveRef.current || event.ctrlKey || event.deltaY === 0) {
                return;
            }

            event.preventDefault();

            if (inputRef.current !== null && document.activeElement === inputRef.current) {
                inputRef.current.blur();
            }

            if (dragRef.current !== null) {
                return;
            }

            const pageHeight: number = element.clientHeight > 0 ? element.clientHeight : WheelFallbackHeight;
            const result: WheelNotchResult = resolveWheelNotch(
                wheelAccumulatorRef.current,
                event.deltaY,
                event.deltaMode,
                pageHeight,
                event.timeStamp,
            );
            wheelAccumulatorRef.current = result.state;

            if (result.steps === 0) {
                return;
            }

            const direction: -1 | 1 = result.steps > 0 ? -1 : 1;
            const next: number | null = adapterRef.current.step(valueRef.current, direction);

            if (next === null) {
                wheelAccumulatorRef.current = { amount: 0, lastAt: result.state.lastAt };
                return;
            }

            valueRef.current = next;
            setValueRef.current(next);
        };

        element.addEventListener("wheel", handleWheel, { passive: false });

        return (): void => {
            element.removeEventListener("wheel", handleWheel);
        };
    }, []);

    /**
     * Commits a candidate value after snapping and skipping disabled values.
     * @param next - Candidate value.
     * @param direction - Travel direction used to skip disabled values; 0 chooses the nearest.
     * @example
     * commit(13, 1);
     * @returns Nothing.
     */
    const commit: (next: number, direction?: -1 | 0 | 1) => void = (
        next: number,
        direction: -1 | 0 | 1 = 0,
    ): void => {
        if (!interactive) {
            return;
        }

        const resolved: number | null = adapter.snap(next, direction);

        if (resolved === null) {
            return;
        }

        valueRef.current = resolved;
        setValue(resolved);
    };

    /**
     * Moves one enabled step in a direction.
     * @param direction - 1 increases and -1 decreases.
     * @example
     * move(1);
     * @returns Nothing.
     */
    const move: (direction: -1 | 1) => void = (direction: -1 | 1): void => {
        const next: number | null = adapter.step(valueRef.current, direction);

        if (next !== null) {
            commit(next, direction);
        }
    };

    /**
     * Moves up to five enabled steps for PageUp and PageDown.
     * @param direction - 1 increases and -1 decreases.
     * @example
     * moveByPage(-1);
     * @returns Nothing.
     */
    const moveByPage: (direction: -1 | 1) => void = (direction: -1 | 1): void => {
        const current: number = valueRef.current;
        let next: number = current;

        for (let index: number = 0; index < PageStepCount; index += 1) {
            const candidate: number | null = adapter.step(next, direction);

            if (candidate === null) {
                break;
            }

            next = candidate;
        }

        if (next !== current) {
            commit(next, direction);
        }
    };

    /**
     * Increases the value by one enabled step.
     * @example
     * increase();
     * @returns Nothing.
     */
    const increase: () => void = (): void => {
        const next: number | null = adapter.step(valueRef.current, 1);

        if (next !== null) {
            commit(next, 1);
        }
    };

    /**
     * Decreases the value by one enabled step.
     * @example
     * decrease();
     * @returns Nothing.
     */
    const decrease: () => void = (): void => {
        const next: number | null = adapter.step(valueRef.current, -1);

        if (next !== null) {
            commit(next, -1);
        }
    };

    /**
     * Commits typed text when it is a finite value inside the bounds, otherwise restores the wheel value.
     * @param text - Raw text from the editable field.
     * @example
     * const accepted = commitText("14");
     * @returns True when the text produced a valid value.
     */
    const commitText: (text: string) => boolean = (text: string): boolean => {
        const trimmed: string = text.trim();

        setDraft(null);

        if (!interactive || trimmed.length === 0 || !NumericTextPattern.test(trimmed)) {
            return false;
        }

        const parsed: number = Number(trimmed);

        if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
            return false;
        }

        const resolved: number | null = adapter.snap(parsed, 0);

        if (resolved === null) {
            return false;
        }

        if (resolved !== valueRef.current) {
            commit(resolved, 0);
        }

        return true;
    };

    /**
     * Commits an autocomplete suggestion and closes the list.
     * @param suggestion - Suggested value.
     * @example
     * selectSuggestion(14);
     * @returns Nothing.
     */
    const selectSuggestion: (suggestion: number) => void = (suggestion: number): void => {
        commitText(`${suggestion}`);
        setSuggestionsOpen(false);
        setActiveSuggestion(-1);
    };

    const handleInputFocus: () => void = (): void => {
        setEditing(true);
        setDraft(`${clamped}`);
        setSuggestionsOpen(false);
        setActiveSuggestion(-1);
    };

    const handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void = (
        event: ChangeEvent<HTMLInputElement>,
    ): void => {
        setDraft(event.currentTarget.value);

        if (!composingRef.current) {
            setSuggestionsOpen(true);
            setActiveSuggestion(-1);
        }
    };

    const handleInputCompositionStart: () => void = (): void => {
        composingRef.current = true;
    };

    const handleInputCompositionEnd: (event: ReactCompositionEvent<HTMLInputElement>) => void = (
        event: ReactCompositionEvent<HTMLInputElement>,
    ): void => {
        composingRef.current = false;
        setDraft(event.currentTarget.value);
        setSuggestionsOpen(true);
        setActiveSuggestion(-1);
    };

    const handleInputBlur: () => void = (): void => {
        const composing: boolean = composingRef.current;
        composingRef.current = false;

        if (!composing && draft !== null) {
            commitText(draft);
        }

        setEditing(false);
        setDraft(null);
        setSuggestionsOpen(false);
        setActiveSuggestion(-1);
    };

    const handleInputKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void = (
        event: ReactKeyboardEvent<HTMLInputElement>,
    ): void => {
        if (composingRef.current || event.nativeEvent.isComposing) {
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();

            if (activeIndex >= 0) {
                selectSuggestion(suggestions[activeIndex]);
            } else {
                commitText(draft ?? `${clamped}`);
            }

            setSuggestionsOpen(false);
            setActiveSuggestion(-1);
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setDraft(null);
            setSuggestionsOpen(false);
            setActiveSuggestion(-1);
            event.currentTarget.select();
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            if (suggestions.length === 0) {
                return;
            }

            event.preventDefault();
            setSuggestionsOpen(true);

            if (event.key === "ArrowDown") {
                setActiveSuggestion(activeIndex < 0 ? 0 : (activeIndex + 1) % suggestions.length);
            } else {
                setActiveSuggestion(
                    activeIndex < 0
                        ? suggestions.length - 1
                        : (activeIndex - 1 + suggestions.length) % suggestions.length,
                );
            }
        }
    };

    const handleSuggestionPointerDown: (event: ReactPointerEvent<HTMLLIElement>, suggestion: number) => void = (
        event: ReactPointerEvent<HTMLLIElement>,
        suggestion: number,
    ): void => {
        event.stopPropagation();

        if (event.pointerType !== "touch" && event.pointerType !== "pen") {
            return;
        }

        event.preventDefault();
        selectSuggestion(suggestion);
    };

    const handleKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void = (
        event: ReactKeyboardEvent<HTMLDivElement>,
    ): void => {
        if (!interactive) {
            return;
        }

        if (event.key === "ArrowUp" || event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
        } else if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
        } else if (event.key === "PageUp") {
            event.preventDefault();
            moveByPage(1);
        } else if (event.key === "PageDown") {
            event.preventDefault();
            moveByPage(-1);
        } else if (event.key === "Home") {
            event.preventDefault();
            const first: number | null = adapter.first();

            if (first !== null) {
                commit(first, -1);
            }
        } else if (event.key === "End") {
            event.preventDefault();
            const last: number | null = adapter.last();

            if (last !== null) {
                commit(last, 1);
            }
        }
    };

    const handlePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        if (!interactive) {
            return;
        }

        if (event.button > 0) {
            return;
        }

        if (dragRef.current !== null) {
            return;
        }

        const startValue: number = valueRef.current;
        const wheel: HTMLDivElement = wheelRef.current ?? event.currentTarget;
        dragRef.current = {
            pointerId: event.pointerId,
            startY: event.clientY,
            lastY: event.clientY,
            startValue,
            offset: 0,
            itemHeight: measureItemHeight(wheel),
            moved: false,
            committedValue: startValue,
            residual: 0,
        };
        wheelAccumulatorRef.current = { amount: 0, lastAt: 0 };
        setDragOffset(0);
    };

    const handlePointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        const drag: NumberPickerDragState | null = dragRef.current;

        if (drag === null || drag.pointerId !== event.pointerId) {
            return;
        }

        if (!interactiveRef.current) {
            finishDrag(event.pointerId, true);
            return;
        }

        if (!drag.moved) {
            if (Math.abs(event.clientY - drag.startY) < DragStartThreshold) {
                return;
            }

            if (inputRef.current !== null && document.activeElement === inputRef.current) {
                inputRef.current.blur();
            }

            const latestValue: number = valueRef.current;

            if (latestValue !== drag.startValue) {
                drag.startValue = latestValue;
                drag.committedValue = latestValue;
                drag.offset = 0;
                drag.residual = 0;
            }

            drag.moved = true;
            drag.lastY = drag.startY;
            setDragging(true);
            wheelRef.current?.focus({ preventScroll: true });

            const element: HTMLDivElement | null = shellRef.current;

            if (element !== null) {
                try {
                    element.setPointerCapture(event.pointerId);
                } catch {
                    // Pointer capture is best-effort; touch pointers are captured implicitly.
                }
            }
        }

        const deltaY: number = event.clientY - drag.lastY;

        if (deltaY === 0) {
            return;
        }

        drag.lastY = event.clientY;
        drag.offset += deltaY;

        const steps: number = snapSteps(-drag.offset / drag.itemHeight);
        const direction: -1 | 0 | 1 = steps > 0 ? 1 : steps < 0 ? -1 : 0;
        const activeAdapter: NumberPickerAdapter = adapterRef.current;
        const candidate: number = drag.startValue + steps * activeAdapter.stepSize;
        const target: number | null = activeAdapter.snap(candidate, direction);

        if (target !== null && target !== drag.committedValue) {
            drag.committedValue = target;
            valueRef.current = target;
            setValue(target);
        }

        const residual: number = drag.offset + steps * drag.itemHeight;

        if (residual !== drag.residual) {
            drag.residual = residual;
            setDragOffset(residual);
        }
    };

    const handlePointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        finishDrag(event.pointerId, true);
    };

    const handlePointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        finishDrag(event.pointerId, true);
    };

    const handleLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => void = (
        event: ReactPointerEvent<HTMLDivElement>,
    ): void => {
        finishDrag(event.pointerId, false);
    };

    const handleClickCapture: (event: ReactMouseEvent<HTMLDivElement>) => void = (
        event: ReactMouseEvent<HTMLDivElement>,
    ): void => {
        if (!suppressClickRef.current) {
            return;
        }

        suppressClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDragStart: (event: ReactDragEvent<HTMLDivElement>) => void = (
        event: ReactDragEvent<HTMLDivElement>,
    ): void => {
        event.preventDefault();
    };

    return (
        <div
            className={cx(
                "number-picker-field",
                disabled && "number-picker-field--disabled",
                invalid && "number-picker-field--invalid",
                className,
            )}
        >
            <span className="number-picker-field__label" id={`${pickerId}-label`}>
                {label}
            </span>
            <div className="number-picker" ref={pickerRef} onClickCapture={handleClickCapture}>
                <Button
                    size="sm"
                    variant="ghost"
                    className="number-picker__step"
                    aria-label={`Increase ${label}`}
                    disabled={!canIncrease}
                    onClick={increase}
                >
                    <Icon name="ChevronUp" size={16} />
                </Button>
                <div
                    ref={shellRef}
                    className={cx(
                        "number-picker__wheel-shell",
                        dragging && "number-picker__wheel-shell--dragging",
                    )}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    onLostPointerCapture={handleLostPointerCapture}
                    onDragStart={handleDragStart}
                >
                    <div
                        ref={wheelRef}
                        id={pickerId}
                        className={cx(
                            "number-picker__wheel",
                            dragging && "number-picker__wheel--dragging",
                        )}
                        role="spinbutton"
                        aria-orientation="vertical"
                        tabIndex={interactive ? 0 : -1}
                        aria-labelledby={`${pickerId}-label`}
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={clamped}
                        aria-valuetext={format(clamped)}
                        aria-describedby={describedBy}
                        aria-disabled={!interactive ? "true" : (void 0)}
                        aria-readonly={!interactive && !disabled ? "true" : (void 0)}
                        data-dragging={dragging ? "true" : "false"}
                        onKeyDown={handleKeyDown}
                    >
                        <div className="number-picker__track" style={trackStyle}>
                            {WheelOffsets.map((offset: number): ReactNode => {
                                const next: number = clamped + offset * safeStep;
                                const inRange: boolean = next >= min && next <= max;
                                const valueDisabled: boolean = adapter.isDisabled(next);
                                const itemDisabled: boolean = !interactive || !inRange || valueDisabled;

                                if (offset === 0) {
                                    return (
                                        <span
                                            key={offset}
                                            className="number-picker__item number-picker__item--placeholder"
                                            aria-hidden="true"
                                        />
                                    );
                                }

                                return (
                                    <button
                                        key={offset}
                                        type="button"
                                        className={cx(
                                            "number-picker__item",
                                            Math.abs(offset) === 1 && "number-picker__item--adjacent",
                                            itemDisabled && inRange && "number-picker__item--disabled",
                                        )}
                                        tabIndex={-1}
                                        disabled={itemDisabled}
                                        aria-hidden="true"
                                        onClick={(): void => commit(valueRef.current + offset * safeStep)}
                                    >
                                        {inRange ? format(next) : ""}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <input
                        ref={inputRef}
                        className="number-picker__input"
                        type="text"
                        value={inputValue}
                        role="combobox"
                        aria-label={`Edit ${label}`}
                        aria-describedby={describedBy}
                        aria-invalid={invalid ? "true" : (void 0)}
                        aria-autocomplete="list"
                        aria-expanded={showSuggestions}
                        aria-controls={showSuggestions ? suggestionsId : (void 0)}
                        aria-activedescendant={
                            activeIndex >= 0 ? `${suggestionsId}-${activeIndex}` : (void 0)
                        }
                        aria-haspopup="listbox"
                        autoComplete="off"
                        spellCheck={false}
                        inputMode={min < 0 ? "text" : "decimal"}
                        disabled={!interactive}
                        onFocus={handleInputFocus}
                        onChange={handleInputChange}
                        onCompositionStart={handleInputCompositionStart}
                        onCompositionEnd={handleInputCompositionEnd}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                    />
                    {showSuggestions ? (
                        <ul
                            className="number-picker__suggestions"
                            id={suggestionsId}
                            role="listbox"
                            aria-label={`${label} suggestions`}
                            onPointerDown={(event: ReactPointerEvent<HTMLUListElement>): void => {
                                event.stopPropagation();
                            }}
                        >
                            {suggestions.map((suggestion: number, index: number): ReactNode => (
                                <li
                                    key={suggestion}
                                    id={`${suggestionsId}-${index}`}
                                    className="number-picker__suggestion"
                                    role="option"
                                    aria-selected={index === activeIndex}
                                    aria-posinset={index + 1}
                                    aria-setsize={suggestions.length}
                                    data-active={index === activeIndex ? "true" : "false"}
                                    onPointerDown={(event: ReactPointerEvent<HTMLLIElement>): void => {
                                        handleSuggestionPointerDown(event, suggestion);
                                    }}
                                    onMouseDown={(event: ReactMouseEvent<HTMLLIElement>): void => {
                                        event.preventDefault();
                                    }}
                                    onClick={(): void => selectSuggestion(suggestion)}
                                >
                                    {format(suggestion)}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    className="number-picker__step"
                    aria-label={`Decrease ${label}`}
                    disabled={!canDecrease}
                    onClick={decrease}
                >
                    <Icon name="ChevronDown" size={16} />
                </Button>
            </div>
            {invalid ? (
                <p className="number-picker-field__error" id={`${pickerId}-error`} role="alert">
                    {error}
                </p>
            ) : hint === (void 0) || hint.length === 0 ? null : (
                <p className="number-picker-field__hint" id={`${pickerId}-hint`}>
                    {hint}
                </p>
            )}
        </div>
    );
};

export default NumberPicker;
