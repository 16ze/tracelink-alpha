import { LoginForm } from "./login-form";
import { Logo } from "@/components/logo";
import Image from "next/image";

/**
 * Page de connexion/inscription - Design Split Screen Moderne
 *
 * Gère l'authentification des utilisateurs avec :
 * - Connexion par email/mot de passe
 * - Inscription avec confirmation email
 * - Affichage des erreurs et messages de succès
 * - Design moderne split screen (image gauche, formulaire droite)
 */
export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panneau gauche : Image et branding */}
      <div className="relative hidden lg:flex bg-gradient-to-br from-primary/10 via-primary/5 to-background border-r">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
        
        {/* Image de haute qualité */}
        <div className="relative w-full h-full">
          <Image
            src="https://images.unsplash.com/photo-1558769132-cb1aea1f767c?q=80&w=2574&auto=format&fit=crop"
            alt="Mode textile durable"
            fill
            className="object-cover opacity-90"
            priority
            sizes="50vw"
          />
          {/* Overlay gradient pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Logo et citation */}
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Logo size="md" />
          
          <div className="space-y-4 text-white">
            <blockquote className="text-2xl font-medium leading-relaxed">
              &quot;TraceLink nous a permis de digitaliser notre chaîne d&apos;approvisionnement
              en moins d&apos;une semaine. La transparence totale.&quot;
            </blockquote>
            <footer className="text-sm text-white/80">
              <p className="font-semibold">Marie Dubois</p>
              <p>CEO, Loom Paris</p>
            </footer>
          </div>
        </div>
      </div>

      {/* Panneau droit : Formulaire de connexion */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center">
            <Logo size="md" />
          </div>

          {/* Titre et sous-titre */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Bienvenue sur TraceLink
            </h1>
            <p className="text-muted-foreground">
              La solution de traçabilité textile la plus simple
            </p>
          </div>

          {/* Formulaire de connexion */}
          <LoginForm locale={locale} />

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              En vous connectant, vous acceptez nos{" "}
              <a href="#" className="underline hover:text-foreground">
                Conditions d&apos;utilisation
              </a>{" "}
              et notre{" "}
              <a href="#" className="underline hover:text-foreground">
                Politique de confidentialité
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
