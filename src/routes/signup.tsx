import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "" });
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3"><Logo size={40} withText={false} /></div>
          <div className="font-bold text-xl tracking-tight">NEXT <span className="text-primary">SCHOOL</span></div>
          <p className="text-sm text-muted-foreground mt-2">Crie sua conta para começar.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Nome completo</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required className="mt-1.5" />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required placeholder="seu_username" className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1.5" />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar conta"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> ou <div className="flex-1 h-px bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
            Continuar com Google
          </Button>
        </div>

        <p className="mt-6 text-sm text-center text-muted-foreground">
          Já tem conta? <Link to="/login" className="text-primary font-medium">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
