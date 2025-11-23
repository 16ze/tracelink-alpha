import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// 1. Initialisation de Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-11-17.clover",
});

// 2. Configuration Supabase Admin (Service Role)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase environment variables are not defined");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 3. Secret du Webhook
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not defined");
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature");
    
    if (!signature) {
      return new NextResponse("Missing stripe-signature header", { status: 400 });
    }

    let event: Stripe.Event;

    // Vérification de la signature Stripe
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
    } catch (err: any) {
      console.error(`❌ Erreur signature Webhook: ${err.message}`);
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Gestion de l'événement
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Récupération des métadonnées envoyées lors du paiement
      const brandId = session.metadata?.brand_id;

      if (brandId) {
        console.log(`💰 Paiement validé pour la marque: ${brandId}`);

        // Mise à jour de la base de données via Supabase Admin
        const { error } = await supabaseAdmin
          .from("brands")
          .update({
            subscription_status: "active",
            plan_name: "pro",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", brandId);

        if (error) {
          console.error("❌ Erreur Supabase:", error);
          return new NextResponse("Database Error", { status: 500 });
        }
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (err: any) {
    console.error(`❌ Erreur serveur: ${err.message}`);
    return new NextResponse("Server Error", { status: 500 });
  }
}
