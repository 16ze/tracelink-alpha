# 📊 Analyse du Schéma de Base de Données - TraceLink

## Vue d'ensemble

Ce document analyse la structure complète de la base de données pour générer les types TypeScript correspondants.

---

## 🗄️ Structure des Tables

### 1. **brands** (Les marques)

**Description** : Stocke les informations des marques clientes de TraceLink.

| Champ | Type SQL | Type TypeScript | Nullable | Description |
|-------|----------|-----------------|----------|-------------|
| `id` | UUID | `string` | ❌ | Identifiant unique (généré automatiquement) |
| `name` | VARCHAR(255) | `string` | ❌ | Nom de la marque (unique) |
| `logo_url` | TEXT | `string \| null` | ✅ | URL du logo de la marque |
| `website_url` | TEXT | `string \| null` | ✅ | URL du site web de la marque |
| `legal_info` | JSONB | `Record<string, any> \| null` | ✅ | Informations légales (SIRET, adresse, etc.) |
| `owner_id` | UUID | `string \| null` | ✅ | ID de l'utilisateur propriétaire (référence auth.users) |
| `created_at` | TIMESTAMPTZ | `string` | ❌ | Date de création (format ISO) |
| `updated_at` | TIMESTAMPTZ | `string` | ❌ | Date de dernière modification (mise à jour automatique) |

**Relations** :
- `owner_id` → `auth.users(id)` (CASCADE DELETE)
- `brands` ← `products.brand_id`
- `brands` ← `suppliers.brand_id`

**Sécurité RLS** :
- ✅ Propriétaire : Toutes les opérations (CREATE, READ, UPDATE, DELETE)
- ✅ Public : Lecture seule (pour le passeport QR Code)

---

### 2. **products** (Les vêtements)

**Description** : Stocke les produits textiles créés par chaque marque.

| Champ | Type SQL | Type TypeScript | Nullable | Description |
|-------|----------|-----------------|----------|-------------|
| `id` | UUID | `string` | ❌ | Identifiant unique |
| `name` | VARCHAR(255) | `string` | ❌ | Nom du produit |
| `sku` | VARCHAR(100) | `string` | ❌ | Stock Keeping Unit (référence unique) |
| `photo_url` | TEXT | `string \| null` | ✅ | URL de la photo du produit |
| `description` | TEXT | `string \| null` | ✅ | Description du produit |
| `brand_id` | UUID | `string` | ❌ | ID de la marque propriétaire |
| `created_at` | TIMESTAMPTZ | `string` | ❌ | Date de création |
| `updated_at` | TIMESTAMPTZ | `string` | ❌ | Date de dernière modification |

**Relations** :
- `brand_id` → `brands(id)` (CASCADE DELETE)
- `products` ← `components.product_id`

**Sécurité RLS** :
- ✅ Propriétaire : Toutes les opérations (via la marque)
- ✅ Public : Lecture seule (pour le passeport QR Code)

**Contraintes** :
- `sku` doit être unique

---

### 3. **suppliers** (Les fournisseurs)

**Description** : Stocke les fournisseurs de matières premières, liés à une marque.

| Champ | Type SQL | Type TypeScript | Nullable | Description |
|-------|----------|-----------------|----------|-------------|
| `id` | UUID | `string` | ❌ | Identifiant unique |
| `name` | VARCHAR(255) | `string` | ❌ | Nom du fournisseur |
| `country` | VARCHAR(100) | `string` | ❌ | Pays du fournisseur |
| `brand_id` | UUID | `string` | ❌ | ID de la marque propriétaire |
| `contact_info` | JSONB | `Record<string, any> \| null` | ✅ | Informations de contact (email, téléphone, adresse) |
| `created_at` | TIMESTAMPTZ | `string` | ❌ | Date de création |
| `updated_at` | TIMESTAMPTZ | `string` | ❌ | Date de dernière modification |

**Relations** :
- `brand_id` → `brands(id)` (CASCADE DELETE)
- `suppliers` ← `components.supplier_id` (SET NULL on delete)

**Sécurité RLS** :
- ✅ Propriétaire : Toutes les opérations (via la marque)
- ✅ Public : Lecture seule

**🔑 Changement important** : Les fournisseurs sont maintenant liés directement à une marque (`brand_id`), et non plus de manière indépendante.

---

### 4. **components** (Les matières premières)

**Description** : Stocke les composants/matières premières de chaque produit.

| Champ | Type SQL | Type TypeScript | Nullable | Description |
|-------|----------|-----------------|----------|-------------|
| `id` | UUID | `string` | ❌ | Identifiant unique |
| `type` | VARCHAR(100) | `string` | ❌ | Type de composant (ex: "Coton", "Polyester", "Boutons") |
| `origin_country` | VARCHAR(100) | `string` | ❌ | Pays d'origine du composant |
| `product_id` | UUID | `string` | ❌ | ID du produit auquel appartient le composant |
| `supplier_id` | UUID | `string \| null` | ✅ | ID du fournisseur (optionnel) |
| `weight_grams` | DECIMAL(10, 2) | `number \| null` | ✅ | Poids en grammes |
| `percentage` | DECIMAL(5, 2) | `number \| null` | ✅ | Pourcentage dans le produit |
| `created_at` | TIMESTAMPTZ | `string` | ❌ | Date de création |
| `updated_at` | TIMESTAMPTZ | `string` | ❌ | Date de dernière modification |

**Relations** :
- `product_id` → `products(id)` (CASCADE DELETE)
- `supplier_id` → `suppliers(id)` (SET NULL on delete)
- `components` ← `certificates.component_id`

**Sécurité RLS** :
- ✅ Propriétaire : Toutes les opérations (via le produit → marque)
- ✅ Public : Lecture seule

