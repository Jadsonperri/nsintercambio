import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home, LayoutDashboard, GraduationCap, Brain, Wallet,
  Compass, ListChecks, Mail, User as UserIcon, Globe, LogOut, Settings, Shield
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const NAV: readonly NavItem[] = [
  { to: "/app", label: "Painel Inicial", icon: Home, exact: true },
  { to: "/app/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/app/faculdades", label: "Jornada Acadêmica", icon: GraduationCap },
  { to: "/app/ia", label: "Estratégia de Inteligência", icon: Brain },
  { to: "/app/financeiro", label: "Planejamento Financeiro", icon: Wallet },
  { to: "/app/direcao", label: "Direção Estratégica", icon: Compass },
  { to: "/app/execucao", label: "Execução", icon: ListChecks },
  { to: "/app/conexao", label: "Conexão", icon: Mail },
  { to: "/app/perfil", label: "Perfil", icon: UserIcon },
  { to: "/app/comunidade", label: "Comunidade", icon: Globe },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const initials = (profile?.full_name || profile?.username || "U")
    .split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-16 items-center px-5 border-b border-sidebar-border">
          <Link to="/app"><Logo size={28} /></Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((item, i) => {
            const Icon = item.icon;
            const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            return (
              <a
                key={item.to}
                href={item.to}
                onClick={(e) => { e.preventDefault(); navigate({ to: item.to as never }); }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-smooth ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-muted-foreground bg-sidebar-accent/40">
                  {i + 1}
                </span>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border text-xs text-muted-foreground">
          NEXT SCHOOL · v1.0
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur px-4 md:px-6">
          <div className="md:hidden"><Logo size={26} /></div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative flex items-center gap-2 rounded-full p-1 hover:bg-muted transition-smooth">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-medium">{profile?.full_name}</div>
                  <div className="text-xs text-muted-foreground">@{profile?.username}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/app/perfil" })}>
                  <UserIcon className="mr-2 h-4 w-4" /> Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/app/perfil" })}>
                  <Shield className="mr-2 h-4 w-4" /> Segurança
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/app/perfil" })}>
                  <Settings className="mr-2 h-4 w-4" /> Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto gap-1 px-2 py-2 border-b bg-sidebar">
          {NAV.map((item) => {
            const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function ProtectedShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      navigate({ to: "/login" });
    }
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
