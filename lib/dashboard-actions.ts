"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  DatabaseBrand,
  DatabaseProduct,
  DatabaseComponent,
  DatabaseCertificate,
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
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (error) {
      // Si aucune marque n'est trouvée (PGRST116 = not found), retourner null
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Erreur lors de la récupération de la marque:", error);
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
 * Type de retour pour les actions de demande de certificat
 */
export type CertificateRequestActionState = {
  error?: string;
  success?: string;
};

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

  // 3. Vérification Limites (Plan Gratuit)
  // @ts-ignore
  const subscriptionStatus = (brand as any)?.subscription_status;
  
  if (subscriptionStatus !== "active") {
    // Compter les produits existants
    const { count, error: countError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("brand_id", brand.id);

    if (!countError) {
      const currentCount = count || 0;
      const newTotal = currentCount + products.length;
      const MAX_PRODUCTS_FREE = 10;

      if (newTotal > MAX_PRODUCTS_FREE) {
        return { 
          error: `Import impossible. Limite de 10 produits atteinte (${currentCount} existants + ${products.length} importés). Passez Pro pour illimité.` 
        };
      }
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

