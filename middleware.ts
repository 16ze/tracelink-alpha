import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware pour gérer l'authentification et la protection des routes
 *
 * Fonctionnalités :
 * 1. Rafraîchit automatiquement la session Supabase
 * 2. Protège les routes privées (dashboard)
 * 3. Redirige les utilisateurs connectés depuis login/home vers dashboard
 * 4. Exclut les routes publiques et les routes d'authentification
 */
export async function middleware(request: NextRequest) {
  // Exclure la route de callback d'authentification
  // Cette route doit gérer elle-même l'authentification
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // Exclure les routes publiques de passeport (/p/*)
  // Ces routes doivent être accessibles sans authentification
  if (request.nextUrl.pathname.startsWith("/p/")) {
    return NextResponse.next();
  }

  // Vérification des variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Variables d'environnement Supabase manquantes dans middleware");
    // En cas d'erreur de configuration, on laisse passer la requête
    // mais on ne peut pas protéger les routes
    return NextResponse.next();
  }

  // Initialisation de la réponse
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    // Création du client Supabase avec gestion des cookies
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mise à jour des cookies dans la requête
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Création d'une nouvelle réponse avec les cookies mis à jour
          response = NextResponse.next({
            request,
          });
          // Application des options des cookies dans la réponse
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Rafraîchissement de la session si nécessaire
    // Cette opération met automatiquement à jour les cookies si la session est renouvelée
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Si une erreur survient lors de la récupération de l'utilisateur,
    // on continue avec user = null (utilisateur non connecté)
    if (error) {
      console.warn("Erreur lors de la récupération de l'utilisateur:", error.message);
    }

    // Identification des routes
    const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
    const isLoginPage = request.nextUrl.pathname.startsWith("/login");
    const isHomePage = request.nextUrl.pathname === "/";

    // Protection des routes privées
    // Si l'utilisateur n'est PAS connecté et essaie d'accéder au dashboard
    if (isDashboard && !user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirection des utilisateurs connectés
    // Si l'utilisateur EST connecté et essaie d'accéder au login ou à la home
    if ((isLoginPage || isHomePage) && user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (err) {
    // En cas d'erreur inattendue, on log et on laisse passer la requête
    console.error("Erreur inattendue dans le middleware:", err);
    return NextResponse.next();
  }
}

/**
 * Configuration du middleware
 *
 * Le matcher définit les routes sur lesquelles le middleware s'exécute.
 * On exclut :
 * - Les fichiers statiques Next.js (_next/static, _next/image)
 * - Les fichiers médias (images, etc.)
 * - Le favicon
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (gérées séparément)
     * - Les fichiers médias
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

