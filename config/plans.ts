/**
 * Configuration des plans tarifaires TraceLink
 * 
 * Définit les limites de produits pour chaque plan d'abonnement.
 */

export type PlanName = "free" | "starter" | "pro" | "enterprise";

/**
 * Interface pour définir un plan
 */
export interface PlanConfig {
  name: PlanName;
  maxProducts: number | null; // null = illimité
  price: number; // Prix mensuel en euros
  priceId?: string; // Stripe Price ID (optionnel, pour les plans payants)
}

/**
 * Configuration des plans disponibles
 */
export const PLANS: Record<PlanName, PlanConfig> = {
  free: {
    name: "free",
    maxProducts: 3,
    price: 0,
  },
  starter: {
    name: "starter",
    maxProducts: 25,
    price: 9,
    priceId: process.env.STRIPE_STARTER_PRICE_ID, // À définir dans les variables d'environnement
  },
  pro: {
    name: "pro",
    maxProducts: null, // Illimité
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  enterprise: {
    name: "enterprise",
    maxProducts: null, // Illimité
    price: 0, // Sur devis
  },
} as const;

/**
 * Récupère la configuration d'un plan par son nom
 * 
 * @param planName - Le nom du plan
 * @returns La configuration du plan ou le plan gratuit par défaut
 */
export function getPlanConfig(planName: PlanName | null | undefined): PlanConfig {
  if (!planName || !(planName in PLANS)) {
    return PLANS.free;
  }
  return PLANS[planName];
}

/**
 * Vérifie si un utilisateur peut créer un produit selon son plan
 * 
 * @param planName - Le nom du plan de l'utilisateur
 * @param currentProductCount - Le nombre actuel de produits
 * @returns true si l'utilisateur peut créer un produit, false sinon
 */
export function canCreateProduct(
  planName: PlanName | null | undefined,
  currentProductCount: number
): boolean {
  const plan = getPlanConfig(planName);
  
  // Si maxProducts est null, le plan est illimité
  if (plan.maxProducts === null) {
    return true;
  }
  
  // Sinon, vérifier si on n'a pas atteint la limite
  return currentProductCount < plan.maxProducts;
}

/**
 * Récupère le message d'erreur si la limite est atteinte
 * 
 * @param planName - Le nom du plan de l'utilisateur
 * @returns Le message d'erreur approprié
 */
export function getUpgradeMessage(planName: PlanName | null | undefined): string {
  const plan = getPlanConfig(planName);
  
  if (plan.name === "free") {
    return "Limite de 3 produits atteinte. Passez au plan Starter (9€/mois) ou Pro (29€/mois) pour plus de produits.";
  }
  
  if (plan.name === "starter") {
    return "Limite de 25 produits atteinte. Passez au plan Pro (29€/mois) pour des produits illimités.";
  }
  
  return "Limite de produits atteinte. Veuillez passer à un plan supérieur.";
}

