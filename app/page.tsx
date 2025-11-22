import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n";

/**
 * Page d'accueil (Home)
 *
 * Redirige automatiquement vers la page avec locale.
 * Le middleware next-intl gère la détection de la langue du navigateur.
 */
export default function Home() {
  // Rediriger vers la locale par défaut
  // Le middleware next-intl redirigera automatiquement selon la langue du navigateur
  redirect(`/${defaultLocale}`);
}
