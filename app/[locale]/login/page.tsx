import { LoginForm } from "./login-form";

/**
 * Page de connexion/inscription
 *
 * Gère l'authentification des utilisateurs avec :
 * - Connexion par email/mot de passe
 * - Inscription avec confirmation email
 * - Affichage des erreurs et messages de succès
 */
export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <LoginForm locale={locale} />
    </div>
  );
}
