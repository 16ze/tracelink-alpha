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
  console.log("🔍 DEBUG STRIPE START");
  console.log("Variabe PRICE_ID:", process.env.STRIPE_PRO_PRICE_ID);
  console.log("Variable KEY exists:", !!process.env.STRIPE_SECRET_KEY);
  console.log("[createCheckoutSession] Action appelée avec locale:", locale);
  
  // Vérification de la configuration Stripe
  if (!isStripeConfigured()) {
    console.error("[createCheckoutSession] Stripe n'est pas correctement configuré");
    return null;
  }

  // Utilisation directe de la variable d'environnement côté serveur (sécurisé)
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!proPriceId) {
    console.error("[createCheckoutSession] STRIPE_PRO_PRICE_ID manquant dans les variables d'environnement");
    return null;
  }
  
  console.log("[createCheckoutSession] Configuration validée, création de la session...");

  // Récupération de l'utilisateur connecté
  console.log("[createCheckoutSession] Récupération de l'utilisateur...");
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("❌ [createCheckoutSession] Erreur lors de la récupération de l'utilisateur:", userError);
    return null;
  }
  console.log("[createCheckoutSession] Utilisateur récupéré:", user.id);

  try {
    // Récupération de la marque de l'utilisateur
    console.log("[createCheckoutSession] Récupération de la marque...");
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, stripe_customer_id")
      .eq("owner_id", user.id)
      .single();

    if (brandError || !brand) {
      console.error("❌ [createCheckoutSession] Erreur lors de la récupération de la marque:", brandError);
      return null;
    }
    console.log("[createCheckoutSession] Marque récupérée:", brand.id);

    // Création ou récupération du client Stripe
    let customerId = brand.stripe_customer_id;
    console.log("[createCheckoutSession] Customer ID existant:", customerId || "Aucun");

    // Vérification que l'instance Stripe est disponible
    if (!stripe) {
      console.error("❌ [createCheckoutSession] Instance Stripe non disponible (null)");
      return null;
    }

    if (!customerId) {
      console.log("[createCheckoutSession] Création d'un nouveau client Stripe...");
      // Création d'un nouveau client Stripe
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          brand_id: brand.id,
          user_id: user.id,
        },
      });

      customerId = customer.id;
      console.log("[createCheckoutSession] Nouveau client Stripe créé:", customerId);

      // Mise à jour de la marque avec le customer_id
      await supabase
        .from("brands")
        .update({ stripe_customer_id: customerId })
        .eq("id", brand.id);
      console.log("[createCheckoutSession] Marque mise à jour avec le customer_id");
    }

    // Création de la session de checkout
    console.log("[createCheckoutSession] Création de la session Stripe Checkout...");
    console.log("[createCheckoutSession] Paramètres:", {
      customerId,
      proPriceId,
      locale,
      appUrl: stripeConfig.appUrl,
    });
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
      success_url: `${stripeConfig.appUrl}/${locale}${stripeConfig.successUrl.replace(stripeConfig.appUrl, "")}`,
      cancel_url: `${stripeConfig.appUrl}/${locale}${stripeConfig.cancelUrl.replace(stripeConfig.appUrl, "")}`,
      metadata: {
        brand_id: brand.id,
        user_id: user.id,
      },
      locale: locale === "en" ? "en" : "fr",
    });

    console.log("[createCheckoutSession] Session créée avec succès, URL:", session.url);
    return session.url;
  } catch (error) {
    console.error("❌ ERREUR FATALE STRIPE:", error);
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
    }
    console.error("Erreur lors de la création de la session de checkout:", error);
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
  
  console.log("🔍 [redirectToCheckout] Début de la fonction");
  const locale = (formData.get("locale") as string) || "fr";
  console.log("🔍 [redirectToCheckout] Locale extraite:", locale);
  
  try {
    const checkoutUrl = await createCheckoutSession(locale);
    console.log("🔍 [redirectToCheckout] URL de checkout reçue:", checkoutUrl ? "✅ Présente" : "❌ Null/Undefined");

    if (checkoutUrl) {
      console.log("🔍 [redirectToCheckout] Retour de l'URL de checkout");
      return { checkoutUrl };
    } else {
      console.error("❌ [redirectToCheckout] Échec - createCheckoutSession a retourné null");
      return { error: "Impossible de créer la session de checkout. Vérifiez les logs serveur pour plus de détails." };
    }
  } catch (error) {
    console.error("❌ [redirectToCheckout] Exception capturée:", error);
    if (error instanceof Error) {
      console.error("❌ [redirectToCheckout] Message d'erreur:", error.message);
      console.error("❌ [redirectToCheckout] Stack:", error.stack);
    }
    return { error: `Erreur lors de la création de la session: ${error instanceof Error ? error.message : "Erreur inconnue"}` };
  }
}
