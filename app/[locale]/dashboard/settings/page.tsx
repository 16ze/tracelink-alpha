import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserBrand, updateBrandSettings } from "../actions";
import { BrandSettingsForm } from "@/components/dashboard/brand-settings-form";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";

/**
 * Action serveur pour la déconnexion
 */
async function logoutAction(formData: FormData) {
  "use server";
  const locale = formData.get("locale") as string;
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}

/**
 * Page de paramètres de la marque (White Label)
 *
 * Permet aux utilisateurs de personnaliser leur marque,
 * notamment la couleur principale et le masquage du branding TraceLink (Pro uniquement).
 */
export default async function BrandSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Vérification de l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Récupération de la marque
  const brand = await getUserBrand();

  if (!brand) {
    redirect(`/${locale}/dashboard`);
  }

  // Vérification du statut d'abonnement
  // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes Stripe
  const subscriptionStatus = (brand as any)?.subscription_status;
  const isProPlan = subscriptionStatus === "active";

  // Récupération des valeurs pour le formulaire
  // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes white label
  const primaryColor = (brand as any)?.primary_color || "#000000";
  // @ts-ignore
  const removeBranding = (brand as any)?.remove_branding || false;

  return (
    <main className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <Logo size="md" href={`/${locale}/dashboard`} />
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/dashboard`}>
              <Button variant="outline">Retour au dashboard</Button>
            </Link>
            <form action={logoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </form>
          </div>
        </div>

        {/* Titre de la page */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Paramètres de la marque
          </h1>
          <p className="text-muted-foreground mt-2">
            Personnalisez l'apparence de vos passeports publics
          </p>
        </div>

        {/* Formulaire de paramètres */}
        <BrandSettingsForm
          brand={brand}
          isProPlan={isProPlan}
          initialPrimaryColor={primaryColor}
          initialRemoveBranding={removeBranding}
          locale={locale}
        />
      </div>
    </main>
  );
}

