"use server";

import type {
  Database,
  DatabaseBrand,
  DatabaseCertificate,
  DatabaseComponent,
  DatabaseProduct,
} from "@/types/supabase";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { productSchema, brandSchema, brandSettingsSchema, validateImageFile } from "@/lib/validations";
import { z } from "zod";
import OpenAI from "openai";

/**
 * Type de retour pour les actions de marque
 */
export type BrandActionState = {
  error?: string;
  success?: string;
  redirect?: string;
};

/**
 * Type de retour pour les actions de produit
 */
export type ProductActionState = {
  error?: string;
  success?: string;
  redirect?: string;
};

/**
 * Type de retour pour les actions de composant
 */
export type ComponentActionState = {
  error?: string;
  success?: string;
};

/**
 * Type de retour pour les actions de certificat
 */
export type CertificateActionState = {
  error?: string;
  success?: string;
};

/**
 * Type de retour pour les actions de compliance
 */
export type ComplianceActionState = {
  error?: string;
  success?: string;
};

/**
 * Type pour les statistiques d'analytics
 */
export interface AnalyticsStats {
  totalProducts: number;
  totalScans: number;
  topProduct: {
    id: string;
    name: string;
    scans: number;
  } | null;
  scansLast7Days: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Récupère la marque de l'utilisateur connecté
 *
 * ⚠️ CRITIQUE: Cette fonction utilise cookies() pour forcer le mode dynamique
 * et éviter le cache Next.js. Cela garantit que le statut d'abonnement Stripe
 * est toujours à jour après un paiement.
 *
 * @returns La marque de l'utilisateur ou null si elle n'existe pas
 */
export async function getUserBrand(): Promise<DatabaseBrand | null> {
  // 🔥 FORCE LE MODE DYNAMIQUE - Empêche Next.js de cacher cette fonction
  await cookies();
  
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur:",
      userError
    );
    return null;
  }

  try {
    // Récupération de la marque de l'utilisateur
    // ⚠️ CRITIQUE: On force le rafraîchissement pour détecter les changements de statut Stripe
    console.log("🔍 [getUserBrand] Récupération de la marque pour user:", user.id);
    
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) {
      // Si aucune marque n'est trouvée (PGRST116 = not found), retourner null
      if (error.code === "PGRST116") {
        console.log("ℹ️ [getUserBrand] Aucune marque trouvée pour cet utilisateur");
        return null;
      }
      console.error("❌ [getUserBrand] Erreur lors de la récupération de la marque:", error);
      return null;
    }

    // maybeSingle() peut retourner null si aucun résultat n'est trouvé
    if (!data) {
      console.log("ℹ️ [getUserBrand] Aucune marque trouvée (data null)");
      return null;
    }

    console.log("✅ [getUserBrand] Marque récupérée:", {
      id: (data as any).id,
      name: (data as any).name,
      subscription_status: (data as any).subscription_status || "N/A"
    });

    return data as DatabaseBrand;
  } catch (err) {
    console.error(
      "❌ [getUserBrand] Erreur inattendue lors de la récupération de la marque:",
      err
    );
    return null;
  }
}

/**
 * Action serveur pour créer une marque
 *
 * @param prevState - État précédent de l'action (pour useActionState)
 * @param formData - Données du formulaire contenant name et website_url
 * @returns État de l'action avec error ou success
 */
export async function createBrand(
  prevState: BrandActionState | null,
  formData: FormData
): Promise<BrandActionState> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Vous devez être connecté pour créer une marque" };
  }

  // ============================================
  // VALIDATION DES DONNÉES AVEC ZOD
  // ============================================
  const rawData = {
    name: formData.get("name") as string,
    website_url: formData.get("website_url") as string,
  };

  const validation = brandSchema.safeParse(rawData);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return { error: firstError?.message || "Erreur de validation" };
  }

  const { name, website_url } = validation.data;

  try {
    // Vérification si l'utilisateur a déjà une marque
    const existingBrand = await getUserBrand();
    if (existingBrand) {
      return {
        error:
          "Vous possédez déjà une marque. Vous ne pouvez en créer qu'une seule.",
      };
    }

    // Création de la marque
    // Note: subscription_status et plan_name ont une valeur par défaut 'free' dans la DB
    // Les données sont déjà validées et sanitizées par Zod
    const { data, error } = await supabase
      .from("brands")
      .insert({
        name,
        website_url,
        owner_id: user.id,
      } as any)
      .select()
      .single();

    if (error) {
      // Gestion des erreurs spécifiques
      if (error.code === "23505") {
        // Violation de contrainte unique (nom déjà utilisé)
        return {
          error:
            "Ce nom de marque est déjà utilisé. Veuillez en choisir un autre.",
        };
      }
      console.error("Erreur lors de la création de la marque:", error);
      return {
        error: error.message || "Erreur lors de la création de la marque",
      };
    }

    if (!data) {
      return { error: "Erreur inattendue lors de la création de la marque" };
    }

    // Révalidation du cache et redirection
    revalidatePath("/dashboard", "layout");
    return {
      success: "Marque créée avec succès !",
      redirect: "/dashboard",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la création de la marque:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

/**
 * Action serveur pour mettre à jour les paramètres de la marque (White Label)
 *
 * @param prevState - État précédent de l'action (pour useActionState)
 * @param formData - Données du formulaire contenant name, website_url, primary_color, remove_branding
 * @returns État de l'action avec error ou success
 */
export async function updateBrandSettings(
  prevState: BrandActionState | null,
  formData: FormData
): Promise<BrandActionState> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Vous devez être connecté pour modifier les paramètres" };
  }

  // Récupération de la marque de l'utilisateur
  const brand = await getUserBrand();
  if (!brand) {
    return {
      error: "Vous devez créer une marque avant de modifier les paramètres",
    };
  }

  // Vérification que l'utilisateur est propriétaire de la marque
  if (brand.owner_id !== user.id) {
    return { error: "Vous n'avez pas accès à cette marque" };
  }

  // ============================================
  // VALIDATION DES DONNÉES AVEC ZOD
  // ============================================
  const rawData = {
    name: formData.get("name") as string,
    website_url: formData.get("website_url") as string || null,
    primary_color: formData.get("primary_color") as string || null,
    remove_branding: formData.get("remove_branding") === "true",
  };

  const validation = brandSettingsSchema.safeParse(rawData);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return { error: firstError?.message || "Erreur de validation" };
  }

  const { name, website_url, primary_color, remove_branding } = validation.data;

  // Vérification du statut d'abonnement pour remove_branding
  // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes Stripe
  const subscriptionStatus = (brand as any)?.subscription_status;
  const isProPlan = subscriptionStatus === "active";

  // Si l'utilisateur essaie de masquer le branding mais n'est pas Pro
  if (removeBranding && !isProPlan) {
    return {
      error: "Masquer le logo TraceLink est réservé aux membres Pro.",
    };
  }

  try {
    // Mise à jour de la marque
    // Les données sont déjà validées et sanitizées par Zod
    const updateData: Database["public"]["Tables"]["brands"]["Update"] = {
      name,
      website_url,
      primary_color: primary_color || "#000000",
    };

    // Seuls les membres Pro peuvent masquer le branding
    if (isProPlan) {
      updateData.remove_branding = remove_branding;
    }

    const { data, error } = await (supabase.from("brands") as any)
      .update(updateData)
      .eq("id", brand.id)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la mise à jour de la marque:", error);
      return {
        error: error.message || "Erreur lors de la mise à jour des paramètres",
      };
    }

    if (!data) {
      return { error: "Erreur inattendue lors de la mise à jour" };
    }

    // Révalidation du cache
    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/settings", "layout");

    return {
      success: "Paramètres mis à jour avec succès !",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la mise à jour:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

/**
 * Récupère tous les produits de l'utilisateur connecté (via sa marque)
 *
 * @returns La liste des produits ou un tableau vide si aucun produit
 */
export async function getUserProducts(): Promise<DatabaseProduct[]> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur:",
      userError
    );
    return [];
  }

  try {
    // Récupération de la marque de l'utilisateur
    const brand = await getUserBrand();
    if (!brand) {
      return [];
    }

    // Récupération des produits de la marque
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des produits:", error);
      return [];
    }

    return (data as DatabaseProduct[]) || [];
  } catch (err) {
    console.error(
      "Erreur inattendue lors de la récupération des produits:",
      err
    );
    return [];
  }
}

