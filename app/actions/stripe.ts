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
  // Vérification de la configuration Stripe
  if (!isStripeConfigured()) {
    console.error("Stripe n'est pas correctement configuré");
    return null;
  }

  // Récupération de l'utilisateur connecté
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Erreur lors de la récupération de l'utilisateur:", userError);
    return null;
  }

  try {
    // Récupération de la marque de l'utilisateur
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, stripe_customer_id")
      .eq("owner_id", user.id)
      .single();

    if (brandError || !brand) {
      console.error("Erreur lors de la récupération de la marque:", brandError);
      return null;
    }

    // Création ou récupération du client Stripe
    let customerId = brand.stripe_customer_id;

    if (!customerId) {
      // Création d'un nouveau client Stripe
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          brand_id: brand.id,
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Mise à jour de la marque avec le customer_id
      await supabase
        .from("brands")
        .update({ stripe_customer_id: customerId })
        .eq("id", brand.id);
    }

    // Création de la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripeConfig.proPriceId,
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

    return session.url;
  } catch (error) {
    console.error("Erreur lors de la création de la session de checkout:", error);
    return null;
  }
}

/**
 * Action serveur pour rediriger vers Stripe Checkout
 * 
 * Cette fonction est utilisée par le composant ProButton pour déclencher le checkout.
 * 
 * @param formData - Contient la locale
 */
export async function redirectToCheckout(formData: FormData) {
  "use server";
  
  const locale = (formData.get("locale") as string) || "fr";
  const checkoutUrl = await createCheckoutSession(locale);

  if (checkoutUrl) {
    redirect(checkoutUrl);
  } else {
    // En cas d'erreur, rediriger vers le dashboard avec un message d'erreur
    redirect(`/${locale}/dashboard?error=checkout_failed`);
  }
}
