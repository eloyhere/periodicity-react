import {
    useState,
    type Dispatch,
    type FC,
    type ReactNode,
    type SetStateAction,
} from "react";
import { Inline, Stack } from "../../../arrange/layout";
import { Animation, Button, Ring, Spinner, Text } from "../../../component";
import Demo from "../../Demo";
import "../../Foundations.css";

const motionSteps: ReadonlyArray<readonly [string, string, string]> = [
    ["Fast", "--duration-fast", "250ms"],
    ["Medium", "--duration-medium", "500ms"],
    ["Slow", "--duration-slow", "750ms"],
    ["Slower", "--duration-slower", "1000ms"],
];

const motionCode: string = `/* Every animation and transition reads the motion ladder. */
<div style={{ animationDuration: "calc(var(--duration-fast) * var(--motion-scale))" }} />
<div style={{ animationDuration: "calc(var(--duration-medium) * var(--motion-scale))" }} />
<div style={{ animationDuration: "calc(var(--duration-slow) * var(--motion-scale))" }} />
<div style={{ animationDuration: "calc(var(--duration-slower) * var(--motion-scale))" }} />

/* Ripples inherit the same scale, so one provider pauses every layer. */`;

const scopeCode: string = `const [playing, setPlaying] = useState(true);
const [reduced, setReduced] = useState(false);

<Button onClick={() => setPlaying(!playing)}>
    {playing ? "Pause motion" : "Play motion"}
</Button>
<Button onClick={() => setReduced(!reduced)}>
    {reduced ? "Use full motion" : "Reduce motion"}
</Button>

<Animation enabled={playing} reducedMotion={reduced ? "always" : "never"}>
    <Button>Ripple me</Button>
    <Spinner />
    <Ring />
</Animation>`;

/**
 * Documents the duration and easing tokens, plus one scope that controls every
 * animated layer in its subtree, including ripples and loading indicators.
 * @example
 * <MotionPage />
 * @returns The Motion entry.
 */
const MotionPage: FC = () => {
    const [playing, setPlaying]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(true);
    const [reduced, setReduced]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);

    return (
        <>
            <Demo
                title="Duration and easing"
                description="Short, decelerating transitions; the same rhythm across components."
                code={motionCode}
            >
                <div className="foundation-motion">
                    {motionSteps.map(
                        ([name, token, duration]: readonly [string, string, string]): ReactNode => (
                            <div className="foundation-motion__row" key={token}>
                                <span className="foundation-motion__name">{name}</span>
                                <span className="foundation-motion__track">
                                    <span
                                        className="foundation-motion__dot"
                                        style={{ animationDuration: `var(${token})` }}
                                    />
                                </span>
                                <code>
                                    {token} · {duration}
                                </code>
                            </div>
                        ),
                    )}
                </div>
            </Demo>

            <Demo
                title="One motion scope"
                description="Ripple, spinner, and ring share the same scale; pausing the scope stops every layer."
                code={scopeCode}
            >
                <Stack gap="md">
                    <Inline gap="sm" wrap>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(): void => setPlaying(!playing)}
                        >
                            {playing ? "Pause motion" : "Play motion"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(): void => setReduced(!reduced)}
                        >
                            {reduced ? "Use full motion" : "Reduce motion"}
                        </Button>
                    </Inline>
                    <Animation
                        enabled={playing}
                        reducedMotion={reduced ? "always" : "never"}
                    >
                        <Inline gap="lg" align="center" wrap>
                            <Button variant="outline">Ripple me</Button>
                            <Spinner label="Loading preview" />
                            <Ring label="Progress preview" />
                            <Text variant="body-sm" tone="muted">
                                Ripple, spinner, and ring share the same scale.
                            </Text>
                        </Inline>
                    </Animation>
                </Stack>
            </Demo>
        </>
    );
};

export default MotionPage;
