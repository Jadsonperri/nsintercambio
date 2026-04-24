import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:bg-primary-glow"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NEXT SCHOOL — Planejamento de Intercâmbio Inteligente" },
      { name: "description", content: "Plataforma moderna e inteligente de planejamento de intercâmbio: faculdades, score, financeiro e IA." },
      { property: "og:title", content: "NEXT SCHOOL — Planejamento de Intercâmbio Inteligente" },
      { property: "og:description", content: "Plataforma moderna e inteligente de planejamento de intercâmbio: faculdades, score, financeiro e IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "NEXT SCHOOL — Planejamento de Intercâmbio Inteligente" },
      { name: "twitter:description", content: "Plataforma moderna e inteligente de planejamento de intercâmbio: faculdades, score, financeiro e IA." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3666d013-1cee-483e-b0a8-0d845355ade9/id-preview-20bdecea--4af7fcd6-be54-4c2c-a7c1-c866b31928e4.lovable.app-1776922262768.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3666d013-1cee-483e-b0a8-0d845355ade9/id-preview-20bdecea--4af7fcd6-be54-4c2c-a7c1-c866b31928e4.lovable.app-1776922262768.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } }
  }));
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
