"use server";

import { stripe, stripeConfig, isStripeConfigured } from "@/utils/stripe/config";
import { createClient } from "@/utils/supabase/server";

/**
 * Type de retour pour la fonction createCheckoutSession
 */
export type CheckoutSessionResult = 
  | { url: string }
  | { error: string };

/**
 * Action serveur pour créer une session de checkout Stripe pour le plan Pro
 * 
 * Cette fonction retourne un objet avec `url` en cas de succès ou `error` en cas d'échec.
 * La redirection est gérée côté client pour éviter les problèmes avec redirect().
 * 
 * @param locale - La locale de l'application (pour les URLs de callback)
 * @returns { url: string } en cas de succès, { error: string } en cas d'erreur
 */
export async function createCheckoutSession(
  locale: string
): Promise<CheckoutSessionResult> {
  // ============================================
  // 1. VÉRIFICATION AUTHENTIFICATION
  // ============================================
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Retourne une erreur d'authentification si l'utilisateur n'est pas connecté
  if (userError || !user) {
    console.log("🔐 Utilisateur non connecté");
    return { error: "not_authenticated" };
  }

  // Récupération de la marque de l'utilisateur
  // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes Stripe
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Si l'utilisateur n'a pas de marque, retourne une erreur
  if (brandError || !brand) {
    console.log("🏢 Utilisateur connecté mais pas de marque");
    return { error: "no_brand" };
  }

  const brandId = (brand as any).id;

  // ============================================
  // 2. VÉRIFICATIONS DE CONFIGURATION
  // ============================================
  // Logs de vérification des variables d'environnement
  console.log(
    "🔑 Checking Keys - Secret:",
    !!process.env.STRIPE_SECRET_KEY,
    "PriceID:",
    !!process.env.STRIPE_PRO_PRICE_ID
  );

  // Vérification de la configuration Stripe
  if (!isStripeConfigured()) {
    console.error("❌ Stripe n'est pas correctement configuré");
    return { error: "Stripe n'est pas correctement configuré" };
  }

  // Utilisation directe de la variable d'environnement côté serveur (sécurisé)
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!proPriceId) {
    console.error("❌ STRIPE_PRO_PRICE_ID n'est pas définie");
    return { error: "Configuration Stripe incomplète" };
  }

  // Vérification que l'instance Stripe est disponible
  if (!stripe) {
    return { error: "Service Stripe indisponible" };
  }

  // Construction des URLs de redirection avec fallback de sécurité
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error(
      "❌ ERREUR CRITIQUE: NEXT_PUBLIC_APP_URL n'est pas définie. Impossible de créer la session de checkout."
    );
    return { error: "Configuration serveur incomplète" };
  }

  // ============================================
  // 3. LOGIQUE STRIPE
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
        await updateQuery
          .update({ stripe_customer_id: customerId })
          .eq("id", brandId);
      } catch (err) {
        // Colonne n'existe pas encore - ignoré silencieusement
      }
    }

    // Construction des URLs avec la locale
    const successUrl = `${appUrl}/${locale}/dashboard?checkout=success`;
    const cancelUrl = `${appUrl}/${locale}/dashboard?checkout=canceled`;

    // 🛒 CRITIQUE: Log avant création de la session pour traçabilité
    console.log('🛒 Création session pour brand:', brandId);
    console.log('   👤 User ID:', user.id);
    console.log('   📦 Metadata qui sera envoyée:', {
      brand_id: brandId,
      user_id: user.id
    });

    // Création de la session de checkout
    // ⚠️ CRITIQUE: metadata DOIT contenir brand_id et user_id
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: proPriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        brand_id: brandId, // C'est la clé vitale
        user_id: user.id,
      },
      locale: locale === "en" ? "en" : "fr",
    });

    console.log("✅ Session de checkout créée avec succès:", session.id);

    if (!session.url) {
      return { error: "L'URL de checkout n'a pas pu être générée" };
    }

    return { url: session.url };
  } catch (error) {
    // Logs détaillés pour identifier la vraie erreur
    console.error("❌ STRIPE ERROR DETAILS:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
      return { error: error.message };
    }
    return { error: "Une erreur inconnue s'est produite lors de la création de la session" };
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
 * Action serveur pour créer une session de checkout Stripe (wrapper legacy)
 * 
 * Cette fonction est un wrapper pour compatibilité avec useActionState.
 * Elle adapte le résultat de createCheckoutSession au format CheckoutActionState.
 * 
 * @deprecated Utilisez directement createCheckoutSession() dans vos composants client
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
    const result = await createCheckoutSession(locale);

    if ("url" in result) {
      return { checkoutUrl: result.url };
    } else {
      return { error: result.error };
    }
  } catch (error) {
    return { 
      error: `Erreur lors de la création de la session: ${error instanceof Error ? error.message : "Erreur inconnue"}` 
    };
  }
}
