import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeConfig } from "@/utils/stripe/config";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Route API pour gérer les webhooks Stripe
 *
 * Cette route :
 * 1. Vérifie la signature du webhook pour garantir la sécurité
 * 2. Écoute l'événement checkout.session.completed
 * 3. Met à jour le statut d'abonnement dans la base de données
 *
 * IMPORTANT : Cette route doit recevoir le body brut (raw) pour la vérification de signature.
 * Next.js doit être configuré pour ne pas parser automatiquement le body.
 */
export async function POST(request: NextRequest) {
  try {
    // Récupération du body brut (raw) pour la vérification de signature Stripe
    const body = await request.text();

    // Récupération de la signature depuis les headers
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Vérification du webhook secret
    if (!stripeConfig.webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Vérification de la signature du webhook
    // Cette étape est CRITIQUE pour la sécurité : elle garantit que le webhook vient bien de Stripe
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeConfig.webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Traitement de l'événement checkout.session.completed
    // Cet événement est déclenché quand un utilisateur complète avec succès un paiement
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Récupération des métadonnées stockées lors de la création de la session
      const brandId = session.metadata?.brand_id;
      const userId = session.metadata?.user_id;

      if (!brandId) {
        console.error("Missing brand_id in session metadata");
        return NextResponse.json(
          { error: "Missing brand_id in metadata" },
          { status: 400 }
        );
      }

      // Vérification que les variables d'environnement Supabase sont définies
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }

      if (!supabaseServiceRoleKey) {
        console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }

      // Création d'un client Supabase avec la clé SERVICE_ROLE
      // Cette clé permet de bypasser les RLS (Row Level Security) pour les opérations admin
      // IMPORTANT : Ne jamais exposer cette clé côté client !
      const supabaseAdmin = createClient<Database>(
        supabaseUrl,
        supabaseServiceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      // Mise à jour de la marque avec le statut d'abonnement actif
      const { error: updateError } = await supabaseAdmin
        .from("brands")
        .update({
          subscription_status: "active",
          plan_name: "pro",
          stripe_customer_id: session.customer as string | null,
          stripe_subscription_id: session.subscription as string | null,
        })
        .eq("id", brandId);

      if (updateError) {
        console.error("Error updating brand subscription:", updateError);
        return NextResponse.json(
          { error: "Failed to update subscription" },
          { status: 500 }
        );
      }

      console.log(
        `Subscription activated for brand ${brandId} (user ${userId})`
      );

      // Retour d'une réponse 200 pour confirmer à Stripe que le webhook a été traité
      return NextResponse.json({ received: true });
    }

    // Si l'événement n'est pas celui que nous traitons, on retourne quand même 200
    // pour éviter que Stripe ne réessaie de l'envoyer
    console.log(`Unhandled event type: ${event.type}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Configuration Next.js pour cette route
 *
 * IMPORTANT : On désactive le parsing automatique du body pour pouvoir
 * récupérer le raw body nécessaire à la vérification de signature Stripe.
 * On force également le mode dynamique pour éviter la mise en cache.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";


