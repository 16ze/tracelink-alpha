"use server";

import { createClient } from "@/utils/supabase/server";
import { stripe, stripeConfig } from "@/utils/stripe/config";
import { redirect } from "next/navigation";

/**
 * Server Action pour créer une session Stripe Checkout
 *
 * Cette action :
 * 1. Vérifie que l'utilisateur est connecté
 * 2. Récupère la marque (brand) de l'utilisateur
 * 3. Crée une session Stripe Checkout en mode subscription
 * 4. Redirige l'utilisateur vers la page de paiement Stripe
 *
 * @param priceId - L'ID du prix Stripe pour le plan d'abonnement
 * @param locale - La locale actuelle (pour la redirection en cas d'annulation)
 * @returns Redirige vers Stripe Checkout ou retourne une erreur
 */
export async function createCheckoutSession(
  priceId: string,
  locale: string = "fr"
) {
  try {
    console.log("🚀 Action Stripe lancée, PriceID:", priceId);
    
    // Vérification de la clé Stripe avec plus de détails
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("❌ ERREUR: STRIPE_SECRET_KEY est MANQUANTE");
      return {
        error: "Configuration Stripe manquante. Veuillez contacter le support.",
      };
    }
    
    // Vérification que c'est bien une clé secrète
    if (stripeKey.startsWith("pk_")) {
      console.error("❌ ERREUR: STRIPE_SECRET_KEY contient une clé PUBLIQUE (pk_) au lieu d'une clé SECRÈTE (sk_)");
      return {
        error: "Configuration Stripe incorrecte : une clé publique a été utilisée au lieu d'une clé secrète. Veuillez vérifier votre fichier .env.local",
      };
    }
    
    if (!stripeKey.startsWith("sk_")) {
      console.error("❌ ERREUR: STRIPE_SECRET_KEY ne semble pas être une clé secrète valide");
      return {
        error: "Configuration Stripe incorrecte : la clé secrète n'est pas valide. Veuillez vérifier votre fichier .env.local",
      };
    }
    
    // Masquer la clé dans les logs (afficher seulement les 7 premiers et 4 derniers caractères)
    const maskedKey = stripeKey.substring(0, 7) + "..." + stripeKey.substring(stripeKey.length - 4);
    console.log("🔑 Clé Stripe:", `Présente (${maskedKey})`);

    // Création du client Supabase pour accéder à la base de données
    const supabase = await createClient();

    // Vérification que l'utilisateur est connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("👤 User:", user?.id || "NON CONNECTÉ");
    if (authError) {
      console.error("❌ ERREUR AUTH:", authError);
    }

    if (authError || !user) {
      // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
      console.log("🔄 Redirection vers login (utilisateur non connecté)");
      redirect(`/${locale}/login?redirect=pricing`);
    }

    // Récupération de la marque (brand) associée à l'utilisateur
    console.log("🔍 Récupération de la marque pour l'utilisateur:", user.id);
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (brandError) {
      console.error("❌ ERREUR STRIPE - Erreur lors de la récupération de la marque:", brandError);
    }

    if (brandError || !brand) {
      // Si l'utilisateur n'a pas de marque, rediriger vers le dashboard pour en créer une
      console.error("❌ ERREUR STRIPE - Pas de marque, redirection vers dashboard");
      if (brandError) {
        console.error("Détails de l'erreur:", brandError);
      }
      redirect(`/${locale}/dashboard?error=no_brand`);
    }

    console.log("✅ Marque trouvée:", brand.id);

    // Construction des URLs de redirection avec l'URL dynamique
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${appUrl}/${locale}/dashboard?success=true`;
    const cancelUrl = `${appUrl}/${locale}?canceled=true`;

    console.log("🔗 URLs de redirection:", { successUrl, cancelUrl });

    // Création de la session Stripe Checkout
    console.log("💳 Création de la session Stripe Checkout...");
    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // Mode abonnement récurrent
      payment_method_types: ["card"], // Types de paiement acceptés
      line_items: [
        {
          price: priceId, // ID du prix Stripe passé en paramètre
          quantity: 1, // Quantité d'abonnements
        },
      ],
      success_url: successUrl, // URL de redirection après succès
      cancel_url: cancelUrl, // URL de redirection en cas d'annulation
      metadata: {
        // Métadonnées stockées avec la session pour les retrouver plus tard
        brand_id: brand.id, // ID de la marque
        user_id: user.id, // ID de l'utilisateur
      },
      // Permet de préremplir l'email dans le formulaire Stripe
      customer_email: user.email || undefined,
    });

    console.log("✅ Session Stripe créée:", session.id);

    // Redirection vers la page de paiement Stripe
    if (session.url) {
      console.log("🔄 Redirection vers:", session.url);
      redirect(session.url);
    }

    console.error("❌ ERREUR STRIPE - Pas d'URL de session");
    return {
      error: "Impossible de créer la session de paiement",
    };
  } catch (error) {
    // Les redirections Next.js lancent une exception spéciale
    // On doit la laisser remonter pour que Next.js la gère
    if (
      error &&
      typeof error === "object" &&
      ("digest" in error || "message" in error)
    ) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("NEXT_REDIRECT") ||
        (error as any).digest?.includes("NEXT_REDIRECT")
      ) {
        // C'est une redirection Next.js, on la laisse remonter
        throw error;
      }
    }
    
    // Sinon, c'est une vraie erreur qu'on doit gérer
    console.error("❌ ERREUR STRIPE:", error);
    if (error instanceof Error) {
      console.error("❌ Message d'erreur:", error.message);
      console.error("❌ Stack trace:", error.stack);
    }
    return {
      error:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la création de la session de paiement",
    };
  }
}

