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
<Button variant="outline" prefix="Plus" content="Outline" />
<Button variant="ghost" suffix="ArrowUpRight" content="Ghost" />
<Button variant="quiet" prefix="Setting" aria-label="Settings" />

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

const iconsCode: string = `<Button prefix="Plus" content="Leading icon" />
<Button suffix="ArrowUpRight" content="Trailing icon" />
<Button prefix="Plus" content="Both slots" suffix="ArrowUpRight" />
<Button variant="outline" prefix="Search" aria-label="Search" />
<Button variant="quiet" prefix="More" aria-label="More actions" />
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
                <Button variant="outline" prefix="Plus" content="Outline" />
                <Button variant="ghost" suffix="ArrowUpRight" content="Ghost" />
                <Button variant="quiet" prefix="Setting" aria-label="Settings" />
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
                title="Slots and states"
                description="Prefix, content, and suffix slots; icon-only buttons; and the disabled state."
                code={iconsCode}
            >
                <DemoGroup label="Slots and states">
                    <Button prefix="Plus" content="Leading icon" />
                    <Button suffix="ArrowUpRight" content="Trailing icon" />
                    <Button prefix="Plus" content="Both slots" suffix="ArrowUpRight" />
                    <Button variant="outline" prefix="Search" aria-label="Search" />
                    <Button variant="quiet" prefix="More" aria-label="More actions" />
                    <Button disabled>Disabled</Button>
                </DemoGroup>
            </Demo>
        </>
    );
};

export default ButtonsPage;
