import {
    Children,
    cloneElement,
    isValidElement,
    type FC,
    type ReactElement,
    type ReactNode,
    type SVGProps,
} from "react";
import { usePrefersReducedMotion } from "../../animation/usePrefersReducedMotion";
import { actionIcons, type ActionIconName } from "./action";
import { interactionIcons, type InteractionIconName } from "./interaction";
import { toolIcons, type ToolIconName } from "./tool";
import { weatherIcons, type WeatherIconName } from "./weather";
import { emotionIcons, type EmotionIconName } from "./emotion";
import { natureIcons, type NatureIconName } from "./nature";
import { foodIcons, type FoodIconName } from "./food";
import { communicationIcons, type CommunicationIconName } from "./communication";
import { mediaIcons, type MediaIconName } from "./media";
import { travelIcons, type TravelIconName } from "./travel";
import { businessIcons, type BusinessIconName } from "./business";
import { fileIcons, type FileIconName } from "./file";
import { deviceIcons, type DeviceIconName } from "./device";
import { healthIcons, type HealthIconName } from "./health";
import { timeIcons, type TimeIconName } from "./time";
import { securityIcons, type SecurityIconName } from "./security";
import { socialIcons, type SocialIconName } from "./social";
import { educationIcons, type EducationIconName } from "./education";
import { financeIcons, type FinanceIconName } from "./finance";
import { musicIcons, type MusicIconName } from "./music";
import { sportIcons, type SportIconName } from "./sport";
import { celebrationIcons, type CelebrationIconName } from "./celebration";
import { animalIcons, type AnimalIconName } from "./animal";
import { transportIcons, type TransportIconName } from "./transport";
import { uiIcons, type UiIconName } from "./ui";
import { agentIcons, type AgentIconName } from "./agent";
import { companyIcons, type CompanyIconName } from "./company";
import { motionIcons, type MotionIconName } from "./motion";
import { mathIcons, type MathIconName } from "./math";
import { liveIcons, type LiveIconName } from "./live";
import { dynamicIcons, type DynamicIconName } from "./dynamic";
import { motionExtraIcons, type MotionExtraIconName } from "./motion-extra";
import { liveExtraIcons, type LiveExtraIconName } from "./live-extra";
import { dynamicExtraIcons, type DynamicExtraIconName } from "./dynamic-extra";
import { computerIcons, type ComputerIconName } from "./computer";
import { programmingIcons, type ProgrammingIconName } from "./programming";
import { electronicsIcons, type ElectronicsIconName } from "./electronics";
import { plantIcons, type PlantIconName } from "./plant";
import type { Icon as IconDefinition } from "./types";
import "./Icon.css";

export type IconName =
    | ActionIconName
    | InteractionIconName
    | ToolIconName
    | WeatherIconName
    | EmotionIconName
    | NatureIconName
    | FoodIconName
    | CommunicationIconName
    | MediaIconName
    | TravelIconName
    | BusinessIconName
    | FileIconName
    | DeviceIconName
    | HealthIconName
    | TimeIconName
    | SecurityIconName
    | SocialIconName
    | EducationIconName
    | FinanceIconName
    | MusicIconName
    | SportIconName
    | CelebrationIconName
    | AnimalIconName
    | TransportIconName
    | UiIconName
    | AgentIconName
    | CompanyIconName
    | MotionIconName
    | MathIconName
    | LiveIconName
    | DynamicIconName
    | MotionExtraIconName
    | LiveExtraIconName
    | DynamicExtraIconName
    | ComputerIconName
    | ProgrammingIconName
    | ElectronicsIconName
    | PlantIconName;

const glyphs: Record<IconName, IconDefinition> = {
    ...actionIcons,
    ...interactionIcons,
    ...toolIcons,
    ...weatherIcons,
    ...emotionIcons,
    ...natureIcons,
    ...foodIcons,
    ...communicationIcons,
    ...mediaIcons,
    ...travelIcons,
    ...businessIcons,
    ...fileIcons,
    ...deviceIcons,
    ...healthIcons,
    ...timeIcons,
    ...securityIcons,
    ...socialIcons,
    ...educationIcons,
    ...financeIcons,
    ...musicIcons,
    ...sportIcons,
    ...celebrationIcons,
    ...animalIcons,
    ...transportIcons,
    ...uiIcons,
    ...agentIcons,
    ...companyIcons,
    ...motionIcons,
    ...mathIcons,
    ...liveIcons,
    ...dynamicIcons,
    ...motionExtraIcons,
    ...liveExtraIcons,
    ...dynamicExtraIcons,
    ...computerIcons,
    ...programmingIcons,
    ...electronicsIcons,
    ...plantIcons,
};

export interface IconProps extends SVGProps<SVGSVGElement> {
    name: IconName;
    size?: number;
    motion?: "auto" | "always";
}

const isAnimationNode: (element: ReactElement) => boolean = (element: ReactElement): boolean =>
    typeof element.type === "string" &&
    (element.type === "animate" ||
        element.type === "animateTransform" ||
        element.type === "animateMotion");

const stripAnimationNodes: (node: ReactNode) => ReactNode = (node: ReactNode): ReactNode => {
    if (!isValidElement(node)) {
        return node;
    }

    const element: ReactElement<{ children?: ReactNode }> = node as ReactElement<{
        children?: ReactNode;
    }>;

    if (isAnimationNode(element)) {
        return null;
    }

    const children: ReactNode | undefined = element.props.children;

    if (children === (void 0)) {
        return element;
    }

    return cloneElement(element, element.props, Children.map(children, stripAnimationNodes));
};

const Icon: FC<IconProps> = ({ name, size, motion = "auto", className = "", ...rest }: IconProps) => {
    // The catalogue and the glyph registry are separate modules. During an HMR
    // update one can briefly be newer than the other, so an unknown name must
    // fall back instead of crashing the whole page.
    const glyph: IconDefinition | undefined = (glyphs as Record<string, IconDefinition>)[name];
    const resolvedGlyph: IconDefinition = glyph ?? glyphs.Help;
    const prefersReducedMotion: boolean = usePrefersReducedMotion();
    const content: ReactNode =
        prefersReducedMotion && motion !== "always"
            ? stripAnimationNodes(resolvedGlyph.component)
            : resolvedGlyph.component;

    return (
        <svg
            width={size ?? resolvedGlyph.size}
            height={size ?? resolvedGlyph.size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            data-icon={name}
            data-icon-fallback={glyph === (void 0) ? "true" : (void 0)}
            data-icon-motion={motion}
            className={`icon ${className}`.trim()}
            {...rest}
        >
            {content}
        </svg>
    );
};

export default Icon;
