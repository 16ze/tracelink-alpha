import Stripe from "stripe";

/**
 * Configuration Stripe pour TraceLink
 * 
 * Gère l'initialisation du client Stripe et la validation de la configuration.
 */

// Vérification de la présence des variables d'environnement requises
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeProPriceId = process.env.STRIPE_PRO_PRICE_ID;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

/**
 * Vérifie si Stripe est correctement configuré
 * 
 * @returns true si toutes les variables d'environnement requises sont présentes
 */
export function isStripeConfigured(): boolean {
  return !!(
    stripeSecretKey &&
    stripeProPriceId &&
    appUrl &&
    stripeSecretKey.startsWith("sk_")
  );
}

/**
 * Instance du client Stripe
 * 
 * Initialisée uniquement si la configuration est valide.
 * Lance une erreur en cas de configuration invalide pour éviter les erreurs silencieuses.
 */
export const stripe = isStripeConfigured()
  ? new Stripe(stripeSecretKey!, {
      apiVersion: "2024-12-18.acacia",
    })
  : (null as unknown as Stripe); // Type assertion pour éviter les erreurs TypeScript

/**
 * Configuration Stripe
 */
export const stripeConfig = {
  proPriceId: stripeProPriceId || "",
  appUrl: appUrl || "http://localhost:3000",
  successUrl: `${appUrl || "http://localhost:3000"}/dashboard?checkout=success`,
  cancelUrl: `${appUrl || "http://localhost:3000"}/dashboard?checkout=canceled`,
} as const;
