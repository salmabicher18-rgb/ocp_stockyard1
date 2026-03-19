# 🇫🇷 Guide Complet de Migration — OCP Stockyard
## Du Cloud vers Node.js + PostgreSQL (en local sur votre PC)

> **Ce guide est fait pour quelqu'un qui n'a AUCUNE expérience en développement.**  
> Suivez chaque étape dans l'ordre, sans en sauter aucune.

---

## 📋 Table des matières

1. [Ce que vous allez faire](#1--ce-que-vous-allez-faire)
2. [Ce dont vous avez besoin](#2--ce-dont-vous-avez-besoin)
3. [Étape 1 — Installer Node.js](#3--étape-1--installer-nodejs)
4. [Étape 2 — Installer PostgreSQL](#4--étape-2--installer-postgresql)
5. [Étape 3 — Créer la base de données](#5--étape-3--créer-la-base-de-données)
6. [Étape 4 — Créer les tables](#6--étape-4--créer-les-tables)
7. [Étape 5 — Ajouter les données de test](#7--étape-5--ajouter-les-données-de-test)
8. [Étape 6 — Préparer le backend](#8--étape-6--préparer-le-backend)
9. [Étape 7 — Préparer le frontend](#9--étape-7--préparer-le-frontend)
10. [Étape 8 — Démarrer tout](#10--étape-8--démarrer-tout)
11. [Étape 9 — Vérifier que tout marche](#11--étape-9--vérifier-que-tout-marche)
12. [En cas de problème](#12--en-cas-de-problème)
13. [Structure des fichiers](#13--structure-des-fichiers)
14. [Résumé des commandes](#14--résumé-des-commandes)

---

## 1. 🎯 Ce que vous allez faire

Actuellement, votre site web utilise un service en ligne (le "Cloud") pour stocker les données.  
Après cette migration, **tout sera sur votre ordinateur** :

| Avant (Cloud) | Après (Local) |
|---|---|
| Base de données en ligne | Base de données PostgreSQL sur votre PC |
| API en ligne | Serveur Node.js sur votre PC |
| Dépend d'internet | Fonctionne sans internet |

**Le site web restera exactement le même visuellement.** Seul l'endroit où les données sont stockées change.

---

## 2. 🛠 Ce dont vous avez besoin

Avant de commencer, vous devez installer **2 logiciels gratuits** :

| Logiciel | À quoi ça sert | Lien de téléchargement |
|---|---|---|
| **Node.js** | Fait tourner le serveur backend | https://nodejs.org |
| **PostgreSQL** | La base de données | https://www.postgresql.org/download/ |

> 💡 **Optionnel mais recommandé** : Installez aussi **pgAdmin** (il vient avec PostgreSQL) — c'est un outil visuel pour voir vos données.

---

## 3. 📦 Étape 1 — Installer Node.js

### Sur Windows :

1. Allez sur **https://nodejs.org**
2. Cliquez sur le bouton vert **"LTS"** (c'est la version stable)
3. Un fichier `.msi` va se télécharger
4. **Double-cliquez** sur le fichier téléchargé
5. Cliquez **"Next"** à chaque écran (gardez tout par défaut)
6. Cliquez **"Install"**
7. Attendez que ça finisse, puis cliquez **"Finish"**

### Vérifier que ça a marché :

1. Ouvrez l'**Invite de commandes** :
   - Appuyez sur la touche **Windows** de votre clavier
   - Tapez `cmd`
   - Cliquez sur **"Invite de commandes"**
2. Dans la fenêtre noire qui s'ouvre, tapez :
   ```
   node --version
   ```
3. Appuyez sur **Entrée**
4. Vous devez voir un numéro qui s'affiche, par exemple : `v20.11.0`

✅ Si vous voyez un numéro → Node.js est installé !  
❌ Si vous voyez une erreur → Recommencez l'installation

---

## 4. 🐘 Étape 2 — Installer PostgreSQL

### Sur Windows :

1. Allez sur **https://www.postgresql.org/download/windows/**
2. Cliquez sur **"Download the installer"**
3. Choisissez la dernière version (le plus gros numéro)
4. Téléchargez le fichier `.exe`
5. **Double-cliquez** dessus pour lancer l'installation
6. Cliquez **"Next"** à chaque écran
7. ⚠️ **IMPORTANT** — À l'écran du mot de passe :
   - On vous demande un mot de passe pour l'utilisateur `postgres`
   - **Choisissez un mot de passe simple que vous n'oublierez pas**
   - Par exemple : `postgres123`
   - **NOTEZ CE MOT DE PASSE QUELQUE PART** ✏️
8. Gardez le port par défaut : **5432**
9. Continuez avec **"Next"** puis **"Install"**
10. Décochez "Launch Stack Builder" et cliquez **"Finish"**

### Vérifier que ça a marché :

1. Ouvrez l'**Invite de commandes** (comme avant)
2. Tapez :
   ```
   psql --version
   ```
3. Vous devez voir quelque chose comme : `psql (PostgreSQL) 16.2`

> ⚠️ Si `psql` n'est pas reconnu, vous devez ajouter PostgreSQL au PATH :
> 1. Cherchez "Variables d'environnement" dans la barre de recherche Windows
> 2. Cliquez sur "Variables d'environnement"
> 3. Dans "Variables système", trouvez `Path`, cliquez "Modifier"
> 4. Cliquez "Nouveau" et ajoutez : `C:\Program Files\PostgreSQL\16\bin`
> 5. Cliquez OK partout, fermez et rouvrez l'invite de commandes

---

## 5. 🗄️ Étape 3 — Créer la base de données

Maintenant on va créer une base de données vide appelée `ocp_stockyard`.

1. Ouvrez l'**Invite de commandes**
2. Connectez-vous à PostgreSQL en tapant :
   ```
   psql -U postgres
   ```
3. Il va vous demander le mot de passe → tapez celui que vous avez choisi (ex: `postgres123`)
4. Vous êtes maintenant dans PostgreSQL (vous voyez `postgres=#`)
5. Tapez cette commande pour créer la base de données :
   ```sql
   CREATE DATABASE ocp_stockyard;
   ```
6. Appuyez sur **Entrée**
7. Vous devez voir : `CREATE DATABASE`
8. Tapez `\q` puis **Entrée** pour quitter

✅ La base de données est créée !

---

## 6. 📐 Étape 4 — Créer les tables

Maintenant on va créer toutes les tables (les "tableaux" où vos données seront rangées).

1. Ouvrez l'**Invite de commandes**
2. Naviguez vers le dossier du projet. Par exemple, si votre projet est sur le Bureau :
   ```
   cd Desktop\votre-projet
   ```
3. Exécutez le fichier qui crée les tables :
   ```
   psql -U postgres -d ocp_stockyard -f backend/db/schema.sql
   ```
4. Tapez votre mot de passe PostgreSQL
5. Vous verrez plusieurs lignes de confirmation (`CREATE TABLE`, `CREATE INDEX`, etc.)

✅ Les tables sont créées !

### Qu'est-ce qui a été créé ?

| Table | Contenu |
|---|---|
| `tas_brut` | Les tas de stock brut (positions, tonnages, statut) |
| `tas_lave` | Les tas de stock lavé |
| `couches` | Les couches chimiques de chaque tas |
| `fractions` | Les fractions granulométriques de chaque couche |
| `machines` | Les machines (stackers, roue-pelles) |
| `matrices_cible` | Les matrices cibles (objectifs qualité) |
| `import_history` | L'historique des imports Excel |
| `action_history` | L'historique des actions |

---

## 7. 🌱 Étape 5 — Ajouter les données de test

Pour commencer avec des données déjà prêtes :

1. Dans l'invite de commandes (dans le dossier du projet) :
   ```
   psql -U postgres -d ocp_stockyard -f backend/db/seed.sql
   ```

✅ Les données de test sont ajoutées !

---

## 8. ⚙️ Étape 6 — Préparer le backend

### 8.1 — Créer le fichier de configuration

Le backend a besoin d'un fichier `.env` pour savoir comment se connecter à la base de données.

1. Allez dans le dossier `backend/` de votre projet
2. Vous y trouverez un fichier appelé `.env.example`
3. **Faites une copie** de ce fichier
4. **Renommez** la copie en `.env` (sans le `.example`)

   > **Comment faire sur Windows :**
   > - Clic droit sur `.env.example` → Copier
   > - Clic droit dans le même dossier → Coller
   > - Clic droit sur la copie → Renommer
   > - Tapez `.env`
   > - Windows peut vous avertir que le fichier n'aura pas d'extension → cliquez "Oui"

5. **Ouvrez** le fichier `.env` avec le Bloc-notes (clic droit → Ouvrir avec → Bloc-notes)
6. **Modifiez** la première ligne pour mettre VOTRE mot de passe PostgreSQL :

   ```
   DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/ocp_stockyard
   PORT=3001
   ```

   **Exemple** si votre mot de passe est `postgres123` :
   ```
   DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/ocp_stockyard
   PORT=3001
   ```

7. **Sauvegardez** le fichier (Ctrl+S)

### 8.2 — Installer les dépendances du backend

1. Ouvrez l'**Invite de commandes**
2. Allez dans le dossier backend :
   ```
   cd Desktop\votre-projet\backend
   ```
3. Tapez :
   ```
   npm install
   ```
4. Attendez que ça finisse (ça peut prendre 1-2 minutes)
5. Vous verrez un message avec "added XX packages"

✅ Le backend est prêt !

---

## 9. 🎨 Étape 7 — Préparer le frontend

### 9.1 — Installer les dépendances du frontend

1. Ouvrez une **NOUVELLE** invite de commandes (laissez l'autre ouverte)
2. Allez dans le dossier principal du projet :
   ```
   cd Desktop\votre-projet
   ```
3. Tapez :
   ```
   npm install
   ```
4. Attendez que ça finisse

### 9.2 — Ce qui a changé dans le code

Le fichier `src/hooks/useApiData.ts` remplace l'ancien `useSupabaseData.ts`.  
Il fait exactement la même chose, mais au lieu d'appeler le Cloud, il appelle votre serveur local.

Le fichier `vite.config.ts` a été modifié pour que le site web sache rediriger les appels API vers votre serveur local (port 3001).

**Vous n'avez rien à faire ici**, les fichiers sont déjà prêts.

---

## 10. 🚀 Étape 8 — Démarrer tout

Vous devez ouvrir **2 fenêtres d'invite de commandes** :

### Fenêtre 1 — Le backend (le serveur) :

```
cd Desktop\votre-projet\backend
npm start
```

Vous devez voir :
```
OCP Stockyard API running on port 3001
```

> ⚠️ **NE FERMEZ PAS CETTE FENÊTRE !** Le serveur doit rester allumé.

### Fenêtre 2 — Le frontend (le site web) :

```
cd Desktop\votre-projet
npm run dev
```

Vous devez voir :
```
VITE v5.x.x ready in xxx ms

➜ Local:   http://localhost:8080/
```

### Ouvrir le site :

1. Ouvrez votre navigateur web (Chrome, Firefox, Edge...)
2. Tapez dans la barre d'adresse : **http://localhost:8080**
3. Le site web doit s'afficher !

✅ **Votre application fonctionne en local !**

---

## 11. ✅ Étape 9 — Vérifier que tout marche

### Test 1 — La page s'affiche

- Ouvrez http://localhost:8080
- Vous devez voir le tableau de bord avec les tas de stock

### Test 2 — Les données se chargent

- Regardez la section "Stock Brut"
- Vous devez voir les tas de stock (s'il y en a dans la base de données)
- Si la base est vide, c'est normal au début

### Test 3 — L'API répond

- Ouvrez un nouvel onglet dans votre navigateur
- Tapez : **http://localhost:3001/api/health**
- Vous devez voir : `{"status":"ok","timestamp":"..."}`

### Test 4 — Créer un tas de stock

- Allez dans la section "Stock Brut" du site
- Cliquez sur "Ajouter un tas"
- Remplissez les champs et validez
- Le tas doit apparaître dans la liste

---

## 12. 🔧 En cas de problème

### ❌ "psql n'est pas reconnu"
→ Voir l'étape 4 pour ajouter PostgreSQL au PATH

### ❌ "FATAL: password authentication failed"
→ Vérifiez que le mot de passe dans le fichier `.env` est le même que celui de PostgreSQL

### ❌ "ECONNREFUSED" quand le backend démarre
→ PostgreSQL n'est pas démarré. Cherchez "Services" dans Windows, trouvez "postgresql" et cliquez "Démarrer"

### ❌ Le site affiche "Chargement des données..." indéfiniment
→ Vérifiez que le backend tourne bien (Fenêtre 1 affiche "API running on port 3001")

### ❌ "EADDRINUSE: address already in use"
→ Le port est déjà utilisé. Fermez les autres fenêtres d'invite de commandes et réessayez

### ❌ "npm: command not found"
→ Node.js n'est pas installé correctement. Réinstallez-le (Étape 1)

### ❌ Les données de l'ancien site ne sont pas là
→ C'est normal ! L'ancienne base (Cloud) et la nouvelle (locale) sont séparées. Utilisez l'import Excel pour ajouter vos données.

---

## 13. 📁 Structure des fichiers

Voici tous les fichiers importants et à quoi ils servent :

```
votre-projet/
├── backend/                          ← Le serveur (API)
│   ├── .env                          ← ⚠️ À CRÉER (voir Étape 6)
│   ├── .env.example                  ← Modèle pour le .env
│   ├── package.json                  ← Liste des dépendances backend
│   ├── server.js                     ← Le serveur principal
│   ├── db/
│   │   ├── pool.js                   ← Connexion à PostgreSQL
│   │   ├── schema.sql                ← Création des tables
│   │   └── seed.sql                  ← Données de test
│   └── routes/
│       ├── tasBrut.js                ← API pour les tas bruts
│       ├── tasLave.js                ← API pour les tas lavés
│       ├── couches.js                ← API pour les couches
│       ├── machines.js               ← API pour les machines
│       ├── matrices.js               ← API pour les matrices cibles
│       └── import.js                 ← API pour l'import Excel
│
├── src/                              ← Le site web (frontend)
│   ├── api/
│   │   └── client.ts                 ← Communication avec le serveur
│   ├── hooks/
│   │   └── useApiData.ts             ← ⭐ NOUVEAU : remplace useSupabaseData
│   ├── pages/
│   │   └── Index.tsx                 ← Page principale (utilise useApiData)
│   └── ...
│
├── vite.config.ts                    ← Configuration du site (avec proxy API)
└── package.json                      ← Liste des dépendances frontend
```

---

## 14. 📝 Résumé des commandes

Voici toutes les commandes à exécuter, dans l'ordre :

```bash
# 1. Créer la base de données
psql -U postgres
# → Tapez votre mot de passe
CREATE DATABASE ocp_stockyard;
\q

# 2. Créer les tables
psql -U postgres -d ocp_stockyard -f backend/db/schema.sql

# 3. (Optionnel) Ajouter des données de test
psql -U postgres -d ocp_stockyard -f backend/db/seed.sql

# 4. Créer le fichier backend/.env (copie de .env.example)
# → Modifiez le mot de passe dans le fichier

# 5. Installer les dépendances du backend
cd backend
npm install

# 6. Installer les dépendances du frontend
cd ..
npm install

# 7. Démarrer le backend (Fenêtre 1)
cd backend
npm start

# 8. Démarrer le frontend (Fenêtre 2)
cd ..
npm run dev

# 9. Ouvrir le navigateur → http://localhost:8080
```

---

## 🎉 Félicitations !

Votre application fonctionne maintenant **entièrement sur votre ordinateur**, sans dépendre d'aucun service en ligne.

### Pour la prochaine fois que vous voulez utiliser l'application :

1. Ouvrez une invite de commandes → `cd Desktop\votre-projet\backend` → `npm start`
2. Ouvrez une autre invite de commandes → `cd Desktop\votre-projet` → `npm run dev`
3. Ouvrez http://localhost:8080

> 💡 **PostgreSQL démarre automatiquement avec Windows**, vous n'avez pas besoin de le relancer.
