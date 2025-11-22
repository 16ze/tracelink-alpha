import Stripe from "stripe";

/**
 * Configuration et initialisation du client Stripe
 *
 * Ce fichier initialise l'instance Stripe avec la clé secrète depuis les variables d'environnement.
 * La clé secrète doit être définie dans .env.local sous le nom STRIPE_SECRET_KEY.
 *
 * @throws {Error} Si STRIPE_SECRET_KEY n'est pas définie dans les variables d'environnement
 * @throws {Error} Si STRIPE_SECRET_KEY est une clé publique au lieu d'une clé secrète
 */
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY is not defined in environment variables. Please add it to .env.local"
  );
}

// Validation que c'est bien une clé secrète (commence par sk_) et non une clé publique (pk_)
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey.startsWith("pk_")) {
  throw new Error(
    "❌ ERREUR: STRIPE_SECRET_KEY contient une clé PUBLIQUE (pk_) au lieu d'une clé SECRÈTE (sk_).\n" +
    "Les clés publiques commencent par 'pk_' et ne peuvent pas être utilisées pour les opérations serveur.\n" +
    "Vous devez utiliser une clé SECRÈTE qui commence par 'sk_test_' (mode test) ou 'sk_live_' (mode production).\n" +
    "Récupérez votre clé secrète sur https://dashboard.stripe.com/account/apikeys"
  );
}

if (!stripeKey.startsWith("sk_")) {
  throw new Error(
    "❌ ERREUR: STRIPE_SECRET_KEY ne semble pas être une clé secrète valide.\n" +
    "Une clé secrète Stripe doit commencer par 'sk_test_' (mode test) ou 'sk_live_' (mode production).\n" +
    "Vérifiez votre variable d'environnement et récupérez la bonne clé sur https://dashboard.stripe.com/account/apikeys"
  );
}

/**
 * Instance Stripe configurée avec la clé secrète
 *
 * Cette instance est utilisée pour toutes les opérations Stripe côté serveur :
 * - Création de clients
 * - Création d'abonnements
 * - Gestion des webhooks
 * - Récupération des informations d'abonnement
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia", // Version API Stripe (à mettre à jour selon la dernière version)
  typescript: true,
});

/**
 * Configuration Stripe pour l'application
 */
export const stripeConfig = {
  /**
   * ID du produit Stripe pour le plan Pro (à créer dans le dashboard Stripe)
   * À définir dans .env.local sous STRIPE_PRO_PRICE_ID
   */
  proPriceId: process.env.STRIPE_PRO_PRICE_ID || "",

  /**
   * URL de base de l'application pour les redirections après paiement
   */
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  /**
   * URL de succès après souscription
   */
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?success=true`,

  /**
   * URL d'annulation après souscription
   */
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=true`,

  /**
   * Webhook secret pour valider les événements Stripe
   * À définir dans .env.local sous STRIPE_WEBHOOK_SECRET
   */
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
} as const;

/**
 * Vérification que les variables d'environnement requises sont définies
 */
export function validateStripeConfig(): void {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }

  if (!stripeConfig.proPriceId) {
    console.warn(
      "STRIPE_PRO_PRICE_ID is not set. Pro subscription will not work."
    );
  }

  if (!stripeConfig.webhookSecret) {
    console.warn(
      "STRIPE_WEBHOOK_SECRET is not set. Webhooks will not be validated."
    );
  }
}


