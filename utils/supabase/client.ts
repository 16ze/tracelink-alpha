/**
 * Client Supabase pour le navigateur (Browser)
 *
 * Ce client est utilisé côté client dans les composants React.
 * Il utilise les types TypeScript définis dans types/supabase.ts
 * pour une autocomplétion parfaite.
 */

import type { Database } from "@/types/supabase";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Crée et retourne un client Supabase pour le navigateur
 *
 * @returns Instance du client Supabase typé avec notre schéma
 *
 * @example
 * const supabase = createClient();
 * const { data: brands } = await supabase.from('brands').select('*');
 */
export function createClient() {
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
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Instance du client Supabase (singleton)
 *
 * Utilisez cette instance directement dans vos composants
 * au lieu de créer un nouveau client à chaque fois.
 *
 * @example
 * import { supabase } from '@/utils/supabase/client';
 * const { data } = await supabase.from('brands').select('*');
 */
export const supabase = createClient();
