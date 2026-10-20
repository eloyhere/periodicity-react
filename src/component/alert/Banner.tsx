import type { FC } from "react";
import Alert, { type AlertProps } from "./Alert";

/**
 * Props for the Banner component; identical to Alert.
 * Type: type alias.
 * Fields: tone, title, description, icon, action, dismissible, onDismiss, visible, defaultVisible,
 * onVisibleChange, className, ref, plus native div attributes.
 * @example
 * const props: BannerProps = { tone: "warning", title: "Storage almost full" };
 */
export type BannerProps = AlertProps;

/**
 * Renders a page-level message using the Alert surface and semantics.
 * Visibility control, dismissal reasons, refs, and native attributes are inherited from `AlertProps`.
 * @param props - Tone, title, description, icon, action, dismissal, visibility, and native attributes.
 * @example
 * <Banner tone="danger" title="Sync failed" description="Retry when you are back online." />
 * @returns An alert-style banner element.
 */
const Banner: FC<BannerProps> = (props: BannerProps) => <Alert {...props} />;

export default Banner;
