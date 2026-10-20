import type { FC } from "react";
import Alert, { type AlertProps } from "./Alert";

/**
 * Props for the Banner component; identical to Alert.
 * Type: type alias.
 * Fields: tone, title, description, icon, action, dismissible, onDismiss, className.
 * @example
 * const props: BannerProps = { tone: "warning", title: "Storage almost full" };
 */
export type BannerProps = AlertProps;

/**
 * Renders a page-level message using the Alert surface and semantics.
 * @param props - Tone, title, description, icon, action, dismissal, and class name.
 * @example
 * <Banner tone="danger" title="Sync failed" description="Retry when you are back online." />
 * @returns An alert-style banner element.
 */
const Banner: FC<BannerProps> = (props: BannerProps) => <Alert {...props} />;

export default Banner;
