# 📋 Guide de Migration SQL - TraceLink

Ce document liste toutes les migrations SQL à exécuter dans l'ordre pour mettre à jour la base de données suite aux dernières fonctionnalités.

## ⚠️ Ordre d'exécution

**IMPORTANT** : Exécutez les migrations dans l'ordre suivant pour éviter les erreurs.

---

## 1. Migration Initiale (si pas déjà fait)

**Fichier** : `001_initial_schema.sql`

**Description** : Crée les tables de base (brands, products, suppliers, components, certificates, scans)

**À exécuter** : ✅ Seulement si la base de données est neuve

---

## 2. Champs Stripe (si pas déjà fait)

**Fichier** : `add_stripe_subscription_fields.sql`

**Description** : Ajoute les colonnes pour la gestion des abonnements Stripe

**À exécuter** : ✅ Seulement si les colonnes Stripe n'existent pas encore

**Colonnes ajoutées** :
- `subscription_status` (TEXT, DEFAULT 'free')
- `stripe_customer_id` (TEXT, UNIQUE)
- `stripe_subscription_id` (TEXT)
- `plan_name` (TEXT, DEFAULT 'free') - **⚠️ Contrainte à mettre à jour avec la migration suivante**

---

## 3. ⭐ NOUVELLE MIGRATION : Plan Starter

**Fichier** : `add_starter_plan.sql`

**Description** : Met à jour la contrainte CHECK de `plan_name` pour inclure le plan 'starter'

**À exécuter** : ✅ **OBLIGATOIRE** pour les nouvelles fonctionnalités

**Changements** :
- Supprime l'ancienne contrainte CHECK sur `plan_name`
- Ajoute une nouvelle contrainte incluant 'starter' : `('free', 'starter', 'pro', 'enterprise')`
- Met à jour le commentaire de la colonne

**Commande SQL** :
```sql
-- Voir le fichier complet : supabase/migrations/add_starter_plan.sql
```

---

## 4. Champs White Label (si pas déjà fait)

**Fichier** : `add_white_label_fields.sql`

**Description** : Ajoute les colonnes pour la personnalisation (plan Pro)

**À exécuter** : ✅ Seulement si les colonnes White Label n'existent pas encore

**Colonnes ajoutées** :
- `primary_color` (TEXT, DEFAULT '#000000')
- `remove_branding` (BOOLEAN, DEFAULT false)

---

## 5. Champs Compliance (si pas déjà fait)

**Fichier** : `add_compliance_fields.sql`

**Description** : Ajoute les colonnes pour la conformité (entretien, recyclabilité)

**À exécuter** : ✅ Seulement si les colonnes Compliance n'existent pas encore

---

## 6. Table Scans (si pas déjà fait)

**Fichier** : `create_scans_table.sql`

**Description** : Crée la table `scans` pour l'analytics

**À exécuter** : ✅ Seulement si la table `scans` n'existe pas encore

---

## 🚀 Exécution Rapide (Toutes les migrations)

Si vous voulez exécuter toutes les migrations d'un coup, voici l'ordre :

```sql
-- 1. Schéma initial (si base neuve)
\i supabase/migrations/001_initial_schema.sql

-- 2. Champs Stripe
\i supabase/migrations/add_stripe_subscription_fields.sql

-- 3. ⭐ NOUVEAU : Plan Starter (OBLIGATOIRE)
\i supabase/migrations/add_starter_plan.sql

-- 4. Champs White Label
\i supabase/migrations/add_white_label_fields.sql

-- 5. Champs Compliance
\i supabase/migrations/add_compliance_fields.sql

-- 6. Table Scans
\i supabase/migrations/create_scans_table.sql
```

---

## 📝 Instructions pour Supabase Dashboard

1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet TraceLink
3. Allez dans **SQL Editor** dans le menu de gauche
4. Cliquez sur **New Query**
5. Copiez-collez le contenu de `supabase/migrations/add_starter_plan.sql`
6. Cliquez sur **Run** (ou `Cmd/Ctrl + Enter`)

---

## ✅ Vérification Post-Migration

Après avoir exécuté la migration, vérifiez que tout est correct :

```sql
-- Vérifier que la contrainte CHECK inclut 'starter'
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'brands'::regclass
  AND contype = 'c'
  AND conname LIKE '%plan_name%';

-- Vérifier que vous pouvez insérer un plan 'starter'
-- (Cette requête devrait fonctionner sans erreur)
INSERT INTO brands (name, plan_name) 
VALUES ('Test Brand', 'starter')
ON CONFLICT (name) DO NOTHING;

-- Nettoyer le test
DELETE FROM brands WHERE name = 'Test Brand';
```

---

## 🔍 Résumé des Changements

### Nouveautés dans cette session :

1. **Plan Starter** : Ajout du plan 'starter' (25 produits max, 9€/mois)
2. **Limites mises à jour** :
   - Free : 3 produits (au lieu de 10)
   - Starter : 25 produits (nouveau)
   - Pro : Illimité
3. **Import CSV** : Réservé aux comptes payants (Starter/Pro)
4. **Analyse de certificats** : Extraction automatique avec OpenAI (pas de changement de schéma)

### Changements de schéma requis :

- ✅ **Migration `add_starter_plan.sql`** : Mise à jour de la contrainte CHECK sur `plan_name`

---

## ⚠️ Notes Importantes

- Les migrations utilisent `IF NOT EXISTS` et `IF EXISTS` pour être idempotentes
- Vous pouvez les exécuter plusieurs fois sans problème
- La migration `add_starter_plan.sql` est **obligatoire** pour que le plan Starter fonctionne
- Les autres migrations sont optionnelles si elles ont déjà été exécutées

---

## 🆘 En cas d'erreur

Si vous rencontrez une erreur lors de l'exécution :

1. **Erreur "constraint does not exist"** : C'est normal, la migration gère ce cas
2. **Erreur "column already exists"** : C'est normal, les migrations utilisent `IF NOT EXISTS`
3. **Erreur de permission** : Vérifiez que vous êtes connecté avec les droits administrateur

Pour toute autre erreur, consultez les logs dans Supabase Dashboard > Logs > Postgres Logs.

