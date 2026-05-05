import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Home, LayoutDashboard, GraduationCap, Brain, Wallet,
  ListChecks, Mail, User as UserIcon, Globe, LogOut, Settings, Shield, ChevronUp,
  Calendar, FileText, Calculator, Bell
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };

// Ordem fixa conforme PRD
const NAV: readonly NavItem[] = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/app/faculdades", label: "Faculdades", icon: GraduationCap },
  { to: "/app/execucao", label: "Pipeline", icon: ListChecks },
  { to: "/app/prazos", label: "Prazos", icon: Calendar },
  { to: "/app/documentos", label: "Documentos", icon: FileText },
  { to: "/app/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/app/simulador", label: "Simulador", icon: Calculator },
  { to: "/app/ia", label: "Estratégia & IA", icon: Brain },
  { to: "/app/conexao", label: "Conexão", icon: Mail },
  { to: "/app/perfil", label: "Perfil", icon: UserIcon },
  { to: "/app/comunidade", label: "Comunidade", icon: Globe },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const initials = (profile?.full_name || profile?.username || "U")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

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

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            return (
              <a
                key={item.to}
                href={item.to}
                onClick={(e) => { e.preventDefault(); navigate({ to: item.to as never }); }}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-smooth ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60"
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-primary" />}
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Avatar menu no rodapé */}
        <div className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent/60 transition-smooth">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm font-medium truncate">{profile?.full_name ?? "Usuário"}</div>
                  <div className="text-xs text-muted-foreground truncate">@{profile?.username}</div>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
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
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur px-4 md:px-6">
          <div className="md:hidden"><Logo size={26} /></div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-smooth relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary border-2 border-background" />
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto gap-1 px-2 py-2 border-b bg-sidebar">
          {NAV.map((item) => {
            const active = item.exact ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
            return (
              <a
                key={item.to}
                href={item.to}
                onClick={(e) => { e.preventDefault(); navigate({ to: item.to as never }); }}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </a>
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
