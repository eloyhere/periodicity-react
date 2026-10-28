import type { FC } from "react";
import VideoPlayer, { type VideoProps } from "./VideoPlayer";

/**
 * Props for the VerticalVideo component.
 * Type: type alias.
 * Fields: every `VideoProps` field; see that interface for the shared media contract.
 * @example
 * const props: VerticalVideoProps = { src: "/short.mp4", label: "Short film" };
 */
export type VerticalVideoProps = VideoProps;

/**
 * 9:16 frame used when the caller does not pass `aspectRatio`.
 * Type: constant.
 * Fields: none.
 * @example
 * const ratio: number = VerticalRatio;
 */
const VerticalRatio: number = 9 / 16;

/**
 * Renders the portrait player: a 9:16 stage with a right-hand action stack, a time badge, and a slim
 * progress rail along the bottom edge.
 * @param props - Shared video props; `aspectRatio` defaults to 9:16 and can be overridden.
 * @example
 * <VerticalVideo src="/short.mp4" label="Short film" caption="Portrait cut." />
 * @returns A portrait player.
 */
const VerticalVideo: FC<VerticalVideoProps> = ({ aspectRatio = VerticalRatio, ...rest }: VerticalVideoProps) => (
    <VideoPlayer {...rest} layout="vertical" aspectRatio={aspectRatio} />
);

export default VerticalVideo;
