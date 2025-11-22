"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

/**
 * Type de retour pour les actions d'authentification
 */
export type AuthActionState = {
  error?: string;
  success?: string;
  requiresEmailConfirmation?: boolean;
  redirect?: string; // URL vers laquelle rediriger en cas de succès
};

/**
 * Action serveur pour la connexion par Email/Mot de passe
 *
 * @param prevState - État précédent de l'action (pour useFormState)
 * @param formData - Données du formulaire contenant email et password
 * @returns État de l'action avec error ou success
 */
export async function login(
  prevState: AuthActionState | null,
  formData: FormData,
  locale?: string
): Promise<AuthActionState> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validation des champs requis
  if (!email || !password) {
    return { error: "Email et mot de passe requis" };
  }

  // Validation du format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Format d'email invalide" };
  }

  // Validation de la longueur du mot de passe
  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères" };
  }

  try {
    // Tentative de connexion
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      // Messages d'erreur spécifiques selon le type d'erreur
      if (error.message.includes("Invalid login credentials")) {
        return { error: "Email ou mot de passe incorrect" };
      }
      if (error.message.includes("Email not confirmed")) {
        return {
          error: "Veuillez vérifier votre email avant de vous connecter",
        };
      }
      return { error: error.message || "Erreur lors de la connexion" };
    }

    // Si l'utilisateur est connecté avec succès
    if (data.user) {
      revalidatePath("/", "layout");
      // Retourner un état de succès avec redirection au lieu d'utiliser redirect()
      // La redirection sera gérée côté client via useActionState
      const currentLocale = locale || "fr";
      return { success: "Connexion réussie", redirect: `/${currentLocale}/dashboard` };
    }

    return { error: "Erreur inattendue lors de la connexion" };
  } catch (err) {
    console.error("Erreur lors de la connexion:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}

/**
 * Action serveur pour l'inscription
 *
 * @param prevState - État précédent de l'action (pour useFormState)
 * @param formData - Données du formulaire contenant email, password et confirmPassword
 * @returns État de l'action avec error, success ou requiresEmailConfirmation
 */
export async function signup(
  prevState: AuthActionState | null,
  formData: FormData,
  locale?: string
): Promise<AuthActionState> {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validation des champs requis
  if (!email || !password || !confirmPassword) {
    return { error: "Tous les champs sont requis" };
  }

  // Validation du format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Format d'email invalide" };
  }

  // Validation de la longueur du mot de passe
  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères" };
  }

  // Validation de la correspondance des mots de passe
  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas" };
  }

  // Récupérer l'origine pour construire l'URL de callback correcte
  const origin = (await headers()).get("origin");
  if (!origin) {
    return { error: "Impossible de déterminer l'origine de la requête" };
  }

  try {
    // Tentative d'inscription
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        // Redirection vers NOTRE application après confirmation email
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      // Messages d'erreur spécifiques
      if (error.message.includes("User already registered")) {
        return {
          error: "Cet email est déjà utilisé. Essayez de vous connecter.",
        };
      }
      return { error: error.message || "Erreur lors de l'inscription" };
    }

    // Vérifier si l'email doit être confirmé
    // Si data.user existe mais n'a pas de session, cela signifie qu'une confirmation email est requise
    if (data.user && !data.session) {
      return {
        success:
          "Un email de confirmation a été envoyé. Veuillez vérifier votre boîte mail.",
        requiresEmailConfirmation: true,
      };
    }

    // Si l'utilisateur est directement connecté (email confirmation désactivée)
    if (data.user && data.session) {
      revalidatePath("/", "layout");
      // Retourner un état de succès avec redirection au lieu d'utiliser redirect()
      // La redirection sera gérée côté client via useActionState
      const currentLocale = locale || "fr";
      return { success: "Inscription réussie", redirect: `/${currentLocale}/dashboard` };
    }

    return {
      error: "Erreur inattendue lors de l'inscription. Veuillez réessayer.",
    };
  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    return {
      error: "Une erreur est survenue. Veuillez réessayer plus tard.",
    };
  }
}