/**
 * Action serveur pour créer un produit avec upload d'image
 *
 * @param prevState - État précédent de l'action (pour useActionState)
 * @param formData - Données du formulaire contenant name, sku, description et photo
 * @returns État de l'action avec error ou success
 */
export async function createProduct(
  prevState: ProductActionState | null,
  formData: FormData,
  locale?: string
): Promise<ProductActionState> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Vous devez être connecté pour créer un produit" };
  }

  // Vérification que l'utilisateur a une marque
  const brand = await getUserBrand();
  if (!brand) {
    return {
      error: "Vous devez créer une marque avant de créer un produit",
    };
  }

  // ============================================
  // VÉRIFICATION DE LA LIMITE DE PRODUITS (PLANS)
  // ============================================
  // Récupération du statut d'abonnement et du plan
  // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes Stripe
  const subscriptionStatus = (brand as any)?.subscription_status;
  const planName = (brand as any)?.plan_name as "free" | "starter" | "pro" | "enterprise" | null | undefined;

  // Détermination du plan réel :
  // - Si subscription_status === 'active', on utilise plan_name (ou 'pro' par défaut pour compatibilité)
  // - Sinon, on considère que c'est le plan 'free'
  const effectivePlanName: "free" | "starter" | "pro" | "enterprise" | null = 
    subscriptionStatus === "active" 
      ? (planName || "pro") // Si actif mais pas de plan_name, on assume 'pro' pour compatibilité
      : "free";

  // Import de la configuration des plans
  const { canCreateProduct, getUpgradeMessage } = await import("@/config/plans");

  // Compter le nombre de produits existants pour cette marque
  const { count, error: countError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("brand_id", brand.id);

  if (countError) {
    console.error("Erreur lors du comptage des produits:", countError);
    // En cas d'erreur, on continue (sécurité : on assume qu'il peut créer)
  } else {
    // Vérification de la limite selon le plan
    const currentProductCount = count ?? 0;
    if (!canCreateProduct(effectivePlanName, currentProductCount)) {
      return {
        error: getUpgradeMessage(effectivePlanName),
      };
    }
  }

  // ============================================
  // VALIDATION DES DONNÉES AVEC ZOD
  // ============================================
  // Récupération et validation du fichier image
  const photo = formData.get("photo") as File | null;
  const photoValidation = validateImageFile(photo);
  if (!photoValidation.success) {
    return { error: photoValidation.error };
  }
  const validatedPhoto = photoValidation.data;

  // Récupération et validation des données du formulaire
  const rawData = {
    name: formData.get("name") as string,
    sku: formData.get("sku") as string,
    description: formData.get("description") as string,
  };

  const validation = productSchema.safeParse(rawData);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return { error: firstError?.message || "Erreur de validation" };
  }

  const { name, sku, description } = validation.data;

  try {
    // Génération d'un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedOriginalName = validatedPhoto.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}-${sanitizedOriginalName}`;
    const filePath = `${user.id}/${uniqueFileName}`;

    // Conversion du fichier en ArrayBuffer pour l'upload
    const arrayBuffer = await validatedPhoto.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload de l'image vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, fileBuffer, {
        contentType: validatedPhoto.type,
        upsert: false, // Ne pas écraser si le fichier existe déjà
      });

    if (uploadError) {
      console.error("Erreur lors de l'upload de l'image:", uploadError);
      return {
        error:
          uploadError.message ||
          "Erreur lors de l'upload de l'image. Veuillez réessayer.",
      };
    }

    // Récupération de l'URL publique de l'image
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath);

    // Insertion du produit dans la table products
    // Les données sont déjà validées et sanitizées par Zod
    const { data: productData, error: insertError } = await supabase
      .from("products")
      .insert({
        name,
        sku,
        description,
        photo_url: publicUrl,
        brand_id: brand.id,
      } as any)
      .select()
      .single();

    if (insertError) {
      // Si l'insertion échoue, supprimer l'image uploadée pour éviter les fichiers orphelins
      await supabase.storage.from("product-images").remove([filePath]);

      // Gestion des erreurs spécifiques
      if (insertError.code === "23505") {
        // Violation de contrainte unique (SKU déjà utilisé)
        return {
          error: "Ce SKU est déjà utilisé. Veuillez en choisir un autre.",
        };
      }
      console.error("Erreur lors de la création du produit:", insertError);
      return {
        error: insertError.message || "Erreur lors de la création du produit",
      };
    }

    if (!productData) {
      // Si pas de données, supprimer l'image uploadée
      await supabase.storage.from("product-images").remove([filePath]);
      return { error: "Erreur inattendue lors de la création du produit" };
    }

    // Révalidation du cache et redirection
    const currentLocale = locale || "fr";
    revalidatePath(`/${currentLocale}/dashboard`, "layout");
    revalidatePath(`/${currentLocale}/dashboard/products`, "layout");
    return {
      success: "Produit créé avec succès !",
      redirect: `/${currentLocale}/dashboard`,
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la création du produit:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

/**
 * Récupère un produit par son ID avec vérification de propriété
 *
 * @param productId - ID du produit à récupérer
 * @returns Le produit ou null si non trouvé ou non autorisé
 */
export async function getProductById(
  productId: string
): Promise<DatabaseProduct | null> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur:",
      userError
    );
    return null;
  }

  try {
    // Récupération de la marque de l'utilisateur
    const brand = await getUserBrand();
    if (!brand) {
      return null;
    }

    // Récupération du produit avec vérification qu'il appartient à la marque
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("brand_id", brand.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Produit non trouvé
        return null;
      }
      console.error("Erreur lors de la récupération du produit:", error);
      return null;
    }

    return data as DatabaseProduct;
  } catch (err) {
    console.error("Erreur inattendue lors de la récupération du produit:", err);
    return null;
  }
}

