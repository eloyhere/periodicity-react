import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Reports whether the operating system asks for reduced motion.
 * @example
 * const reduced = prefersReducedMotion();
 * @returns True when animations should be skipped.
 */
const prefersReducedMotion: () => boolean = (): boolean =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Reveals text progressively while an agent response is streaming.
 * When streaming ends the full text is shown immediately; reduced-motion users never see the
 * animation. Prefix growth from streamed chunks continues from the already-revealed position.
 * @param text - Current complete text received so far.
 * @param active - Whether the message is still streaming.
 * @param speed - Delay in milliseconds between reveal ticks.
 * @example
 * const visible = useTypewriter(message.content, message.streaming === true);
 * @returns The currently visible prefix.
 */
export const useTypewriter: (text: string, active: boolean, speed?: number) => string = (
    text: string,
    active: boolean,
    speed: number = 24,
): string => {
    const characters: string[] = useMemo((): string[] => Array.from(text), [text]);
    const [reduced]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(prefersReducedMotion);
    const [revealed, setRevealed]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(active && !reduced ? 0 : characters.length);

    useEffect((): (() => void) | void => {
        if (!active || reduced || revealed >= characters.length) {
            return;
        }

        const timer: number = window.setTimeout((): void => {
            setRevealed((previous: number): number => Math.min(previous + 2, characters.length));
        }, speed);

        return (): void => window.clearTimeout(timer);
    }, [active, reduced, revealed, characters.length, speed]);

    const visibleCount: number =
        !active || reduced ? characters.length : Math.min(revealed, characters.length);

    return characters.slice(0, visibleCount).join("");
};

export default useTypewriter;
