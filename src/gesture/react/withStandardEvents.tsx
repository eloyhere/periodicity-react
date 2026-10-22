import {
    useEffect,
    useMemo,
    useRef,
    type ComponentType,
    type CSSProperties,
    type FC,
    type ReactElement,
    type RefCallback,
    type RefObject,
} from "react";
import type {
    StandardEvent,
    StandardEventHandler,
    StandardEventName,
    StandardEventOptions,
} from "../events/types";
import { useStandardEvents } from "./useStandardEvents";

/**
 * Standard event listener props shared by every public component.
 * Type: interface.
 * Fields: standardEvents, onStandardEvent, onStandardOver, onStandardEnter,
 * onStandardLeave, onStandardWheel, onStandardClick, onStandardPress,
 * onStandardInput, onStandardContinuous, onStandardDrag.
 * Native React event props remain available and are forwarded untouched.
 * @example
 * <Button
 *     onClick={save}
 *     onStandardClick={(event) => console.log(event.count)}
 * />
 */
export interface StandardEventProps {
    standardEvents?: StandardEventOptions;
    onStandardEvent?: StandardEventHandler;
    onStandardOver?: StandardEventHandler;
    onStandardEnter?: StandardEventHandler;
    onStandardLeave?: StandardEventHandler;
    onStandardWheel?: StandardEventHandler;
    onStandardClick?: StandardEventHandler;
    onStandardPress?: StandardEventHandler;
    onStandardInput?: StandardEventHandler;
    onStandardContinuous?: StandardEventHandler;
    onStandardDrag?: StandardEventHandler;
}

const StandardEventNames: readonly StandardEventName[] = [
    "over",
    "enter",
    "leave",
    "wheel",
    "click",
    "press",
    "input",
    "continuous",
    "drag",
];

const boundaryStyle: CSSProperties = { display: "contents" };

/**
 * Adds standard event listeners to any component without changing its native props.
 * @param Component - Component to wrap.
 * @example
 * const Button = withStandardEvents(BaseButton);
 * <Button onStandardPress={press} />
 * @returns A component that accepts `standardEvents` and `onStandard*` handlers.
 */
export const withStandardEvents: <Props extends object>(
    Component: ComponentType<Props>,
) => ComponentType<Props & StandardEventProps> = <Props extends object>(
    Component: ComponentType<Props>,
): ComponentType<Props & StandardEventProps> => {
    const StandardEventComponent: FC<Props & StandardEventProps> = (
        props: Props & StandardEventProps,
    ): ReactElement => {
        const {
            standardEvents,
            onStandardEvent,
            onStandardOver,
            onStandardEnter,
            onStandardLeave,
            onStandardWheel,
            onStandardClick,
            onStandardPress,
            onStandardInput,
            onStandardContinuous,
            onStandardDrag,
            ...componentProps
        }: Props & StandardEventProps = props;
        const options: StandardEventOptions = useMemo((): StandardEventOptions => {
            const prefixedHandlers: Readonly<
                Partial<Record<StandardEventName, StandardEventHandler>>
            > = {
                over: onStandardOver,
                enter: onStandardEnter,
                leave: onStandardLeave,
                wheel: onStandardWheel,
                click: onStandardClick,
                press: onStandardPress,
                input: onStandardInput,
                continuous: onStandardContinuous,
                drag: onStandardDrag,
            };
            const handlers: Partial<Record<StandardEventName, StandardEventHandler>> = {};

            for (const name of StandardEventNames) {
                const specific: StandardEventHandler | undefined = standardEvents?.[name];
                const prefixed: StandardEventHandler | undefined = prefixedHandlers[name];

                if (
                    specific !== (void 0) ||
                    prefixed !== (void 0) ||
                    onStandardEvent !== (void 0)
                ) {
                    handlers[name] = (event: StandardEvent): void => {
                        specific?.(event);
                        prefixed?.(event);
                        onStandardEvent?.(event);
                    };
                }
            }

            return {
                ...(standardEvents ?? {}),
                ...handlers,
            };
        }, [
            standardEvents,
            onStandardEvent,
            onStandardOver,
            onStandardEnter,
            onStandardLeave,
            onStandardWheel,
            onStandardClick,
            onStandardPress,
            onStandardInput,
            onStandardContinuous,
            onStandardDrag,
        ]);
        const attachStandardEvents: RefCallback<HTMLElement> = useStandardEvents(options).ref;
        const boundaryRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const hasStandardEvents: boolean =
            standardEvents !== (void 0) ||
            onStandardEvent !== (void 0) ||
            onStandardOver !== (void 0) ||
            onStandardEnter !== (void 0) ||
            onStandardLeave !== (void 0) ||
            onStandardWheel !== (void 0) ||
            onStandardClick !== (void 0) ||
            onStandardPress !== (void 0) ||
            onStandardInput !== (void 0) ||
            onStandardContinuous !== (void 0) ||
            onStandardDrag !== (void 0);

        useEffect((): (() => void) => {
            const boundary: HTMLDivElement | null = boundaryRef.current;

            if (boundary === null) {
                return (): void => {};
            }

            const child: Element | null = boundary.firstElementChild;
            const root: HTMLElement =
                child === null ? boundary : (child as HTMLElement);

            attachStandardEvents(root);

            return (): void => {
                attachStandardEvents(null);
            };
        }, [attachStandardEvents, hasStandardEvents]);

        if (!hasStandardEvents) {
            return <Component {...(componentProps as Props)} />;
        }

        return (
            <div
                ref={boundaryRef}
                className="standard-event-boundary"
                style={boundaryStyle}
                data-standard-events="true"
            >
                <Component {...(componentProps as Props)} />
            </div>
        );
    };

    StandardEventComponent.displayName = `withStandardEvents(${Component.displayName ?? Component.name ?? "Component"})`;

    return StandardEventComponent;
};

export default withStandardEvents;
