"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Type pour les données de scan
 */
interface ScanData {
  productId: string;
  deviceType?: "mobile" | "desktop" | "tablet";
  country?: string;
}

/**
 * Action serveur pour tracker un scan (vue) de passeport
 *
 * Cette fonction est non-bloquante et ne doit pas ralentir le rendu de la page.
 * Elle récupère automatiquement le brand_id associé au produit.
 *
 * @param scanData - Données du scan (productId, deviceType, country)
 * @returns Promise<void> - Ne retourne rien car c'est fire-and-forget
 */
export async function trackScan(scanData: ScanData): Promise<void> {
  try {
    const supabase = await createClient();

    // Récupération du produit pour obtenir le brand_id
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("brand_id")
      .eq("id", scanData.productId)
      .single();

    if (productError || !product) {
      console.error(
        "Erreur lors de la récupération du produit pour tracking:",
        productError
      );
      return; // Ne pas bloquer si le produit n'existe pas
    }

    // Insertion du scan dans la base de données
    const { error: insertError } = await (supabase.from("scans") as any).insert(
      {
        product_id: scanData.productId,
        brand_id: (product as { brand_id: string }).brand_id,
        device_type: scanData.deviceType || null,
        country: scanData.country || null,
      }
    );

    if (insertError) {
      console.error("Erreur lors de l'enregistrement du scan:", insertError);
      // Ne pas lancer d'erreur pour ne pas bloquer le rendu
      return;
    }
  } catch (error) {
    // Silently fail - ne pas bloquer le rendu de la page en cas d'erreur
    console.error("Erreur inattendue lors du tracking:", error);
  }
}
