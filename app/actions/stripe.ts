"use server";

import { stripe, isStripeConfigured } from "@/utils/stripe/config";
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
 * ⚠️ CRITIQUE: Les metadata DOIVENT contenir brand_id pour que le webhook puisse
 * mettre à jour la bonne marque dans Supabase.
 * 
 * @param locale - La locale de l'application (pour les URLs de callback)
 * @returns { url: string } en cas de succès, { error: string } en cas d'erreur
 */
export async function createCheckoutSession(
  locale: string
): Promise<CheckoutSessionResult> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 [STRIPE ACTION] Début createCheckoutSession");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // ============================================
  // 1. VÉRIFICATION AUTHENTIFICATION
  // ============================================
  console.log("1️⃣ [STRIPE ACTION] Vérification de l'authentification...");
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("❌ [STRIPE ACTION] Utilisateur non connecté:", userError?.message);
    return { error: "not_authenticated" };
  }
  console.log("✅ [STRIPE ACTION] Utilisateur connecté:", user.id);
  console.log("📧 [STRIPE ACTION] Email:", user.email);

  // ============================================
  // 2. RÉCUPÉRATION DE LA MARQUE
  // ============================================
  console.log("2️⃣ [STRIPE ACTION] Récupération de la marque...");
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (brandError || !brand) {
    console.error("❌ [STRIPE ACTION] Pas de marque trouvée:", brandError?.message);
    return { error: "no_brand" };
  }

  const brandId = (brand as any).id;
  const brandName = (brand as any).name;
  console.log("✅ [STRIPE ACTION] Marque trouvée:");
  console.log("   🆔 Brand ID:", brandId);
  console.log("   🏷️  Brand Name:", brandName);

  // ============================================
  // 3. VÉRIFICATIONS DE CONFIGURATION STRIPE
  // ============================================
  console.log("3️⃣ [STRIPE ACTION] Vérification de la configuration Stripe...");
  
  if (!isStripeConfigured()) {
    console.error("❌ [STRIPE ACTION] Stripe n'est pas configuré");
    return { error: "Stripe n'est pas correctement configuré" };
  }

  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!proPriceId) {
    console.error("❌ [STRIPE ACTION] STRIPE_PRO_PRICE_ID manquant");
    return { error: "Configuration Stripe incomplète" };
  }
  console.log("✅ [STRIPE ACTION] Price ID:", proPriceId);

  if (!stripe) {
    console.error("❌ [STRIPE ACTION] Instance Stripe manquante");
    return { error: "Service Stripe indisponible" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error("❌ [STRIPE ACTION] NEXT_PUBLIC_APP_URL manquant");
    return { error: "Configuration serveur incomplète" };
  }
  console.log("✅ [STRIPE ACTION] App URL:", appUrl);

  // ============================================
  // 4. GESTION DU CUSTOMER STRIPE
  // ============================================
  console.log("4️⃣ [STRIPE ACTION] Gestion du customer Stripe...");
  
  let customerId: string | null = null;
  
  // Tentative de récupération du stripe_customer_id existant
  try {
    const { data: brandWithStripe } = await supabase
      .from("brands")
      .select("stripe_customer_id")
      .eq("id", brandId)
      .single();

    if (brandWithStripe && (brandWithStripe as any).stripe_customer_id) {
      customerId = (brandWithStripe as any).stripe_customer_id;
      console.log("♻️ [STRIPE ACTION] Customer Stripe existant:", customerId);
    }
  } catch (err) {
    console.log("ℹ️ [STRIPE ACTION] Colonne stripe_customer_id non disponible ou vide");
  }

  // Création d'un nouveau customer si nécessaire
  if (!customerId) {
    console.log("🆕 [STRIPE ACTION] Création d'un nouveau customer Stripe...");
    try {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          brand_id: brandId,
          user_id: user.id,
        },
      });

      customerId = customer.id;
      console.log("✅ [STRIPE ACTION] Customer créé:", customerId);

      // Sauvegarde du customer_id (si la colonne existe)
      try {
        const updateQuery = supabase.from("brands") as any;
        await updateQuery
          .update({ stripe_customer_id: customerId })
          .eq("id", brandId);
        console.log("✅ [STRIPE ACTION] Customer ID sauvegardé en DB");
      } catch (err) {
        console.log("⚠️ [STRIPE ACTION] Impossible de sauvegarder le customer ID (colonne manquante?)");
      }
    } catch (error) {
      console.error("❌ [STRIPE ACTION] Erreur création customer:", error);
      return { error: "Impossible de créer le customer Stripe" };
    }
  }

  // ============================================
  // 5. CRÉATION DE LA SESSION CHECKOUT
  // ============================================
  console.log("5️⃣ [STRIPE ACTION] Création de la session Checkout...");
  
  const successUrl = `${appUrl}/${locale}/dashboard?checkout=success`;
  const cancelUrl = `${appUrl}/${locale}/dashboard?checkout=canceled`;
  
  console.log("🔗 [STRIPE ACTION] Success URL:", successUrl);
  console.log("🔗 [STRIPE ACTION] Cancel URL:", cancelUrl);

  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔥 [STRIPE ACTION] CRÉATION SESSION AVEC METADATA:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   🆔 brand_id:", brandId);
    console.log("   👤 user_id:", user.id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

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
      // ⚠️ CRITIQUE: Ces metadata sont ESSENTIELLES pour le webhook
      metadata: {
        brand_id: brandId,
        user_id: user.id,
      },
      locale: locale === "en" ? "en" : "fr",
    });

    console.log("✅ [STRIPE ACTION] Session créée avec succès!");
    console.log("   🆔 Session ID:", session.id);
    console.log("   🔗 URL:", session.url ? "✅ Présente" : "❌ Manquante");
    console.log("   📦 Metadata envoyées:", session.metadata);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!session.url) {
      console.error("❌ [STRIPE ACTION] Session URL manquante");
      return { error: "L'URL de checkout n'a pas pu être générée" };
    }

    return { url: session.url };
  } catch (error) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ [STRIPE ACTION] ERREUR LORS DE LA CRÉATION:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(error);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Une erreur inconnue s'est produite" };
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
 * @deprecated Utilisez directement createCheckoutSession() dans vos composants client
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
      error: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}` 
    };
  }
}
