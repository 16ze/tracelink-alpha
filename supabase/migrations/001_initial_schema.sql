-- =====================================================
-- TraceLink - Architecture de Base de Données (MASTER VERSION FINAL)
-- Version : Gestion Fournisseurs + Accès Public + Triggers Dates
-- =====================================================

-- 1. CONFIGURATION INITIALE

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. TABLES
-- =====================================================

-- TABLE: brands

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    legal_info JSONB, 
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT brands_name_unique UNIQUE(name)
);

-- TABLE: products

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    photo_url TEXT,
    description TEXT,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT products_sku_unique UNIQUE(sku)
);

-- TABLE: suppliers

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE, 
    contact_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: components

CREATE TABLE IF NOT EXISTS components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    origin_country VARCHAR(100) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    weight_grams DECIMAL(10, 2),
    percentage DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE: certificates

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_url TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. TRIGGERS (Mise à jour automatique des dates)
-- =====================================================

-- Fonction qui met à jour le champ updated_at

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application sur toutes les tables

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. INDEX (Performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_brands_owner_id ON brands(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_brand_id ON suppliers(brand_id);
CREATE INDEX IF NOT EXISTS idx_components_product_id ON components(product_id);
CREATE INDEX IF NOT EXISTS idx_certificates_component_id ON certificates(component_id);

-- =====================================================
-- 5. SECURITE RLS (Row Level Security)
-- =====================================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- POLITIQUES PROPRIETAIRE (ADMIN)
-- Note: PostgreSQL ne supporte pas "ALL", donc on crée des politiques séparées pour chaque opération

-- BRANDS : Le propriétaire peut tout faire sur ses marques
CREATE POLICY "Owner selects own brand" ON brands FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner inserts own brand" ON brands FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates own brand" ON brands FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner deletes own brand" ON brands FOR DELETE USING (auth.uid() = owner_id);

-- PRODUCTS : Le propriétaire peut tout faire sur ses produits
CREATE POLICY "Owner selects own products" ON products FOR SELECT USING (EXISTS (SELECT 1 FROM brands WHERE brands.id = products.brand_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner inserts own products" ON products FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM brands WHERE brands.id = products.brand_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner updates own products" ON products FOR UPDATE USING (EXISTS (SELECT 1 FROM brands WHERE brands.id = products.brand_id AND brands.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM brands WHERE brands.id = products.brand_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner deletes own products" ON products FOR DELETE USING (EXISTS (SELECT 1 FROM brands WHERE brands.id = products.brand_id AND brands.owner_id = auth.uid()));

-- SUPPLIERS : Le propriétaire peut tout faire sur ses fournisseurs
CREATE POLICY "Owner selects own suppliers" ON suppliers FOR SELECT USING (EXISTS (SELECT 1 FROM brands WHERE brands.id = suppliers.brand_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner inserts own suppliers" ON suppliers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM brands WHERE brands.id = suppliers.brand_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner updates own suppliers" ON suppliers FOR UPDATE USING (EXISTS (SELECT 1 FROM brands WHERE brands.id = suppliers.brand_id AND brands.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM brands WHERE brands.id = suppliers.brand_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner deletes own suppliers" ON suppliers FOR DELETE USING (EXISTS (SELECT 1 FROM brands WHERE brands.id = suppliers.brand_id AND brands.owner_id = auth.uid()));

-- COMPONENTS : Le propriétaire peut tout faire sur ses composants
CREATE POLICY "Owner selects own components" ON components FOR SELECT USING (EXISTS (SELECT 1 FROM products JOIN brands ON products.brand_id = brands.id WHERE products.id = components.product_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner inserts own components" ON components FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM products JOIN brands ON products.brand_id = brands.id WHERE products.id = components.product_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner updates own components" ON components FOR UPDATE USING (EXISTS (SELECT 1 FROM products JOIN brands ON products.brand_id = brands.id WHERE products.id = components.product_id AND brands.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM products JOIN brands ON products.brand_id = brands.id WHERE products.id = components.product_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner deletes own components" ON components FOR DELETE USING (EXISTS (SELECT 1 FROM products JOIN brands ON products.brand_id = brands.id WHERE products.id = components.product_id AND brands.owner_id = auth.uid()));

-- CERTIFICATES : Le propriétaire peut tout faire sur ses certificats
CREATE POLICY "Owner selects own certificates" ON certificates FOR SELECT USING (EXISTS (SELECT 1 FROM components JOIN products ON components.product_id = products.id JOIN brands ON products.brand_id = brands.id WHERE components.id = certificates.component_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner inserts own certificates" ON certificates FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM components JOIN products ON components.product_id = products.id JOIN brands ON products.brand_id = brands.id WHERE components.id = certificates.component_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner updates own certificates" ON certificates FOR UPDATE USING (EXISTS (SELECT 1 FROM components JOIN products ON components.product_id = products.id JOIN brands ON products.brand_id = brands.id WHERE components.id = certificates.component_id AND brands.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM components JOIN products ON components.product_id = products.id JOIN brands ON products.brand_id = brands.id WHERE components.id = certificates.component_id AND brands.owner_id = auth.uid()));
CREATE POLICY "Owner deletes own certificates" ON certificates FOR DELETE USING (EXISTS (SELECT 1 FROM components JOIN products ON components.product_id = products.id JOIN brands ON products.brand_id = brands.id WHERE components.id = certificates.component_id AND brands.owner_id = auth.uid()));

-- POLITIQUES PUBLIQUES (LECTURE SEULE)

CREATE POLICY "Public view brands" ON brands FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public view products" ON products FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public view suppliers" ON suppliers FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public view components" ON components FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public view certificates" ON certificates FOR SELECT TO anon, authenticated USING (true);

-- =====================================================
-- 6. STOCKAGE (Storage Buckets)
-- =====================================================

-- Note: Si cette partie échoue, crée les buckets manuellement dans l'interface Supabase

INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques de stockage

CREATE POLICY "Public Access Images" ON storage.objects FOR SELECT USING ( bucket_id = 'product-images' );

CREATE POLICY "Public Access Certificates" ON storage.objects FOR SELECT USING ( bucket_id = 'certificates' );

CREATE POLICY "Auth Users Upload Images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Auth Users Upload Certificates" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'certificates');
