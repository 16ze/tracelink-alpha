-- Migration: Ajout des champs White Label pour le plan Pro
-- Date: 2024-12-XX
-- Description: Ajoute les colonnes nécessaires pour la personnalisation du passeport public (White Label)

-- Ajout de la colonne primary_color (couleur principale pour les boutons et header)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#000000';

-- Ajout de la colonne remove_branding (masquer le logo TraceLink)
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS remove_branding BOOLEAN DEFAULT false;

-- Commentaires pour la documentation
COMMENT ON COLUMN brands.primary_color IS 'Couleur principale pour personnaliser le passeport public (boutons, header). Par défaut: #000000';
COMMENT ON COLUMN brands.remove_branding IS 'Masquer le logo TraceLink sur le passeport public. Disponible uniquement pour les membres Pro (subscription_status = active)';

