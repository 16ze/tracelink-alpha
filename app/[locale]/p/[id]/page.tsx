import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import { notFound } from "next/navigation";
// On utilise la méthode standard pour récupérer les traductions
import { CertificateDownloadButton } from "@/components/public/certificate-download-button";
import { LanguageSwitcher } from "@/components/public/language-switcher";
import type {
  DatabaseBrand,
  DatabaseCertificate,
  DatabaseComponent,
  DatabaseProduct,
} from "@/types/supabase";
import {
  Box,
  CircleDot,
  Link as LinkIcon,
  Package,
  Scissors,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Type pour le produit avec sa marque et ses composants avec certificats
 */
interface ProductWithBrand extends DatabaseProduct {
  brands: DatabaseBrand;
  components?: (DatabaseComponent & {
    certificates?: DatabaseCertificate[];
  })[];
}

/**
 * Fonction pour obtenir l'icône selon le type de composant
 */
function getComponentIcon(type: string) {
  const typeLower = type.toLowerCase();
  if (typeLower.includes("tissu")) return Package;
  if (typeLower.includes("fil")) return Scissors;
  if (typeLower.includes("bouton")) return CircleDot;
  if (typeLower.includes("zip")) return LinkIcon;
  if (typeLower.includes("emballage")) return Box;
  return Package; // Par défaut
}

/**
 * Page publique du passeport numérique d'un produit
 *
 * Accessible sans authentification.
 * Design mobile-first pour être consulté sur smartphone.
 */
export default async function ProductPassportPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  // 1. Récupération des paramètres (Next.js 15 style)
  const { locale, id } = await params;

  // 2. Chargement des traductions pour le namespace 'passport'
  // C'est ici que la magie opère. Si tes JSON sont bons, t('key') renverra le texte.
  const t = await getTranslations({ locale, namespace: "passport" });

  const supabase = await createClient();

  try {
    // 3. Récupération des données Supabase
    const { data, error } = await supabase
      .from("products")
      .select("*, brands(*), components(*, certificates(*))")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Erreur Supabase:", error);
      notFound();
    }

    const product = data as ProductWithBrand;

    // Tri des composants
    if (product.components) {
      product.components.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    // 4. Formatage de la date selon la langue
    const createdDate = new Date(product.created_at);
    const formattedDate = new Intl.DateTimeFormat(
      locale === "en" ? "en-US" : "fr-FR",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    ).format(createdDate);

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b bg-card relative">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {product.brands.logo_url ? (
                  <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                    <Image
                      src={product.brands.logo_url}
                      alt={product.brands.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-semibold">
                    {product.brands.name}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {t("passport_title")}
                  </p>
                </div>
              </div>
              {/* Sélecteur de langue */}
              <LanguageSwitcher currentLocale={locale} productId={id} />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-6 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Photo */}
            <section className="w-full">
              <div className="sticky top-6">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden border shadow-sm">
                  {product.photo_url ? (
                    <Image
                      src={product.photo_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Details */}
            <section className="flex flex-col justify-center space-y-6 lg:space-y-8">
              {/* Nom Produit */}
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
                  {product.name}
                </h2>
              </div>

              {/* SKU */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {t("reference")}
                </h3>
                <code className="inline-block text-base bg-muted px-4 py-2 rounded font-mono border">
                  {product.sku}
                </code>
              </div>

              {/* Description */}
              {product.description && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {t("description")}
                  </h3>
                  <p className="text-base leading-relaxed text-foreground">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Composition */}
              {product.components && product.components.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {t("composition_title")}
                  </h3>
                  <div className="space-y-2">
                    {product.components.map((component) => {
                      const IconComponent = getComponentIcon(component.type);
                      const hasCertificate =
                        component.certificates &&
                        component.certificates.length > 0;
                      const certificate = hasCertificate
                        ? component.certificates![0]
                        : null;

                      return (
                        <div
                          key={component.id}
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div className="p-2 rounded-md bg-muted">
                            <IconComponent className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {component.type}
                              </p>
                              {hasCertificate && certificate && (
                                <CertificateDownloadButton
                                  certificate={certificate}
                                  componentName={component.type}
                                />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              <span>{t("origin")}</span>{" "}
                              {component.origin_country}
                            </p>
                            {hasCertificate && certificate && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {t("verified")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date Création */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {t("created_at")}
                </h3>
                <p className="text-base text-foreground">{formattedDate}</p>
              </div>

              {/* Footer Section */}
              <div className="border-t pt-6 lg:pt-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{t("footer")}</span>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Mobile Footer */}
        <footer className="border-t bg-card lg:hidden mt-auto">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t("footer")}</p>
            </div>
          </div>
        </footer>
      </div>
    );
  } catch (err) {
    console.error("Erreur inattendue:", err);
    notFound();
  }
}

/**
 * Génération des métadonnées pour le SEO
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  // On utilise le même namespace "passport" pour éviter les erreurs si "common" n'existe pas
  const t = await getTranslations({ locale, namespace: "passport" });
  const supabase = await createClient();

  try {
    const { data } = await supabase
      .from("products")
      .select("name, description, photo_url, brands(name)")
      .eq("id", id)
      .single();

    if (!data) {
      return {
        title: `${t("notFound")} - TraceLink`,
      };
    }

    const product = data as {
      name: string;
      description: string | null;
      photo_url: string | null;
      brands: { name: string };
    };

    return {
      title: `${product.name} - ${t("passport_title")} | TraceLink`,
      description: product.description || "",
      openGraph: {
        title: `${product.name} - ${t("passport_title")}`,
        description: product.description || "",
        images: product.photo_url ? [product.photo_url] : [],
      },
    };
  } catch {
    return {
      title: "TraceLink",
    };
  }
}