/**
 * Récupère tous les composants d'un produit
 *
 * @param productId - ID du produit
 * @returns La liste des composants ou un tableau vide
 */
export async function getProductComponents(
  productId: string
): Promise<DatabaseComponent[]> {
  const supabase = await createClient();

  // Vérification que le produit appartient à l'utilisateur
  const product = await getProductById(productId);
  if (!product) {
    return [];
  }

  try {
    // Récupération des composants du produit
    const { data, error } = await supabase
      .from("components")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des composants:", error);
      return [];
    }

    return (data as DatabaseComponent[]) || [];
  } catch (err) {
    console.error(
      "Erreur inattendue lors de la récupération des composants:",
      err
    );
    return [];
  }
}

/**
 * Action serveur pour ajouter un composant à un produit
 *
 * @param prevState - État précédent de l'action (pour useActionState)
 * @param formData - Données du formulaire contenant product_id, type et origin_country
 * @returns État de l'action avec error ou success
 */
export async function addComponent(
  prevState: ComponentActionState | null,
  formData: FormData
): Promise<ComponentActionState> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Vous devez être connecté pour ajouter un composant" };
  }

  // Récupération des données du formulaire
  const productId = formData.get("product_id") as string;
  const type = formData.get("type") as string;
  const originCountry = formData.get("origin_country") as string;

  // Validation des champs requis
  if (!productId) {
    return { error: "ID du produit manquant" };
  }

  if (!type || type.trim().length === 0) {
    return { error: "Le type de composant est requis" };
  }

  if (!originCountry || originCountry.trim().length === 0) {
    return { error: "Le pays d'origine est requis" };
  }

  // Validation de la longueur des champs
  if (type.trim().length > 100) {
    return { error: "Le type ne peut pas dépasser 100 caractères" };
  }

  if (originCountry.trim().length > 100) {
    return { error: "Le pays d'origine ne peut pas dépasser 100 caractères" };
  }

  // Vérification que le produit appartient à l'utilisateur
  const product = await getProductById(productId);
  if (!product) {
    return {
      error: "Produit non trouvé ou vous n'avez pas accès à ce produit",
    };
  }

  try {
    // Insertion du composant
    const { data, error } = await supabase
      .from("components")
      .insert({
        product_id: productId,
        type: type.trim(),
        origin_country: originCountry.trim(),
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de l'ajout du composant:", error);
      return {
        error: error.message || "Erreur lors de l'ajout du composant",
      };
    }

    if (!data) {
      return { error: "Erreur inattendue lors de l'ajout du composant" };
    }

    // Révalidation du cache
    revalidatePath(`/dashboard/products/${productId}`, "layout");
    return {
      success: "Composant ajouté avec succès !",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de l'ajout du composant:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

/**
 * Récupère tous les certificats d'un composant
 *
 * @param componentId - ID du composant
 * @returns La liste des certificats ou un tableau vide
 */
export async function getComponentCertificates(
  componentId: string
): Promise<DatabaseCertificate[]> {
  const supabase = await createClient();

  try {
    // Récupération des certificats du composant
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("component_id", componentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur lors de la récupération des certificats:", error);
      return [];
    }

    return (data as DatabaseCertificate[]) || [];
  } catch (err) {
    console.error(
      "Erreur inattendue lors de la récupération des certificats:",
      err
    );
    return [];
  }
}

/**
 * Action serveur pour uploader un certificat pour un composant
 *
 * @param prevState - État précédent de l'action (pour useActionState)
 * @param formData - Données du formulaire contenant component_id, type et file
 * @returns État de l'action avec error ou success
 */
export async function uploadCertificate(
  prevState: CertificateActionState | null,
  formData: FormData
): Promise<CertificateActionState> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Vous devez être connecté pour uploader un certificat" };
  }

  // Récupération des données du formulaire
  const componentId = formData.get("component_id") as string;
  const certificateType = formData.get("type") as string;
  const file = formData.get("file") as File | null;

  // Validation des champs requis
  if (!componentId) {
    return { error: "ID du composant manquant" };
  }

  if (!certificateType || certificateType.trim().length === 0) {
    return { error: "Le type de certificat est requis" };
  }

  if (!file || file.size === 0) {
    return { error: "Le fichier est requis" };
  }

  // Validation de la taille du fichier (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB en bytes
  if (file.size > maxSize) {
    return {
      error: "La taille du fichier ne doit pas dépasser 10MB",
    };
  }

  // Validation du type de fichier (PDF et images uniquement)
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  if (!allowedTypes.includes(file.type)) {
    return {
      error: "Le fichier doit être un PDF ou une image (JPEG, PNG ou WebP)",
    };
  }

  // Validation de la longueur du type
  if (certificateType.trim().length > 50) {
    return { error: "Le type ne peut pas dépasser 50 caractères" };
  }

  // Vérification que le composant appartient à l'utilisateur
  // Récupération du composant avec son produit
  const { data: componentData, error: componentError } = await supabase
    .from("components")
    .select("product_id")
    .eq("id", componentId)
    .single();

  if (componentError || !componentData) {
    return {
      error: "Composant non trouvé ou vous n'avez pas accès à ce composant",
    };
  }

  const productId = (componentData as any).product_id;

  // Vérification que le produit appartient à l'utilisateur
  const product = await getProductById(productId);
  if (!product) {
    return {
      error: "Vous n'avez pas accès à ce composant",
    };
  }

  // ============================================
  // VÉRIFICATION DU PLAN (CERTIFICATS RÉSERVÉS AUX MEMBRES PRO)
  // ============================================
  // Récupération de la marque pour vérifier le statut d'abonnement
  const brand = await getUserBrand();
  if (!brand) {
    return {
      error: "Marque non trouvée",
    };
  }

  // Récupération du statut d'abonnement
  // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes Stripe
  const subscriptionStatus = (brand as any)?.subscription_status;

  // Si l'utilisateur n'est pas en plan Pro (subscription_status !== 'active')
  if (subscriptionStatus !== "active") {
    return {
      error: "L'ajout de certificats PDF est réservé aux membres Pro.",
    };
  }

  try {
    // Génération d'un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}-${sanitizedOriginalName}`;
    const filePath = `${user.id}/${componentId}/${uniqueFileName}`;

    // Conversion du fichier en ArrayBuffer pour l'upload
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload du fichier vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false, // Ne pas écraser si le fichier existe déjà
      });

    if (uploadError) {
      console.error("Erreur lors de l'upload du certificat:", uploadError);
      return {
        error:
          uploadError.message ||
          "Erreur lors de l'upload du fichier. Veuillez réessayer.",
      };
    }

    // Récupération de l'URL publique du fichier
    const {
      data: { publicUrl },
    } = supabase.storage.from("certificates").getPublicUrl(filePath);

    // Insertion du certificat dans la table certificates
    const { data: certificateData, error: insertError } = await supabase
      .from("certificates")
      .insert({
        component_id: componentId,
        type: certificateType.trim(),
        file_url: publicUrl,
        verified: false, // Par défaut, non vérifié
      } as any)
      .select()
      .single();

    if (insertError) {
      // Si l'insertion échoue, supprimer le fichier uploadé pour éviter les fichiers orphelins
      await supabase.storage.from("certificates").remove([filePath]);

      console.error("Erreur lors de la création du certificat:", insertError);
      return {
        error:
          insertError.message || "Erreur lors de la création du certificat",
      };
    }

    if (!certificateData) {
      // Si pas de données, supprimer le fichier uploadé
      await supabase.storage.from("certificates").remove([filePath]);
      return { error: "Erreur inattendue lors de la création du certificat" };
    }

    // Révalidation du cache
    revalidatePath(`/dashboard/products/${productId}`, "layout");
    return {
      success: "Certificat uploadé avec succès !",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de l'upload du certificat:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

/**
 * Action serveur pour mettre à jour les données de compliance (Entretien & Loi AGEC) d'un produit
 *
 * @param prevState - État précédent de l'action (pour useActionState)
 * @param formData - Données du formulaire contenant product_id et les champs de compliance
 * @returns État de l'action avec error ou success
 */
export async function updateProductCompliance(
  prevState: ComplianceActionState | null,
  formData: FormData
): Promise<ComplianceActionState> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Vous devez être connecté pour modifier les données de compliance",
    };
  }

  // Récupération de la marque pour vérifier le statut d'abonnement
  const brand = await getUserBrand();
  if (!brand) {
    return {
      error: "Marque non trouvée",
    };
  }

  // Vérification du plan Pro
  // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes Stripe
  const subscriptionStatus = (brand as any)?.subscription_status;
  const isProPlan = subscriptionStatus === "active";

  if (!isProPlan) {
    return {
      error:
        "La gestion des données de compliance est réservée aux membres Pro.",
    };
  }

  // Récupération de l'ID du produit
  const productId = formData.get("product_id") as string;
  if (!productId) {
    return { error: "ID du produit manquant" };
  }

  // Vérification que le produit appartient à l'utilisateur
  const product = await getProductById(productId);
  if (!product) {
    return {
      error: "Produit non trouvé ou vous n'avez pas accès à ce produit",
    };
  }

  // Récupération des données du formulaire
  const compositionText = formData.get("composition_text") as string;
  const careWash = formData.get("care_wash") as string;
  const careBleach = formData.get("care_bleach") === "true";
  const careDry = formData.get("care_dry") as string;
  const careIron = formData.get("care_iron") as string;
  const recyclability = formData.get("recyclability") === "true";
  const releasedMicroplastics =
    formData.get("released_microplastics") === "true";

  // Validation des valeurs de care_wash
  const validCareWash = ["30_deg", "40_deg", "60_deg", "hand_wash", "no_wash"];
  if (careWash && careWash !== "" && !validCareWash.includes(careWash)) {
    return { error: "Valeur de lavage invalide" };
  }

  // Validation des valeurs de care_dry
  const validCareDry = [
    "no_dryer",
    "tumble_low",
    "tumble_medium",
    "tumble_high",
    "line_dry",
    "flat_dry",
  ];
  if (careDry && careDry !== "" && !validCareDry.includes(careDry)) {
    return { error: "Valeur de séchage invalide" };
  }

  // Validation des valeurs de care_iron
  const validCareIron = ["no_iron", "low", "medium", "high"];
  if (careIron && careIron !== "" && !validCareIron.includes(careIron)) {
    return { error: "Valeur de repassage invalide" };
  }

  try {
    // Mise à jour du produit avec les données de compliance
    const updateData: Database["public"]["Tables"]["products"]["Update"] = {};

    if (compositionText !== null && compositionText !== undefined) {
      updateData.composition_text = compositionText.trim() || null;
    }
    if (careWash && careWash !== "") {
      updateData.care_wash = careWash as
        | "30_deg"
        | "40_deg"
        | "60_deg"
        | "hand_wash"
        | "no_wash";
    } else {
      updateData.care_wash = null;
    }
    updateData.care_bleach = careBleach;
    if (careDry && careDry !== "") {
      updateData.care_dry = careDry as
        | "no_dryer"
        | "tumble_low"
        | "tumble_medium"
        | "tumble_high"
        | "line_dry"
        | "flat_dry";
    } else {
      updateData.care_dry = null;
    }
    if (careIron && careIron !== "") {
      updateData.care_iron = careIron as "no_iron" | "low" | "medium" | "high";
    } else {
      updateData.care_iron = null;
    }
    updateData.recyclability = recyclability;
    updateData.released_microplastics = releasedMicroplastics;

    const { data, error } = await (supabase.from("products") as any)
      .update(updateData)
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la mise à jour du produit:", error);
      return {
        error:
          error.message ||
          "Erreur lors de la mise à jour des données de compliance",
      };
    }

    if (!data) {
      return { error: "Erreur inattendue lors de la mise à jour" };
    }

    // Révalidation du cache
    revalidatePath(`/dashboard/products/${productId}`, "layout");
    revalidatePath(`/p/${productId}`, "layout");

    return {
      success: "Données de compliance mises à jour avec succès !",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la mise à jour:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

/**
 * Récupère les statistiques d'analytics pour la marque de l'utilisateur
 *
 * @returns Les statistiques d'analytics ou des valeurs par défaut en cas d'erreur
 */
export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      totalProducts: 0,
      totalScans: 0,
      topProduct: null,
      scansLast7Days: [],
    };
  }

  try {
    // Récupération de la marque de l'utilisateur
    const brand = await getUserBrand();
    if (!brand) {
      return {
        totalProducts: 0,
        totalScans: 0,
        topProduct: null,
        scansLast7Days: [],
      };
    }

    // Récupération du nombre total de produits
    const { count: totalProductsCount, error: productsError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brand.id);

    if (productsError) {
      console.error("Erreur lors du comptage des produits:", productsError);
    }

    const totalProducts = totalProductsCount || 0;

    // Récupération du nombre total de scans
    // @ts-ignore - La table scans n'est pas encore dans les types générés
    const { count: totalScansCount, error: scansError } = await supabase
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brand.id);

    if (scansError) {
      console.error("Erreur lors du comptage des scans:", scansError);
    }

    const totalScans = totalScansCount || 0;

    // Récupération du produit avec le plus de scans
    // On utilise une requête SQL brute pour un comptage efficace
    // @ts-ignore - La table scans n'est pas encore dans les types générés
    const { data: topProductData, error: topProductError } = await supabase
      .from("scans")
      .select("product_id")
      .eq("brand_id", brand.id);

    let topProduct: AnalyticsStats["topProduct"] = null;

    if (!topProductError && topProductData && topProductData.length > 0) {
      // Compter les scans par produit
      const productScansCount: Record<string, number> = {};

      topProductData.forEach((scan: any) => {
        const productId = scan.product_id;
        productScansCount[productId] = (productScansCount[productId] || 0) + 1;
      });

      // Trouver le produit avec le plus de scans
      let maxScans = 0;
      let topProductId = "";

      Object.entries(productScansCount).forEach(([productId, count]) => {
        if (count > maxScans) {
          maxScans = count;
          topProductId = productId;
        }
      });

      // Récupérer le nom du produit top
      if (topProductId) {
        const { data: productData, error: productNameError } = await supabase
          .from("products")
          .select("name")
          .eq("id", topProductId)
          .single();

        if (!productNameError && productData) {
          topProduct = {
            id: topProductId,
            name: (productData as { name: string }).name,
            scans: maxScans,
          };
        }
      }
    }

    // Récupération des scans des 7 derniers jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // @ts-ignore - La table scans n'est pas encore dans les types générés
    const { data: scansData, error: scans7DaysError } = await supabase
      .from("scans")
      .select("created_at")
      .eq("brand_id", brand.id)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    const scansLast7Days: Array<{ date: string; count: number }> = [];

    if (!scans7DaysError && scansData) {
      // Initialiser les 7 derniers jours avec 0 scans
      const last7DaysMap: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString().split("T")[0];
        last7DaysMap[dateKey] = 0;
      }

      // Compter les scans par jour
      scansData.forEach((scan: any) => {
        const scanDate = new Date(scan.created_at);
        scanDate.setHours(0, 0, 0, 0);
        const dateKey = scanDate.toISOString().split("T")[0];
        if (last7DaysMap[dateKey] !== undefined) {
          last7DaysMap[dateKey]++;
        }
      });

      // Convertir en tableau pour le graphique
      Object.entries(last7DaysMap)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .forEach(([date, count]) => {
          // Formater la date pour l'affichage (ex: "15 Déc")
          const dateObj = new Date(date);
          const formattedDate = new Intl.DateTimeFormat("fr-FR", {
            day: "numeric",
            month: "short",
          }).format(dateObj);

          scansLast7Days.push({
            date: formattedDate,
            count,
          });
        });
    }

    return {
      totalProducts,
      totalScans,
      topProduct,
      scansLast7Days,
    };
  } catch (err) {
    console.error(
      "Erreur inattendue lors de la récupération des analytics:",
      err
    );
    return {
      totalProducts: 0,
      totalScans: 0,
      topProduct: null,
      scansLast7Days: [],
    };
  }
}

