import type { FC, SVGProps } from "react";
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
    | CompanyIconName;

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
};

interface IconProps extends SVGProps<SVGSVGElement> {
    name: IconName;
    size?: number;
}

const Icon: FC<IconProps> = ({ name, size, className = "", ...rest }: IconProps) => {
    const glyph: IconDefinition = glyphs[name];

    return (
        <svg
            width={size ?? glyph.size}
            height={size ?? glyph.size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            className={`icon ${className}`.trim()}
            {...rest}
        >
            {glyph.component}
        </svg>
    );
};

export default Icon;
