import type {
  HTMLAnchorAttributes,
  HTMLButtonAttributes,
} from "svelte/elements";
import { type VariantProps, tv } from "tailwind-variants";

import type { WithElementRef } from "../utils.js";

export const buttonVariants = tv({
  base: "mira-ui-button",
  variants: {
    variant: {
      default: "mira-ui-button--default",
      destructive: "mira-ui-button--destructive",
      outline: "mira-ui-button--outline",
      secondary: "mira-ui-button--secondary",
      ghost: "mira-ui-button--ghost",
      link: "mira-ui-button--link",
    },
    size: {
      default: "mira-ui-button--default-size",
      sm: "mira-ui-button--sm",
      xs: "mira-ui-button--xs",
      lg: "mira-ui-button--lg",
      icon: "mira-ui-button--icon",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
  WithElementRef<HTMLAnchorAttributes> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  };
