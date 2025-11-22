# Configuration Stripe - TraceLink

## 📋 Vue d'ensemble

Ce document explique comment configurer Stripe pour gérer les abonnements Pro dans TraceLink.

## 🔧 Installation

Le SDK Stripe a été installé avec la commande :
```bash
npm install stripe
```

## 🗄️ Migration Base de Données

### Fichier SQL de migration

Le fichier `supabase/migrations/add_stripe_subscription_fields.sql` contient la migration SQL à exécuter dans Supabase.

### Colonnes ajoutées à la table `brands` :

1. **`subscription_status`** (TEXT, DEFAULT 'free')
   - Valeurs possibles : `'free'`, `'active'`, `'canceled'`, `'past_due'`, `'trialing'`
   - Statut de l'abonnement Stripe

2. **`stripe_customer_id`** (TEXT, UNIQUE)
   - Identifiant unique du client dans Stripe
   - Permet de lier une marque à un client Stripe

3. **`stripe_subscription_id`** (TEXT)
   - Identifiant unique de l'abonnement dans Stripe
   - Permet de suivre l'abonnement actif

4. **`plan_name`** (TEXT, DEFAULT 'free')
   - Valeurs possibles : `'free'`, `'pro'`, `'enterprise'`
   - Nom du plan d'abonnement actuel

### Comment appliquer la migration

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de `supabase/migrations/add_stripe_subscription_fields.sql`
4. Exécutez la requête

## 🔑 Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Clé secrète Stripe (trouvable dans Dashboard Stripe > Developers > API keys)
STRIPE_SECRET_KEY=sk_test_...

# ID du Price Stripe pour le plan Pro (à créer dans Dashboard Stripe > Products)
STRIPE_PRO_PRICE_ID=price_...

# Secret du webhook Stripe (généré lors de la création du webhook)
STRIPE_WEBHOOK_SECRET=whsec_...

# URL de base de l'application (pour les redirections)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Comment obtenir ces valeurs

1. **STRIPE_SECRET_KEY** :
   - Dashboard Stripe > Developers > API keys
   - Utilisez la clé secrète (commence par `sk_test_` en mode test, `sk_live_` en production)

2. **STRIPE_PRO_PRICE_ID** :
   - Dashboard Stripe > Products
   - Créez un produit "Plan Pro" avec un prix récurrent mensuel de 29€
   - Copiez l'ID du Price (commence par `price_`)

3. **STRIPE_WEBHOOK_SECRET** :
   - Dashboard Stripe > Developers > Webhooks
   - Créez un endpoint webhook pointant vers votre application
   - Copiez le "Signing secret" (commence par `whsec_`)

## 📁 Fichiers créés

### `utils/stripe/config.ts`

Ce fichier contient :
- L'initialisation du client Stripe
- La configuration des URLs de redirection
- La validation des variables d'environnement

**Utilisation** :
```typescript
import { stripe, stripeConfig } from "@/utils/stripe/config";

// Utiliser l'instance Stripe
const customer = await stripe.customers.create({...});

// Accéder à la configuration
const successUrl = stripeConfig.successUrl;
```

## 🔄 Types TypeScript mis à jour

Le fichier `types/supabase.ts` a été mis à jour pour inclure les nouveaux champs dans l'interface `DatabaseBrand` :

```typescript
export interface DatabaseBrand {
  // ... champs existants
  subscription_status: "free" | "active" | "canceled" | "past_due" | "trialing" | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_name: "free" | "pro" | "enterprise" | null;
}
```

## ✅ Prochaines étapes

1. ✅ SDK Stripe installé
2. ✅ Migration SQL créée
3. ✅ Configuration Stripe créée
4. ✅ Server Action pour créer les sessions Checkout
5. ✅ Route API pour les webhooks Stripe
6. ⏭️ Configurer le webhook dans le dashboard Stripe
7. ⏭️ Mettre à jour l'UI pour afficher le statut d'abonnement

## 🔔 Configuration du Webhook Stripe

### 1. Créer le webhook dans Stripe

1. Allez dans votre **Dashboard Stripe** > **Developers** > **Webhooks**
2. Cliquez sur **Add endpoint**
3. Entrez l'URL de votre webhook :
   - **En développement** : `http://localhost:3000/api/webhooks/stripe` (utilisez Stripe CLI pour tester)
   - **En production** : `https://votre-domaine.com/api/webhooks/stripe`
4. Sélectionnez les événements à écouter :
   - ✅ `checkout.session.completed` (obligatoire pour activer les abonnements)
5. Cliquez sur **Add endpoint**

### 2. Récupérer le Webhook Secret

1. Après avoir créé le webhook, cliquez dessus
2. Dans la section **Signing secret**, cliquez sur **Reveal**
3. Copiez le secret (commence par `whsec_...`)
4. Ajoutez-le dans votre `.env.local` :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 3. Ajouter la clé SERVICE_ROLE de Supabase

Pour que le webhook puisse mettre à jour la base de données, vous devez ajouter la clé SERVICE_ROLE de Supabase :

1. Allez dans votre **Dashboard Supabase** > **Settings** > **API**
2. Dans la section **Project API keys**, copiez la clé **`service_role` `secret`**
3. ⚠️ **IMPORTANT** : Cette clé est très sensible, ne l'exposez jamais côté client !
4. Ajoutez-la dans votre `.env.local` :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 4. Tester le webhook en local (optionnel)

Pour tester le webhook en développement local, utilisez Stripe CLI :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter à votre compte Stripe
stripe login

# Forwarder les webhooks vers votre serveur local
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Cette commande affichera le webhook secret à utiliser en développement (commence par `whsec_...`).

## 📚 Documentation Stripe

- [Documentation Stripe Node.js](https://stripe.com/docs/api/node)
- [Guide des abonnements](https://stripe.com/docs/billing/subscriptions/overview)
- [Webhooks Stripe](https://stripe.com/docs/webhooks)

