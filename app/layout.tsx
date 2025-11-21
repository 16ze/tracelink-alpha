import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";

/**
 * Configuration de la police Inter
 * Cette police est optimisée pour le web et recommandée par Shadcn/ui.
 * La variable --font-sans permet de l'utiliser via Tailwind.
 */
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "TraceLink - Passeport Numérique Produit",
  description:
    "Outil de Passeport Numérique Produit (DPP) pour l'industrie textile",
};

/**
 * Layout Racine (RootLayout)
 *
 * Ce composant enveloppe toute l'application.
 * Il applique :
 * 1. La langue française (lang="fr")
 * 2. Les classes de base Shadcn (min-h-screen, bg-background, font-sans, antialiased)
 * 3. La variable CSS de la police
 *
 * @param children - Les composants enfants à rendre (les pages)
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
