import * as React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type LaunchButtonVariant = "primary" | "secondary" | "ghost";

type LaunchButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: LaunchButtonVariant;
};

const variantClasses: Record<LaunchButtonVariant, string> = {
  primary:
    "bg-[#6C5CE7] text-white shadow-[0_18px_45px_rgba(108,92,231,0.35)] hover:bg-[#7C6CF0]",
  secondary:
    "border border-white/15 bg-white/8 text-[#E5E7EB] shadow-[0_16px_35px_rgba(0,0,0,0.18)] hover:bg-white/12",
  ghost: "text-[#E5E7EB] hover:bg-white/8",
};

export function Button({
  className,
  href,
  variant = "primary",
  type = "button",
  ...props
}: LaunchButtonProps) {
  const classes = cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A] disabled:pointer-events-none disabled:opacity-60",
    variantClasses[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {props.children}
      </Link>
    );
  }

  return <button className={classes} type={type} {...props} />;
}
