import {
    useState,
    type ChangeEvent,
    type ChangeEventHandler,
    type Dispatch,
    type FC,
    type FocusEvent,
    type FocusEventHandler,
    type FormEvent,
    type FormEventHandler,
    type SetStateAction,
} from "react";
import TextInput, { type TextInputProps } from "../text/TextInput";
import { useInternational, type InternationalContextValue } from "../../../international";
import {
    TelephonePatternSource,
    sanitiseTelephoneText,
    validateTelephone,
    type SanitisedTelephoneText,
    type TelephoneValidationMessages,
} from "./telephone";

/**
 * Props for the telephone field.
 * Type: type alias.
 * Fields: all TextInputProps except type.
 * @example
 * <TelephoneInput label="Phone" value={phone} onChange={setPhone} />
 */
export type TelephoneInputProps = Omit<TextInputProps, "type">;

/**
 * Reads the caret offset, falling back to the end of the value when the input type
 * does not expose a text selection.
 * @param element - Input element that owns the caret.
 * @param fallback - Offset used when no selection is available.
 * @example
 * const caret = readCaret(element, 0);
 * @returns The caret offset.
 */
const readCaret: (element: HTMLInputElement, fallback: number) => number = (
    element: HTMLInputElement,
    fallback: number,
): number => {
    try {
        return element.selectionStart ?? fallback;
    } catch {
        return fallback;
    }
};

/**
 * Moves the caret to an absolute offset.
 * @param element - Input element that owns the caret.
 * @param caret - Requested caret offset.
 * @example
 * restoreCaret(element, 4);
 * @returns Nothing.
 */
const restoreCaret: (element: HTMLInputElement, caret: number) => void = (
    element: HTMLInputElement,
    caret: number,
): void => {
    try {
        element.setSelectionRange(caret, caret);
    } catch {
        // Some input types do not expose a text selection; the browser keeps the caret at the end.
    }
};

/**
 * Applies a filtered value and keeps the caret in place.
 * @param element - Input element that was edited.
 * @param result - Filtered value and adjusted caret offset.
 * @example
 * applySanitisedValue(element, { value: "+44 7700 900000", caret: 4 });
 * @returns Nothing.
 */
const applySanitisedValue: (element: HTMLInputElement, result: SanitisedTelephoneText) => void = (
    element: HTMLInputElement,
    result: SanitisedTelephoneText,
): void => {
    if (result.value === element.value) {
        return;
    }

    element.value = result.value;
    restoreCaret(element, result.caret);

    // A controlled parent re-renders after this handler. Reapply the caret once the
    // commit has finished, unless the parent deliberately stored a different value.
    queueMicrotask((): void => {
        if (element.isConnected && element.value === result.value) {
            restoreCaret(element, result.caret);
        }
    });
};

/**
 * Telephone field that filters typing, pasting, and dropping to an international format:
 * an optional leading `+`, digits, spaces, hyphens, and balanced parentheses. The complete
 * value is validated on blur and on native form submission, and the message is exposed
 * through TextInput's `error` API. A supplied `error` prop overrides the generated message.
 * Submit handlers that skip native constraint validation can call `validateTelephone`
 * from this module.
 * @param props - Telephone field props; label, hint, error, variant, size, and native input attributes are forwarded.
 * @example
 * <TelephoneInput label="Phone" placeholder="+44 7700 900000" />
 * @returns A telephone text field with a telephone keyboard, autocomplete, and inline validation.
 */
const TelephoneInput: FC<TelephoneInputProps> = ({
    error,
    required = false,
    pattern,
    inputMode = "tel",
    autoComplete = "tel",
    onChange,
    onBlur,
    onInvalid,
    ...rest
}: TelephoneInputProps) => {
    const { t }: InternationalContextValue = useInternational();
    const validationMessages: TelephoneValidationMessages = {
        required: t("telephoneRequired"),
        shape: t("telephoneShape"),
        parentheses: t("telephoneParentheses"),
        digits: t("telephoneDigits"),
    };
    const [touched, setTouched]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const [internalError, setInternalError]: [string | void, Dispatch<SetStateAction<string | void>>] =
        useState<string | void>((void 0));

    const handleChange: ChangeEventHandler<HTMLInputElement> = (event: ChangeEvent<HTMLInputElement>): void => {
        // Typing, paste, and drag-and-drop all arrive as change events, so every edit
        // shares the same sanitising path before the caller receives the event.
        const element: HTMLInputElement = event.currentTarget;
        const rawValue: string = element.value;
        const rawCaret: number = readCaret(element, rawValue.length);
        const sanitised: SanitisedTelephoneText = sanitiseTelephoneText(rawValue, rawCaret);

        applySanitisedValue(element, sanitised);
        onChange?.(event);

        if (touched) {
            setInternalError(validateTelephone(sanitised.value, required, validationMessages));
        }
    };

    const handleBlur: FocusEventHandler<HTMLInputElement> = (event: FocusEvent<HTMLInputElement>): void => {
        if (!event.currentTarget.disabled && !event.currentTarget.readOnly) {
            setTouched(true);
            setInternalError(validateTelephone(event.currentTarget.value, required, validationMessages));
        }

        onBlur?.(event);
    };

    const handleInvalid: FormEventHandler<HTMLInputElement> = (event: FormEvent<HTMLInputElement>): void => {
        const message: string | void = validateTelephone(
            event.currentTarget.value,
            required,
            validationMessages,
        );

        if (!event.currentTarget.disabled && !event.currentTarget.readOnly && message !== (void 0)) {
            event.preventDefault();
            setTouched(true);
            setInternalError(message);
        }

        onInvalid?.(event);
    };

    const shownError: string | void = error !== (void 0) && error.length > 0 ? error : internalError;
    const patternSource: string =
        pattern === (void 0) || pattern.length === 0 ? TelephonePatternSource : pattern;

    return (
        <TextInput
            {...rest}
            type="tel"
            inputMode={inputMode}
            autoComplete={autoComplete}
            required={required}
            pattern={patternSource}
            error={shownError === (void 0) ? (void 0) : shownError}
            onChange={handleChange}
            onBlur={handleBlur}
            onInvalid={handleInvalid}
        />
    );
};

export default TelephoneInput;
