import {
    useState,
    type Dispatch,
    type FC,
    type ReactNode,
    type SetStateAction,
} from "react";
import { Inline, Stack } from "../../../arrange/layout";
import {
    Animation,
    Animated,
    Button,
    International,
    Surface,
    Text,
    Theme,
    ToastProvider,
    useInternational,
    useToast,
} from "../../../component";
import type {
    AnimationPreset,
    InternationalContextValue,
    InternationalMessages,
    MessageDictionary,
    ThemeMode,
    ThemeTokens,
    ToastApi,
} from "../../../component";
import Demo, { DemoGroup } from "../../Demo";

const themeCode: string = `const [mode, setMode] = useState<ThemeMode>("light");

<Inline gap="sm">
    <Button size="sm" onClick={() => setMode("light")}>Light</Button>
    <Button size="sm" onClick={() => setMode("dark")}>Dark</Button>
</Inline>

<Theme mode={mode} density="compact" radius="rounded" tokens={accentTokens}>
    <Surface elevation={1} shape="sm">
        <Text variant="h4">Scoped theme</Text>
        <Text variant="body-sm" tone="muted">
            Mode, density, radius, and token overrides apply to this subtree only.
        </Text>
    </Surface>
</Theme>`;

const internationalCode: string = `const [locale, setLocale] = useState("en-GB");

const messages = {
    "en-GB": { greeting: "Good morning, {name}", sessions: "{count} sessions booked" },
    "fr-FR": { greeting: "Bonjour, {name}", sessions: "{count} séances réservées" },
};

<Inline gap="sm">
    <Button size="sm" onClick={() => setLocale("en-GB")}>English</Button>
    <Button size="sm" onClick={() => setLocale("fr-FR")}>Français</Button>
</Inline>

<International locale={locale} fallbackLocale="en-GB" messages={messages}>
    <LocaleSample />
</International>

const LocaleSample = () => {
    const { locale, t, formatNumber } = useInternational();

    return (
        <Text variant="body">
            {locale}: {t("greeting", { name: "Mira" })} · {formatNumber(1234.5)}
        </Text>
    );
};`;

const animationCode: string = `const [replay, setReplay] = useState(0);

<Button size="sm" variant="outline" onClick={() => setReplay(replay + 1)}>
    Replay
</Button>

<Animation key={replay} preset="slide-up" duration={320} reducedMotion="system">
    <Animated preset="fade" delay={80}>
        <Surface elevation={1} shape="sm">
            <Text variant="h4">Scoped animation</Text>
            <Text variant="body-sm" tone="muted">
                Preset, duration, delay, and reduced-motion behaviour are inherited.
            </Text>
        </Surface>
    </Animated>
</Animation>`;

const animatedCode: string = `const animatedPresets = ["fade", "slide-up", "scale-in"];

{animatedPresets.map((preset) => (
    <Animated key={\`\${replay}-\${preset}\`} preset={preset} delay={80} element="div">
        <Surface elevation={1} shape="sm">
            <Text variant="label">{preset}</Text>
            <Text variant="body-sm" tone="muted">
                The Animated wrapper renders a single element with a preset.
            </Text>
        </Surface>
    </Animated>
))}`;

const toastCode: string = `<ToastProvider max={2} duration={4000}>
    <ToastTrigger />
</ToastProvider>

const ToastTrigger = () => {
    const toast = useToast();

    return (
        <Button
            onClick={() =>
                toast.show({
                    title: "Saved quietly",
                    description: "The toast queue lives inside this provider.",
                    tone: "success",
                })
            }
        >
            Show scoped toast
        </Button>
    );
};`;

const accentTokens: ThemeTokens = {
    "--colourPrimary": "#7b1fa2",
    "--colourPrimaryContainer": "#f3e5f5",
    "--colourOnPrimaryContainer": "#4a148c",
};

const localeEntries: ReadonlyArray<readonly [string, MessageDictionary]> = [
    ["en-GB", { greeting: "Good morning, {name}", sessions: "{count} sessions booked" }],
    ["fr-FR", { greeting: "Bonjour, {name}", sessions: "{count} séances réservées" }],
];

const localeMessages: InternationalMessages = Object.fromEntries(localeEntries);

const animatedPresets: readonly AnimationPreset[] = ["fade", "slide-up", "scale-in"];

/**
 * Reads the scoped locale so the internationalisation demo renders real copy.
 * @example
 * <LocaleSample />
 * @returns Two translated lines and a formatted number.
 */
const LocaleSample: FC = () => {
    const { locale, t, formatNumber }: InternationalContextValue = useInternational();

    return (
        <Stack gap="xs">
            <Text variant="body">{t("greeting", { name: "Mira" })}</Text>
            <Text variant="body-sm" tone="muted">
                {`${locale} · ${t("sessions", { count: 12 })} · ${formatNumber(1234.5)}`}
            </Text>
        </Stack>
    );
};

/**
 * Shows a toast from inside a nested provider, proving the context boundary.
 * @example
 * <ToastTrigger />
 * @returns A button that enqueues a toast in the nearest provider.
 */
