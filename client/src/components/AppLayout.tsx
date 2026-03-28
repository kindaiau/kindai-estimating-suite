import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  BarChart3, BookOpen, Camera, ChevronRight, CreditCard, FolderOpen,
  LogOut, Menu, Settings, Sparkles, Users, X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";

const NAV_ITEMS = [
  { href: "/ai-takeoff", label: "AI Vision Takeoff", icon: Sparkles, highlight: true },
  { href: "/dashboard",  label: "Dashboard",         icon: BarChart3 },
  { href: "/projects",   label: "Projects",           icon: FolderOpen },
  { href: "/materials",  label: "Materials Library",  icon: BookOpen },
  { href: "/labour",     label: "Labour Rates",       icon: Users },
  { href: "/billing",    label: "Billing",             icon: CreditCard },
];

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { logout(); window.location.href = "/"; },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src={LOGO_URL} alt="Kindai" className="w-16 h-16 object-contain animate-pulse" />
          <div className="text-sm text-muted-foreground font-medium">Loading Kindai...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center kindai-hero-bg">
        <div className="text-center space-y-5 glass-card rounded-3xl p-10 max-w-sm mx-4">
          <img src={LOGO_URL} alt="Kindai" className="w-20 h-20 object-contain mx-auto drop-shadow-xl" />
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Kindai Estimating</h2>
            <p className="text-white/60 text-sm">Sign in to access your trade workbench</p>
          </div>
          <Button
            className="kindai-btn-primary w-full rounded-full font-bold text-sm h-11"
            onClick={() => window.location.href = getLoginUrl()}
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "KA";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-xl blur-md opacity-60 kindai-gradient scale-110 group-hover:opacity-80 transition-opacity" />
              <img src={LOGO_URL} alt="Kindai" className="relative w-10 h-10 object-contain" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-black leading-tight kindai-gradient-text" style={{ fontFamily: "'Nunito', sans-serif" }}>
                kindai
              </div>
              <div className="text-[10px] text-sidebar-foreground/40 leading-tight uppercase tracking-widest">
                Estimating Suite
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-widest px-3 mb-2">
          Main Menu
        </div>
        {NAV_ITEMS.map(({ href, label, icon: Icon, highlight }) => {
          const active = location === href || location.startsWith(href + "/");
          return (
            <Link key={href} href={href}>
              <div
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer",
                  active
                    ? "kindai-gradient text-white shadow-md shadow-pink-500/20"
                    : highlight && !active
                    ? "bg-gradient-to-r from-pink-50 to-orange-50 text-pink-600 hover:from-pink-100 hover:to-orange-100 border border-pink-200/50"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {highlight && !active && <span className="text-[9px] font-black bg-gradient-to-r from-pink-500 to-orange-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>}
                {active && <ChevronRight className="w-3 h-3 opacity-70" />}
              </div>
            </Link>
          );
        })}

        <div className="text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-widest px-3 mt-5 mb-2">
          Account
        </div>
        <Link href="/profile">
          <div
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer",
              location === "/profile"
                ? "kindai-gradient text-white shadow-md shadow-pink-500/20"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span>Profile & Settings</span>
          </div>
        </Link>
      </nav>

      {/* User Footer */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent transition-colors cursor-pointer">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="text-xs font-black text-white kindai-gradient">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-bold text-sidebar-foreground truncate">{user?.name ?? "User"}</div>
                <div className="text-[10px] text-sidebar-foreground/40 truncate">{user?.email ?? ""}</div>
              </div>
              <ChevronRight className="w-3 h-3 text-sidebar-foreground/30 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <div className="flex items-center gap-2 cursor-pointer"><Settings className="w-4 h-4" /> Settings</div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-sidebar border-r border-sidebar-border z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border sticky top-0 z-40 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Kindai" className="w-7 h-7 object-contain" />
            <span className="text-sm font-black kindai-gradient-text" style={{ fontFamily: "'Nunito', sans-serif" }}>
              {title ?? "kindai"}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
