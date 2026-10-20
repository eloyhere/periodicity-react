import {
    useEffect,
    useState,
    type Dispatch,
    type FC,
    type SetStateAction,
} from "react";
import { ToastProvider } from "../component";
import Text from "../component/text/Text";
import ShowcaseNav from "./ShowcaseNav";
import { ShowcaseFocusContext } from "./focus";
import {
    findEntry,
    findGroup,
    findSection,
    resolveEntryId,
    type ShowcaseEntry,
    type ShowcaseGroup,
    type ShowcaseSection,
} from "./registry";
import "./Foundations.css";
import "./Showcase.css";

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
    const demoLabel: string = entry.demoTitle ?? entry.title;
    const Page: FC = entry.page;

    useEffect((): void => {
        document.title = `${entry.title} · Periodicity`;
    }, [entry.title]);

    useEffect((): void => {
        const anchor: string | void = entry.anchor;

        if (anchor === (void 0)) {
            window.scrollTo({ top: 0, behavior: "auto" });
            return;
        }

        const target: HTMLElement | null = document.getElementById(anchor);

        if (target === null) {
            window.scrollTo({ top: 0, behavior: "auto" });
            return;
        }

        target.scrollIntoView({ block: "start", behavior: "auto" });
    }, [entry.anchor, entry.id]);

    return (
        <ToastProvider>
            <div className="showcase-shell">
                <ShowcaseNav activeId={entry.id} onNavigate={navigate} />
                <main className="showcase-main">
                    <article className="showcase-page" key={entry.id}>
                        <header className="showcase-page__header">
                            <Text className="showcase-page__eyebrow" variant="label" tone="accent">
                                {`${group.label} · ${section.label}`}
                            </Text>
                            <Text as="h1" className="showcase-page__title" variant="h1">
                                {entry.title}
                            </Text>
                            <Text className="showcase-page__lead" variant="body" tone="muted">
                                {entry.description}
                            </Text>
                        </header>
                        {entry.anchor === (void 0) ? null : (
                            <div className="showcase-page__focus">
                                <span className="showcase-page__focus-copy">
                                    <Text variant="label" tone="accent">
                                        {entry.label}
                                    </Text>
                                    <Text variant="body-sm" tone="muted">
                                        {`Live demo · ${demoLabel}`}
                                    </Text>
                                </span>
                                <Text variant="body-sm" tone="muted">
                                    The full family page stays below.
                                </Text>
                            </div>
                        )}
                        <ShowcaseFocusContext.Provider value={entry.anchor ?? ""}>
                            <Page />
                        </ShowcaseFocusContext.Provider>
                    </article>
                </main>
            </div>
        </ToastProvider>
    );
};

export default Showcase;
