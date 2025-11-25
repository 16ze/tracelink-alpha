-- Migration: Création de la table scans pour le tracking des vues de passeports
-- Date: 2024-12-XX
-- Description: Table pour enregistrer les scans (vues) des passeports publics
-- ⚠️ IMPORTANT: Exécutez ce script dans le SQL Editor de Supabase

-- TABLE: scans
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
    country TEXT
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_scans_product_id ON scans(product_id);
CREATE INDEX IF NOT EXISTS idx_scans_brand_id ON scans(brand_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at);
CREATE INDEX IF NOT EXISTS idx_scans_brand_created_at ON scans(brand_id, created_at);

-- RLS (Row Level Security)
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Politique : Les propriétaires peuvent voir leurs scans
CREATE POLICY "Owner selects own scans" ON scans FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM brands 
        WHERE brands.id = scans.brand_id 
        AND brands.owner_id = auth.uid()
    ));

-- Politique : Tout le monde peut insérer des scans (pour le tracking public)
CREATE POLICY "Public can insert scans" ON scans FOR INSERT 
    WITH CHECK (true);

-- Politique : Lecture publique des scans (pour les stats agrégées)
CREATE POLICY "Public view scans" ON scans FOR SELECT TO anon, authenticated USING (true);

-- Commentaires pour la documentation
COMMENT ON TABLE scans IS 'Table pour tracker les scans (vues) des passeports publics';
COMMENT ON COLUMN scans.product_id IS 'ID du produit dont le passeport a été consulté';
COMMENT ON COLUMN scans.brand_id IS 'ID de la marque (pour requêtes rapides par marque)';
COMMENT ON COLUMN scans.device_type IS 'Type d''appareil: mobile, desktop, tablet';
COMMENT ON COLUMN scans.country IS 'Pays d''origine de la requête (si disponible via headers)';
