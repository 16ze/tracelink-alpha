/**
 * Layout Racine (RootLayout)
 *
 * IMPORTANT: Avec next-intl et localePrefix: "always", ce layout NE DOIT PAS
 * contenir de balises <html> ou <body>. Ces balises sont gérées par le layout
 * [locale]/layout.tsx pour permettre la configuration dynamique de la langue.
 *
 * Ce layout sert uniquement de wrapper pour les routes sans locale (comme /auth/callback).
 *
 * @param children - Les composants enfants à rendre
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
