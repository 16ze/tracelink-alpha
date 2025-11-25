/**
 * Types TypeScript pour la base de données TraceLink
 *
 * Ces types correspondent EXACTEMENT au schéma SQL défini dans
 * supabase/migrations/001_initial_schema.sql
 *
 * Générés manuellement pour garantir la correspondance parfaite avec le schéma.
 */

/**
 * Type pour les informations légales d'une marque (JSONB)
 */
export interface LegalInfo {
  companyName?: string;
  siret?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  vatNumber?: string;
  [key: string]: any; // Permet d'ajouter des champs personnalisés
}

/**
 * Type pour les informations de contact d'un fournisseur (JSONB)
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  contactPerson?: string;
  [key: string]: any; // Permet d'ajouter des champs personnalisés
}

/**
 * Table: brands
 * Les marques clientes de TraceLink
 */
export interface DatabaseBrand {
  id: string; // UUID
  name: string; // VARCHAR(255) NOT NULL, UNIQUE
  logo_url: string | null; // TEXT
  website_url: string | null; // TEXT
  legal_info: LegalInfo | null; // JSONB
  owner_id: string | null; // UUID REFERENCES auth.users(id)
  // Champs Stripe pour la gestion des abonnements
  subscription_status: "free" | "active" | "canceled" | "past_due" | "trialing" | null; // TEXT DEFAULT 'free'
  stripe_customer_id: string | null; // TEXT UNIQUE
  stripe_subscription_id: string | null; // TEXT
  plan_name: "free" | "pro" | "enterprise" | null; // TEXT DEFAULT 'free'
  // Champs White Label
  primary_color: string | null; // TEXT DEFAULT '#000000'
  remove_branding: boolean | null; // BOOLEAN DEFAULT false
  created_at: string; // TIMESTAMPTZ (format ISO 8601)
  updated_at: string; // TIMESTAMPTZ (format ISO 8601)
}

/**
 * Table: products
 * Les vêtements/produits textiles
 */
