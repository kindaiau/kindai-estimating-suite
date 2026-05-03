import * as React from "react";
import { cn } from "@/lib/utils";

export function Section({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("px-5 py-14 sm:px-6 lg:px-8", className)} {...props} />;
}
