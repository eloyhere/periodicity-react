import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type FC,
    type MouseEvent,
    type RefObject,
    type SetStateAction,
} from "react";
import {
    Anchor,
    AppBar,
    Button,
    CompleteInput,
    Coordinator,
    Dialog,
    International,
    Link,
    LinearLayout,
    Select,
    Theme,
    ToastProvider,
    Toolbar,
    localeOptions,
    themePresets,
} from "../component";
import type {
    CompleteOption,
    LocaleCode,
    LocaleOption,
    ThemePreset,
    ThemePresetId,
} from "../component";
import Text from "../component/text/Text";
import { ShowcaseFocusContext } from "./focus";
import {
    foundationEntries,
    findEntry,
    findGroup,
    findSection,
    resolveEntryId,
    showcaseEntries,
    type ShowcaseEntry,
    type ShowcaseGroup,
    type ShowcaseSection,
} from "./registry";
import {
    uiComponentSections,
    type ComponentRecord,
    type ComponentSection,
} from "./componentCatalogue";
import { shellMessages, type ShellMessageKey, type ShellMessages } from "./shellMessages";
import { themeNames } from "./themeMessages";
import { localizeComponentName } from "./componentNames";
import { fallbackDescription, showcaseLabel, toUsEnglish } from "./showcaseLabels";
import "./Foundations.css";
import "./Showcase.css";

interface ShowcaseOption {
    value: string;
    label: string;
}

interface ShowcaseCategory {
    id: string;
    label: string;
    labelEn: string;
    options: readonly ShowcaseOption[];
}

const componentOptions: (sectionIds: readonly string[]) => readonly ShowcaseOption[] = (
    sectionIds: readonly string[],
): readonly ShowcaseOption[] =>
    uiComponentSections
        .filter((section: ComponentSection): boolean => sectionIds.includes(section.id))
        .flatMap((section: ComponentSection): readonly ShowcaseOption[] =>
            section.components.map(
                (component: ComponentRecord): ShowcaseOption => ({
                    value: component.id,
                    label: component.name,
                }),
            ),
        );

const showcaseCategories: readonly ShowcaseCategory[] = [
    {
        id: "inputs",
        label: "输入组件",
        labelEn: "Inputs",
        options: componentOptions(["actions", "inputs", "selection", "pickers"]),
    },
    {
        id: "data",
        label: "数据组件",
        labelEn: "Data",
        options: componentOptions(["data", "charts", "messaging", "files"]),
    },
    {
        id: "layout",
        label: "布局组件",
        labelEn: "Layout",
        options: componentOptions(["layout", "navigation", "overlays", "menus"]),
    },
    {
        id: "auxiliary",
        label: "辅助组件",
        labelEn: "Auxiliary",
        options: [
            ...componentOptions(["display", "feedback", "providers", "primitives"]),
            ...foundationEntries.map(
                (entry: ShowcaseEntry): ShowcaseOption => ({
                    value: entry.id,
                    label: `Foundations · ${entry.label}`,
                }),
            ),
        ],
    },
];

/**
 * Reads the raw hash without letting a malformed escape stop the shell.
 * @example
 * const hash: string = readHash();
 * @returns The decoded hash, with or without a leading `#`.
 */
const readHash: () => string = (): string => {
    if (typeof window === "undefined") {
        return "";
    }

    try {
        return decodeURIComponent(window.location.hash);
    } catch {
        // A malformed escape sequence should not stop the shell from loading.
        return window.location.hash;
    }
};

/**
 * Reads the entry id from the hash and keeps it in sync with the browser.
 * The hash is the single source of truth, so every entry has a stable,
 * shareable URL and the back button works without a router dependency.
 * @example
 * const [activeId, navigate] = useHashRoute();
 * @returns The active entry id and a navigation callback.
 */
