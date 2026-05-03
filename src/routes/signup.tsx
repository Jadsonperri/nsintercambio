import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Mail, Lock, User, AtSign, IdCard } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres");
    if (!/^[a-z0-9_]{3,20}$/i.test(form.username)) return toast.error("Username: 3-20 letras/números/_");
    setLoading(true);
    const { error } = await signUp(form);
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success("Conta criada."); navigate({ to: "/app" }); }
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
              <h2 className="text-2xl font-bold tracking-tight">Criar conta</h2>
              <p className="text-sm text-muted-foreground mt-1">Comece sua jornada de intercâmbio.</p>
            </div>

            <form onSubmit={submit} className="space-y-3.5">
              <div>
                <Label>Nome completo</Label>
                <div className="relative mt-1.5">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className="pl-9" />
                </div>
              </div>
              <div>
                <Label>Username</Label>
                <div className="relative mt-1.5">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="pl-9" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="pl-9" />
                </div>
              </div>
              <div>
                <Label>Senha</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</> : "Criar conta"}
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
            Já tem conta? <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
