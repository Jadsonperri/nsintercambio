import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(identifier, password);
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success("Bem-vindo!"); navigate({ to: "/app" }); }
  };

  const handleForgot = async () => {
    if (!identifier.includes("@")) {
      toast.error("Digite seu email no campo acima para receber o link de redefinição.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Email enviado! Verifique sua caixa de entrada.");
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <BrandPanel />

      <div className="flex items-center justify-center px-4 py-10 md:py-0">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="md:hidden text-center mb-8">
            <div className="flex justify-center mb-3"><Logo size={40} withText={false} /></div>
            <div className="font-bold text-xl tracking-tight">NEXT <span className="text-primary">SCHOOL</span></div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-7 shadow-elegant">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Entrar</h2>
              <p className="text-sm text-muted-foreground mt-1">Acesse sua jornada acadêmica.</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="id">Email ou username</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus className="pl-9" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pw">Senha</Label>
                  <button type="button" onClick={handleForgot} className="text-[11px] text-primary hover:underline">
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pw"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-primary hover:opacity-95 transition-smooth hover-scale" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...</> : "Entrar"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
              <div className="flex-1 h-px bg-border" /> ou continue com <div className="flex-1 h-px bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
              <Mail className="h-4 w-4 mr-2" />
              Continuar com Google
            </Button>
          </div>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Novo aqui? <Link to="/signup" className="text-primary font-medium hover:underline">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