const useHashRoute: () => readonly [string, (id: string) => void] = () => {
    const [activeId, setActiveId]: [string, Dispatch<SetStateAction<string>>] = useState<string>(
        (): string => resolveEntryId(readHash()),
    );

    useEffect((): (() => void) => {
        const handleHashChange: () => void = (): void => {
            setActiveId(resolveEntryId(readHash()));
        };

        window.addEventListener("hashchange", handleHashChange);

        return (): void => {
            window.removeEventListener("hashchange", handleHashChange);
        };
    }, []);

    useEffect((): void => {
        const target: string = `#${activeId}`;

        if (window.location.hash !== target && window.location.hash !== "#dashboard") {
            window.history.replaceState(null, "", target);
        }
    }, [activeId]);

    const navigate: (id: string) => void = (id: string): void => {
        const next: string = resolveEntryId(id);

        if (next === activeId) {
            return;
        }

        setActiveId(next);
        window.location.hash = next;
    };

    return [activeId, navigate] as const;
};

/**
 * Documentation shell: a persistent sidebar beside the active entry page.
 * Every page is selected by hash, rendered from the registry, and remounted
 * when the route changes so each entry starts from a clean local state.
 *
 * A component entry reuses its family page: the header names the selected
 * component, the focus bar names the demo, and the shell scrolls to that
 * demo's anchor while all sibling demos and code samples stay on the page.
 * @example
 * <Showcase />
 * @returns The design-system documentation application.
 */
