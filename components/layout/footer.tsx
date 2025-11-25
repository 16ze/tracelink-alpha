import { Logo } from "@/components/logo";
import Link from "next/link";

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  return (
    <footer className="border-t py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Colonne 1: Logo & Description */}
          <div>
            <Logo size="sm" href={`/${locale}`} />
            <p className="text-sm text-muted-foreground mt-4">
              Passeport Numérique Produit pour l&apos;industrie textile
            </p>
          </div>

          {/* Colonne 2: Produit */}
          <div>
            <h4 className="font-semibold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}#demo`}
                  className="hover:text-foreground transition-colors"
                >
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}#pricing`}
                  className="hover:text-foreground transition-colors"
                >
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3: Légal */}
          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/legal/terms`}
                  className="hover:text-foreground transition-colors"
                >
                  Conditions Générales (CGU)
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/legal/privacy`}
                  className="hover:text-foreground transition-colors"
                >
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/legal/sales`}
                  className="hover:text-foreground transition-colors"
                >
                  Conditions de Vente (CGV)
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4: Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="mailto:contact@tracelink.com"
                  className="hover:text-foreground transition-colors"
                >
                  contact@tracelink.com
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} TraceLink. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

