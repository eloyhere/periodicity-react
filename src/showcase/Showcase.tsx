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
import {
    findEntry,
    findGroup,
    resolveEntryId,
    type ShowcaseEntry,
    type ShowcaseGroup,
} from "./registry";
import "./Foundations.css";
import "./Showcase.css";

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

    useEffect((): void => {
        window.scrollTo({ top: 0, behavior: "auto" });
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
    const Page: FC = entry.page;

    useEffect((): void => {
        document.title = `${entry.title} · Periodicity`;
    }, [entry.title]);

    return (
        <ToastProvider>
            <div className="showcase-shell">
                <ShowcaseNav activeId={entry.id} onNavigate={navigate} />
                <main className="showcase-main">
                    <article className="showcase-page" key={entry.id}>
                        <header className="showcase-page__header">
                            <Text
                                className="showcase-page__eyebrow"
                                variant="label"
                                tone="accent"
                            >
                                {group.label}
                            </Text>
                            <Text as="h1" className="showcase-page__title" variant="h1">
                                {entry.title}
                            </Text>
                            <Text className="showcase-page__lead" variant="body" tone="muted">
                                {entry.description}
                            </Text>
                        </header>
                        <Page />
                    </article>
                </main>
            </div>
        </ToastProvider>
    );
};

export default Showcase;