/**
 * Action serveur pour mettre à jour un produit
 *
 * @param prevState - État précédent de l'action (pour useActionState)
 * @param formData - Données du formulaire contenant productId, name, sku, description et photo (optionnelle)
 * @param locale - Locale pour la redirection
 * @returns État de l'action avec error ou success
 */
export async function updateProduct(
  prevState: ProductActionState | null,
  formData: FormData,
  locale?: string
): Promise<ProductActionState> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Vous devez être connecté pour modifier un produit" };
  }

  // Récupération des données du formulaire
  const productId = formData.get("productId") as string;
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const description = formData.get("description") as string;
  const photo = formData.get("photo") as File | null;

  // Validation des champs requis
  if (!productId) {
    return { error: "ID du produit manquant" };
  }

  if (!name || name.trim().length === 0) {
    return { error: "Le nom du produit est requis" };
  }

  if (!sku || sku.trim().length === 0) {
    return { error: "Le SKU/Référence est requis" };
  }

  // Validation de la longueur des champs
  if (name.trim().length > 255) {
    return { error: "Le nom du produit ne peut pas dépasser 255 caractères" };
  }

  if (sku.trim().length > 100) {
    return { error: "Le SKU ne peut pas dépasser 100 caractères" };
  }

  // Vérification que le produit appartient à l'utilisateur
  const existingProduct = await getProductById(productId);
  if (!existingProduct) {
    return {
      error: "Produit non trouvé ou vous n'avez pas accès à ce produit",
    };
  }

  try {
    let photoUrl = existingProduct.photo_url;
    let oldFilePath: string | null = null;

    // Si une nouvelle photo est fournie, l'uploader
    if (photo && photo.size > 0) {
      // Validation de la taille du fichier (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB en bytes
      if (photo.size > maxSize) {
        return {
          error: "La taille de l'image ne doit pas dépasser 10MB",
        };
      }

      // Validation du type de fichier (images uniquement)
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(photo.type)) {
        return {
          error: "Le fichier doit être une image (JPEG, PNG ou WebP)",
        };
      }

      // Extraire le chemin de l'ancienne image pour la supprimer après
      if (existingProduct.photo_url) {
        // L'URL Supabase Storage suit le format:
        // https://<project>.supabase.co/storage/v1/object/public/product-images/<path>
        const urlParts = existingProduct.photo_url.split("/product-images/");
        if (urlParts.length === 2) {
          oldFilePath = urlParts[1];
        }
      }

      // Génération d'un nom de fichier unique
      const timestamp = Date.now();
      const sanitizedOriginalName = photo.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const uniqueFileName = `${timestamp}-${sanitizedOriginalName}`;
      const filePath = `${user.id}/${uniqueFileName}`;

      // Conversion du fichier en ArrayBuffer pour l'upload
      const arrayBuffer = await photo.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      // Upload de la nouvelle image vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, fileBuffer, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Erreur lors de l'upload de l'image:", uploadError);
        return {
          error:
            uploadError.message ||
            "Erreur lors de l'upload de l'image. Veuillez réessayer.",
        };
      }

      // Récupération de l'URL publique de la nouvelle image
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath);
      photoUrl = publicUrl;

      // Suppression de l'ancienne image (en arrière-plan, ne bloque pas si ça échoue)
      if (oldFilePath) {
        supabase.storage
          .from("product-images")
          .remove([oldFilePath])
          .catch((err) => {
            console.warn(
              "Erreur lors de la suppression de l'ancienne image:",
              err
            );
          });
      }
    }

    // Mise à jour du produit dans la table products
    const updateData: Database["public"]["Tables"]["products"]["Update"] = {
      name: name.trim(),
      sku: sku.trim(),
      description: description?.trim() || null,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    };

    const { error: updateError } = await (supabase
      .from("products") as any)
      .update(updateData)
      .eq("id", productId);

    if (updateError) {
      // Si la mise à jour échoue et qu'on a uploadé une nouvelle image, la supprimer
      if (photo && photo.size > 0 && photoUrl) {
        const urlParts = photoUrl.split("/product-images/");
        if (urlParts.length === 2) {
          await supabase.storage
            .from("product-images")
            .remove([urlParts[1]])
            .catch(() => {
              // Ignorer l'erreur de suppression
            });
        }
      }

      // Gestion des erreurs spécifiques
      if (updateError.code === "23505") {
        // Violation de contrainte unique (SKU déjà utilisé)
        return {
          error: "Ce SKU est déjà utilisé. Veuillez en choisir un autre.",
        };
      }

      console.error("Erreur lors de la mise à jour du produit:", updateError);
      return {
        error:
          updateError.message || "Erreur lors de la mise à jour du produit",
      };
    }

    // Révalidation du cache
    const currentLocale = locale || "fr";
    revalidatePath(`/${currentLocale}/dashboard`, "layout");
    revalidatePath(`/${currentLocale}/dashboard/products/${productId}`, "page");
    revalidatePath(`/${currentLocale}/p/${productId}`, "page");

    return {
      success: "Produit mis à jour avec succès !",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la mise à jour du produit:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

/**
 * Action serveur pour supprimer un produit
 *
 * @param productId - ID du produit à supprimer
 * @param locale - Locale pour la redirection
 * @returns État de l'action avec error ou redirect
 */
export async function deleteProduct(
  productId: string,
  locale: string = "fr"
): Promise<ProductActionState> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Vous devez être connecté pour supprimer un produit" };
  }

  // Vérification que le produit appartient à l'utilisateur
  const product = await getProductById(productId);
  if (!product) {
    return {
      error: "Produit non trouvé ou vous n'avez pas accès à ce produit",
    };
  }

  try {
    // Suppression de l'image du produit dans le storage (si elle existe)
    if (product.photo_url) {
      // Extraire le chemin de l'image depuis l'URL
      const urlParts = product.photo_url.split("/product-images/");
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        // Suppression en arrière-plan (ne bloque pas si ça échoue)
        await supabase.storage
          .from("product-images")
          .remove([filePath])
          .catch((err) => {
            console.warn(
              "Erreur lors de la suppression de l'image du produit:",
              err
            );
          });
      }
    }

    // Suppression du produit (les composants et certificats seront supprimés en cascade)
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      console.error("Erreur lors de la suppression du produit:", deleteError);
      return {
        error:
          deleteError.message || "Erreur lors de la suppression du produit",
      };
    }

    // Révalidation du cache
    revalidatePath(`/${locale}/dashboard`, "layout");
    revalidatePath(`/${locale}/dashboard/products`, "layout");

    return {
      success: "Produit supprimé avec succès",
      redirect: `/${locale}/dashboard`,
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la suppression du produit:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

/**
 * Action serveur pour importer des produits en masse via CSV
 * 
 * @param products - Tableau d'objets produits issus du CSV
 * @param locale - Locale pour la revalidation
 */
export async function importProducts(products: any[], locale: string = "fr"): Promise<ProductActionState> {
  const supabase = await createClient();

  // 1. Vérification Authentification
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "Vous devez être connecté pour importer des produits" };
  }

  // 2. Vérification Marque
  const brand = await getUserBrand();
  if (!brand) {
    return { error: "Vous devez créer une marque avant d'importer des produits" };
  }

  // 3. Vérification Limites selon le plan
  // @ts-ignore
  const subscriptionStatus = (brand as any)?.subscription_status;
  const planName = (brand as any)?.plan_name as "free" | "starter" | "pro" | "enterprise" | null | undefined;

  // Détermination du plan réel
  const effectivePlanName: "free" | "starter" | "pro" | "enterprise" | null = 
    subscriptionStatus === "active" 
      ? (planName || "pro")
      : "free";

  // Import de la configuration des plans
  const { getPlanConfig, canCreateProduct, getUpgradeMessage } = await import("@/config/plans");
  const planConfig = getPlanConfig(effectivePlanName);

  // Compter les produits existants
  const { count, error: countError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("brand_id", brand.id);

  if (!countError) {
    const currentCount = count || 0;
    const newTotal = currentCount + products.length;

    // Vérifier si l'import est possible
    if (planConfig.maxProducts !== null && newTotal > planConfig.maxProducts) {
      return { 
        error: `Import impossible. Limite de ${planConfig.maxProducts} produits atteinte (${currentCount} existants + ${products.length} importés). ${getUpgradeMessage(effectivePlanName)}` 
      };
    }
  }

  try {
    // 4. Préparation des données
    const productsToInsert = products.map(p => {
      // Si une origine est fournie dans le CSV, on l'ajoute à la description
      // car la table products n'a pas de colonne origin_country (c'est au niveau des composants)
      let description = p.description || "";
      if (p.origin) {
        description += description ? `\n\nOrigine: ${p.origin}` : `Origine: ${p.origin}`;
      }

      return {
        name: p.name?.trim(),
        sku: p.sku?.trim(),
        description: description.trim() || null,
        brand_id: brand.id,
        // Pas de photo par défaut pour l'import CSV
      };
    });

    // Validation basique des données obligatoires
    if (productsToInsert.some(p => !p.name || !p.sku)) {
      return { error: "Format invalide : Nom et SKU sont obligatoires pour tous les produits." };
    }

    // 5. Insertion en masse
    const { error } = await (supabase
      .from("products") as any)
      .insert(productsToInsert);

    if (error) {
      // Gestion des doublons SKU
      if (error.code === "23505") {
        return { error: "Erreur : Un ou plusieurs SKUs/Références existent déjà." };
      }
      console.error("Erreur Supabase Import:", error);
      return { error: "Erreur lors de l'enregistrement en base de données." };
    }

    // 6. Revalidation
    revalidatePath(`/${locale}/dashboard`, "layout");
    revalidatePath(`/${locale}/dashboard/products`, "layout");

    return { success: `${products.length} produits importés avec succès !` };

  } catch (err) {
    console.error("Erreur inattendue import:", err);
    return { error: "Une erreur inattendue est survenue lors de l'import." };
  }
}

