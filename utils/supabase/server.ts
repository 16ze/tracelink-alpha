import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/**
 * Crée un client Supabase pour le côté serveur (Server Components & Server Actions)
 * Gère automatiquement la lecture et l'écriture des cookies.
 * Utilise les types TypeScript définis dans types/supabase.ts pour une autocomplétion parfaite.
 *
 * @returns Instance du client Supabase typé avec notre schéma
 *
 * @example
 * const supabase = await createClient();
 * const { data: brands } = await supabase.from('brands').select('*');
 */
export async function createClient() {
  const cookieStore = await cookies();

  // Vérification que les variables d'environnement sont définies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable"
    );
  }

  // Création du client avec les types de notre base de données
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
  });
}

