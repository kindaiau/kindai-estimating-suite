import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  HardHat,
  LogOut,
  Menu,
  Settings,
  Users,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/materials", label: "Materials Library", icon: BookOpen },
  { href: "/labour", label: "Labour Rates", icon: Users },
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl kindai-gradient flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="text-sm text-muted-foreground">Loading Kindai...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl kindai-gradient flex items-center justify-center mx-auto shadow-lg">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Sign in to continue</h2>
          <p className="text-muted-foreground text-sm">Access your Kindai Estimating Suite</p>
          <Button
            className="kindai-gradient text-white border-0 shadow-md"
            onClick={() => window.location.href = getLoginUrl()}
          >
            Sign In
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
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl kindai-gradient flex items-center justify-center shadow-sm flex-shrink-0">
          <HardHat className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-sidebar-foreground leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Kindai
          </div>
          <div className="text-[10px] text-sidebar-foreground/50 leading-tight uppercase tracking-wider">
            Estimating Suite
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mb-2">
          Main Menu
        </div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location === href || location.startsWith(href + "/");
          return (
            <Link key={href} href={href}>
              <div
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-60" />}
              </div>
            </Link>
          );
        })}

        <div className="text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-wider px-3 mt-5 mb-2">
          Account
        </div>
        <Link href="/profile">
          <div
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer",
              location === "/profile"
                ? "bg-primary text-white shadow-sm"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span>Profile & Settings</span>
          </div>
        </Link>
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name ?? "User"}</div>
                <div className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email ?? ""}</div>
              </div>
              <ChevronRight className="w-3 h-3 text-sidebar-foreground/40 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/profile"><div className="flex items-center gap-2 cursor-pointer"><Settings className="w-4 h-4" /> Settings</div></Link>
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
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-sidebar border-r border-sidebar-border z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground"
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
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg kindai-gradient flex items-center justify-center">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {title ?? "Kindai"}
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
