import { cn } from "../utils";

export type ButtonVariant = "default" | "outline" | "ghost" | "secondary";
export type ButtonSize = "default" | "sm" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default: "mira-button--default",
  outline: "mira-button--outline",
  ghost: "mira-button--ghost",
  secondary: "mira-button--secondary",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "mira-button--default-size",
  sm: "mira-button--sm",
  icon: "mira-button--icon",
};

export function buttonVariants(
  options: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    class?: string;
  } = {},
): string {
  return cn(
    "mira-button",
    variantClasses[options.variant ?? "default"],
    sizeClasses[options.size ?? "default"],
    options.class,
  );
}