/**
 * Schéma de validation pour un produit importé via CSV
 */
const bulkImportProductSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255, "Le nom ne peut pas dépasser 255 caractères").trim(),
  sku: z.string().min(1, "Le SKU est requis").max(100, "Le SKU ne peut pas dépasser 100 caractères").trim(),
  description: z.string().max(5000, "La description ne peut pas dépasser 5000 caractères").trim().nullable().optional().transform((val) => val || null),
  origin_country: z.string().max(100, "Le pays d'origine ne peut pas dépasser 100 caractères").trim().nullable().optional().transform((val) => val || null),
});

/**
 * Action serveur pour importer des produits en masse via CSV (comptes payants uniquement)
 * 
 * Cette fonction :
 * - Vérifie que l'utilisateur est en plan payant (Starter/Pro)
 * - Vérifie que l'import ne dépasse pas le quota
 * - Gère les doublons de SKU (met à jour les produits existants)
 * - Fait un insert massif optimisé
 * 
 * @param products - Tableau d'objets produits issus du CSV
 * @param locale - Locale pour la revalidation
 * @returns État de l'action avec error ou success
 */
export async function bulkImportProducts(
  products: any[],
  locale: string = "fr"
): Promise<ProductActionState> {
  const supabase = await createClient();

  // 1. Vérification Authentification
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "Vous devez être connecté pour importer des produits" };
  }

  // 2. Vérification Marque
  const brand = await getUserBrand();
  if (!brand) {
    return { error: "Vous devez créer une marque avant d'importer des produits" };
  }

  // 3. FEATURE GATE : Vérification que l'utilisateur est en plan payant
  // @ts-ignore
  const subscriptionStatus = (brand as any)?.subscription_status;
  const planName = (brand as any)?.plan_name as "free" | "starter" | "pro" | "enterprise" | null | undefined;

  // Détermination du plan réel
  const effectivePlanName: "free" | "starter" | "pro" | "enterprise" | null = 
    subscriptionStatus === "active" 
      ? (planName || "pro")
      : "free";

  // L'import CSV est réservé aux comptes payants
  if (effectivePlanName === "free") {
    return { 
      error: "L'import CSV est réservé aux comptes Starter et Pro. Passez à un plan payant pour utiliser cette fonctionnalité." 
    };
  }

  // 4. Validation et sanitization des données avec Zod
  const validatedProducts: Array<{
    name: string;
    sku: string;
    description: string | null;
    origin_country: string | null;
  }> = [];

  for (const product of products) {
    const validation = bulkImportProductSchema.safeParse(product);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { 
        error: `Erreur de validation ligne ${products.indexOf(product) + 1}: ${firstError?.message || "Données invalides"}` 
      };
    }
    validatedProducts.push(validation.data);
  }

  if (validatedProducts.length === 0) {
    return { error: "Aucun produit valide à importer." };
  }

  // 5. Vérification des limites selon le plan
  const { getPlanConfig, canCreateProduct, getUpgradeMessage } = await import("@/config/plans");
  const planConfig = getPlanConfig(effectivePlanName);

  // Compter les produits existants
  const { count, error: countError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("brand_id", brand.id);

  if (countError) {
    console.error("Erreur lors du comptage des produits:", countError);
    return { error: "Erreur lors de la vérification des limites." };
  }

  const currentCount = count || 0;
  
  // Récupérer les SKUs existants pour détecter les doublons
  const { data: existingProducts, error: existingError } = await supabase
    .from("products")
    .select("sku")
    .eq("brand_id", brand.id);

  if (existingError) {
    console.error("Erreur lors de la récupération des SKUs existants:", existingError);
    return { error: "Erreur lors de la vérification des doublons." };
  }

  const existingSkus = new Set((existingProducts || []).map(p => p.sku));
  const newProducts = validatedProducts.filter(p => !existingSkus.has(p.sku));
  const duplicateProducts = validatedProducts.filter(p => existingSkus.has(p.sku));

  // Calculer le nombre de nouveaux produits qui seront ajoutés
  const newProductsCount = newProducts.length;
  const finalCount = currentCount + newProductsCount;

  // Vérifier si l'import est possible (seuls les nouveaux produits comptent)
  if (planConfig.maxProducts !== null && finalCount > planConfig.maxProducts) {
    return { 
      error: `Import impossible. Limite de ${planConfig.maxProducts} produits atteinte (${currentCount} existants + ${newProductsCount} nouveaux). ${getUpgradeMessage(effectivePlanName)}` 
    };
  }

  try {
    // 6. Préparation des données pour insertion
    const productsToInsert = newProducts.map(p => {
      // Si origin_country est fourni, on l'ajoute à la description
      // car la table products n'a pas de colonne origin_country (c'est au niveau des composants)
      let description = p.description || "";
      if (p.origin_country) {
        description += description ? `\n\nPays d'origine: ${p.origin_country}` : `Pays d'origine: ${p.origin_country}`;
      }

      return {
        name: p.name,
        sku: p.sku,
        description: description.trim() || null,
        brand_id: brand.id,
        // Pas de photo par défaut pour l'import CSV
      };
    });

    // 7. Mise à jour des produits en doublon (mise à jour des informations)
    let updatedCount = 0;
    if (duplicateProducts.length > 0) {
      for (const duplicate of duplicateProducts) {
        let description = duplicate.description || "";
        if (duplicate.origin_country) {
          description += description ? `\n\nPays d'origine: ${duplicate.origin_country}` : `Pays d'origine: ${duplicate.origin_country}`;
        }

        const { error: updateError } = await supabase
          .from("products")
          .update({
            name: duplicate.name,
            description: description.trim() || null,
          })
          .eq("brand_id", brand.id)
          .eq("sku", duplicate.sku);

        if (!updateError) {
          updatedCount++;
        }
      }
    }

    // 8. Insertion en masse des nouveaux produits
    let insertedCount = 0;
    if (productsToInsert.length > 0) {
      const { error: insertError } = await (supabase
        .from("products") as any)
        .insert(productsToInsert);

      if (insertError) {
        console.error("Erreur Supabase Import:", insertError);
        return { error: "Erreur lors de l'enregistrement en base de données." };
      }
      insertedCount = productsToInsert.length;
    }

    // 9. Revalidation
    revalidatePath(`/${locale}/dashboard`, "layout");
    revalidatePath(`/${locale}/dashboard/products`, "layout");

    // 10. Message de succès détaillé
    const messages: string[] = [];
    if (insertedCount > 0) {
      messages.push(`${insertedCount} nouveau(x) produit(s) importé(s)`);
    }
    if (updatedCount > 0) {
      messages.push(`${updatedCount} produit(s) mis à jour (SKU existant)`);
    }
    if (duplicateProducts.length > updatedCount) {
      messages.push(`${duplicateProducts.length - updatedCount} produit(s) ignoré(s) (erreur lors de la mise à jour)`);
    }

    return { 
      success: messages.length > 0 
        ? messages.join(", ") + " avec succès !" 
        : "Aucun produit à importer (tous les SKUs existent déjà)." 
    };

  } catch (err) {
    console.error("Erreur inattendue import:", err);
    return { error: "Une erreur inattendue est survenue lors de l'import." };
  }
}

