import { z } from "zod";

/**
 * Schémas de validation Zod pour les Server Actions
 * 
 * Ces schémas permettent de valider et sanitizer les données entrantes
 * avant de les envoyer à Supabase, garantissant la sécurité et l'intégrité des données.
 */

/**
 * Schéma de validation pour un produit
 */
export const productSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom du produit est requis")
    .max(255, "Le nom du produit ne peut pas dépasser 255 caractères")
    .trim(),
  sku: z
    .string()
    .min(1, "Le SKU/Référence est requis")
    .max(100, "Le SKU ne peut pas dépasser 100 caractères")
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, "Le SKU ne peut contenir que des lettres, chiffres, tirets et underscores"),
  description: z
    .string()
    .max(5000, "La description ne peut pas dépasser 5000 caractères")
    .trim()
    .nullable()
    .optional()
    .transform((val) => val || null),
});

/**
 * Schéma de validation pour une marque (création)
 */
export const brandSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom de la marque doit contenir au moins 2 caractères")
    .max(255, "Le nom de la marque ne peut pas dépasser 255 caractères")
    .trim(),
  website_url: z
    .union([
      z.string().url("L'URL du site web doit être valide (commence par http:// ou https://)").max(500, "L'URL ne peut pas dépasser 500 caractères").trim(),
      z.string().length(0),
      z.null(),
    ])
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
});

/**
 * Schéma de validation pour les paramètres de marque (mise à jour)
 */
export const brandSettingsSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom de la marque doit contenir au moins 2 caractères")
    .max(255, "Le nom de la marque ne peut pas dépasser 255 caractères")
    .trim(),
  website_url: z
    .union([
      z.string().url("L'URL du site web doit être valide (commence par http:// ou https://)").max(500, "L'URL ne peut pas dépasser 500 caractères").trim(),
      z.string().length(0),
      z.null(),
    ])
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  primary_color: z
    .union([
      z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal (#RRGGBB)").max(7, "La couleur ne peut pas dépasser 7 caractères").trim(),
      z.string().length(0),
      z.null(),
    ])
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  remove_branding: z
    .boolean()
    .optional()
    .default(false),
});

/**
 * Schéma de validation pour un fichier image
 */
export const imageFileSchema = z
  .instanceof(File, { message: "Le fichier doit être une image" })
  .refine((file) => file.size > 0, "Le fichier ne peut pas être vide")
  .refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB
    "La taille de l'image ne doit pas dépasser 10MB"
  )
  .refine(
    (file) => ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type),
    "Le fichier doit être une image (JPEG, PNG ou WebP)"
  );

/**
 * Fonction utilitaire pour parser et valider les données d'un FormData
 * 
 * @param formData - Le FormData à parser
 * @param schema - Le schéma Zod à utiliser pour la validation
 * @returns Les données validées ou une erreur
 */
export function parseFormData<T>(
  formData: FormData,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    // Conversion du FormData en objet
    const rawData: Record<string, unknown> = {};
    
    for (const [key, value] of formData.entries()) {
      // Gestion spéciale pour les booléens
      if (value === "true" || value === "false") {
        rawData[key] = value === "true";
      } else {
        rawData[key] = value;
      }
    }

    // Validation avec Zod
    const result = schema.safeParse(rawData);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      // Récupération du premier message d'erreur
      const firstError = result.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Erreur de validation",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inattendue lors de la validation",
    };
  }
}

/**
 * Fonction utilitaire pour valider un fichier image
 * 
 * @param file - Le fichier à valider
 * @returns Les données validées ou une erreur
 */
export function validateImageFile(
  file: File | null
): { success: true; data: File } | { success: false; error: string } {
  if (!file) {
    return { success: false, error: "La photo du produit est obligatoire" };
  }

  const result = imageFileSchema.safeParse(file);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: firstError?.message || "Le fichier image est invalide",
    };
  }
}

