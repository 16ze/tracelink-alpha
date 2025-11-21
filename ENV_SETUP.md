# 🔐 Configuration des Variables d'Environnement

## 📋 Fichier `.env.local`

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```bash
# URL de votre projet Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Clé anonyme (publique) de votre projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 🔍 Où trouver ces valeurs dans Supabase ?

### 1. **NEXT_PUBLIC_SUPABASE_URL**

1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet TraceLink
4. Allez dans **Settings** (⚙️) dans le menu de gauche
5. Cliquez sur **API** dans le sous-menu
6. Dans la section **Project URL**, copiez l'URL
   - Format : `https://xxxxxxxxxxxxx.supabase.co`

### 2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**

1. Toujours dans **Settings > API**
2. Dans la section **Project API keys**
3. Copiez la clé **`anon` `public`**
   - C'est une clé longue qui commence généralement par `eyJ...`
   - ⚠️ Cette clé est publique et peut être exposée côté client

## 📝 Exemple de fichier `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5OTk5OTk5OSwiZXhwIjoyMDk5OTk5OTk5fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## ⚠️ Sécurité

- ✅ Le fichier `.env.local` est automatiquement ignoré par Git (déjà dans `.gitignore`)
- ✅ Les variables `NEXT_PUBLIC_*` sont accessibles côté client (c'est normal pour ces clés)
- ❌ Ne partagez jamais vos clés publiquement
- ❌ Ne commitez jamais le fichier `.env.local`

## 🧪 Vérification

Pour vérifier que vos variables sont bien chargées, vous pouvez lancer :

```bash
npm run dev
```

Le serveur de développement devrait démarrer sans erreur si les variables sont correctement configurées.
