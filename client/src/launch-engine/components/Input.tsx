import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm text-[#E5E7EB] shadow-inner shadow-black/10 outline-none transition placeholder:text-[#9CA3AF] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/35",
        className
      )}
      type={type}
      {...props}
    />
  );
}
