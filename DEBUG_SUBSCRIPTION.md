# 🔍 Guide de Diagnostic - Problème de Statut d'Abonnement

## Problème
Après un paiement Stripe réussi, l'utilisateur reste en plan "Gratuit" dans l'application au lieu de passer en plan "Pro".

## ✅ Corrections Appliquées

### 1. Webhook Stripe Amélioré (`app/api/webhooks/stripe/route.ts`)
- ✅ Utilisation de `supabaseAdmin` avec `SUPABASE_SERVICE_ROLE_KEY` pour contourner RLS
- ✅ Logs très détaillés à chaque étape :
  - `🔔 [WEBHOOK] Réception d'un événement Stripe`
  - `✅ [WEBHOOK] Signature validée`
  - `💰 [WEBHOOK] Événement checkout.session.completed détecté`
  - `🔍 [WEBHOOK] Recherche de la marque dans Supabase`
  - `✅ [WEBHOOK] Marque trouvée`
  - `🔄 [WEBHOOK] Tentative de mise à jour`
  - `✅ [WEBHOOK] Mise à jour réussie!`

### 2. Rafraîchissement du Cache (`app/[locale]/dashboard/page.tsx`)
- ✅ `revalidatePath` appelé automatiquement après détection du paiement réussi
- ✅ Logs de confirmation :
  - `🔄 [DASHBOARD] Paiement réussi détecté, revalidation du cache...`
  - `✅ [DASHBOARD] Cache revalidé avec succès`

### 3. Route API de Debug (`/api/debug-subscription`)
- ✅ Nouvelle route pour vérifier le statut réel dans la base de données
- ✅ Compare les données via RLS et via Admin
- ✅ Diagnostic automatique du problème

## 📋 Procédure de Diagnostic

### Étape 1 : Vérifier les Logs du Webhook

1. Ouvre ton terminal Stripe CLI (si tu l'utilises) ou la console Vercel/server
2. Déclenche un nouveau paiement de test
3. Cherche dans les logs :
   ```
   ✅ [WEBHOOK] Signature validée
   💰 [WEBHOOK] Événement checkout.session.completed détecté
   🔍 [WEBHOOK] Brand ID extrait: <UUID>
   ✅ [WEBHOOK] Marque trouvée
   ✅ [WEBHOOK] Mise à jour réussie!
   ```

**Si tu ne vois PAS ces logs :**
- ❌ Le webhook n'est pas configuré correctement dans Stripe Dashboard
- Solution : Vérifie l'URL du webhook et le secret dans `.env.local`

**Si tu vois une erreur `❌ [WEBHOOK]` :**
- ❌ Problème de mise à jour en base
- Solution : Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien configurée

### Étape 2 : Utiliser la Route de Debug

1. Connecte-toi à ton application
2. Accède à : `http://localhost:3000/api/debug-subscription`
3. Tu verras un JSON détaillé avec :

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "user": {
    "id": "...",
    "email": "..."
  },
  "brand_via_rls": {
    "found": true,
    "data": { /* ta marque */ }
  },
  "brand_via_admin": {
    "found": true,
    "data": { /* ta marque */ }
  },
  "subscription_status": {
    "via_rls": "active",
    "via_admin": "active",
    "match": true
  },
  "stripe_data": {
    "customer_id": "cus_...",
    "subscription_id": "sub_..."
  },
  "diagnosis": [
    "✅ Le statut est 'active' dans la DB et accessible correctement",
    "💡 Si l'interface affiche 'Gratuit', le problème est côté cache/frontend"
  ]
}
```

### Étape 3 : Interpréter les Résultats

#### ✅ **Cas 1 : Statut "active" en DB mais "Gratuit" affiché**
```json
"subscription_status": {
  "via_rls": "active",
  "via_admin": "active",
  "match": true
}
```
**Diagnostic :** Le webhook a bien fonctionné, mais le cache Next.js n'a pas été rafraîchi.

**Solutions :**
1. Force un refresh complet : `Ctrl+Shift+R` (ou `Cmd+Shift+R` sur Mac)
2. Déconnecte-toi et reconnecte-toi
3. Accède à : `/?success=true` pour forcer la revalidation

---

#### ❌ **Cas 2 : Pas de données Stripe en DB**
```json
"stripe_data": {
  "customer_id": null,
  "subscription_id": null
}
```
**Diagnostic :** Le webhook Stripe n'a jamais été reçu ou traité.

**Solutions :**
1. Vérifie que le webhook est bien configuré dans Stripe Dashboard
2. URL doit être : `https://ton-domaine.vercel.app/api/webhooks/stripe`
3. Événement activé : `checkout.session.completed`
4. Secret webhook correctement configuré dans `.env.local`

---

#### ❌ **Cas 3 : Données Stripe en DB mais statut pas à jour**
```json
"subscription_status": {
  "via_rls": null,
  "via_admin": null
},
"stripe_data": {
  "customer_id": "cus_...",
  "subscription_id": "sub_..."
}
```
**Diagnostic :** Le webhook a partiellement échoué (stripe_customer_id enregistré mais pas le statut).

**Solutions :**
1. Vérifie les logs du webhook pour voir l'erreur exacte
2. Possible problème de RLS (Row Level Security) sur la table `brands`
3. Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien la Service Role Key (pas l'Anon Key)

---

#### ⚠️ **Cas 4 : Incohérence RLS vs Admin**
```json
"subscription_status": {
  "via_rls": null,
  "via_admin": "active",
  "match": false
}
```
**Diagnostic :** Problème de permissions RLS ou cache Supabase.

**Solutions :**
1. Vérifie les politiques RLS sur la table `brands`
2. L'utilisateur doit pouvoir lire sa propre marque via `owner_id = auth.uid()`
3. Essaie de te déconnecter/reconnecter

## 🛠️ Actions Manuelles de Dépannage

### Forcer la mise à jour manuelle en DB
Si tout le reste échoue, tu peux mettre à jour manuellement le statut dans Supabase :

1. Va sur Supabase Dashboard → Table Editor → `brands`
2. Trouve ta marque (filtre par `owner_id` = ton user ID)
3. Modifie `subscription_status` → `active`
4. Sauvegarde
5. Retourne sur l'app et force un refresh (`Ctrl+Shift+R`)

### Vérifier les Variables d'Environnement
Assure-toi d'avoir dans `.env.local` :
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # ⚠️ CRITIQUE pour le webhook
```

## 📞 Support

Si le problème persiste après ces étapes :
1. Copie le JSON de `/api/debug-subscription`
2. Copie les logs du webhook (si disponibles)
3. Note les étapes exactes pour reproduire le problème

## 🎯 Checklist Finale

- [ ] Webhook Stripe configuré avec la bonne URL
- [ ] Secret webhook (`STRIPE_WEBHOOK_SECRET`) correct
- [ ] `SUPABASE_SERVICE_ROLE_KEY` définie (pas l'Anon Key)
- [ ] Logs du webhook montrent `✅ Mise à jour réussie`
- [ ] `/api/debug-subscription` montre `"subscription_status": "active"`
- [ ] Cache navigateur vidé (`Ctrl+Shift+R`)
- [ ] Reconnexion effectuée

Si tous les points sont ✅ mais le problème persiste, c'est probablement un problème de cache Next.js côté serveur. Dans ce cas, redéploie l'application sur Vercel/ton hébergeur.




