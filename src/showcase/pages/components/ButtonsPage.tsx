import type { FC, ReactNode } from "react";
import {
    Button,
    type ButtonSize,
    type ButtonVariant,
} from "../../../component";
import { useToast } from "../../../component/toast/ToastContext";
import type { ToastApi } from "../../../component/toast/ToastContext";
import Demo, { DemoGroup } from "../../Demo";

const rippleCode: string = `<Button>Primary</Button>
<Button variant="outline" icon="Plus">Outline</Button>
<Button variant="ghost" trailingIcon="ArrowUpRight">Ghost</Button>
<Button variant="quiet" icon="Setting" aria-label="Settings" />

<Button
    variant="outline"
    rippleTrigger="context"
    onContextMenu={() => {
        toast.show({
            title: "Context ripple",
            description: "Right-click spawned a ripple.",
        });
    }}
>
    Context ripple
</Button>

<Button disabled>Disabled</Button>`;

const variantsCode: string = `<Button variant="solid">solid</Button>
<Button variant="outline">outline</Button>
<Button variant="ghost">ghost</Button>
<Button variant="quiet">quiet</Button>`;

const sizesCode: string = `<Button size="sm">Size sm</Button>
<Button size="md">Size md</Button>
<Button size="lg">Size lg</Button>`;

const iconsCode: string = `<Button icon="Plus">Leading icon</Button>
<Button trailingIcon="ArrowUpRight">Trailing icon</Button>
<Button variant="outline" icon="Search" aria-label="Search" />
<Button variant="quiet" icon="More" aria-label="More actions" />
<Button disabled>Disabled</Button>`;

const buttonVariants: readonly ButtonVariant[] = ["solid", "outline", "ghost", "quiet"];

const buttonSizes: readonly ButtonSize[] = ["sm", "md", "lg"];

/**
 * Documents every button variant, size, icon slot, and ripple trigger.
 * @example
 * <ButtonsPage />
 * @returns The Buttons entry.
 */
const ButtonsPage: FC = () => {
    const toast: ToastApi = useToast();

    return (
        <>
            <Demo
                title="Buttons and ripple"
                description="Hover and click ripples; a context ripple fires on right-click."
                code={rippleCode}
                layout="row"
            >
                <Button>Primary</Button>
                <Button variant="outline" icon="Plus">
                    Outline
                </Button>
                <Button variant="ghost" trailingIcon="ArrowUpRight">
                    Ghost
                </Button>
                <Button variant="quiet" icon="Setting" aria-label="Settings" />
                <Button
                    rippleTrigger="context"
                    variant="outline"
                    onContextMenu={(): void => {
                        toast.show({
                            title: "Context ripple",
                            description: "Right-click spawned a ripple.",
                        });
                    }}
                >
                    Context ripple
                </Button>
                <Button disabled>Disabled</Button>
            </Demo>

            <Demo title="Variants" code={variantsCode}>
                <DemoGroup label="Variants">
                    {buttonVariants.map((variant: ButtonVariant): ReactNode => (
                        <Button key={variant} variant={variant}>
                            {variant}
                        </Button>
                    ))}
                </DemoGroup>
            </Demo>

            <Demo title="Sizes" code={sizesCode}>
                <DemoGroup label="Sizes">
                    {buttonSizes.map((size: ButtonSize): ReactNode => (
                        <Button key={size} size={size}>
                            Size {size}
                        </Button>
                    ))}
                </DemoGroup>
            </Demo>

            <Demo
                title="Icons and states"
                description="Leading and trailing icon slots, icon-only buttons, and the disabled state."
                code={iconsCode}
            >
                <DemoGroup label="Icons and states">
                    <Button icon="Plus">Leading icon</Button>
                    <Button trailingIcon="ArrowUpRight">Trailing icon</Button>
                    <Button variant="outline" icon="Search" aria-label="Search" />
                    <Button variant="quiet" icon="More" aria-label="More actions" />
                    <Button disabled>Disabled</Button>
                </DemoGroup>
            </Demo>
        </>
    );
};

export default ButtonsPage;
