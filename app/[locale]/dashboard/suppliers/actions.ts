"use server";

import type { DatabaseSupplier } from "@/types/supabase";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getUserBrand } from "../actions";

/**
 * Type de retour pour les actions de fournisseur
 */
export type SupplierActionState = {
  error?: string;
  success?: string;
};

/**
 * Récupère tous les fournisseurs de l'utilisateur
 *
 * @returns La liste des fournisseurs ou un tableau vide
 */
export async function getUserSuppliers(): Promise<DatabaseSupplier[]> {
  const supabase = await createClient();

  // Récupération de la marque de l'utilisateur
  const brand = await getUserBrand();
  if (!brand) {
    return [];
  }

  try {
    // Récupération des fournisseurs
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("brand_id", brand.id)
      .order("name", { ascending: true });

    if (error) {
      console.error("Erreur lors de la récupération des fournisseurs:", error);
      return [];
    }

    return (data as DatabaseSupplier[]) || [];
  } catch (err) {
    console.error(
      "Erreur inattendue lors de la récupération des fournisseurs:",
      err
    );
    return [];
  }
}

/**
 * Action serveur pour créer un fournisseur
 *
 * @param prevState - État précédent de l'action (pour useActionState)
 * @param formData - Données du formulaire contenant name, country, email, certifications
 * @returns État de l'action avec error ou success
 */
export async function createSupplier(
  prevState: SupplierActionState | null,
  formData: FormData
): Promise<SupplierActionState> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Vous devez être connecté pour créer un fournisseur" };
  }

  // Vérification que l'utilisateur a une marque
  const brand = await getUserBrand();
  if (!brand) {
    return {
      error: "Vous devez créer une marque avant de créer un fournisseur",
    };
  }

  // Récupération des données du formulaire
  const name = formData.get("name") as string;
  const country = formData.get("country") as string;
  const email = formData.get("email") as string;
  const certifications = formData.get("certifications") as string;

  // Validation des champs requis
  if (!name || name.trim().length === 0) {
    return { error: "Le nom du fournisseur est requis" };
  }

  if (!country || country.trim().length === 0) {
    return { error: "Le pays est requis" };
  }

  // Validation de la longueur des champs
  if (name.trim().length > 255) {
    return { error: "Le nom ne peut pas dépasser 255 caractères" };
  }

  if (country.trim().length > 100) {
    return { error: "Le pays ne peut pas dépasser 100 caractères" };
  }

  try {
    // Construction de l'objet contact_info
    const contactInfo: Record<string, any> = {};
    if (email && email.trim().length > 0) {
      contactInfo.email = email.trim();
    }
    if (certifications && certifications.trim().length > 0) {
      contactInfo.certifications = certifications.trim();
    }

    // Insertion du fournisseur dans la table suppliers
    const { error: insertError } = await supabase
      .from("suppliers")
      .insert({
        name: name.trim(),
        country: country.trim(),
        brand_id: brand.id,
        contact_info: Object.keys(contactInfo).length > 0 ? contactInfo : null,
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error("Erreur lors de la création du fournisseur:", insertError);
      return {
        error: insertError.message || "Erreur lors de la création du fournisseur",
      };
    }

    // Révalidation du cache
    revalidatePath("/dashboard/suppliers", "page");

    return {
      success: "Fournisseur créé avec succès !",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la création du fournisseur:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

/**
 * Action serveur pour supprimer un fournisseur
 *
 * @param supplierId - ID du fournisseur à supprimer
 * @returns État de l'action avec error ou success
 */
export async function deleteSupplier(
  supplierId: string
): Promise<SupplierActionState> {
  const supabase = await createClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Vous devez être connecté pour supprimer un fournisseur" };
  }

  // Vérification que l'utilisateur a une marque
  const brand = await getUserBrand();
  if (!brand) {
    return { error: "Marque non trouvée" };
  }

  try {
    // Vérification que le fournisseur appartient bien à la marque
    const { data: supplier, error: fetchError } = await supabase
      .from("suppliers")
      .select("id")
      .eq("id", supplierId)
      .eq("brand_id", brand.id)
      .single();

    if (fetchError || !supplier) {
      return {
        error: "Fournisseur non trouvé ou vous n'avez pas accès à ce fournisseur",
      };
    }

    // Suppression du fournisseur
    const { error: deleteError } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", supplierId);

    if (deleteError) {
      console.error("Erreur lors de la suppression du fournisseur:", deleteError);
      return {
        error: deleteError.message || "Erreur lors de la suppression du fournisseur",
      };
    }

    // Révalidation du cache
    revalidatePath("/dashboard/suppliers", "page");

    return {
      success: "Fournisseur supprimé avec succès",
    };
  } catch (err) {
    console.error("Erreur inattendue lors de la suppression du fournisseur:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}




