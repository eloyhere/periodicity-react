/**
 * Data attributes forwarded to a picker trigger, popup, or option.
 * Type: interface.
 * Fields: data-*.
 * @example
 * <TimePicker label="Start" data-testid="start" data-analytics-id="start-time" />
 */
export interface PickerDataAttributes {
    [key: `data-${string}`]: string | number | boolean | undefined;
}
