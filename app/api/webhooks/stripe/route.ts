import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * WEBHOOK STRIPE ULTRA-BLINDÉ
 * 
 * Ce webhook reçoit les événements Stripe et met à jour la base de données Supabase.
 * Les logs sont ultra-détaillés pour faciliter le debugging dans Vercel.
 * 
 * ⚠️ CRITIQUE: Utilise SUPABASE_SERVICE_ROLE_KEY pour contourner RLS
 */

export async function POST(req: Request) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔔 1. [WEBHOOK] Réception d'un événement Stripe");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   🕐 Timestamp:", new Date().toISOString());
  
  try {
    // ============================================
    // ÉTAPE 1: LECTURE DU BODY
    // ============================================
    const body = await req.text();
    console.log("✅ 2. [WEBHOOK] Body reçu");
    console.log("   📏 Longueur:", body.length, "caractères");

    // ============================================
    // ÉTAPE 2: VÉRIFICATION DE LA SIGNATURE
    // ============================================
    console.log("🔍 3. [WEBHOOK] Vérification de la signature...");
    const signature = (await headers()).get("stripe-signature");
    
    if (!signature) {
      console.error("❌ [WEBHOOK] ERREUR: Signature manquante dans les headers");
      return new NextResponse("Missing signature", { status: 400 });
    }
    console.log("✅ [WEBHOOK] Signature présente:", signature.substring(0, 20) + "...");

    // Vérification des variables d'environnement
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripeSecretKey) {
      console.error("❌ [WEBHOOK] ERREUR FATALE: STRIPE_SECRET_KEY manquante");
      return new NextResponse("Configuration error", { status: 500 });
    }
    
    if (!webhookSecret) {
      console.error("❌ [WEBHOOK] ERREUR FATALE: STRIPE_WEBHOOK_SECRET manquante");
      return new NextResponse("Configuration error", { status: 500 });
    }
    
    console.log("✅ [WEBHOOK] Variables d'environnement Stripe OK");

    // Initialisation de Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });

    // Construction de l'événement
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("✅ 4. [WEBHOOK] Signature vérifiée avec succès");
      console.log("   📋 Event ID:", event.id);
      console.log("   🏷️  Event Type:", event.type);
    } catch (err: any) {
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ [WEBHOOK] ERREUR DE VÉRIFICATION DE SIGNATURE");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("   Message:", err.message);
      console.error("   Type:", err.type);
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // ============================================
    // ÉTAPE 3: FILTRAGE DES ÉVÉNEMENTS
    // ============================================
    console.log("5️⃣ [WEBHOOK] Analyse du type d'événement...");
    
    if (event.type !== "checkout.session.completed") {
      console.log("ℹ️ [WEBHOOK] Événement ignoré (type:", event.type, ")");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return new NextResponse(JSON.stringify({ received: true, ignored: true }), { status: 200 });
    }

    console.log("✅ [WEBHOOK] Type d'événement: checkout.session.completed");

    // ============================================
    // ÉTAPE 4: EXTRACTION DES DONNÉES
    // ============================================
    console.log("6️⃣ [WEBHOOK] Extraction des données de la session...");
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📦 [WEBHOOK] DONNÉES DE LA SESSION:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   🆔 Session ID:", session.id);
    console.log("   👤 Customer ID:", session.customer);
    console.log("   💳 Subscription ID:", session.subscription);
    console.log("   💰 Amount Total:", session.amount_total);
    console.log("   💵 Currency:", session.currency);
    console.log("   ✅ Payment Status:", session.payment_status);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 [WEBHOOK] METADATA REÇUES:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(JSON.stringify(session.metadata, null, 2));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const brandId = session.metadata?.brand_id;
    const userId = session.metadata?.user_id;

    if (!brandId) {
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ [WEBHOOK] ERREUR CRITIQUE: brand_id MANQUANT dans metadata");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("   ⚠️  Metadata reçues:", session.metadata);
      console.error("   ⚠️  Impossible de mettre à jour la base de données");
      console.error("   ⚠️  Vérifier app/actions/stripe.ts ligne metadata");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return new NextResponse(
        JSON.stringify({ 
          error: "brand_id missing in metadata",
          metadata: session.metadata 
        }), 
        { status: 400 }
      );
    }

    console.log("✅ 7. [WEBHOOK] Brand ID extrait:", brandId);
    if (userId) {
      console.log("✅ [WEBHOOK] User ID extrait:", userId);
    }

    // ============================================
    // ÉTAPE 5: INITIALISATION SUPABASE ADMIN
    // ============================================
    console.log("8️⃣ [WEBHOOK] Initialisation du client Supabase Admin...");
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl) {
      console.error("❌ [WEBHOOK] ERREUR FATALE: NEXT_PUBLIC_SUPABASE_URL manquante");
      return new NextResponse("Supabase configuration error", { status: 500 });
    }
    
    if (!supabaseServiceKey) {
      console.error("❌ [WEBHOOK] ERREUR FATALE: SUPABASE_SERVICE_ROLE_KEY manquante");
      return new NextResponse("Supabase configuration error", { status: 500 });
    }
    
    console.log("✅ [WEBHOOK] Variables d'environnement Supabase OK");
    console.log("   🔗 URL:", supabaseUrl);
    console.log("   🔑 Service Key:", supabaseServiceKey.substring(0, 20) + "...");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    console.log("✅ [WEBHOOK] Client Supabase Admin initialisé");

    // ============================================
    // ÉTAPE 6: VÉRIFICATION DE L'EXISTENCE DE LA MARQUE
    // ============================================
    console.log("9️⃣ [WEBHOOK] Vérification de l'existence de la marque...");
    console.log("   🔍 Recherche de brand_id:", brandId);
    
    const { data: existingBrand, error: fetchError } = await supabaseAdmin
      .from("brands")
      .select("id, name, subscription_status, owner_id")
      .eq("id", brandId)
      .single();

    if (fetchError) {
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ [WEBHOOK] ERREUR: Marque non trouvée dans Supabase");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("   🆔 Brand ID recherché:", brandId);
      console.error("   📋 Code erreur:", fetchError.code);
      console.error("   💬 Message:", fetchError.message);
      console.error("   🔍 Détails:", fetchError.details);
      console.error("   💡 Hint:", fetchError.hint);
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      return new NextResponse(
        JSON.stringify({ 
          error: "Brand not found in database",
          brand_id: brandId,
          supabase_error: fetchError 
        }), 
        { status: 500 }
      );
    }

    console.log("✅ [WEBHOOK] Marque trouvée:");
    console.log("   🆔 ID:", existingBrand.id);
    console.log("   🏷️  Nom:", existingBrand.name);
    console.log("   👤 Owner ID:", existingBrand.owner_id);
    console.log("   📊 Statut actuel:", existingBrand.subscription_status || "null");

    // ============================================
    // ÉTAPE 7: MISE À JOUR DU STATUT D'ABONNEMENT
    // ============================================
    console.log("🔟 [WEBHOOK] Tentative de mise à jour du statut...");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 [WEBHOOK] DONNÉES À METTRE À JOUR:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   🆔 brand_id:", brandId);
    console.log("   ✅ subscription_status: 'active'");
    console.log("   👤 stripe_customer_id:", session.customer);
    console.log("   💳 stripe_subscription_id:", session.subscription);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from("brands")
      .update({
        subscription_status: "active",
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      })
      .eq("id", brandId)
      .select();

    if (updateError) {
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ 11. [WEBHOOK] ERREUR LORS DE LA MISE À JOUR SUPABASE");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("   🆔 Brand ID:", brandId);
      console.error("   📋 Code erreur:", updateError.code);
      console.error("   💬 Message:", updateError.message);
      console.error("   🔍 Détails:", updateError.details);
      console.error("   💡 Hint:", updateError.hint);
      console.error("   📊 Erreur complète:", JSON.stringify(updateError, null, 2));
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // ⚠️ ERREUR 500 EXPLICITE pour que Stripe réessaie
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

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ 12. [WEBHOOK] MISE À JOUR RÉUSSIE !");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   🎉 Statut mis à jour: 'active'");
    console.log("   📊 Résultat:", JSON.stringify(updateResult, null, 2));
    console.log("   🏷️  Marque:", existingBrand.name);
    console.log("   👤 Owner ID:", existingBrand.owner_id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

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
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ [WEBHOOK] ERREUR FATALE NON GÉRÉE");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("   💬 Message:", err.message);
    console.error("   📚 Stack:", err.stack);
    console.error("   📊 Erreur complète:", JSON.stringify(err, null, 2));
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal server error",
        message: err.message,
        stack: err.stack
      }), 
      { status: 500 }
    );
  }
}
