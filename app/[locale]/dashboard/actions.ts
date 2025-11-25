"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  DatabaseBrand,
  DatabaseProduct,
  DatabaseComponent,
  DatabaseCertificate,
  BrandInsert,
  ProductInsert,
} from "@/types/supabase";

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
 * @returns La marque de l'utilisateur ou null si elle n'existe pas
 */
export async function getUserBrand(): Promise<DatabaseBrand | null> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
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
    // Utilisation de no-store pour forcer le rafraîchissement des données
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) {
      // Si aucune marque n'est trouvée (PGRST116 = not found), retourner null
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Erreur lors de la récupération de la marque:", error);
      return null;
    }

    // maybeSingle() peut retourner null si aucun résultat n'est trouvé
    if (!data) {
      return null;
    }

    return data as DatabaseBrand;
  } catch (err) {
    console.error("Erreur inattendue lors de la récupération de la marque:", err);
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

  // Récupération des données du formulaire
  const name = formData.get("name") as string;
  const websiteUrl = formData.get("website_url") as string;

  // Validation des champs requis
  if (!name || name.trim().length === 0) {
    return { error: "Le nom de la marque est requis" };
  }

  // Validation de la longueur du nom
  if (name.trim().length < 2) {
    return { error: "Le nom de la marque doit contenir au moins 2 caractères" };
  }

  if (name.trim().length > 255) {
    return { error: "Le nom de la marque ne peut pas dépasser 255 caractères" };
  }

  // Validation optionnelle de l'URL du site web
  let websiteUrlValidated: string | null = null;
  if (websiteUrl && websiteUrl.trim().length > 0) {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(websiteUrl.trim())) {
      return {
        error: "L'URL du site web doit commencer par http:// ou https://",
      };
    }
    websiteUrlValidated = websiteUrl.trim();
  }

  try {
    // Vérification si l'utilisateur a déjà une marque
    const existingBrand = await getUserBrand();
    if (existingBrand) {
      return {
        error: "Vous possédez déjà une marque. Vous ne pouvez en créer qu'une seule.",
      };
    }

    // Création de la marque
    // Note: subscription_status et plan_name ont une valeur par défaut 'free' dans la DB
    const { data, error } = await supabase
      .from("brands")
      .insert({
        name: name.trim(),
        website_url: websiteUrlValidated,
        owner_id: user.id,
      } as any)
      .select()
      .single();

    if (error) {
      // Gestion des erreurs spécifiques
      if (error.code === "23505") {
        // Violation de contrainte unique (nom déjà utilisé)
        return {
          error: "Ce nom de marque est déjà utilisé. Veuillez en choisir un autre.",
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

  // Récupération des données du formulaire
  const name = formData.get("name") as string;
  const websiteUrl = formData.get("website_url") as string;
  const primaryColor = formData.get("primary_color") as string;
  const removeBranding = formData.get("remove_branding") === "true";

  // Validation du nom (obligatoire)
  if (!name || name.trim().length === 0) {
    return { error: "Le nom de la marque est requis" };
  }

  if (name.trim().length < 2) {
    return { error: "Le nom de la marque doit contenir au moins 2 caractères" };
  }

  if (name.trim().length > 255) {
    return { error: "Le nom de la marque ne peut pas dépasser 255 caractères" };
  }

  // Validation de l'URL du site web (optionnel)
  let websiteUrlValidated: string | null = null;
  if (websiteUrl && websiteUrl.trim().length > 0) {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(websiteUrl.trim())) {
      return {
        error: "L'URL du site web doit commencer par http:// ou https://",
      };
    }
    websiteUrlValidated = websiteUrl.trim();
  }

  // Validation de la couleur primaire (format hex)
  let primaryColorValidated: string = "#000000";
  if (primaryColor && primaryColor.trim().length > 0) {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(primaryColor.trim())) {
      return {
        error: "La couleur doit être au format hexadécimal (ex: #FF5733)",
      };
    }
    primaryColorValidated = primaryColor.trim();
  }

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
    // @ts-ignore - Les types Supabase ne reconnaissent pas encore toutes les colonnes
    const updateData: any = {
      name: name.trim(),
      website_url: websiteUrlValidated,
      primary_color: primaryColorValidated,
    };

    // Seuls les membres Pro peuvent masquer le branding
    if (isProPlan) {
      updateData.remove_branding = removeBranding;
    }

    const { data, error } = await supabase
      .from("brands")
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
    console.error("Erreur lors de la récupération de l'utilisateur:", userError);
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
    console.error("Erreur inattendue lors de la récupération des produits:", err);
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
  // VÉRIFICATION DE LA LIMITE DE PRODUITS (PLAN GRATUIT)
  // ============================================
  // Récupération du statut d'abonnement
  // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes Stripe
  const subscriptionStatus = (brand as any)?.subscription_status;

  // Si l'utilisateur n'est pas en plan Pro (subscription_status !== 'active')
  if (subscriptionStatus !== "active") {
    // Compter le nombre de produits existants pour cette marque
    const { count, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brand.id);

    if (countError) {
      console.error("Erreur lors du comptage des produits:", countError);
      // En cas d'erreur, on continue (sécurité : on assume qu'il peut créer)
    } else {
      // Limite de 10 produits pour le plan gratuit
      const MAX_PRODUCTS_FREE = 10;
      if (count !== null && count >= MAX_PRODUCTS_FREE) {
        return {
          error: "Limite de 10 produits atteinte. Passez Pro pour illimité.",
        };
      }
    }
  }

  // Récupération des données du formulaire
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const description = formData.get("description") as string;
  const photo = formData.get("photo") as File | null;

  // Validation des champs requis
  if (!name || name.trim().length === 0) {
    return { error: "Le nom du produit est requis" };
  }

  if (!sku || sku.trim().length === 0) {
    return { error: "Le SKU/Référence est requis" };
  }

  // Validation du fichier photo (indispensable)
  if (!photo || photo.size === 0) {
    return { error: "La photo du produit est obligatoire" };
  }

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

  // Validation de la longueur des champs
  if (name.trim().length > 255) {
    return { error: "Le nom du produit ne peut pas dépasser 255 caractères" };
  }

  if (sku.trim().length > 100) {
    return { error: "Le SKU ne peut pas dépasser 100 caractères" };
  }

  try {
    // Génération d'un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedOriginalName = photo.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}-${sanitizedOriginalName}`;
    const filePath = `${user.id}/${uniqueFileName}`;

    // Conversion du fichier en ArrayBuffer pour l'upload
    const arrayBuffer = await photo.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload de l'image vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, fileBuffer, {
        contentType: photo.type,
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
    const { data: productData, error: insertError } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        sku: sku.trim(),
        description: description?.trim() || null,
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
        error:
          insertError.message || "Erreur lors de la création du produit",
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
    console.error("Erreur lors de la récupération de l'utilisateur:", userError);
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
    return { error: "Vous devez être connecté pour modifier les données de compliance" };
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
      error: "La gestion des données de compliance est réservée aux membres Pro.",
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
  const releasedMicroplastics = formData.get("released_microplastics") === "true";

  // Validation des valeurs de care_wash
  const validCareWash = ["30_deg", "40_deg", "60_deg", "hand_wash", "no_wash"];
  if (careWash && careWash !== "" && !validCareWash.includes(careWash)) {
    return { error: "Valeur de lavage invalide" };
  }

  // Validation des valeurs de care_dry
  const validCareDry = ["no_dryer", "tumble_low", "tumble_medium", "tumble_high", "line_dry", "flat_dry"];
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
    // @ts-ignore - Les types Supabase ne reconnaissent pas encore les colonnes compliance
    const updateData: any = {};

    if (compositionText !== null && compositionText !== undefined) {
      updateData.composition_text = compositionText.trim() || null;
    }
    if (careWash && careWash !== "") {
      updateData.care_wash = careWash;
    } else {
      updateData.care_wash = null;
    }
    updateData.care_bleach = careBleach;
    if (careDry && careDry !== "") {
      updateData.care_dry = careDry;
    } else {
      updateData.care_dry = null;
    }
    if (careIron && careIron !== "") {
      updateData.care_iron = careIron;
    } else {
      updateData.care_iron = null;
    }
    updateData.recyclability = recyclability;
    updateData.released_microplastics = releasedMicroplastics;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de la mise à jour du produit:", error);
      return {
        error: error.message || "Erreur lors de la mise à jour des données de compliance",
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
            name: productData.name,
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
    console.error("Erreur inattendue lors de la récupération des analytics:", err);
    return {
      totalProducts: 0,
      totalScans: 0,
      topProduct: null,
      scansLast7Days: [],
    };
  }
}

