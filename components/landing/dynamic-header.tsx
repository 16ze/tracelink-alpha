import { createClient } from "@/utils/supabase/server";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserMenu } from "./user-menu";

interface DynamicHeaderProps {
  locale: string;
}

/**
 * Header dynamique qui affiche différents boutons selon l'état de connexion
 * 
 * - Connecté : Affiche "Accéder au Dashboard" + Avatar/Menu utilisateur
 * - Déconnecté : Affiche "Se connecter" + "Commencer"
 */
export async function DynamicHeader({ locale }: DynamicHeaderProps) {
  // Vérification de l'authentification
  let user: { email?: string } | null = null;
  
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (!error && authUser) {
      user = authUser;
    }
  } catch (error) {
    // En cas d'erreur, on considère l'utilisateur comme non connecté
    console.error("Erreur lors de la vérification de l'authentification:", error);
  }

  return (
    <nav className="border-b bg-card/50 backdrop-blur supports-backdrop-filter:bg-card/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo href={`/${locale}`} size="sm" />
          
          {user ? (
            // Utilisateur connecté : Bouton Dashboard + Menu Avatar
            <div className="flex items-center gap-3">
              <Button asChild>
                <Link href={`/${locale}/dashboard`}>
                  Accéder au Dashboard
                </Link>
              </Button>
              <UserMenu email={user.email} locale={locale} />
            </div>
          ) : (
            // Utilisateur déconnecté : Boutons Se connecter + Commencer
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href={`/${locale}/login`}>Se connecter</Link>
              </Button>
              <Button asChild>
                <Link href={`/${locale}/login`}>Commencer</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}




