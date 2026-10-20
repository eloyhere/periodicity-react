import { useMemo, type FC, type HTMLAttributes, type ReactNode, type Ref } from "react";
import cx from "../foundation/cx";
import useControllableState from "../foundation/useControllableState";
import VisuallyHidden from "../foundation/VisuallyHidden";
import Icon from "../icon/Icon";
import Surface, { type RippleOptions } from "../surface/Surface";
import { useInternational, type InternationalContextValue } from "../../international";
import "./Pagination.css";

/**
 * One slot of the generated page list.
 * Type: type alias.
 * Fields:
 * - `number`: A clickable page number.
 * - `"start-ellipsis"`: Pages hidden before the window.
 * - `"end-ellipsis"`: Pages hidden after the window.
 * @example
 * const token: PaginationToken = "start-ellipsis";
 */
type PaginationToken = number | "start-ellipsis" | "end-ellipsis";

/**
 * Props for the Pagination component.
 * Type: interface.
 * Extends the native `nav` attributes, so `id`, `style`, `title`, `aria-*`, `data-*`, `tabIndex`, and
 * pointer, mouse, keyboard, and focus handlers are forwarded to the navigation landmark.
 * Fields:
 * - `page`: Controlled current page, one-based.
 * - `defaultPage`: Uncontrolled initial page; defaults to `1`.
 * - `pageCount`: Total number of pages.
 * - `onPageChange`: Called with the next requested page.
 * - `siblingCount`: Pages shown on each side of the current page.
 * - `showEdges`: Whether the first and last page shortcuts are rendered.
 * - `size`: Control size; defaults to `md`.
 * - `disabled`: Disables every control.
 * - `label`: Accessible name of the landmark; defaults to the localised Pagination label.
 * - `previousLabel`: Accessible name of the previous control; defaults to the localised Previous label.
 * - `nextLabel`: Accessible name of the next control; defaults to the localised Next label.
 * - `ellipsisLabel`: Screen-reader text for a skipped range; defaults to the localised More label.
 * - `className`: Extra class names for the navigation element.
 * @example
 * <Pagination page={3} pageCount={20} onPageChange={setPage} />
 * @example
 * <Pagination defaultPage={1} pageCount={8} onPageChange={setPage} />
 */
export interface PaginationProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "className"> {
    page?: number;
    defaultPage?: number;
    pageCount: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
    showEdges?: boolean;
    size?: "sm" | "md";
    disabled?: boolean;
    label?: string;
    previousLabel?: string;
    nextLabel?: string;
    ellipsisLabel?: string;
    className?: string;
    ref?: Ref<HTMLElement>;
}

/**
 * Builds an inclusive list of page numbers.
 * @param start - First page number.
 * @param end - Last page number.
 * @example
 * const pages: number[] = rangeToArray(1, 3);
 * @returns Page numbers from `start` to `end`, both included.
 */
const rangeToArray: (start: number, end: number) => number[] = (start: number, end: number): number[] => {
    const values: number[] = [];

    for (let value: number = start; value <= end; value += 1) {
        values.push(value);
    }

    return values;
};

/**
 * Collapses a page range into numbers and ellipsis markers.
 * @param activePage - Current page, already clamped.
 * @param totalPages - Total number of pages.
 * @param siblingCount - Pages shown on each side of the current page.
 * @param showEdges - Whether the first and last page shortcuts are rendered.
 * @example
 * const tokens: readonly PaginationToken[] = buildPageTokens(5, 20, 1, true);
 * @returns Page numbers with at most two ellipsis markers.
 */
const buildPageTokens: (
    activePage: number,
    totalPages: number,
    siblingCount: number,
    showEdges: boolean,
) => readonly PaginationToken[] = (
    activePage: number,
    totalPages: number,
    siblingCount: number,
    showEdges: boolean,
): readonly PaginationToken[] => {
    const siblings: number = Math.max(0, siblingCount);
    const windowSize: number = siblings * 2 + 5;

    if (totalPages <= windowSize) {
        return rangeToArray(1, totalPages);
    }

    const leftSibling: number = Math.max(activePage - siblings, 1);
    const rightSibling: number = Math.min(activePage + siblings, totalPages);
    const hasStartGap: boolean = leftSibling > 2;
    const hasEndGap: boolean = rightSibling < totalPages - 1;

    if (!hasStartGap && !hasEndGap) {
        return rangeToArray(1, totalPages);
    }

    if (!hasStartGap) {
        const head: PaginationToken[] = rangeToArray(1, Math.min(totalPages, siblings * 2 + 3));

        return showEdges ? [...head, "end-ellipsis", totalPages] : [...head, "end-ellipsis"];
    }

    if (!hasEndGap) {
        const tailLength: number = siblings * 2 + 3;
        const tail: PaginationToken[] = rangeToArray(Math.max(1, totalPages - tailLength + 1), totalPages);

        return showEdges ? [1, "start-ellipsis", ...tail] : ["start-ellipsis", ...tail];
    }

    const middle: PaginationToken[] = rangeToArray(leftSibling, rightSibling);

    return showEdges
        ? [1, "start-ellipsis", ...middle, "end-ellipsis", totalPages]
        : ["start-ellipsis", ...middle, "end-ellipsis"];
};

