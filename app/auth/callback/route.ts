import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Route de callback pour l'authentification Supabase
 *
 * Cette route est appelée après :
 * 1. Confirmation d'email (signup)
 * 2. Réinitialisation de mot de passe
 * 3. Changement d'email
 *
 * Elle échange le code d'authentification temporaire contre une session permanente.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/fr/dashboard"; // Locale par défaut
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const origin = requestUrl.origin;
  
  // Détection de la locale depuis le header Accept-Language ou utilisation de 'fr' par défaut
  const acceptLanguage = request.headers.get("accept-language");
  const locale = acceptLanguage?.startsWith("en") ? "en" : "fr";

  // Gestion des erreurs OAuth (si présentes dans l'URL)
  if (error) {
    console.error("Erreur OAuth dans callback:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/${locale}/login?error=${encodeURIComponent(
        errorDescription || "Erreur d'authentification"
      )}`
    );
  }

  // Si un code est présent, on l'échange contre une session
  if (code) {
    const cookieStore = await cookies();
    
    // Vérification des variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Variables d'environnement Supabase manquantes");
      return NextResponse.redirect(
        `${origin}/${locale}/login?error=${encodeURIComponent(
          "Configuration serveur invalide"
        )}`
      );
    }

    try {
      // Création du client Supabase avec gestion des cookies
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (err) {
              // Cette erreur peut être ignorée si le middleware gère le rafraîchissement des sessions
              console.warn("Erreur lors de la définition des cookies:", err);
            }
          },
        },
      });

      // Échange du code contre une session
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Erreur lors de l'échange du code:", exchangeError);
        return NextResponse.redirect(
          `${origin}/${locale}/login?error=${encodeURIComponent(
            exchangeError.message || "Erreur lors de la confirmation"
          )}`
        );
    }

      // Vérification que l'utilisateur est bien créé et authentifié
      if (data.user && data.session) {
        // Redirection vers la page demandée (ou dashboard par défaut)
        // Si next n'a pas de locale, on l'ajoute
        const redirectPath = next.startsWith(`/${locale}/`) || next.startsWith("/fr/") || next.startsWith("/en/") 
          ? next 
          : `/${locale}${next}`;
        return NextResponse.redirect(`${origin}${redirectPath}`);
      } else {
        console.error("Session invalide après échange du code");
        return NextResponse.redirect(
          `${origin}/${locale}/login?error=${encodeURIComponent(
            "Impossible de créer la session"
          )}`
        );
      }
    } catch (err) {
      console.error("Erreur inattendue dans le callback:", err);
      return NextResponse.redirect(
        `${origin}/${locale}/login?error=${encodeURIComponent(
          "Une erreur inattendue est survenue"
        )}`
      );
    }
  }

  // Si aucun code n'est présent, c'est une erreur
  console.warn("Callback appelé sans code d'authentification");
  return NextResponse.redirect(
    `${origin}/${locale}/login?error=${encodeURIComponent(
      "Code d'authentification manquant"
    )}`
  );
}
