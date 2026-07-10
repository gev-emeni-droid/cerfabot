# CerfaBot

CerfaBot est une application web d'automatisation et de remplissage intelligent de formulaires Cerfa (PDF) utilisant l'IA.

## 1. Guide d'installation

**Prérequis :**
- Node.js (version 18 ou supérieure recommandée)
- npm ou yarn

**Étapes d'installation :**
1. Clonez le dépôt sur votre machine locale.
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Copiez le fichier d'environnement et complétez-le :
   ```bash
   cp .env.example .env
   ```
4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
L'application sera accessible sur `http://localhost:3000` (par défaut).

## 2. Guide de déploiement

Le projet est configuré pour être déployé sur **Cloudflare Pages**.
1. Connectez votre dépôt GitHub à votre compte Cloudflare Pages.
2. Configurez les paramètres de build :
   - Build command : `npm run build`
   - Build output directory : `dist`
3. Renseignez les variables d'environnement dans le dashboard Cloudflare Pages.
4. Les déploiements se feront automatiquement à chaque push sur la branche `main`.

*Alternative en CLI avec Wrangler :*
```bash
npm run build
npx wrangler pages deploy dist
```

## 3. Schéma d'infrastructure

- **Frontend (UI) :** React.js + Vite + TailwindCSS, hébergé sur Cloudflare Pages.
- **Manipulation PDF :** Traitement natif dans le navigateur via `pdf-lib` et `PDF.js` pour des raisons de confidentialité (les fichiers utilisateurs ne quittent pas le navigateur).
- **Logique Métier (Backend) :** Conçu pour un couplage avec Cloudflare Workers (proxying des requêtes IA sécurisées).
- **Intelligence Artificielle :** Modèle LLM externe appelé pour extraire et structurer la donnée depuis le texte vers le JSON attendu par les champs PDF.

## 4. Manuel de maintenance

- **Sauvegardes (BDD) :** Actuellement, le système est purement client (Stateless) et ne stocke aucune donnée utilisateur. Si une base de données est ajoutée, une politique de backup automatique (ex: snapshots quotidiens) devra être intégrée.
- **Crash Critique :** En cas d'indisponibilité, vérifiez les statuts de déploiement Cloudflare Pages via le dashboard et consultez les logs d'erreurs (Sentry ou Cloudflare logs) pour identifier la source du problème.
