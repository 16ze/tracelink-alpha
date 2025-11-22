import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

// Liste des locales supportées
export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

// Locale par défaut
export const defaultLocale: Locale = "fr";

// Configuration du routing pour next-intl
export const routing = {
  locales,
  defaultLocale,
  localePrefix: "always" as const, // Toujours préfixer avec la locale (/fr/..., /en/...)
};

/**
 * Configuration i18n pour next-intl
 * Utilise getRequestConfig pour la configuration request-scope
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Utiliser requestLocale() pour récupérer la locale depuis le contexte de la requête
  // requestLocale est une fonction qu'il faut appeler et attendre
  let locale: string;
  
  try {
    locale = await requestLocale();
  } catch {
    // Si requestLocale() échoue, utiliser la locale par défaut
    locale = defaultLocale;
  }
  
  // Si aucune locale n'est fournie ou si elle est invalide, utiliser la locale par défaut
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }
  
  // Validation finale de la locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale, // Retourner explicitement la locale (obligatoire)
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});