---

### 5. **certificates** (Les preuves écologiques PDF)

**Description** : Stocke les certificats écologiques (GOTS, OEKO-TEX, etc.) liés aux composants.

| Champ | Type SQL | Type TypeScript | Nullable | Description |
|-------|----------|-----------------|----------|-------------|
| `id` | UUID | `string` | ❌ | Identifiant unique |
| `file_url` | TEXT | `string` | ❌ | URL du fichier PDF dans Supabase Storage |
| `type` | VARCHAR(50) | `string` | ❌ | Type de certificat (ex: "GOTS", "OEKO-TEX", "OCS", "GRS") |
| `component_id` | UUID | `string` | ❌ | ID du composant associé |
| `verified` | BOOLEAN | `boolean` | ❌ | Indique si le certificat a été vérifié manuellement (défaut: false) |
| `created_at` | TIMESTAMPTZ | `string` | ❌ | Date de création |
| `updated_at` | TIMESTAMPTZ | `string` | ❌ | Date de dernière modification |

**Relations** :
- `component_id` → `components(id)` (CASCADE DELETE)

**Sécurité RLS** :
- ✅ Propriétaire : Toutes les opérations (via le composant → produit → marque)
- ✅ Public : Lecture seule

---

## 🔄 Relations entre les Tables

```
auth.users (Supabase Auth)
  └── owner_id → brands
       ├── brand_id → products
       │    └── product_id → components
       │         ├── supplier_id → suppliers
       │         └── component_id → certificates
       └── brand_id → suppliers
```

**Hiérarchie** :
1. `users` → `brands` (propriétaire)
2. `brands` → `products` + `suppliers`
3. `products` → `components`
4. `components` → `certificates`
5. `components` → `suppliers` (relation optionnelle)

---

## 🔒 Modèle de Sécurité RLS

### Niveaux d'accès

1. **Propriétaire (Admin Dashboard)** :
   - Peut créer, lire, modifier et supprimer ses données
   - Accès complet via les politiques `Owner manages...`

2. **Public (QR Code / Passeport)** :
   - Peut uniquement lire les données (SELECT)
   - Accès via les politiques `Public view...`
   - Fonctionne même sans authentification (role `anon`)

### Politiques RLS

- **ALL** : Toutes les opérations (SELECT, INSERT, UPDATE, DELETE)
- **FOR SELECT** : Uniquement la lecture

---

## 📦 Stockage (Storage Buckets)

### Buckets créés

1. **`product-images`** :
   - Public en lecture
   - Upload uniquement pour utilisateurs authentifiés
   - Stocke les photos des produits

2. **`certificates`** :
   - Public en lecture
   - Upload uniquement pour utilisateurs authentifiés
   - Stocke les PDF de certificats

---

## 🎯 Types TypeScript à Générer

### Types de base (par table)

1. **`DatabaseBrand`** : Type complet depuis Supabase
2. **`DatabaseProduct`** : Type complet depuis Supabase
3. **`DatabaseSupplier`** : Type complet depuis Supabase
4. **`DatabaseComponent`** : Type complet depuis Supabase
5. **`DatabaseCertificate`** : Type complet depuis Supabase

### Types avec relations (pour les requêtes JOIN)

1. **`ProductWithBrand`** : Product + Brand
2. **`ProductWithComponents`** : Product + Components[]
3. **`ComponentWithSupplier`** : Component + Supplier
4. **`ComponentWithCertificates`** : Component + Certificates[]
5. **`ProductWithFullDetails`** : Product + Brand + Components[] + Suppliers[] + Certificates[]

### Types pour les formulaires (Insert/Update)

1. **`BrandInsert`** : Champs requis pour créer une marque
2. **`ProductInsert`** : Champs requis pour créer un produit
3. **`SupplierInsert`** : Champs requis pour créer un fournisseur
4. **`ComponentInsert`** : Champs requis pour créer un composant
5. **`CertificateInsert`** : Champs requis pour créer un certificat

### Types pour les mises à jour (Update)

1. **`BrandUpdate`** : Champs optionnels pour modifier une marque
2. **`ProductUpdate`** : Champs optionnels pour modifier un produit
3. **`SupplierUpdate`** : Champs optionnels pour modifier un fournisseur
4. **`ComponentUpdate`** : Champs optionnels pour modifier un composant
5. **`CertificateUpdate`** : Champs optionnels pour modifier un certificat

---

## ⚙️ Fonctionnalités Automatiques

### Triggers

- **`update_updated_at_column()`** : Met à jour automatiquement le champ `updated_at` sur toutes les tables lors d'une modification

### Index

- Index sur toutes les Foreign Keys pour optimiser les JOIN
- Index sur `brands.owner_id` pour optimiser les requêtes par propriétaire
- Index sur `products.sku` pour optimiser les recherches par référence

---

## 📝 Notes Importantes pour TypeScript

1. **UUID** : Tous les IDs sont des `string` (UUID en format texte)

2. **Timestamps** : Les dates sont au format `TIMESTAMPTZ` (ISO 8601 string)

3. **JSONB** : Les champs `legal_info` et `contact_info` sont des objets TypeScript typés

4. **Décimal** : Les champs `weight_grams` et `percentage` sont des `number` (TypeScript n'a pas de type Decimal natif)

5. **Nullable** : Utiliser `| null` pour les champs optionnels

6. **Relations** : Les Foreign Keys peuvent être utilisées pour créer des types de relations typées

---

## 🚀 Prochaines Étapes

1. Générer les types TypeScript depuis ce schéma
2. Créer les helpers TypeScript pour les requêtes Supabase
3. Créer les composants React pour gérer chaque entité
4. Créer les pages publiques pour le passeport QR Code

