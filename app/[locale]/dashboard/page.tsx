import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, LogOut, Plus, CheckCircle2 } from "lucide-react";
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
 * Version ultra-résistante aux erreurs : en cas d'erreur, la page s'affiche en mode "défaut" (gratuit).
 *
 * Scénario A (Pas de marque) : Affiche le formulaire de création de marque
 * Scénario B (Marque existante) : Affiche un message de bienvenue et les actions possibles
 */
export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ============================================
  // 1. RÉCUPÉRATION SÉCURISÉE DES PARAMÈTRES
  // ============================================
  let locale: string = "fr";
  let searchParamsResolved: { [key: string]: string | string[] | undefined } = {};
  let isPaymentSuccess: boolean = false;

  try {
    const paramsResolved = await params;
    locale = paramsResolved.locale || "fr";
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des params:", error);
    // On continue avec la locale par défaut
  }

  try {
    searchParamsResolved = await searchParams;
    
    // Détection du retour de paiement réussi (sécurisé)
    const checkoutParam = searchParamsResolved.checkout;
    const successParam = searchParamsResolved.success;
    
    isPaymentSuccess = 
      checkoutParam === "success" || 
      successParam === "true" ||
      successParam === true;
    
    // Force le rafraîchissement des données si le paiement vient d'être effectué
    if (isPaymentSuccess) {
      try {
        revalidatePath(`/${locale}/dashboard`);
      } catch (error) {
        console.error("❌ Erreur lors de la revalidation du cache:", error);
        // On continue même si la revalidation échoue
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des searchParams:", error);
    // On continue avec les valeurs par défaut
  }

  // ============================================
  // 2. VÉRIFICATION D'AUTHENTIFICATION
  // ============================================
  let user: { id: string; email?: string } | null = null;
  
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ Erreur lors de la récupération de l'utilisateur:", userError);
      // Redirection vers login seulement si erreur d'auth réelle
      redirect(`/${locale}/login`);
    }

    if (!authUser) {
      redirect(`/${locale}/login`);
    }

    user = authUser;
  } catch (error) {
    console.error("❌ Erreur inattendue lors de l'authentification:", error);
    // Si c'est une erreur de redirection Next.js, on la propage
    if (error && typeof error === 'object' && 'digest' in error && (error as any).digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    // Sinon, redirection vers login
    redirect(`/${locale}/login`);
  }

  // ============================================
  // 3. RÉCUPÉRATION DES DONNÉES (AVEC GESTION D'ERREUR)
  // ============================================
  let brand: Awaited<ReturnType<typeof getUserBrand>> = null;
  let products: Awaited<ReturnType<typeof getUserProducts>> = [];

  try {
    brand = await getUserBrand();
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la marque:", error);
    // On continue avec brand = null (mode défaut)
  }

  try {
    if (brand) {
      products = await getUserProducts();
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des produits:", error);
    // On continue avec products = [] (tableau vide)
  }

  // ============================================
  // 4. VÉRIFICATION DU STATUT D'ABONNEMENT (SÉCURISÉE)
  // ============================================
  let stripeConfigured: boolean = false;
  let isFreePlan: boolean = true; // Par défaut, on assume le plan gratuit

  try {
    stripeConfigured = isStripeConfigured();
  } catch (error) {
    console.error("❌ Erreur lors de la vérification de la configuration Stripe:", error);
    // On continue avec stripeConfigured = false
  }

  // Vérification sécurisée du statut d'abonnement
  if (brand) {
    try {
      // Accès sécurisé à subscription_status avec vérification d'existence
      const subscriptionStatus = (brand as any)?.subscription_status;
      
      // Un utilisateur est en mode gratuit si :
      // - subscription_status n'existe pas OU
      // - subscription_status !== 'active' ET ce n'est pas juste après un paiement
      isFreePlan = 
        !subscriptionStatus || 
        (subscriptionStatus !== "active" && !isPaymentSuccess);
    } catch (error) {
      console.error("❌ Erreur lors de la vérification du statut d'abonnement:", error);
      // En cas d'erreur, on assume le plan gratuit (sécurité)
      isFreePlan = true;
    }
  } else {
    isFreePlan = false; // Pas de marque = pas de plan à afficher
  }

  // Vérification de sécurité finale : si user est null après toutes les vérifications,
  // on ne devrait jamais arriver ici (normalement redirigé), mais on sécurise quand même
  if (!user) {
    console.error("❌ ERREUR CRITIQUE: user est null après vérification d'auth");
    redirect(`/${locale}/login`);
  }

  return (
    <main className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Bannière de succès du paiement */}
        {isPaymentSuccess && (
          <Alert variant="success" className="border-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Paiement reçu !</AlertTitle>
            <AlertDescription>
              Activation de votre compte en cours... Votre abonnement Pro sera actif dans quelques instants.
            </AlertDescription>
          </Alert>
        )}

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
                  Bienvenue chez {brand?.name || "votre marque"}
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
                    <p className="font-medium">{brand?.name || "Non défini"}</p>
                  </div>
                  {brand?.website_url && (
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

