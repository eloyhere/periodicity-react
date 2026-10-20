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
    Select,
    Surface,
    Text,
    Theme,
    ToastProvider,
    localeOptions,
    themePresets,
    useInternational,
    useToast,
} from "../../../component";
import type {
    AnimationPreset,
    InternationalContextValue,
    LocaleCode,
    LocaleOption,
    ThemePreset,
    ThemePresetId,
    ThemeTokens,
    ToastApi,
} from "../../../component";
import Demo, { DemoGroup } from "../../Demo";

const themeOptions: readonly { value: ThemePresetId; label: string }[] = themePresets.map(
    (preset: ThemePreset): { value: ThemePresetId; label: string } => ({
        value: preset.id,
        label: `${preset.label.zh} · ${preset.label.en}`,
    }),
);

const localeSelectOptions: readonly { value: LocaleCode; label: string }[] = localeOptions.map(
    (option: LocaleOption): { value: LocaleCode; label: string } => ({
        value: option.code,
        label: `${option.nativeLabel} · ${option.label}`,
    }),
);

const themeCode: string = `const [theme, setTheme] = useState<ThemePresetId>("milk");

<Select
    label="Theme preset"
    options={themeOptions}
    value={theme}
    onChange={(value) => setTheme(value as ThemePresetId)}
/>

<Theme theme={theme} density="compact" radius="rounded" tokens={accentTokens}>
    <Surface elevation={1} shape="sm">
        <Text variant="h4">Scoped theme</Text>
        <Text variant="body-sm" tone="muted">
            Theme preset, density, radius, and token overrides apply to this subtree only.
        </Text>
    </Surface>
</Theme>`;

const internationalCode: string = `const [locale, setLocale] = useState<LocaleCode>("en-GB");

<Select
    label="Locale"
    options={localeOptions}
    value={locale}
    onChange={(value) => setLocale(value as LocaleCode)}
/>

<International locale={locale} fallbackLocale="en-GB">
    <LocaleSample />
</International>

const LocaleSample = () => {
    const { locale, t, formatDate } = useInternational();

    return (
        <Text variant="body">
            {locale}: {t("save")} · {t("cancel")} · {formatDate(Date.now())}
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

const animatedPresets: readonly AnimationPreset[] = ["fade", "slide-up", "scale-in"];
const demoDate: Date = new Date(2026, 9, 20);

/**
 * Reads the scoped locale so the internationalisation demo renders built-in copy.
 * @example
 * <LocaleSample />
 * @returns Translated actions and a formatted date.
 */
const LocaleSample: FC = () => {
    const { locale, t, formatDate }: InternationalContextValue = useInternational();

    return (
        <Stack gap="xs">
            <Text variant="body">{`${t("save")} · ${t("cancel")} · ${t("retry")}`}</Text>
            <Text variant="body-sm" tone="muted">
                {`${locale} · ${formatDate(demoDate)}`}
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
    const [themePreset, setThemePreset]: [
        ThemePresetId,
        Dispatch<SetStateAction<ThemePresetId>>,
    ] = useState<ThemePresetId>("milk");
    const [locale, setLocale]: [LocaleCode, Dispatch<SetStateAction<LocaleCode>>] =
        useState<LocaleCode>("en-GB");
    const [animationKey, setAnimationKey]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);
    const [animatedKey, setAnimatedKey]: [number, Dispatch<SetStateAction<number>>] =
        useState<number>(0);

    return (
        <>
            <Demo
                title="Theme provider"
                description="Scoped theme preset, density, radius, and token overrides without touching the rest of the page."
                code={themeCode}
            >
                <DemoGroup label="Theme preset">
                    <Select
                        label="Theme preset"
                        options={themeOptions}
                        value={themePreset}
                        onChange={(value: string): void =>
                            setThemePreset(value as ThemePresetId)
                        }
                    />
                </DemoGroup>
                <Theme theme={themePreset} density="compact" radius="rounded" tokens={accentTokens}>
                    <Surface className="showcase__surface" elevation={1} shape="sm">
                        <Stack gap="xs">
                            <Text variant="label" tone="accent">
                                {`theme · ${themePreset}`}
                            </Text>
                            <Text variant="h4">Scoped theme</Text>
                            <Text variant="body-sm" tone="muted">
                                Preset, density, radius, and token overrides apply to this subtree
                                only.
                            </Text>
                        </Stack>
                    </Surface>
                </Theme>
            </Demo>

            <Demo
                title="International provider"
                description="Locale, built-in messages, and locale-aware date formatting."
                code={internationalCode}
            >
                <DemoGroup label="Locale">
                    <Select
                        label="Locale"
                        options={localeSelectOptions}
                        value={locale}
                        onChange={(value: string): void => setLocale(value as LocaleCode)}
                    />
                </DemoGroup>
                <International locale={locale} fallbackLocale="en-GB">
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