export interface DatabaseProduct {
  id: string; // UUID
  name: string; // VARCHAR(255) NOT NULL
  sku: string; // VARCHAR(100) NOT NULL, UNIQUE
  photo_url: string | null; // TEXT
  description: string | null; // TEXT
  brand_id: string; // UUID NOT NULL REFERENCES brands(id)
  // Champs Compliance (Entretien & Loi AGEC)
  composition_text: string | null; // TEXT
  care_wash: "30_deg" | "40_deg" | "60_deg" | "hand_wash" | "no_wash" | null; // TEXT
  care_bleach: boolean | null; // BOOLEAN DEFAULT false
  care_dry: "no_dryer" | "tumble_low" | "tumble_medium" | "tumble_high" | "line_dry" | "flat_dry" | null; // TEXT
  care_iron: "no_iron" | "low" | "medium" | "high" | null; // TEXT
  recyclability: boolean | null; // BOOLEAN DEFAULT false
  released_microplastics: boolean | null; // BOOLEAN DEFAULT false
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * Table: suppliers
 * Les fournisseurs de matières premières
 */
export interface DatabaseSupplier {
  id: string; // UUID
  name: string; // VARCHAR(255) NOT NULL
  country: string; // VARCHAR(100) NOT NULL
  brand_id: string; // UUID NOT NULL REFERENCES brands(id)
  contact_info: ContactInfo | null; // JSONB
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * Table: components
 * Les matières premières/composants des produits
 */
export interface DatabaseComponent {
  id: string; // UUID
  type: string; // VARCHAR(100) NOT NULL (ex: "Coton", "Polyester", "Boutons")
  origin_country: string; // VARCHAR(100) NOT NULL
  product_id: string; // UUID NOT NULL REFERENCES products(id)
  supplier_id: string | null; // UUID REFERENCES suppliers(id) ON DELETE SET NULL
  weight_grams: number | null; // DECIMAL(10, 2)
  percentage: number | null; // DECIMAL(5, 2)
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * Table: certificates
 * Les certificats écologiques (PDF)
 */
export interface DatabaseCertificate {
  id: string; // UUID
  file_url: string; // TEXT NOT NULL (URL du PDF dans Supabase Storage)
  type: string; // VARCHAR(50) NOT NULL (ex: "GOTS", "OEKO-TEX", "OCS", "GRS")
  component_id: string; // UUID NOT NULL REFERENCES components(id)
  verified: boolean; // BOOLEAN DEFAULT FALSE
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * Table: scans
 * Les scans (vues) de passeports publics pour l'analytics
 */
export interface DatabaseScan {
  id: string; // UUID
  product_id: string; // UUID NOT NULL REFERENCES products(id)
  brand_id: string; // UUID NOT NULL REFERENCES brands(id)
  created_at: string; // TIMESTAMPTZ DEFAULT NOW()
  device_type: "mobile" | "desktop" | "tablet" | null; // TEXT
  country: string | null; // TEXT
}

/**
 * Interface principale de la base de données
 * Utilisée pour typer les clients Supabase
 */
export interface Database {
  public: {
    Tables: {
      brands: {
        Row: DatabaseBrand;
        Insert: Omit<DatabaseBrand, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<DatabaseBrand, "id" | "created_at" | "updated_at">
        >;
      };
      products: {
        Row: DatabaseProduct;
        Insert: Omit<DatabaseProduct, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<DatabaseProduct, "id" | "created_at" | "updated_at">
        >;
      };
      suppliers: {
        Row: DatabaseSupplier;
        Insert: Omit<DatabaseSupplier, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<DatabaseSupplier, "id" | "created_at" | "updated_at">
        >;
      };
      components: {
        Row: DatabaseComponent;
        Insert: Omit<DatabaseComponent, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<DatabaseComponent, "id" | "created_at" | "updated_at">
        >;
      };
      certificates: {
        Row: DatabaseCertificate;
        Insert: Omit<DatabaseCertificate, "id" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<DatabaseCertificate, "id" | "created_at" | "updated_at">
        >;
      };
      scans: {
        Row: DatabaseScan;
        Insert: Omit<DatabaseScan, "id" | "created_at">;
        Update: Partial<Omit<DatabaseScan, "id" | "created_at">>;
      };
    };
  };
}

/**
 * Types utilitaires pour les opérations sur les tables
 */

// Types Insert (pour créer des enregistrements)
export type BrandInsert = Database["public"]["Tables"]["brands"]["Insert"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type SupplierInsert =
  Database["public"]["Tables"]["suppliers"]["Insert"];
export type ComponentInsert =
  Database["public"]["Tables"]["components"]["Insert"];
export type CertificateInsert =
  Database["public"]["Tables"]["certificates"]["Insert"];

// Types Update (pour modifier des enregistrements)
export type BrandUpdate = Database["public"]["Tables"]["brands"]["Update"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
export type SupplierUpdate =
  Database["public"]["Tables"]["suppliers"]["Update"];
export type ComponentUpdate =
  Database["public"]["Tables"]["components"]["Update"];
export type CertificateUpdate =
  Database["public"]["Tables"]["certificates"]["Update"];

// Types Row (pour lire les enregistrements)
export type BrandRow = Database["public"]["Tables"]["brands"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];
export type ComponentRow = Database["public"]["Tables"]["components"]["Row"];
export type CertificateRow =
  Database["public"]["Tables"]["certificates"]["Row"];

/**
 * Types avec relations (pour les requêtes JOIN)
 */

// Product avec sa Brand
export interface ProductWithBrand extends ProductRow {
  brand: BrandRow;
}

// Component avec son Product
export interface ComponentWithProduct extends ComponentRow {
  product: ProductRow;
}

// Component avec son Supplier
export interface ComponentWithSupplier extends ComponentRow {
  supplier: SupplierRow | null;
}

// Component avec son Product et son Supplier
export interface ComponentWithProductAndSupplier extends ComponentRow {
  product: ProductRow;
  supplier: SupplierRow | null;
}

// Certificate avec son Component
export interface CertificateWithComponent extends CertificateRow {
  component: ComponentRow;
}

// Component avec ses Certificates
export interface ComponentWithCertificates extends ComponentRow {
  certificates: CertificateRow[];
}

// Product avec tous ses Components
export interface ProductWithComponents extends ProductRow {
  components: ComponentRow[];
}

// Product avec ses Components et leurs Suppliers
export interface ProductWithComponentsAndSuppliers extends ProductRow {
  components: (ComponentRow & {
    supplier: SupplierRow | null;
  })[];
}

// Product complet : avec Brand, Components, Suppliers et Certificates
export interface ProductFullDetails extends ProductRow {
  brand: BrandRow;
  components: (ComponentRow & {
    supplier: SupplierRow | null;
    certificates: CertificateRow[];
  })[];
}

// Brand avec tous ses Products
export interface BrandWithProducts extends BrandRow {
  products: ProductRow[];
}
