-- Migration: Ajout des champs Compliance (Entretien & Loi AGEC) pour le plan Pro
-- Date: 2024-12-XX
-- Description: Ajoute les colonnes nécessaires pour la gestion des informations d'entretien et de compliance environnementale

-- Ajout de la colonne composition_text (ex: '100% Coton Bio')
ALTER TABLE products
ADD COLUMN IF NOT EXISTS composition_text TEXT;

-- Ajout de la colonne care_wash (température de lavage)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS care_wash TEXT CHECK (care_wash IN ('30_deg', '40_deg', '60_deg', 'hand_wash', 'no_wash'));

-- Ajout de la colonne care_bleach (autorisation javel)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS care_bleach BOOLEAN DEFAULT false;

-- Ajout de la colonne care_dry (séchage)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS care_dry TEXT CHECK (care_dry IN ('no_dryer', 'tumble_low', 'tumble_medium', 'tumble_high', 'line_dry', 'flat_dry'));

-- Ajout de la colonne care_iron (repassage)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS care_iron TEXT CHECK (care_iron IN ('no_iron', 'low', 'medium', 'high'));

-- Ajout de la colonne recyclability (recyclabilité)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS recyclability BOOLEAN DEFAULT false;

-- Ajout de la colonne released_microplastics (rejette des microplastiques)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS released_microplastics BOOLEAN DEFAULT false;

-- Commentaires pour la documentation
COMMENT ON COLUMN products.composition_text IS 'Texte de composition (ex: 100% Coton Bio). Partie de la compliance Loi AGEC';
COMMENT ON COLUMN products.care_wash IS 'Instructions de lavage: 30_deg, 40_deg, 60_deg, hand_wash, no_wash';
COMMENT ON COLUMN products.care_bleach IS 'Autorisation d''utilisation de javel (true/false)';
COMMENT ON COLUMN products.care_dry IS 'Instructions de séchage: no_dryer, tumble_low, tumble_medium, tumble_high, line_dry, flat_dry';
COMMENT ON COLUMN products.care_iron IS 'Instructions de repassage: no_iron, low, medium, high';
COMMENT ON COLUMN products.recyclability IS 'Le produit est-il recyclable ? (Loi AGEC)';
COMMENT ON COLUMN products.released_microplastics IS 'Le produit rejette-t-il des microplastiques lors du lavage ? (Loi AGEC)';

