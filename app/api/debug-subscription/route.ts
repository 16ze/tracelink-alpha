import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * Route API de debug pour vérifier le statut d'abonnement
 * 
 * Cette route permet de voir l'état réel de la base de données
 * pour diagnostiquer les problèmes de mise à jour du statut Stripe.
 * 
 * GET /api/debug-subscription
 * Retourne le statut d'abonnement de l'utilisateur connecté
 */
export async function GET() {
  try {
    // 1. Vérification de l'authentification
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Non authentifié",
          details: userError?.message,
        },
        { status: 401 }
      );
    }

    console.log("🔍 [DEBUG] Utilisateur authentifié:", user.id, user.email);

    // 2. Récupération avec le client normal (avec RLS)
    const { data: brandNormal, error: brandErrorNormal } = await supabase
      .from("brands")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    console.log("🔍 [DEBUG] Marque récupérée (client normal):", brandNormal);
    console.log("🔍 [DEBUG] Erreur (client normal):", brandErrorNormal);

    // 3. Récupération avec le client admin (sans RLS) pour comparaison
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: brandAdmin, error: brandErrorAdmin } = await supabaseAdmin
      .from("brands")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    console.log("🔍 [DEBUG] Marque récupérée (client admin):", brandAdmin);
    console.log("🔍 [DEBUG] Erreur (client admin):", brandErrorAdmin);

    // 4. Construction de la réponse de debug
    const response = {
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
      },
      brand_via_rls: {
        found: !!brandNormal,
        data: brandNormal,
        error: brandErrorNormal,
      },
      brand_via_admin: {
        found: !!brandAdmin,
        data: brandAdmin,
        error: brandErrorAdmin,
      },
      subscription_status: {
        via_rls: (brandNormal as any)?.subscription_status || null,
        via_admin: (brandAdmin as any)?.subscription_status || null,
        match: (brandNormal as any)?.subscription_status === (brandAdmin as any)?.subscription_status,
      },
      stripe_data: {
        customer_id: (brandAdmin as any)?.stripe_customer_id || null,
        subscription_id: (brandAdmin as any)?.stripe_subscription_id || null,
      },
      diagnosis: getDiagnosis(brandNormal, brandAdmin),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("❌ [DEBUG] Erreur fatale:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * Fonction helper pour diagnostiquer le problème
 */
function getDiagnosis(brandNormal: any, brandAdmin: any): string[] {
  const diagnosis: string[] = [];

  if (!brandNormal && !brandAdmin) {
    diagnosis.push("❌ Aucune marque trouvée dans la base de données");
    return diagnosis;
  }

  if (!brandNormal && brandAdmin) {
    diagnosis.push(
      "⚠️ La marque existe mais n'est pas accessible via RLS (problème de permissions)"
    );
  }

  if (brandNormal && !brandAdmin) {
    diagnosis.push(
      "⚠️ Situation anormale: la marque est accessible via RLS mais pas via admin"
    );
  }

  const statusViaRls = (brandNormal as any)?.subscription_status;
  const statusViaAdmin = (brandAdmin as any)?.subscription_status;

  if (statusViaRls === "active" && statusViaAdmin === "active") {
    diagnosis.push("✅ Le statut est 'active' dans la DB et accessible correctement");
    diagnosis.push(
      "💡 Si l'interface affiche 'Gratuit', le problème est côté cache/frontend"
    );
  }

  if (
    statusViaRls !== "active" &&
    statusViaAdmin !== "active" &&
    (brandAdmin as any)?.stripe_customer_id
  ) {
    diagnosis.push(
      "❌ Le webhook Stripe n'a pas mis à jour le statut malgré la présence de stripe_customer_id"
    );
    diagnosis.push("💡 Vérifiez les logs du webhook");
  }

  if (!(brandAdmin as any)?.stripe_customer_id && !(brandAdmin as any)?.stripe_subscription_id) {
    diagnosis.push(
      "❌ Aucune donnée Stripe enregistrée: le webhook n'a probablement jamais été reçu"
    );
    diagnosis.push("💡 Vérifiez la configuration du webhook dans Stripe Dashboard");
  }

  if (statusViaRls !== statusViaAdmin) {
    diagnosis.push(
      "⚠️ Incohérence entre RLS et admin: possible problème de cache Supabase"
    );
  }

  return diagnosis;
}