/**
 * Type de retour pour l'analyse de certificat
 */
export type CertificateAnalysisResult = {
  success: true;
  data: {
    number: string | null;
    expiration_date: string | null;
    organization_name: string | null;
    scope_materials: string | null;
  };
} | {
  success: false;
  error: string;
};

/**
 * Action serveur pour analyser un certificat avec OpenAI et extraire les métadonnées
 * 
 * Cette fonction :
 * - Accepte un fichier (PDF ou Image)
 * - Convertit le fichier en base64
 * - Envoie à OpenAI GPT-4o avec l'API Vision
 * - Extrait les métadonnées (number, expiration_date, organization_name, scope_materials)
 * - Retourne un JSON avec les données extraites
 * 
 * @param file - Le fichier à analyser (PDF ou Image)
 * @returns Les métadonnées extraites ou une erreur
 */
export async function analyzeCertificate(
  file: File
): Promise<CertificateAnalysisResult> {
  try {
    // 1. Vérification de la clé API OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY n'est pas définie dans les variables d'environnement");
      return {
        success: false,
        error: "Configuration OpenAI manquante. Veuillez contacter le support.",
      };
    }

    // 2. Validation du fichier
    if (!file || file.size === 0) {
      return {
        success: false,
        error: "Le fichier est vide ou invalide.",
      };
    }

    // Validation de la taille du fichier (max 20MB pour OpenAI Vision)
    const maxSize = 20 * 1024 * 1024; // 20MB en bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: "La taille du fichier ne doit pas dépasser 20MB.",
      };
    }

    // Validation du type de fichier
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Le fichier doit être un PDF ou une image (JPEG, PNG ou WebP).",
      };
    }

    // 3. Conversion du fichier en base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    
    // Détermination du type MIME pour OpenAI
    let mimeType: string;
    if (file.type === "application/pdf") {
      mimeType = "application/pdf";
    } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
      mimeType = "image/jpeg";
    } else if (file.type === "image/png") {
      mimeType = "image/png";
    } else if (file.type === "image/webp") {
      mimeType = "image/webp";
    } else {
      return {
        success: false,
        error: "Type de fichier non supporté.",
      };
    }

    // 4. Initialisation du client OpenAI
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // 5. Prompt système pour l'extraction
    const systemPrompt = `Tu es un expert en certification textile. Extrais les données suivantes de ce document au format JSON strict (sans markdown, sans code block, juste le JSON brut) :
{
  "number": "numéro du certificat (ex: GOTS-2024-12345)",
  "expiration_date": "date d'expiration au format YYYY-MM-DD (ex: 2025-12-31)",
  "organization_name": "nom de l'organisme certificateur (ex: GOTS, Oeko-Tex, etc.)",
  "scope_materials": "matériaux couverts par le certificat (ex: Coton biologique, Laine mérinos, etc.)"
}

Si une information n'est pas trouvée dans le document, utilise null pour ce champ.
Retourne UNIQUEMENT le JSON, sans texte supplémentaire, sans explications, sans markdown.`;

    // 6. Appel à l'API OpenAI GPT-4o avec Vision
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyse ce document de certificat et extrais les métadonnées demandées. Retourne uniquement le JSON sans formatage markdown.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1, // Faible température pour plus de précision
      max_tokens: 500, // Limite pour le JSON
      response_format: { type: "json_object" }, // Force le format JSON
    });

    // 7. Extraction et parsing de la réponse
    const responseContent = completion.choices[0]?.message?.content?.trim();
    
    if (!responseContent) {
      console.error("Aucune réponse générée par OpenAI");
      return {
        success: false,
        error: "Impossible d'extraire les métadonnées du document. Veuillez vérifier que le document est lisible.",
      };
    }

    // 8. Parsing du JSON (peut être dans un code block markdown ou brut)
    let jsonString = responseContent;
    
    // Nettoyage : retirer les code blocks markdown si présents
    jsonString = jsonString.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    // Parsing du JSON
    let parsedData: {
      number?: string | null;
      expiration_date?: string | null;
      organization_name?: string | null;
      scope_materials?: string | null;
    };

    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Erreur lors du parsing JSON:", parseError);
      console.error("Contenu reçu:", responseContent);
      return {
        success: false,
        error: "Impossible de parser la réponse de l'IA. Le document pourrait être illisible ou non reconnu.",
      };
    }

    // 9. Validation et normalisation des données
    const result = {
      number: parsedData.number || null,
      expiration_date: parsedData.expiration_date || null,
      organization_name: parsedData.organization_name || null,
      scope_materials: parsedData.scope_materials || null,
    };

    // Validation de la date si présente
    if (result.expiration_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(result.expiration_date)) {
        // Tentative de correction du format de date
        try {
          const date = new Date(result.expiration_date);
          if (!isNaN(date.getTime())) {
            result.expiration_date = date.toISOString().split("T")[0];
          } else {
            result.expiration_date = null;
          }
        } catch {
          result.expiration_date = null;
        }
      }
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Erreur lors de l'analyse du certificat:", error);
    
    // Gestion des erreurs spécifiques OpenAI
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return {
          success: false,
          error: "Clé API OpenAI invalide. Veuillez contacter le support.",
        };
      }
      if (error.status === 429) {
        return {
          success: false,
          error: "Limite de requêtes OpenAI atteinte. Veuillez réessayer plus tard.",
        };
      }
      if (error.status === 400) {
        return {
          success: false,
          error: "Le fichier est trop volumineux ou dans un format non supporté.",
        };
      }
      return {
        success: false,
        error: `Erreur OpenAI: ${error.message}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error 
        ? `Erreur lors de l'analyse: ${error.message}` 
        : "Une erreur inattendue est survenue lors de l'analyse du certificat.",
    };
  }
}

