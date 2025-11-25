import { ProductComplianceTab } from "@/components/dashboard/product-compliance-tab";
import { ProductCompositionTab } from "@/components/dashboard/product-composition-tab";
import { ProductGeneralTab } from "@/components/dashboard/product-general-tab";
import { ProductQRButton } from "@/components/dashboard/product-qr-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Layers,
  Package,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getComponentCertificates,
  getProductById,
  getProductComponents,
  getUserBrand,
} from "../../actions";

/**
 * Page de détail d'un produit
 *
 * Affiche les informations du produit et permet de les modifier.
 * Contient deux onglets : Général et Composition & Traçabilité.
 *
 * @param params - Paramètres de la route contenant l'ID du produit
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  // Vérification de l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Récupération du produit avec vérification de propriété
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  // Récupération de la marque pour vérifier le statut d'abonnement
  const brand = await getUserBrand();

  // Vérification du statut d'abonnement
  // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes Stripe
  const subscriptionStatus = brand ? (brand as any)?.subscription_status : null;
  const isProPlan = subscriptionStatus === "active";

  // Récupération des composants du produit avec leurs certificats
  const components = await getProductComponents(id);

  // Récupération des certificats pour chaque composant
  const componentsWithCertificates = await Promise.all(
    components.map(async (component) => {
      const certificates = await getComponentCertificates(component.id);
      return { ...component, certificates };
    })
  );

  // Formatage de la date de création
  const createdDate = new Date(product.created_at);
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(createdDate);

  return (
    <main className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href={`/${locale}/dashboard`}
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <span>/</span>
          <Link
            href={`/${locale}/dashboard`}
            className="hover:text-foreground transition-colors"
          >
            Produits
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{product.name}</span>
        </nav>

        {/* En-tête amélioré */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Photo et infos principales */}
              <div className="flex items-start gap-4 flex-1">
                <Link href={`/${locale}/dashboard`}>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                {product.photo_url ? (
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-lg overflow-hidden border-2 border-border shadow-sm">
                    <Image
                      src={product.photo_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : (
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg bg-muted flex items-center justify-center border-2 border-border">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                        {product.name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          SKU: {product.sku}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Layers className="h-4 w-4" />
                          <span>
                            {components.length}{" "}
                            {components.length === 1
                              ? "composant"
                              : "composants"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>Créé le {formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                <Link href={`/${locale}/p/${product.id}`} target="_blank">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Voir le passeport
                  </Button>
                </Link>
                <ProductQRButton
                  productId={product.id}
                  productName={product.name}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onglets */}
        <Tabs defaultValue="general" className="w-full">
          <div className="border-b">
            <TabsList className="bg-transparent h-auto p-0">
              <TabsTrigger
                value="general"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Général
              </TabsTrigger>
              <TabsTrigger
                value="composition"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Composition & Traçabilité
                {components.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {components.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="compliance"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Entretien & Loi AGEC
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Onglet Général */}
          <TabsContent value="general" className="mt-6">
            <ProductGeneralTab product={product} locale={locale} />
          </TabsContent>

          {/* Onglet Composition & Traçabilité */}
          <TabsContent value="composition" className="mt-6">
            <ProductCompositionTab
              productId={product.id}
              components={componentsWithCertificates}
              isProPlan={isProPlan}
            />
          </TabsContent>

          {/* Onglet Entretien & Loi AGEC */}
          <TabsContent value="compliance" className="mt-6">
            <ProductComplianceTab
              product={product}
              isProPlan={isProPlan}
              locale={locale}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
