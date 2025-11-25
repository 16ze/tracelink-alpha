# Installation de Stripe CLI

## 🚨 Problème rencontré

L'installation automatique via Homebrew nécessite des Command Line Tools à jour, et le package npm `stripe-cli` n'est pas le bon outil.

## ✅ Solutions d'installation

### Option 1 : Mettre à jour Command Line Tools puis utiliser Homebrew (Recommandé)

```bash
# 1. Mettre à jour les Command Line Tools
sudo rm -rf /Library/Developer/CommandLineTools
sudo xcode-select --install

# 2. Attendre la fin de l'installation, puis installer Stripe CLI
brew install stripe/stripe-cli/stripe
```

### Option 2 : Installation manuelle via téléchargement direct

1. Visitez la page des releases GitHub : https://github.com/stripe/stripe-cli/releases
2. Téléchargez la dernière version pour macOS (arm64 pour Apple Silicon, amd64 pour Intel)
3. Extrayez l'archive :
   ```bash
   tar -xzf stripe_*.tar.gz
   ```
4. Déplacez le binaire dans votre PATH :
   ```bash
   sudo mv stripe /usr/local/bin/stripe
   sudo chmod +x /usr/local/bin/stripe
   ```

### Option 3 : Installation via le script officiel

```bash
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

## 🔍 Vérification de l'installation

Une fois installé, vérifiez que Stripe CLI fonctionne :

```bash
stripe --version
```

Vous devriez voir quelque chose comme : `stripe version 1.x.x`

## 🔐 Configuration initiale

Après l'installation, connectez-vous à votre compte Stripe :

```bash
stripe login
```

Cela ouvrira votre navigateur pour vous authentifier.

## 🧪 Tester le webhook en local

Une fois Stripe CLI installé et configuré, vous pouvez tester votre webhook en local :

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Cette commande :
- Écoute les événements Stripe
- Les forward vers votre serveur local
- Affiche le webhook secret à utiliser (commence par `whsec_...`)

Ajoutez ce secret dans votre `.env.local` pour les tests locaux :

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📚 Documentation

- [Documentation officielle Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Guide des webhooks en local](https://stripe.com/docs/stripe-cli/webhooks)








