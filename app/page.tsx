import { Package } from "lucide-react";

/**
 * Page d'accueil (Home)
 *
 * Affiche le logo et le titre de l'application.
 * Utilise les composants natifs et les classes utilitaires Tailwind/Shadcn.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-6">
      {/* Icône principale représentant le produit/paquet */}
      <div className="bg-primary/10 p-6 rounded-full">
        <Package className="h-16 w-16 text-primary" />
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          TraceLink
        </h1>
        <p className="text-lg text-muted-foreground max-w-[600px]">
          Passeport Numérique Produit pour l&apos;industrie textile
        </p>
      </div>
    </main>
  );
}
