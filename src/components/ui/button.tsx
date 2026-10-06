"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerGhost"
  | "link";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-500 text-inverse font-medium hover:bg-accent-400 active:bg-accent-600 disabled:hover:bg-accent-500",
  secondary:
    "bg-surface-raised text-primary border border-subtle hover:bg-surface-hover hover:border-strong active:bg-surface-raised",
  ghost: "text-secondary hover:bg-surface-hover hover:text-primary",
  danger:
    "bg-danger-500 text-white font-medium hover:bg-danger-400 active:bg-danger-500",
  dangerGhost:
    "text-danger-400 border border-danger-500/40 hover:bg-danger-500/10 hover:border-danger-500/70",
  link: "text-accent-300 underline-offset-4 hover:underline p-0 h-auto",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  // 44px minimum touch target on mobile (WCAG 2.5.5 target size).
  sm: "h-8 max-sm:h-11 px-3 max-sm:px-3.5 text-sm gap-1.5 rounded-sm",
  md: "h-[38px] max-sm:h-11 px-4 text-base gap-2 rounded-sm",
  lg: "h-11 px-5 text-base gap-2 rounded-sm",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "secondary",
      size = "md",
      loading = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      asChild = false,
      className,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        disabled={asChild ? undefined : isDisabled}
        aria-busy={loading || undefined}
        data-loading={loading ? "" : undefined}
        className={cn(
          "relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap",
          "transition-colors duration-150 ease-out",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500",
          "disabled:pointer-events-none disabled:opacity-50",
          "aria-disabled:pointer-events-none aria-disabled:opacity-50",
          VARIANT_CLASSES[variant],
          variant !== "link" && SIZE_CLASSES[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {/*
          When asChild, Slot clones its single child and merges these props onto
          it — so the child must be the consumer's own element, never a Fragment
          (a Fragment cannot receive type/disabled/className). Icons are a
          non-asChild convenience; with asChild the consumer composes its own.
        */}
        {asChild ? (
          children
        ) : loading ? (
          /* The spinner replaces the leading icon; the label stays so the
             button width never changes mid-request. */
          <>
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {iconLeft}
            {children}
            {iconRight}
          </>
        )}
      </Comp>
    );
  },
);