const ToastTrigger: FC = () => {
    const toast: ToastApi = useToast();

    return (
        <Button
            variant="outline"
            onClick={(): void => {
                toast.show({
                    title: "Saved quietly",
                    description: "The toast queue lives inside this provider.",
                    tone: "success",
                });
            }}
        >
            Show scoped toast
        </Button>
    );
};

/**
 * Documents the four provider components with live, scoped previews.
 * @example
 * <ProvidersPage />
 * @returns Theme, International, Animation, Animated, and ToastProvider demos.
 */
const ProvidersPage: FC = () => {
    const [themeMode, setThemeMode]: [ThemeMode, Dispatch<SetStateAction<ThemeMode>>] =
        useState<ThemeMode>("light");
    const [locale, setLocale]: [string, Dispatch<SetStateAction<string>>] = useState<string>("en-GB");
    const [animationKey, setAnimationKey]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const [animatedKey, setAnimatedKey]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);

    return (
        <>
            <Demo
                title="Theme provider"
                description="Scoped mode, density, radius, and token overrides without touching the rest of the page."
                code={themeCode}
            >
                <DemoGroup label="Scoped theme">
                    <Inline gap="sm">
                        <Button
                            size="sm"
                            variant={themeMode === "light" ? "solid" : "outline"}
                            onClick={(): void => setThemeMode("light")}
                        >
                            Light
                        </Button>
                        <Button
                            size="sm"
                            variant={themeMode === "dark" ? "solid" : "outline"}
                            onClick={(): void => setThemeMode("dark")}
                        >
                            Dark
                        </Button>
                    </Inline>
                </DemoGroup>
                <Theme mode={themeMode} density="compact" radius="rounded" tokens={accentTokens}>
                    <Surface className="showcase__surface" elevation={1} shape="sm">
                        <Stack gap="xs">
                            <Text variant="label" tone="accent">
                                {`theme · ${themeMode}`}
                            </Text>
                            <Text variant="h4">Scoped theme</Text>
                            <Text variant="body-sm" tone="muted">
                                Mode, density, radius, and token overrides apply to this subtree
                                only.
                            </Text>
                        </Stack>
                    </Surface>
                </Theme>
            </Demo>

            <Demo
                title="International provider"
                description="Locale, message lookup, placeholder substitution, and number formatting."
                code={internationalCode}
            >
                <DemoGroup label="Locale">
                    <Inline gap="sm">
                        <Button
                            size="sm"
                            variant={locale === "en-GB" ? "solid" : "outline"}
                            onClick={(): void => setLocale("en-GB")}
                        >
                            English
                        </Button>
                        <Button
                            size="sm"
                            variant={locale === "fr-FR" ? "solid" : "outline"}
                            onClick={(): void => setLocale("fr-FR")}
                        >
                            Français
                        </Button>
                    </Inline>
                </DemoGroup>
                <International locale={locale} fallbackLocale="en-GB" messages={localeMessages}>
                    <Surface className="showcase__surface" elevation={1} shape="sm">
                        <LocaleSample />
                    </Surface>
                </International>
            </Demo>

            <Demo
                title="Animation provider"
                description="A configuration scope for preset, duration, delay, and reduced-motion behaviour."
                code={animationCode}
            >
                <DemoGroup label="Replay">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(): void => setAnimationKey(animationKey + 1)}
                    >
                        Replay provider animation
                    </Button>
                </DemoGroup>
                <Animation
                    key={animationKey}
                    preset="slide-up"
                    duration={320}
                    reducedMotion="system"
                >
                    <Animated preset="fade" delay={80}>
                        <Surface className="showcase__surface" elevation={1} shape="sm">
                            <Stack gap="xs">
                                <Text variant="label" tone="accent">
                                    Animation · slide-up
                                </Text>
                                <Text variant="h4">Scoped animation</Text>
                                <Text variant="body-sm" tone="muted">
                                    Preset, duration, delay, and reduced-motion behaviour are
                                    inherited by descendants.
                                </Text>
                            </Stack>
                        </Surface>
                    </Animated>
                </Animation>
            </Demo>

            <Demo
                title="Animated wrapper"
                description="One element per preset, each with its own replay key and inherited timing."
                code={animatedCode}
            >
                <DemoGroup label="Replay">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={(): void => setAnimatedKey(animatedKey + 1)}
                    >
                        Replay wrappers
                    </Button>
                </DemoGroup>
                <Inline gap="md" wrap>
                    {animatedPresets.map((preset: AnimationPreset): ReactNode => (
                        <Animated
                            key={`${animatedKey}-${preset}`}
                            preset={preset}
                            delay={80}
                            element="div"
                        >
                            <Surface className="showcase__surface" elevation={1} shape="sm">
                                <Stack gap="xs">
                                    <Text variant="label" tone="accent">
                                        {`Animated · ${preset}`}
                                    </Text>
                                    <Text variant="body-sm" tone="muted">
                                        The wrapper renders a single element with this preset.
                                    </Text>
                                </Stack>
                            </Surface>
                        </Animated>
                    ))}
                </Inline>
            </Demo>

            <Demo
                title="Toast provider"
                description="A nested queue proves that toasts follow the nearest provider, not the shell."
                code={toastCode}
            >
                <ToastProvider max={2} duration={4000}>
                    <ToastTrigger />
                </ToastProvider>
            </Demo>
        </>
    );
};

export default ProvidersPage;