const Showcase: FC = () => {
    const route: readonly [string, (id: string) => void] = useHashRoute();
    const activeId: string = route[0];
    const navigate: (id: string) => void = route[1];
    const entry: ShowcaseEntry = findEntry(activeId);
    const group: ShowcaseGroup = findGroup(entry.id);
    const section: ShowcaseSection = findSection(entry.id);
    const Page: FC = entry.page;
    const mainRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const pageTitleRef: RefObject<HTMLElement | null> = useRef<HTMLElement | null>(null);
    const [aboutOpen, setAboutOpen]: [boolean, Dispatch<SetStateAction<boolean>>] =
        useState<boolean>(false);
    const [searchValue, setSearchValue]: [string, Dispatch<SetStateAction<string>>] =
        useState<string>("");
    const [themePreset, setThemePreset]: [
        ThemePresetId,
        Dispatch<SetStateAction<ThemePresetId>>,
    ] = useState<ThemePresetId>("default");
    const [locale, setLocale]: [LocaleCode, Dispatch<SetStateAction<LocaleCode>>] =
        useState<LocaleCode>("en-GB");
    const shell: ShellMessages = shellMessages[locale] ?? shellMessages["en-GB"];
    const localizedTitle: string = localizeComponentName(entry.title, locale);
    const localizedDescription: string =
        locale === "en-GB"
            ? entry.description
            : locale === "en-US"
              ? toUsEnglish(entry.description)
              : fallbackDescription(entry.title, localizedTitle, locale);
    const demoLabel: string = locale.startsWith("en") ? (entry.demoTitle ?? entry.title) : localizedTitle;
    const isChinese: boolean = locale.startsWith("zh");
    const localizedThemeOptions: readonly ShowcaseOption[] = themePresets.map(
        (preset: ThemePreset): ShowcaseOption => ({
            value: preset.id,
            label: locale.startsWith("en")
                ? (themeNames[locale]?.[preset.id] ?? preset.label.en)
                : `${themeNames[locale]?.[preset.id] ?? preset.label.en} · ${preset.label.en}`,
        }),
    );
    const localizedLocaleOptions: readonly ShowcaseOption[] = localeOptions.map(
        (option: LocaleOption): ShowcaseOption => ({
            value: option.code,
            label: `${option.nativeLabel} · ${option.label}`,
        }),
    );
    const searchOptions: readonly ShowcaseOption[] = useMemo<readonly ShowcaseOption[]>(
        () =>
            showcaseEntries.map(
                (entry: ShowcaseEntry): ShowcaseOption => ({
                    value: entry.id,
                    label: localizeComponentName(entry.label, locale),
                }),
            ),
        [locale],
    );
    const previousEntryIdRef: RefObject<string> = useRef<string>(entry.id);

    /**
     * Clears the search box and opens the selected component.
     * @param option - The committed autocomplete suggestion.
     * @example
     * <CompleteInput onSelect={handleSearchSelect} />
     * @returns Nothing.
     */
    const handleSearchSelect: (option: CompleteOption) => void = (
        option: CompleteOption,
    ): void => {
        setSearchValue("");
        navigate(option.value);
    };

    /**
     * Moves focus to the main landmark without changing the hash.
     * The hash drives the showcase route, so following `#main-content` natively
     * would be read as an unknown entry; handling the click keeps the reader on
     * the current page while still skipping the sidebar.
     * @param event - The skip link click event.
     * @example
     * <a href="#main-content" onClick={handleSkipToContent}>{shell.skip}</a>
     */
    const handleSkipToContent: (event: MouseEvent<HTMLAnchorElement>) => void = (
        event: MouseEvent<HTMLAnchorElement>,
    ): void => {
        event.preventDefault();
        mainRef.current?.focus();
    };

    useEffect((): void => {
        document.title = `${localizedTitle} · Periodicity`;
    }, [localizedTitle]);

    useEffect((): void => {
        const anchor: string | void = entry.anchor;

        if (anchor === (void 0)) {
            mainRef.current?.parentElement?.scrollTo({ top: 0, behavior: "auto" });
            return;
        }

        const target: HTMLElement | null = document.getElementById(anchor);

        if (target === null) {
            mainRef.current?.parentElement?.scrollTo({ top: 0, behavior: "auto" });
            return;
        }

        target.scrollIntoView({ block: "start", behavior: "auto" });
    }, [entry.anchor, entry.id]);

    useEffect((): void => {
        if (previousEntryIdRef.current === entry.id) {
            return;
        }

        previousEntryIdRef.current = entry.id;
        // The hash change has already scrolled the new page; focusing with
        // preventScroll avoids a second jump while still announcing the title.
        pageTitleRef.current?.focus({ preventScroll: true });
    }, [entry.id]);

    return (
        <Theme theme={themePreset} className="showcase-theme">
            <International locale={locale}>
                <ToastProvider>
                    <Link
                        className="skip-link"
                        href="#main-content"
                        onClick={handleSkipToContent}
                    >
                        {shell.skip}
                    </Link>
                    <div className="showcase-shell">
                        <Coordinator
                            className="showcase-coordinator"
                            height="100vh"
                        collapseHeight={100}
                        collapse={
                            <div className="showcase-filters">
                                <LinearLayout
                                    orientation="horizontal"
                                    gap="md"
                                    align="end"
                                    wrap
                                >
                                    {showcaseCategories.map((category: ShowcaseCategory) => {
                                        const selected: string | undefined =
                                            category.options.some(
                                                (option: ShowcaseOption): boolean =>
                                                    option.value === entry.id,
                                            )
                                                ? entry.id
                                                : (void 0);

                                        return (
                                            <div
                                                className={`showcase-filter showcase-filter--${category.id}`}
                                                key={category.id}
                                            >
                                                <Select
                                                    label={shell[category.id as ShellMessageKey]}
                                                    options={category.options.map((option: ShowcaseOption): ShowcaseOption => ({
                                                        ...option,
                                                        label: localizeComponentName(option.label, locale),
                                                    }))}
                                                    value={selected}
                                                    onChange={navigate}
                                                />
                                            </div>
                                        );
                                    })}
                                    <div className="showcase-filter showcase-filter--search">
                                        <CompleteInput
                                            className="showcase-search"
                                            label={shell.search}
                                            prefix="Search"
                                            options={searchOptions}
                                            value={searchValue}
                                            onChange={setSearchValue}
                                            onSelect={handleSearchSelect}
                                        />
                                    </div>
                                </LinearLayout>
                            </div>
                        }
                        header={
                            <AppBar
                                expandedHeight={72}
                                collapsedHeight={72}
                                scrollBehaviour="none"
                                liftOnScroll={false}
                            >
                                <Toolbar
                                    title="Periodicity"
                                    subtitle={shell.designSystem}
                                    navigationIcon="i"
                                    navigationLabel={shell.aboutTitle}
                                    onNavigationClick={(): void => setAboutOpen(true)}
                                    actions={
                                        <div className="showcase-toolbar-actions">
                                            <Select
                                                size="sm"
                                                label={shell.theme}
                                                options={localizedThemeOptions}
                                                value={themePreset}
                                                onChange={(value: string): void =>
                                                    setThemePreset(value as ThemePresetId)
                                                }
                                            />
                                            <Select
                                                size="sm"
                                                label={shell.language}
                                                options={localizedLocaleOptions}
                                                value={locale}
                                                onChange={(value: string): void =>
                                                    setLocale(value as LocaleCode)
                                                }
                                            />
                                        </div>
                                    }
                                />
                            </AppBar>
                        }
                main={
                    <main
                        className="showcase-main"
                        id="main-content"
                        ref={mainRef}
                        tabIndex={-1}
                        aria-labelledby="showcase-page-title"
                    >
                        <article className="showcase-page" key={entry.id}>
                            <header className="showcase-page__header">
                                <Text
                                    className="showcase-page__eyebrow"
                                    variant="label"
                                    tone="accent"
                                >
                                    {`${showcaseLabel(group.label, locale)} · ${showcaseLabel(section.label, locale)}`}
                                </Text>
                                <Text
                                    as="h1"
                                    className="showcase-page__title"
                                    id="showcase-page-title"
                                    ref={pageTitleRef}
                                    tabIndex={-1}
                                    variant="h1"
                                >
                                    {localizedTitle}
                                </Text>
                                <Text className="showcase-page__lead" variant="body" tone="muted">
                                    {localizedDescription}
                                </Text>
                            </header>
                            {entry.anchor === (void 0) ? null : (
                                <div className="showcase-page__focus">
                                    <span className="showcase-page__focus-copy">
                                        <Text variant="label" tone="accent">
                                            {localizeComponentName(entry.label, locale)}
                                        </Text>
                                        <Text variant="body-sm" tone="muted">
                                            {`${shell.liveDemo} · ${demoLabel}`}
                                        </Text>
                                    </span>
                                    <Text variant="body-sm" tone="muted">
                                        {shell.fullFamily}
                                    </Text>
                                </div>
                            )}
                            <ShowcaseFocusContext.Provider value={entry.anchor ?? ""}>
                                <Page />
                            </ShowcaseFocusContext.Provider>
                            <footer className="showcase-page__footer">
                                <Anchor
                                    href="#main-content"
                                    onNavigate={(
                                        href: string,
                                        event: MouseEvent<HTMLAnchorElement>,
                                    ): void => {
                                        event.preventDefault();
                                        void href;
                                        mainRef.current?.parentElement?.scrollTo({
                                            top: 0,
                                            behavior: "smooth",
                                        });
                                    }}
                                >
                                    {shell.backToTop}
                                </Anchor>
                            </footer>
                        </article>
                    </main>
                }
            />
                    </div>
                    <Dialog
                        open={aboutOpen}
                        size="sm"
                        title={shell.aboutTitle}
                        eyebrow={shell.designSystem}
                        onClose={(): void => setAboutOpen(false)}
                        footer={
                            <Button onClick={(): void => setAboutOpen(false)}>{shell.close}</Button>
                        }
                    >
                        <div className="showcase-about">
                            <p>
                                {isChinese ? "Periodicity React" : "Periodicity React"}{" "}
                                <strong>0.1.0</strong>
                                {isChinese ? " · Apache 2.0 许可证" : " · Apache License 2.0"}
                            </p>
                            <p>
                                {shell.aboutLead}
                            </p>
                            <p className="showcase-about__links">
                                <Link
                                    href="https://github.com/eloyhere/periodicity-react"
                                    external
                                >
                                    GitHub
                                </Link>
                                <Link
                                    href="https://www.npmjs.com/package/periodicity-react"
                                    external
                                >
                                    npm
                                </Link>
                            </p>
                            <h3>{shell.dependencies}</h3>
                            <ul>
                                <li>React 19 / React DOM 19</li>
                                <li>CodeMirror 6</li>
                                <li>TypeScript / Vite / Rolldown</li>
                            </ul>
                        </div>
                    </Dialog>
                </ToastProvider>
            </International>
        </Theme>
    );
};

export default Showcase;
