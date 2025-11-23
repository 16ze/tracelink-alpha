-- Migration: Ajout des champs Stripe pour la gestion des abonnements
-- Date: 2024-11-22
-- Description: Ajoute les colonnes nécessaires pour gérer les abonnements Stripe dans la table brands

-- Ajout de la colonne subscription_status (statut de l'abonnement)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'canceled', 'past_due', 'trialing'));

-- Ajout de la colonne stripe_customer_id (ID du client Stripe)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Ajout de la colonne stripe_subscription_id (ID de l'abonnement Stripe)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Ajout de la colonne plan_name (nom du plan d'abonnement)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'free' CHECK (plan_name IN ('free', 'pro', 'enterprise'));

-- Création d'un index sur stripe_customer_id pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_brands_stripe_customer_id ON brands(stripe_customer_id);

-- Création d'un index sur stripe_subscription_id pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_brands_stripe_subscription_id ON brands(stripe_subscription_id);

-- Commentaires pour la documentation
COMMENT ON COLUMN brands.subscription_status IS 'Statut de l''abonnement Stripe: free, active, canceled, past_due, trialing';
COMMENT ON COLUMN brands.stripe_customer_id IS 'Identifiant unique du client dans Stripe';
COMMENT ON COLUMN brands.stripe_subscription_id IS 'Identifiant unique de l''abonnement dans Stripe';
COMMENT ON COLUMN brands.plan_name IS 'Nom du plan d''abonnement: free, pro, enterprise';




