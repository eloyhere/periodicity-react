import {
    useEffect,
    useId,
    useRef,
    useState,
    type Dispatch,
    type FC,
    type ReactNode,
    type RefObject,
    type SetStateAction,
} from "react";
import Button from "../component/button/Button";
import Text from "../component/text/Text";
import "./Demo.css";

/**
 * How a demo lays out its live preview.
 * Type: type alias.
 * Values: "stack" (vertical flow) or "row" (wrapped inline row).
 * @example
 * const layout: DemoLayout = "row";
 */
export type DemoLayout = "stack" | "row";

/**
 * Props for one documentation demo.
 * Type: interface.
 * Fields: title, description, code, layout, children.
 * @example
 * <Demo title="Buttons" code="<Button>Save</Button>">
 *     <Button>Save</Button>
 * </Demo>
 */
export interface DemoProps {
    title: string;
    description?: string;
    code: string;
    layout?: DemoLayout;
    children: ReactNode;
}

/**
 * Props for the copyable code sample.
 * Type: interface.
 * Fields: code, label, language.
 * @example
 * <CodeBlock code="<Button>Save</Button>" />
 */
export interface CodeBlockProps {
    code: string;
    label?: string;
    language?: string;
}

/**
 * Props for a labelled row inside a demo preview.
 * Type: interface.
 * Fields: label, children.
 * @example
 * <DemoGroup label="Sizes"><Button size="sm">Small</Button></DemoGroup>
 */
export interface DemoGroupProps {
    label: string;
    children: ReactNode;
}

const CopyResetDelay: number = 1600;

/**
 * Renders a monospaced code sample with a clipboard action.
 * The sample itself is deliberately not selectable, matching the house rule
 * that only Text and form controls can be selected.
 * @param props - Code sample, accessible label, and language caption.
 * @example
 * <CodeBlock code={'<Button variant="outline">Save</Button>'} />
 * @returns A code block with a Copy button.
 */
export const CodeBlock: FC<CodeBlockProps> = ({
    code,
    label = "Code example",
    language = "TSX",
}: CodeBlockProps) => {
    const [copied, setCopied]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false);
    const timerRef: RefObject<number | null> = useRef<number | null>(null);

    useEffect((): (() => void) => {
        return (): void => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    const handleCopy: () => Promise<void> = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);

            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
            }

            timerRef.current = window.setTimeout((): void => {
                setCopied(false);
            }, CopyResetDelay);
        } catch {
            // Clipboard access can be denied by permissions; the sample stays on screen.
        }
    };

    return (
        <div className="code-block">
            <div className="code-block__bar">
                <span className="code-block__language">{language}</span>
                <Button
                    aria-label={copied ? `${label} copied` : `Copy ${label}`}
                    icon={copied ? "Check" : "Clipboard"}
                    onClick={handleCopy}
                    size="sm"
                    variant="ghost"
                >
                    {copied ? "Copied" : "Copy"}
                </Button>
            </div>
            <pre
                className="code-block__pre"
                tabIndex={0}
                role="region"
                aria-label={`${label} source code`}
            >
                <code className="code-block__code">{code}</code>
            </pre>
            <span className="code-block__status" role="status" aria-live="polite">
                {copied ? "Copied to clipboard" : ""}
            </span>
        </div>
    );
};

/**
 * Renders a labelled row of examples inside a demo preview.
 * @param props - Group label and demo content.
 * @example
 * <DemoGroup label="Variants"><Button variant="outline">Outline</Button></DemoGroup>
 * @returns A labelled demo row.
 */
export const DemoGroup: FC<DemoGroupProps> = ({ label, children }: DemoGroupProps) => (
    <div className="demo__group">
        <Text variant="label" tone="muted">
            {label}
        </Text>
        <div className="demo__group-row">{children}</div>
    </div>
);

/**
 * Renders one documentation demo: a live preview followed by its copyable source.
 * The preview and the code sample are supplied together, so the documentation
 * always shows the markup that produced what the reader can see.
 * @param props - Demo identity, code sample, layout, and preview content.
 * @example
 * <Demo title="Ghost action" code={'<Button variant="ghost">Open</Button>'}>
 *     <Button variant="ghost">Open</Button>
 * </Demo>
 * @returns A demo card with a preview and a code block.
 */
const Demo: FC<DemoProps> = ({
    title,
    description,
    code,
    layout = "stack",
    children,
}: DemoProps) => {
    const titleId: string = useId();
    const previewClassName: string =
        layout === "row" ? "demo__preview demo__preview--row" : "demo__preview";

    return (
        <section className="demo" aria-labelledby={titleId}>
            <header className="demo__header">
                <Text as="h2" id={titleId} variant="h4">
                    {title}
                </Text>
                {description === (void 0) ? null : (
                    <Text className="demo__description" variant="body-sm" tone="muted">
                        {description}
                    </Text>
                )}
            </header>
            <div className={previewClassName}>{children}</div>
            <CodeBlock code={code} label={title} />
        </section>
    );
};

export default Demo;