/**
 * Renders a pagination landmark with previous, next, numbered, and skipped pages.
 * @param props - Current page, page count, change handler, range settings, size, labels, and native
 * navigation attributes.
 * @example
 * <Pagination page={page} pageCount={12} onPageChange={setPage} />
 * @returns The pagination navigation, or nothing when `pageCount` is below one.
 */
const Pagination: FC<PaginationProps> = ({
    page,
    defaultPage = 1,
    pageCount,
    onPageChange,
    siblingCount = 1,
    showEdges = true,
    size = "md",
    disabled = false,
    label,
    previousLabel,
    nextLabel,
    ellipsisLabel,
    className = "",
    ref,
    ...rest
}: PaginationProps): ReactNode => {
    const { t }: InternationalContextValue = useInternational();
    const resolvedLabel: string = label ?? t("pagination");
    const resolvedPreviousLabel: string = previousLabel ?? t("previous");
    const resolvedNextLabel: string = nextLabel ?? t("next");
    const resolvedEllipsisLabel: string = ellipsisLabel ?? t("more");
    const [currentPage, setCurrentPage]: readonly [number, (next: number) => void] =
        useControllableState<number>({
            value: page,
            defaultValue: defaultPage,
            onChange: onPageChange,
        });
    const safePageCount: number = Number.isFinite(pageCount) ? Math.floor(pageCount) : 0;
    const totalPages: number = Math.max(1, safePageCount);
    const siblings: number = Number.isFinite(siblingCount) ? Math.max(0, Math.floor(siblingCount)) : 0;
    const activePage: number = Math.min(
        Math.max(1, Number.isFinite(currentPage) ? Math.floor(currentPage) : 1),
        totalPages,
    );
    const tokenList: readonly PaginationToken[] = useMemo<readonly PaginationToken[]>(
        () => buildPageTokens(activePage, totalPages, siblings, showEdges),
        [activePage, siblings, showEdges, totalPages],
    );
    const iconSize: number = size === "sm" ? 14 : 16;
    const isPreviousDisabled: boolean = disabled || activePage <= 1;
    const isNextDisabled: boolean = disabled || activePage >= totalPages;
    const ripple: RippleOptions = {
        layer: "foreground",
        trigger: ["hover", "click"],
    };

    const goToPage: (nextPage: number) => void = (nextPage: number): void => {
        const target: number = Math.min(Math.max(1, Math.floor(nextPage)), totalPages);

        if (disabled || target === activePage) {
            return;
        }

        setCurrentPage(target);
    };

    if (safePageCount < 1) {
        return null;
    }

    return (
        <nav
            ref={ref}
            className={cx("pagination", `pagination--${size}`, className)}
            aria-label={resolvedLabel}
            data-disabled={disabled ? "true" : "false"}
            {...rest}
        >
            <ul className="pagination__list">
                <li className="pagination__item">
                    <Surface
                        className={cx(
                            "pagination__surface",
                            isPreviousDisabled && "pagination__surface--disabled",
                        )}
                        disabled={isPreviousDisabled}
                        ripple={ripple}
                    >
                        <button
                            type="button"
                            className="pagination__button pagination__button--edge"
                            aria-label={resolvedPreviousLabel}
                            disabled={isPreviousDisabled}
                            onClick={(): void => {
                                goToPage(activePage - 1);
                            }}
                        >
                            <Icon name="ChevronLeft" size={iconSize} />
                        </button>
                    </Surface>
                </li>
                {tokenList.map((token: PaginationToken, tokenIndex: number): ReactNode => {
                    if (typeof token === "string") {
                        return (
                            <li key={`pagination-ellipsis-${tokenIndex}`} className="pagination__item">
                                <span className="pagination__ellipsis" aria-hidden="true">
                                    …
                                </span>
                                <VisuallyHidden>{resolvedEllipsisLabel}</VisuallyHidden>
                            </li>
                        );
                    }

                    const isCurrent: boolean = token === activePage;

                    return (
                        <li key={`pagination-page-${token}`} className="pagination__item">
                            <Surface
                                className={cx(
                                    "pagination__surface",
                                    isCurrent && "pagination__surface--current",
                                )}
                                disabled={disabled}
                                ripple={ripple}
                            >
                                <button
                                    type="button"
                                    className="pagination__button"
                                    aria-label={t("pageOf", { page: token, pages: totalPages })}
                                    aria-current={isCurrent ? "page" : (void 0)}
                                    disabled={disabled}
                                    onClick={(): void => {
                                        goToPage(token);
                                    }}
                                >
                                    {token}
                                </button>
                            </Surface>
                        </li>
                    );
                })}
                <li className="pagination__item">
                    <Surface
                        className={cx("pagination__surface", isNextDisabled && "pagination__surface--disabled")}
                        disabled={isNextDisabled}
                        ripple={ripple}
                    >
                        <button
                            type="button"
                            className="pagination__button pagination__button--edge"
                            aria-label={resolvedNextLabel}
                            disabled={isNextDisabled}
                            onClick={(): void => {
                                goToPage(activePage + 1);
                            }}
                        >
                            <Icon name="ChevronRight" size={iconSize} />
                        </button>
                    </Surface>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;
