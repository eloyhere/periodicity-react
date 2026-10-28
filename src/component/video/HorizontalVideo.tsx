import type { FC } from "react";
import VideoPlayer, { type VideoProps } from "./VideoPlayer";

/**
 * Props for the HorizontalVideo component.
 * Type: type alias.
 * Fields: every `VideoProps` field; see that interface for the shared media contract.
 * @example
 * const props: HorizontalVideoProps = { src: "/launch.mp4", label: "Launch film" };
 */
export type HorizontalVideoProps = VideoProps;

/**
 * 16:9 frame used when the caller does not pass `aspectRatio`.
 * Type: constant.
 * Fields: none.
 * @example
 * const ratio: number = HorizontalRatio;
 */
const HorizontalRatio: number = 16 / 9;

/**
 * Renders the landscape player: a 16:9 stage with the control bar along the bottom edge.
 * @param props - Shared video props; `aspectRatio` defaults to 16:9 and can be overridden.
 * @example
 * <HorizontalVideo src="/launch.mp4" label="Launch film" caption="Recorded in one take." />
 * @returns A landscape player.
 */
const HorizontalVideo: FC<HorizontalVideoProps> = ({
    aspectRatio = HorizontalRatio,
    ...rest
}: HorizontalVideoProps) => <VideoPlayer {...rest} layout="horizontal" aspectRatio={aspectRatio} />;

export default HorizontalVideo;
