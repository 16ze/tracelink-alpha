# TraceLink - Architecture Base de Données

## 📋 Vue d'ensemble

Ce dossier contient les migrations SQL pour créer l'architecture de base de données de TraceLink dans Supabase.

## 🗄️ Structure des Tables

### 1. **brands** (Les marques clientes)
- Stocke les informations des marques qui utilisent TraceLink
- Chaque marque est liée à un utilisateur propriétaire (`owner_id`)
- Contient : nom, logo, informations légales (JSONB)

### 2. **products** (Les vêtements)
- Stocke les produits textiles créés par chaque marque
- Chaque produit appartient à une marque (`brand_id`)
- Contient : nom, SKU (référence unique), photo, description

### 3. **components** (Les matières premières)
- Stocke les composants/matières premières de chaque produit
- Chaque composant appartient à un produit (`product_id`)
- Peut être lié à un fournisseur (`supplier_id`)
- Contient : type, pays d'origine, poids, pourcentage

### 4. **suppliers** (Les fournisseurs)
- Stocke les informations des fournisseurs de matières premières
- Peut être référencé par plusieurs composants
- Contient : nom, pays, score de certification, informations de contact

### 5. **certificates** (Les preuves écologiques)
- Stocke les certificats écologiques (GOTS, OEKO-TEX, etc.)
- Chaque certificat est lié à un composant (`component_id`)
- Contient : URL du fichier PDF, type de certificat, dates d'émission/expiration

## 🔒 Sécurité (Row Level Security - RLS)

**Principe fondamental** : Chaque marque ne peut voir et modifier QUE ses propres données.

### Règles RLS implémentées :

1. **brands** : Un utilisateur ne peut gérer que ses propres marques
2. **products** : Un utilisateur ne peut gérer que les produits de ses marques
3. **components** : Un utilisateur ne peut gérer que les composants de ses produits
4. **certificates** : Un utilisateur ne peut gérer que les certificats de ses composants
5. **suppliers** : Un utilisateur ne peut voir/modifier que les fournisseurs liés à ses composants

## 🚀 Installation dans Supabase

### Étape 1 : Se connecter à Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Allez dans **SQL Editor** (dans le menu de gauche)

### Étape 2 : Exécuter la migration
1. Ouvrez le fichier `supabase/migrations/001_initial_schema.sql`
2. Copiez tout le contenu du fichier
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **Run** (ou appuyez sur `Cmd/Ctrl + Enter`)

### Étape 3 : Vérifier la création
1. Allez dans **Table Editor** (dans le menu de gauche)
2. Vous devriez voir les 5 tables créées :
   - `brands`
   - `products`
   - `components`
   - `suppliers`
   - `certificates`

### Étape 4 : Vérifier les politiques RLS
1. Allez dans **Authentication** > **Policies**
2. Vérifiez que chaque table a des politiques RLS activées

## 📊 Relations entre les Tables

```
users (auth.users)
  └── brands (owner_id)
       └── products (brand_id)
            └── components (product_id)
                 ├── certificates (component_id)
                 └── suppliers (supplier_id via components)
```

## 🔍 Index Créés

Des index ont été créés sur :
- Les clés étrangères (pour optimiser les JOIN)
- Les champs de recherche fréquents (nom, SKU, type, pays)
- Les champs de tri (created_at, updated_at)

## ⚙️ Fonctionnalités Automatiques

### Trigger `updated_at`
- Mise à jour automatique du champ `updated_at` lors de chaque modification
- Implémenté sur toutes les tables

### Contraintes
- **Unicité** : SKU des produits, nom des marques
- **Vérification** : Scores de certification entre 0-100, pourcentages valides
- **Cascade** : Suppression en cascade (si une marque est supprimée, ses produits le sont aussi)

## 📝 Notes Importantes

1. **UUID** : Tous les IDs utilisent le type UUID pour une meilleure sécurité
2. **JSONB** : Les champs flexibles (legal_info, contact_info) utilisent JSONB pour stocker des données structurées
3. **RLS** : Toujours actif - impossible de contourner via l'API
4. **Timestamps** : Chaque table a `created_at` et `updated_at` pour l'audit

## 🧪 Tests RLS (après création de données)

Pour tester la sécurité RLS :
1. Créez deux utilisateurs de test
2. Créez une marque pour chaque utilisateur
3. Vérifiez qu'un utilisateur ne peut pas voir/modifier les données de l'autre

## 🔄 Prochaines Étapes

1. Créer un bucket Supabase Storage pour stocker les logos et certificats PDF
2. Configurer les règles de stockage pour que seul le propriétaire puisse uploader
3. Créer les fonctions TypeScript pour interagir avec ces tables

