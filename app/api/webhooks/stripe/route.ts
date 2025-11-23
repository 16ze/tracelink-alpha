import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

// Client Admin pour contourner le RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  console.log("🔔 [WEBHOOK] Réception d'un événement Stripe");
  
  try {
    const body = await req.text();
    console.log("🔔 [WEBHOOK] Body reçu, longueur:", body.length);
    
    const signature = (await headers()).get("stripe-signature");
    console.log("🔔 [WEBHOOK] Signature présente:", !!signature);

    if (!signature) {
      console.error("❌ [WEBHOOK] Signature manquante dans les headers");
      return new NextResponse("Missing signature", { status: 400 });
    }

    let event: Stripe.Event;

    try {
      console.log("🔔 [WEBHOOK] Vérification de la signature...");
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("✅ [WEBHOOK] Signature validée. Type d'événement:", event.type);
    } catch (err: any) {
      console.error(`❌ [WEBHOOK] Erreur lors de la vérification de la signature: ${err.message}`);
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      console.log("💰 [WEBHOOK] Événement checkout.session.completed détecté");
      const session = event.data.object as Stripe.Checkout.Session;
      const brandId = session.metadata?.brand_id;
      console.log("💰 [WEBHOOK] Brand ID extrait:", brandId);

      if (brandId) {
        console.log("💰 [WEBHOOK] Mise à jour de la base de données pour brand_id:", brandId);
        const { error } = await supabaseAdmin
          .from("brands")
          .update({
            subscription_status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", brandId);

        if (error) {
          console.error("❌ [WEBHOOK] Erreur lors de la mise à jour Supabase:", error);
        } else {
          console.log("✅ [WEBHOOK] Base de données mise à jour avec succès pour brand_id:", brandId);
        }
      } else {
        console.warn("⚠️ [WEBHOOK] Aucun brand_id trouvé dans les métadonnées de la session");
      }
    } else {
      console.log("ℹ️ [WEBHOOK] Événement ignoré (type:", event.type, ")");
    }

    console.log("✅ [WEBHOOK] Traitement terminé avec succès");
    return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    console.error("❌ [WEBHOOK] Erreur serveur fatale:", err.message);
    console.error("❌ [WEBHOOK] Stack trace:", err.stack);
    return new NextResponse(`Server Error: ${err.message}`, { status: 500 });
  }
}
