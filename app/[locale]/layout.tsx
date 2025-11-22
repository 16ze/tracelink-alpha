import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "../globals.css";

/**
 * Configuration de la police Inter
 * Cette police est optimisée pour le web et recommandée par Shadcn/ui.
 * La variable --font-sans permet de l'utiliser via Tailwind.
 */
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

/**
 * Metadata pour les routes avec locale
 */
export const metadata: Metadata = {
  title: "TraceLink - Passeport Numérique Produit",
  description:
    "Outil de Passeport Numérique Produit (DPP) pour l'industrie textile",
};

/**
 * Layout pour les routes avec locale
 *
 * Enveloppe les pages avec NextIntlClientProvider pour fournir les traductions.
 * Avec next-intl et localePrefix: "always", ce layout gère directement les balises <html> et <body>.
 * Il configure aussi la langue HTML (lang) selon la locale et charge les styles globaux.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Vérification que la locale est valide
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Récupération des messages pour la locale
  // Passer explicitement la locale depuis les params
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
