import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase coloca o token no hash; ao detectar PASSWORD_RECOVERY ficamos prontos.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Caso já haja sessão de recovery
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Senha atualizada!"); navigate({ to: "/app" }); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <BrandPanel />

      <div className="flex items-center justify-center px-4 py-10 md:py-0">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="rounded-2xl border border-border bg-card p-7 shadow-elegant">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Nova senha</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {ready ? "Defina uma nova senha para continuar." : "Validando link..."}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Nova senha</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPw ? "text" : "password"}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    required
                    className="pl-9 pr-9"
                    placeholder="mínimo 6 caracteres"
                    disabled={!ready}
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
              <Button type="submit" className="w-full bg-gradient-primary" disabled={loading || !ready}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Atualizar senha"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            <Link to="/login" className="text-primary font-medium hover:underline">Voltar para login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
