-- Migration: Ajout du plan Starter dans la contrainte CHECK de plan_name
-- Date: 2024-12-XX
-- Description: Met à jour la contrainte CHECK pour inclure le plan 'starter' dans la colonne plan_name de la table brands

-- Suppression de l'ancienne contrainte CHECK (si elle existe)
-- On doit d'abord trouver le nom de la contrainte
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Recherche du nom de la contrainte CHECK sur plan_name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'brands'::regclass
      AND contype = 'c'
      AND conname LIKE '%plan_name%';
    
    -- Si la contrainte existe, on la supprime
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE brands DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END IF;
END $$;

-- Ajout de la nouvelle contrainte CHECK avec 'starter' inclus
ALTER TABLE brands
ADD CONSTRAINT brands_plan_name_check 
CHECK (plan_name IS NULL OR plan_name IN ('free', 'starter', 'pro', 'enterprise'));

-- Mise à jour du commentaire pour refléter les nouveaux plans
COMMENT ON COLUMN brands.plan_name IS 'Nom du plan d''abonnement: free (3 produits), starter (25 produits), pro (illimité), enterprise (illimité)';

