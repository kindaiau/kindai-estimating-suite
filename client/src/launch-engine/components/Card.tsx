import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0A0A0A]/55 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
