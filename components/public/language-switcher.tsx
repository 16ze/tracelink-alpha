"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Props pour le composant LanguageSwitcher
 */
interface LanguageSwitcherProps {
  /**
   * Locale actuelle
   */
  currentLocale: string;
  /**
   * ID du produit (pour préserver la route)
   */
  productId: string;
}

/**
 * Composant pour changer de langue sur la page publique du passeport
 *
 * Affiche des liens FR | EN pour passer de /fr/p/[id] à /en/p/[id]
 */
export function LanguageSwitcher({
  currentLocale,
  productId,
}: LanguageSwitcherProps) {
  const locales = [
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
  ];

  return (
    <div className="flex items-center gap-1">
      {locales.map((locale) => (
        <Link
          key={locale.code}
          href={`/${locale.code}/p/${productId}`}
          className={currentLocale === locale.code ? "pointer-events-none" : ""}
        >
          <Button
            variant={currentLocale === locale.code ? "default" : "ghost"}
            size="sm"
            className={
              currentLocale === locale.code
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }
            disabled={currentLocale === locale.code}
          >
            {locale.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
