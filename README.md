# 🧵 TraceLink

**Passeport Numérique Produit (DPP) pour l'industrie textile**

SaaS B2B permettant aux marques de créer et partager des passeports numériques pour leurs produits textiles, avec traçabilité complète des matières premières, fournisseurs et certificats écologiques.

---

## 🚀 Stack Technique

- **Frontend** : Next.js 14 (App Router)
- **Langage** : TypeScript (Strict mode)
- **Styling** : Tailwind CSS + shadcn/ui (style "New York", base color "Zinc")
- **Backend/DB** : Supabase (PostgreSQL + Auth + Storage)
- **Icônes** : Lucide React

---

## 📦 Installation

### 1. Dépendances installées

Le projet est déjà initialisé avec toutes les dépendances nécessaires :

```bash
npm install
```

### 2. Configuration Supabase

1. Créez un fichier `.env.local` à la racine du projet
2. Ajoutez vos credentials Supabase (voir `ENV_SETUP.md` pour les instructions détaillées)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Base de données

Exécutez le script SQL dans Supabase SQL Editor :

- Fichier : `supabase/migrations/001_initial_schema.sql`

Ce script crée :

- ✅ Les 5 tables : `brands`, `products`, `suppliers`, `components`, `certificates`
- ✅ Les relations Foreign Keys
- ✅ Les index de performance
- ✅ Les triggers pour `updated_at`
- ✅ Les politiques RLS (Row Level Security)
- ✅ Les buckets Storage : `product-images`, `certificates`

---

## 📁 Structure du Projet

```
TraceLink/
├── app/                    # Next.js App Router
│   ├── globals.css        # Styles Tailwind + shadcn/ui
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Page d'accueil
├── components/             # Composants React
├── lib/                    # Utilitaires
│   └── utils.ts           # Fonction cn() pour Tailwind
├── supabase/
│   ├── migrations/        # Migrations SQL
│   │   └── 001_initial_schema.sql
│   ├── ANALYSE_SCHEMA.md  # Analyse détaillée du schéma
│   └── README.md          # Documentation Supabase
├── types/
│   └── supabase.ts        # Types TypeScript de la DB
├── utils/
│   └── supabase/
│       └── client.ts      # Client Supabase typé
├── components.json        # Configuration shadcn/ui
├── tailwind.config.ts     # Configuration Tailwind
├── tsconfig.json          # Configuration TypeScript
└── package.json           # Dépendances
```

---

## 🗄️ Architecture de la Base de Données

### Tables

1. **`brands`** : Les marques clientes
2. **`products`** : Les vêtements/produits
3. **`suppliers`** : Les fournisseurs (liés à une marque)
4. **`components`** : Les matières premières
5. **`certificates`** : Les certificats écologiques (PDF)

### Relations

```
auth.users → brands → products → components → certificates
                      ↘ suppliers ↗
```

### Sécurité RLS

- ✅ **Propriétaires** : Accès complet à leurs données (CRUD)
- ✅ **Public** : Accès en lecture seule (pour le QR Code / Passeport)

---

## 🛠️ Commandes Disponibles

```bash
# Démarrer le serveur de développement
npm run dev

# Build de production
npm run build

# Démarrer en production
npm start

# Linter
npm run lint
```

---

## 📚 Documentation

- **Variables d'environnement** : Voir `ENV_SETUP.md`
- **Schéma de base de données** : Voir `supabase/ANALYSE_SCHEMA.md`
- **Types TypeScript** : Voir `types/supabase.ts`

---

## 🔧 Utilisation des Types TypeScript

Les types sont automatiquement disponibles dans tout le projet :

```typescript
import { supabase } from "@/utils/supabase/client";
import type { BrandRow, ProductInsert } from "@/types/supabase";

// Exemple : Récupérer les marques
const { data: brands } = await supabase.from("brands").select("*");

// Exemple : Créer un produit (avec autocomplétion)
const newProduct: ProductInsert = {
  name: "T-shirt Bio",
  sku: "TSH-001",
  brand_id: "...",
  // ... autres champs
};

await supabase.from("products").insert(newProduct);
```

---

## 🎯 Prochaines Étapes

1. ✅ Base de données créée
2. ✅ Types TypeScript générés
3. ✅ Client Supabase configuré
4. ⏳ Créer les composants shadcn/ui
5. ⏳ Implémenter l'authentification
6. ⏳ Créer les pages de gestion (Admin Dashboard)
7. ⏳ Créer la page publique du passeport (QR Code)

---

## 📝 Notes

- Le projet utilise **TypeScript strict mode**
- Tous les fichiers sont commentés pour faciliter la compréhension
- Les types sont générés manuellement pour garantir la correspondance exacte avec le schéma SQL
