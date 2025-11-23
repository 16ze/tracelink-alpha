"use server";

import { stripe, stripeConfig, isStripeConfigured } from "@/utils/stripe/config";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Action serveur pour créer une session de checkout Stripe pour le plan Pro
 * 
 * @param locale - La locale de l'application (pour les redirections)
 * @returns L'URL de redirection vers Stripe Checkout ou null en cas d'erreur
 */
export async function createCheckoutSession(locale: string): Promise<string | null> {
  // Logs de vérification des variables d'environnement
  console.log('🔑 Checking Keys - Secret:', !!process.env.STRIPE_SECRET_KEY, 'PriceID:', !!process.env.STRIPE_PRO_PRICE_ID);
  
  // Vérification de la configuration Stripe
  if (!isStripeConfigured()) {
    console.error("❌ Stripe n'est pas correctement configuré");
    return null;
  }

  // Utilisation directe de la variable d'environnement côté serveur (sécurisé)
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!proPriceId) {
    console.error("❌ STRIPE_PRO_PRICE_ID n'est pas définie");
    return null;
  }

  // ============================================
  // 1. VÉRIFICATION AUTHENTIFICATION (HORS try/catch)
  // ============================================
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Gestion de l'authentification : redirection vers login si non connecté
  if (userError || !user) {
    console.log("🔐 Utilisateur non connecté, redirection vers /login");
    redirect(`/${locale}/login`);
  }

  // Récupération de la marque de l'utilisateur
  // On sélectionne d'abord seulement l'id pour éviter l'erreur si la colonne n'existe pas
  // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes Stripe
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Gestion du cas où l'utilisateur n'a pas de marque : redirection vers dashboard
  if (brandError || !brand) {
    console.log("🏢 Utilisateur connecté mais pas de marque, redirection vers /dashboard");
    redirect(`/${locale}/dashboard`);
  }

  const brandId = (brand as any).id;

  // ============================================
  // 2. LOGIQUE STRIPE (DANS le try/catch)
  // ============================================
  try {

    // Tentative de récupération du stripe_customer_id (si la colonne existe)
    let customerId: string | null = null;
    try {
      // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes Stripe
      const { data: brandWithStripe, error: stripeError } = await supabase
        .from("brands")
        .select("stripe_customer_id")
        .eq("id", brandId)
        .single();
      
      if (!stripeError && brandWithStripe) {
        customerId = (brandWithStripe as any).stripe_customer_id;
      }
    } catch (err) {
      // Colonne n'existe pas encore - ignoré silencieusement
      customerId = null;
    }

    // Vérification que l'instance Stripe est disponible
    if (!stripe) {
      return null;
    }

    if (!customerId) {
      // Création d'un nouveau client Stripe
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          brand_id: brandId,
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Mise à jour de la marque avec le customer_id (si la colonne existe)
      try {
        // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes Stripe
        const updateQuery = supabase.from("brands") as any;
        await updateQuery.update({ stripe_customer_id: customerId }).eq("id", brandId);
      } catch (err) {
        // Colonne n'existe pas encore - ignoré silencieusement
      }
    }

    // Construction des URLs de redirection avec fallback de sécurité
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!appUrl) {
      console.error("❌ ERREUR CRITIQUE: NEXT_PUBLIC_APP_URL n'est pas définie. Impossible de créer la session de checkout.");
      return null;
    }

    // Construction des URLs avec la locale
    const successUrl = `${appUrl}/${locale}/dashboard?checkout=success`;
    const cancelUrl = `${appUrl}/${locale}/dashboard?checkout=canceled`;

    // Création de la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: proPriceId, // Utilisation directe de la variable d'environnement
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        brand_id: brandId,
        user_id: user.id,
      },
      locale: locale === "en" ? "en" : "fr",
    });

    console.log("✅ Session de checkout créée avec succès:", session.id);
    return session.url;
  } catch (error) {
    // Logs détaillés pour identifier la vraie erreur
    console.error("❌ STRIPE ERROR DETAILS:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    // Si c'est une erreur de redirection Next.js, on la propage (ne devrait pas arriver ici)
    if (error && typeof error === 'object' && 'digest' in error && (error as any).digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return null;
  }
}

/**
 * Type de retour pour l'action de checkout
 */
export type CheckoutActionState = {
  error?: string;
  checkoutUrl?: string;
};

/**
 * Action serveur pour créer une session de checkout Stripe
 * 
 * Cette fonction retourne l'URL de checkout au lieu de rediriger directement.
 * La redirection sera gérée côté client pour éviter les problèmes avec redirect().
 * 
 * @param prevState - État précédent (pour useActionState)
 * @param formData - Contient la locale
 * @returns État avec checkoutUrl ou error
 */
export async function redirectToCheckout(
  prevState: CheckoutActionState | null,
  formData: FormData
): Promise<CheckoutActionState> {
  "use server";
  
  const locale = (formData.get("locale") as string) || "fr";
  
  try {
    const checkoutUrl = await createCheckoutSession(locale);

    if (checkoutUrl) {
      return { checkoutUrl };
    } else {
      return { error: "Impossible de créer la session de checkout. Veuillez réessayer." };
    }
  } catch (error) {
    return { error: `Erreur lors de la création de la session: ${error instanceof Error ? error.message : "Erreur inconnue"}` };
  }
}
