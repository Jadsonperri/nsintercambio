import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(identifier, password);
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success("Bem-vindo!"); navigate({ to: "/app" }); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3"><Logo size={40} withText={false} /></div>
          <div className="font-bold text-xl tracking-tight">NEXT <span className="text-primary">SCHOOL</span></div>
          <p className="text-sm text-muted-foreground mt-2">Planeje seu intercâmbio.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="id">Email ou username</Label>
              <Input id="id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required autoFocus className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="pw">Senha</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
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
          Novo aqui? <Link to="/signup" className="text-primary font-medium">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
