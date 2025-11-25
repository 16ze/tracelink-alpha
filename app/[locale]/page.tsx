import { ProButton } from "@/components/landing/pro-button";
import { DynamicHeader } from "@/components/landing/dynamic-header";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Check, FileCheck, Globe2, QrCode } from "lucide-react";
import { getMessages } from "next-intl/server";
import Link from "next/link";

/**
 * Page d'accueil publique (Landing Page)
 *
 * Design moderne, B2B, épuré dans le style Stripe/Raycast.
 * Route publique accessible à tous les visiteurs.
 */
export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Récupération des messages pour les traductions
  const messages = await getMessages({ locale });

  // Fonction de traduction pour le namespace "landing"
  const t = (key: string): string => {
    try {
      const landingMessages =
        (messages?.landing as Record<string, string>) || {};
      return landingMessages[key] || key;
    } catch (error) {
      return key;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar Dynamique */}
      <DynamicHeader locale={locale} />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              La Traçabilité Textile, rendue simple.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Générez vos Passeports Numériques Produits (DPP) en conformité
              avec les lois européennes. Sans effort technique.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href={`/${locale}/login`}>
                  Créer mon premier passeport
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto"
              >
                <Link href="#demo">Voir une démo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section Preuve Sociale */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Ils nous font confiance
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap opacity-60 grayscale">
            {/* Placeholders pour les logos */}
            <div className="text-2xl font-bold text-muted-foreground">Loom</div>
            <div className="text-2xl font-bold text-muted-foreground">
              Asphalte
            </div>
            <div className="text-2xl font-bold text-muted-foreground">
              Linear
            </div>
            <div className="text-2xl font-bold text-muted-foreground">
              Vercel
            </div>
            <div className="text-2xl font-bold text-muted-foreground">
              Stripe
            </div>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section className="py-24 lg:py-32 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-muted-foreground">
              Des fonctionnalités puissantes pour gérer la traçabilité de vos
              produits
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Carte 1: Traçabilité Totale */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Globe2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Traçabilité Totale</CardTitle>
                <CardDescription className="text-base">
                  De la fibre au produit fini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Suivez chaque étape de votre chaîne d&apos;approvisionnement,
                  depuis les matières premières jusqu&apos;au produit final.
                  Toute l&apos;histoire de votre produit en un seul endroit.
                </p>
              </CardContent>
            </Card>

            {/* Carte 2: Conformité Légale */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Conformité Légale</CardTitle>
                <CardDescription className="text-base">
                  Certificats GOTS, Oeko-Tex centralisés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Centralisez tous vos certificats et preuves de conformité.
                  GOTS, Oeko-Tex, factures : tout est stocké et accessible en un
                  clic pour vos audits.
                </p>
              </CardContent>
            </Card>

            {/* Carte 3: QR Code Universel */}
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">QR Code Universel</CardTitle>
                <CardDescription className="text-base">
                  Expérience mobile parfaite pour vos clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Un simple scan révèle tout : origine, composants, certificats.
                  Une expérience transparente qui renforce la confiance de vos
                  clients.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section Comment ça marche */}
      <section id="demo" className="py-24 lg:py-32 border-b bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Comment ça marche
            </h2>
            <p className="text-lg text-muted-foreground">
              En 3 étapes simples, créez votre premier passeport numérique
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Étape 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Créez le produit</h3>
              <p className="text-muted-foreground">
                Ajoutez votre produit avec ses informations de base : nom, SKU,
                description et photo.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Ajoutez les composants
              </h3>
              <p className="text-muted-foreground">
                Documentez chaque composant : origine, type, et les certificats
                associés (GOTS, Oeko-Tex, etc.).
              </p>
            </div>

            {/* Étape 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Imprimez le QR Code
              </h3>
              <p className="text-muted-foreground">
                Générez et téléchargez votre QR Code. Collez-le sur votre
                produit, et vos clients pourront scanner pour tout découvrir.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href={`/${locale}/login`}>
                Commencer maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section Pricing */}
      <section id="pricing" className="py-24 lg:py-32 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {t("pricing_title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("pricing_subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Découverte (Gratuit) */}
            <Card className="border-2 relative">
              <CardHeader>
                <CardTitle className="text-2xl">{t("plan_free")}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{t("price_free")}</span>
                  <span className="text-muted-foreground">{t("period")}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">10 {t("feature_products")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">QR Code gratuit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">Support email</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-5 w-5 flex items-center justify-center">
                      —
                    </span>
                    <span className="text-sm">
                      Pas de {t("feature_certificates")}
                    </span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-8" asChild>
                  <Link href={`/${locale}/login`}>{t("cta_free")}</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Plan Pro (29€) - Mis en valeur */}
            <Card className="border-2 border-primary relative shadow-lg scale-105 md:scale-100">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Populaire
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">{t("plan_pro")}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{t("price_pro")}</span>
                  <span className="text-muted-foreground">{t("period")}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">Produits illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">{t("feature_certificates")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">QR Code personnalisé</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">Support prioritaire</span>
                  </li>
                </ul>
                <ProButton locale={locale} label={t("cta_pro")} className="w-full mt-8" />
              </CardContent>
            </Card>

            {/* Plan Entreprise (Sur devis) */}
            <Card className="border-2 relative">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {t("plan_enterprise")}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Sur devis</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">Tout du plan Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">API Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">SSO (Single Sign-On)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">Account Manager dédié</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-8" asChild>
                  <Link href="mailto:contact@tracelink.fr">
                    {t("cta_contact")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground mt-4">
                Passeport Numérique Produit pour l&apos;industrie textile
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#demo"
                    className="hover:text-foreground transition-colors"
                  >
                    Fonctionnalités
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Tarifs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Politique de confidentialité
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    CGU
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="mailto:contact@tracelink.fr"
                    className="hover:text-foreground transition-colors"
                  >
                    contact@tracelink.fr
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} TraceLink. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