/**
 * Type de retour pour les actions de demande de certificat
 */
export type CertificateRequestActionState = {
  error?: string;
  success?: string;
};

/**
 * Action serveur pour demander un certificat à un fournisseur par email
 * 
 * @param supplierEmail - Email du fournisseur
 * @param productId - ID du produit
 * @param componentId - ID du composant
 * @param customMessage - Message personnalisé (optionnel)
 */
export async function requestCertificateFromSupplier(
  supplierEmail: string,
  productId: string,
  componentId: string,
  customMessage?: string
): Promise<CertificateRequestActionState> {
  const supabase = await createClient();

  // 1. Vérification Authentification
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "Vous devez être connecté pour envoyer une demande." };
  }

  // 2. Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(supplierEmail.trim())) {
    return { error: "L'adresse email fournie n'est pas valide." };
  }

  // 3. Récupération de la marque
  const brand = await getUserBrand();
  if (!brand) {
    return { error: "Marque non trouvée." };
  }

  // 4. Récupération du produit (vérification de propriété)
  const product = await getProductById(productId);
  if (!product) {
    return { error: "Produit non trouvé ou accès non autorisé." };
  }

  // 5. Récupération du composant
  const components = await getProductComponents(productId);
  const component = components.find(c => c.id === componentId);
  if (!component) {
    return { error: "Composant non trouvé." };
  }

  // 6. Envoi de l'email
  try {
    const { sendCertificateRequestEmail } = await import("@/app/actions/email");
    
    const result = await sendCertificateRequestEmail(
      supplierEmail.trim(),
      brand.name,
      product.name,
      component.type,
      customMessage?.trim()
    );

    if (!result.success) {
      return { error: "Erreur lors de l'envoi de l'email. Veuillez réessayer." };
    }

    return { success: `Demande envoyée avec succès à ${supplierEmail}` };
  } catch (err) {
    console.error("Erreur inattendue demande certificat:", err);
    return { error: "Une erreur inattendue est survenue." };
  }
}
