import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendProConfirmationEmail } from "@/app/actions/email";

export const dynamic = "force-dynamic";

/**
 * WEBHOOK STRIPE - VERSION ADMIN
 * 
 * ⚠️ CRITIQUE: Utilise SUPABASE_SERVICE_ROLE_KEY pour contourner RLS
 * Le client Supabase est initialisé DANS la fonction POST avec la clé service role
 */

export async function POST(req: Request) {
  console.log("1. Webhook Start");
  
  try {
    // ============================================
    // ÉTAPE 1: LECTURE DU BODY
    // ============================================
    const body = await req.text();

    // ============================================
    // ÉTAPE 2: VÉRIFICATION DE LA SIGNATURE
    // ============================================
    const signature = (await headers()).get("stripe-signature");
    
    if (!signature) {
      console.error("❌ Signature manquante");
      return new NextResponse("Missing signature", { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!webhookSecret || !stripeSecretKey) {
      console.error("❌ Configuration Stripe manquante");
      return new NextResponse("Configuration error", { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("2. Signature OK");
    } catch (err: any) {
      console.error("❌ Erreur signature:", err.message);
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // ============================================
    // ÉTAPE 3: FILTRAGE DES ÉVÉNEMENTS
    // ============================================
    console.log("3. Event:", event.type);
    
    if (event.type !== "checkout.session.completed") {
      console.log("ℹ️ Événement ignoré");
      return new NextResponse(JSON.stringify({ received: true, ignored: true }), { status: 200 });
    }

    // ============================================
    // ÉTAPE 4: EXTRACTION DES DONNÉES
    // ============================================
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("4. Metadata:", session.metadata);
    
    const brandId = session.metadata?.brand_id;
    console.log("5. Brand ID cible:", brandId);

    if (!brandId) {
      console.error("❌ ERREUR: brand_id manquant dans metadata");
      return new NextResponse(
        JSON.stringify({ 
          error: "brand_id missing in metadata",
          metadata: session.metadata 
        }), 
        { status: 400 }
      );
    }

    // ============================================
    // ÉTAPE 5: INITIALISATION SUPABASE ADMIN
    // ============================================
    // ⚠️ CRITIQUE: Initialisation DANS la fonction avec SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Configuration Supabase manquante");
      return new NextResponse("Supabase configuration error", { status: 500 });
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // ============================================
    // ÉTAPE 6: VÉRIFICATION DE L'EXISTENCE DE LA MARQUE
    // ============================================
    const { data: existingBrand, error: fetchError } = await supabaseAdmin
      .from("brands")
      .select("id, name, subscription_status, owner_id")
      .eq("id", brandId)
      .single();

    if (fetchError) {
      console.error("❌ ERREUR DB: Marque non trouvée", fetchError);
      return new NextResponse(
        JSON.stringify({ 
          error: "Brand not found in database",
          brand_id: brandId,
          supabase_error: fetchError 
        }), 
        { status: 500 }
      );
    }

    console.log("✅ Marque trouvée:", existingBrand.name);
    console.log("   Statut actuel:", existingBrand.subscription_status || "null");

    // ============================================
    // ÉTAPE 7: DÉTERMINATION DU PLAN
    // ============================================
    // Récupération du plan depuis les metadata ou depuis la subscription Stripe
    let planName: "starter" | "pro" = "pro"; // Par défaut, on assume Pro pour compatibilité
    
    // Vérification dans les metadata de la session
    if (session.metadata?.plan === "starter") {
      planName = "starter";
    } else {
      // Si pas dans metadata, on essaie de récupérer depuis la subscription Stripe
      if (session.subscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = subscription.items.data[0]?.price.id;
          
          // Comparaison avec les price IDs configurés
          const starterPriceId = process.env.STRIPE_STARTER_PRICE_ID;
          if (starterPriceId && priceId === starterPriceId) {
            planName = "starter";
          }
        } catch (err) {
          console.warn("⚠️ Impossible de récupérer la subscription Stripe, utilisation du plan par défaut (Pro)");
        }
      }
    }

    console.log("📦 Plan détecté:", planName);

    // ============================================
    // ÉTAPE 8: MISE À JOUR DU STATUT D'ABONNEMENT
    // ============================================
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from("brands")
      .update({
        subscription_status: "active",
        plan_name: planName,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      })
      .eq("id", brandId)
      .select();

    if (updateError) {
      console.error("❌ ERREUR DB:", updateError);
      return new NextResponse(
        JSON.stringify({ 
          error: "Failed to update subscription status in database",
          brand_id: brandId,
          supabase_error: updateError,
          hint: "Check RLS policies and column existence"
        }), 
        { status: 500 }
      );
    }

    console.log("✅ SUCCÈS UPDATE DB");
    console.log("   Brand ID:", brandId);
    console.log("   Statut mis à jour: active");
    console.log("   Plan mis à jour:", planName);
    console.log("   Résultat:", JSON.stringify(updateResult, null, 2));

    // ============================================
    // ÉTAPE 9: ENVOI DE L'EMAIL DE CONFIRMATION
    // ============================================
    if (session.customer_details?.email) {
      console.log("📧 8. [WEBHOOK] Envoi de l'email de confirmation Pro...");
      try {
        const email = session.customer_details.email;
        const name = session.customer_details.name || existingBrand.name || "Client";
        
        // Envoi non bloquant pour ne pas faire timeout le webhook
        sendProConfirmationEmail(email, name).then(() => {
          console.log("✅ [WEBHOOK] Email Pro envoyé");
        }).catch(err => {
          console.error("⚠️ [WEBHOOK] Erreur envoi email Pro:", err);
        });
      } catch (emailError) {
        console.error("⚠️ [WEBHOOK] Erreur préparation email Pro:", emailError);
      }
    }

    return new NextResponse(
      JSON.stringify({ 
        received: true,
        processed: true,
        brand_id: brandId,
        subscription_status: "active"
      }), 
      { status: 200 }
    );

  } catch (err: any) {
    console.error("❌ ERREUR FATALE:", err.message);
    console.error("   Stack:", err.stack);
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal server error",
        message: err.message,
      }), 
      { status: 500 }
    );
  }
}
