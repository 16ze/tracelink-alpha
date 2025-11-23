import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, LogOut, Plus } from "lucide-react";
import { getUserBrand, getUserProducts } from "./actions";
import { CreateBrandForm } from "@/components/dashboard/create-brand-form";
import { ProductTableRow } from "@/components/dashboard/product-table-row";
import { Logo } from "@/components/logo";
import { ProButton } from "@/components/landing/pro-button";
import { isStripeConfigured } from "@/utils/stripe/config";

/**
 * Action serveur pour la déconnexion
 * Cette fonction accepte la locale dans FormData et déconnecte l'utilisateur
 */
async function logoutAction(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}

/**
 * Page Dashboard (tableau de bord)
 *
 * Page principale après authentification.
 *
 * Scénario A (Pas de marque) : Affiche le formulaire de création de marque
 * Scénario B (Marque existante) : Affiche un message de bienvenue et les actions possibles
 */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si l'utilisateur n'est pas connecté, redirection vers login
  // (normalement géré par le middleware, mais sécurité supplémentaire)
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Récupération de la marque de l'utilisateur
  const brand = await getUserBrand();

  // Récupération des produits de l'utilisateur (si marque existe)
  const products = brand ? await getUserProducts() : [];

  // Vérification du statut d'abonnement et de la configuration Stripe
  const stripeConfigured = isStripeConfigured();
  // Un utilisateur est en mode gratuit si sa marque a un statut différent de "active"
  // Condition simplifiée : subscription_status !== 'active'
  const isFreePlan = brand ? brand.subscription_status !== "active" : false;

  return (
    <main className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <Logo size="md" href={`/${locale}/dashboard`} />
          <div className="flex items-center gap-3">
            {/* Bouton Pro (affiché uniquement si Stripe est configuré et utilisateur en mode gratuit) */}
            {stripeConfigured && isFreePlan && brand && (
              <ProButton locale={locale} label="Passer Pro" />
            )}
            <form action={logoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </form>
          </div>
        </div>

        {/* Contenu principal */}
        {!brand ? (
          /* Scénario A : Pas de marque - Afficher le formulaire de création */
          <div className="flex items-center justify-center min-h-[60vh]">
            <CreateBrandForm />
          </div>
        ) : (
          /* Scénario B : Marque existante - Afficher le dashboard */
          <div className="space-y-8">
            {/* En-tête avec bouton "Nouveau Produit" */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Bienvenue chez {brand.name}
                </h2>
                <p className="text-muted-foreground">
                  Gérez vos produits et créez vos passeports numériques
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/${locale}/dashboard/products/new`}>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau Produit
                  </Button>
                </Link>
              </div>
            </div>

            {/* Liste des produits */}
            {products.length === 0 ? (
              /* Aucun produit - Afficher un message avec bouton */
              <Card>
                <CardHeader>
                  <CardTitle>Vos produits</CardTitle>
                  <CardDescription>
                    Commencez par créer votre premier produit
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="bg-muted p-6 rounded-full">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-center">
                    Vous n&apos;avez pas encore de produit.
                    <br />
                    Créez votre premier produit pour commencer !
                  </p>
                  <Link href={`/${locale}/dashboard/products/new`}>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Créer un premier produit
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              /* Liste des produits - Afficher le tableau */
              <Card>
                <CardHeader>
                  <CardTitle>Vos produits</CardTitle>
                  <CardDescription>
                    Liste de tous vos produits ({products.length}{" "}
                    {products.length === 1 ? "produit" : "produits"})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Image</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>SKU / Référence</TableHead>
                        <TableHead className="text-right">Date de création</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <ProductTableRow key={product.id} product={product} locale={locale} />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Actions supplémentaires */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {/* Carte d'information utilisateur */}
              <Card>
                <CardHeader>
                  <CardTitle>Votre compte</CardTitle>
                  <CardDescription>Informations personnelles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ID utilisateur</p>
                    <p className="font-mono text-xs">{user.id}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Carte d'informations de la marque */}
              <Card>
                <CardHeader>
                  <CardTitle>Votre marque</CardTitle>
                  <CardDescription>Informations de la marque</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Nom de la marque</p>
                    <p className="font-medium">{brand.name}</p>
                  </div>
                  {brand.website_url && (
                    <div>
                      <p className="text-sm text-muted-foreground">Site Web</p>
                      <a
                        href={brand.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm text-primary hover:underline"
                      >
                        {brand.website_url}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Carte de fonctionnalités à venir */}
              <Card>
                <CardHeader>
                  <CardTitle>Fonctionnalités</CardTitle>
                  <CardDescription>À venir prochainement</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Gestion des fournisseurs, composants et certificats bientôt
                    disponibles.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

