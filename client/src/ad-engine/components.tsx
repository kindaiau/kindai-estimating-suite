import * as React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function AdEngineShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0F172A] text-[#E5E7EB]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-white/10 bg-[#0A0A0A] p-5 lg:w-72 lg:border-b-0 lg:border-r">
          <a href="/ad-engine" className="text-base font-black text-white">
            Kindai Ad Engine
          </a>
          <nav className="mt-6 flex gap-2 lg:block lg:space-y-2">
            <NavItem href="/ad-engine">Overview</NavItem>
            <NavItem href="/ad-engine/creative">Creative</NavItem>
          </nav>
          <div className="mt-8 rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 p-4 text-sm text-[#BBF7D0]">
            Monitor mode is on. Budget changes are recommendations only.
          </div>
        </aside>
        <div className="flex-1 px-5 py-8 sm:px-6 lg:px-8">{children}</div>
      </div>
    </main>
  );
}

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-4 py-3 text-sm font-bold text-[#9CA3AF] transition hover:bg-white/[0.06] hover:text-white"
    >
      {children}
    </Link>
  );
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-white/10 bg-[#0A0A0A]/70 shadow-[0_20px_60px_rgba(0,0,0,0.24)]", className)}
      {...props}
    />
  );
}

export function Field({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-[#E5E7EB] outline-none placeholder:text-[#9CA3AF] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/35",
        className
      )}
      {...props}
    />
  );
}

export function ActionButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#6C5CE7] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_45px_rgba(108,92,231,0.35)] transition hover:bg-[#7C6CF0] disabled:pointer-events-none disabled:opacity-60",
        props.className
      )}
    />
  );
}
