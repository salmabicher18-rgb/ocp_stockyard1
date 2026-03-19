# 📖 Guide Complet — Explication du Code du Projet OCP Stockyard

> Ce guide explique **tout le code** du projet, fichier par fichier, ligne par ligne.
> Il est rédigé pour quelqu'un qui n'a **aucune formation en développement logiciel**.

---

## 📑 Table des Matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Comment le projet est organisé (structure des dossiers)](#2-structure-des-dossiers)
3. [Fichiers de configuration](#3-fichiers-de-configuration)
4. [Le point d'entrée de l'application](#4-le-point-dentrée)
5. [Le client API (communication frontend ↔ backend)](#5-le-client-api)
6. [Le hook de données (useApiData)](#6-le-hook-de-données)
7. [Les types et données (mockData)](#7-les-types-et-données)
8. [Les pages principales](#8-les-pages-principales)
9. [Les sections (Dashboard, Stock Brut, etc.)](#9-les-sections)
10. [Le Backend (serveur Node.js)](#10-le-backend)
11. [La Base de Données (PostgreSQL)](#11-la-base-de-données)
12. [Les routes API du backend](#12-les-routes-api)
13. [Les styles (CSS)](#13-les-styles-css)
14. [Résumé du flux complet](#14-résumé-du-flux-complet)

---

## 1. Vue d'ensemble du projet

### Qu'est-ce que ce projet ?

C'est un **site web** pour gérer le parc de stockage (stockyard) de phosphate de l'OCP. Il permet de :

- **Voir les tas de phosphate** (bruts et lavés) dans un dashboard visuel
- **Ajouter/modifier/supprimer** des tas et leurs couches (layers)
- **Importer des données** depuis des fichiers Excel
- **Suivre les machines** (stackers et roue-pelles)
- **Vérifier la conformité** chimique des tas par rapport aux matrices cibles
- **Consulter l'historique** des opérations

### Comment ça marche ?

Le projet est divisé en **2 parties** :

```
┌────────────────────┐         ┌────────────────────┐         ┌──────────────┐
│    FRONTEND        │  HTTP   │    BACKEND          │  SQL    │  BASE DE     │
│  (React - ce que   │ ──────> │  (Node.js/Express   │ ──────> │  DONNÉES     │
│   l'utilisateur    │ <────── │   - traite les      │ <────── │  (PostgreSQL │
│   voit dans le     │         │   demandes)         │         │   - stocke   │
│   navigateur)      │         │                     │         │   les données)│
└────────────────────┘         └────────────────────┘         └──────────────┘
     Port 8080                      Port 3001                    Port 5432
```

1. **Le Frontend** (dossier `src/`) : c'est ce que l'utilisateur voit dans son navigateur — les tableaux, les boutons, les graphiques
2. **Le Backend** (dossier `backend/`) : c'est le "cerveau" qui reçoit les demandes du frontend et les transmet à la base de données
3. **La Base de Données** (PostgreSQL) : c'est où toutes les données sont stockées de façon permanente

---

## 2. Structure des dossiers

```
projet/
├── backend/                    ← Le serveur (partie invisible)
│   ├── server.js               ← Le fichier principal du serveur
│   ├── db/
│   │   ├── pool.js             ← La connexion à la base de données
│   │   ├── schema.sql          ← La structure des tables
│   │   └── seed.sql            ← Des données de test
│   ├── routes/
│   │   ├── tasBrut.js          ← Routes pour les tas bruts
│   │   ├── tasLave.js          ← Routes pour les tas lavés
│   │   ├── couches.js          ← Routes pour les couches
│   │   ├── machines.js         ← Routes pour les machines
│   │   ├── matrices.js         ← Routes pour les matrices cibles
│   │   └── import.js           ← Routes pour l'importation Excel
│   ├── package.json            ← Liste des librairies du backend
│   └── .env                    ← Variables secrètes (mot de passe DB, etc.)
│
├── src/                        ← Le frontend (partie visible)
│   ├── main.tsx                ← Point de démarrage de React
│   ├── App.tsx                 ← Le routeur principal
│   ├── index.css               ← Les styles visuels (couleurs, polices)
│   ├── api/
│   │   └── client.ts           ← Le "messager" qui parle au backend
│   ├── hooks/
│   │   └── useApiData.ts       ← Le chargeur de données
│   ├── data/
│   │   └── mockData.ts         ← Les types + données de test + calculs
│   ├── pages/
│   │   ├── Landing.tsx          ← La page d'accueil
│   │   ├── Index.tsx            ← La page principale (dashboard)
│   │   ├── NotFound.tsx         ← Page "404 - page introuvable"
│   │   └── sections/
│   │       ├── DashboardSection.tsx    ← Section dashboard
│   │       ├── RawStockSection.tsx     ← Section stock brut
│   │       ├── WashedStockSection.tsx  ← Section stock lavé
│   │       ├── DatabaseSection.tsx     ← Section base de données
│   │       ├── MachinesSection.tsx     ← Section machines
│   │       ├── TargetMatrixSection.tsx ← Section matrices cibles
│   │       ├── ImportSection.tsx       ← Section import Excel
│   │       └── HistorySection.tsx      ← Section historique
│   ├── components/
│   │   ├── Header.tsx           ← La barre du haut
│   │   ├── Sidebar.tsx          ← Le menu de gauche
│   │   ├── stockyard/           ← Composants visuels du stockyard
│   │   └── ui/                  ← Composants de base (boutons, etc.)
│   └── assets/                  ← Images (logo OCP, etc.)
│
├── public/                     ← Fichiers publics
│   └── favicon.png             ← L'icône de l'onglet du navigateur
│
├── index.html                  ← La page HTML de base
├── package.json                ← Liste des librairies du frontend
├── vite.config.ts              ← Configuration de l'outil de développement
└── tailwind.config.ts          ← Configuration des styles
```

---

## 3. Fichiers de configuration

### `index.html` — La page HTML de base

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <!-- ↑ Indique au navigateur que le texte utilise l'encodage UTF-8
         (pour supporter les accents français, les caractères spéciaux, etc.) -->

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- ↑ Rend le site responsive (s'adapte aux téléphones, tablettes, etc.) -->

    <title>OCP Stockyard Management System</title>
    <!-- ↑ Le texte qui apparaît dans l'onglet du navigateur -->

    <meta name="description" content="Système de gestion de parc de stockage OCP" />
    <!-- ↑ Description du site pour les moteurs de recherche (Google) -->

    <meta name="author" content="OCP Group" />
    <!-- ↑ L'auteur du site -->

    <link rel="icon" href="/favicon.png" type="image/png" />
    <!-- ↑ L'icône qui apparaît dans l'onglet du navigateur (le logo OCP) -->
  </head>

  <body>
    <div id="root"></div>
    <!-- ↑ C'est ici que React va injecter toute l'application.
         Au départ c'est vide, React le remplit automatiquement -->

    <script type="module" src="/src/main.tsx"></script>
    <!-- ↑ Charge le fichier principal de l'application React -->
  </body>
</html>
```

**En résumé** : Ce fichier est le squelette HTML. Il contient juste une `<div>` vide que React va remplir avec tout le contenu de l'application.

---

### `package.json` — Les librairies du projet

```json
{
  "name": "vite_react_shadcn_ts",    // Nom interne du projet
  "private": true,                    // Le projet n'est pas publié sur npm
  "version": "0.0.0",                // Numéro de version
  "type": "module",                   // Utilise les imports modernes (ES modules)

  "scripts": {
    "dev": "vite",                    // Commande pour lancer le serveur de développement
    "build": "vite build",            // Commande pour créer la version finale
    "preview": "vite preview",        // Commande pour prévisualiser la version finale
    "test": "vitest run"              // Commande pour lancer les tests
  },

  "dependencies": {
    "react": "^18.3.1",               // La librairie principale pour créer l'interface
    "react-dom": "^18.3.1",           // Permet d'afficher React dans le navigateur
    "react-router-dom": "^6.30.1",    // Gère la navigation entre les pages
    "xlsx": "^0.18.5",                // Permet de lire les fichiers Excel
    "recharts": "^2.15.4",            // Permet de créer des graphiques
    "lucide-react": "^0.462.0",       // Les icônes (flèches, engrenages, etc.)
    "sonner": "^1.7.4",               // Les notifications temporaires (toasts)
    "date-fns": "^3.6.0",             // Facilite le travail avec les dates
    // ... et d'autres librairies pour les composants visuels
  }
}
```

**En résumé** : Ce fichier liste toutes les librairies externes dont le projet a besoin. Quand tu tapes `npm install`, ça télécharge tout ce qui est listé ici.

---

### `vite.config.ts` — Configuration de Vite (l'outil de développement)

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",           // Écoute sur toutes les interfaces réseau
    port: 8080,           // Le frontend tourne sur le port 8080

    proxy: {
      "/api": {
        target: "http://localhost:3001",   // Redirige les appels /api vers le backend
        changeOrigin: true,
      },
    },
    // ↑ TRÈS IMPORTANT : quand le frontend appelle "/api/tas-brut",
    //   Vite le redirige vers "http://localhost:3001/api/tas-brut"
    //   C'est comme un facteur qui transmet le courrier au bon destinataire
  },

  plugins: [react()],     // Active le support de React

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // ↑ Permet d'écrire "@/components/Header" au lieu de "../../components/Header"
      //   Le "@" est un raccourci vers le dossier "src/"
    },
  },
}));
```

**En résumé** : Ce fichier configure l'outil de développement. Le point le plus important est le **proxy** : il fait le lien entre le frontend (port 8080) et le backend (port 3001).

---

## 4. Le point d'entrée

### `src/main.tsx` — Le tout premier fichier exécuté

```typescript
import { createRoot } from "react-dom/client";
// ↑ Importe la fonction qui permet de "monter" React dans la page

import App from "./App.tsx";
// ↑ Importe le composant principal de l'application

import "./index.css";
// ↑ Charge tous les styles CSS (couleurs, polices, espacements)

createRoot(document.getElementById("root")!).render(<App />);
// ↑ Trouve la <div id="root"> dans index.html
//   et y injecte le composant <App />
//   Le "!" dit à TypeScript "je suis sûr que cet élément existe"
```

**En résumé** : Ce fichier dit au navigateur "prends le composant App et affiche-le dans la div #root".

---

### `src/App.tsx` — Le routeur principal

```typescript
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Crée un gestionnaire de cache pour les requêtes réseau
const queryClient = new QueryClient();

const App = () => (
  // QueryClientProvider : fournit le cache à toute l'application
  <QueryClientProvider client={queryClient}>
    {/* TooltipProvider : permet d'afficher des bulles d'info au survol */}
    <TooltipProvider>
      {/* Toaster + Sonner : systèmes de notifications temporaires */}
      <Toaster />
      <Sonner />

      {/* BrowserRouter : gère les URLs dans le navigateur */}
      <BrowserRouter>
        <Routes>
          {/* Route "/" → la page d'accueil (Landing) */}
          <Route path="/" element={<Landing />} />

          {/* Route "/app" → le tableau de bord principal */}
          <Route path="/app" element={<Index />} />

          {/* Route "*" → toute autre URL = page 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

**En résumé** : Ce fichier est comme un **aiguilleur** :
- Si l'utilisateur va sur `/` → il voit la page d'accueil
- Si l'utilisateur va sur `/app` → il voit le dashboard
- Si l'utilisateur tape n'importe quoi d'autre → il voit "Page non trouvée"

---

## 5. Le client API

### `src/api/client.ts` — Le messager entre le frontend et le backend

```typescript
// L'adresse de base pour toutes les requêtes
const API_BASE = '/api';
// ↑ Toutes les requêtes commenceront par "/api"
//   Grâce au proxy de Vite, elles seront redirigées vers le backend

// Classe d'erreur personnalisée pour les erreurs API
class ApiError extends Error {
  status: number;   // Le code d'erreur HTTP (404, 500, etc.)
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Fonction principale qui envoie une requête au serveur
async function request<T = any>(path: string, options?: RequestInit): Promise<T> {
  // Envoie la requête HTTP
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      // ↑ Dit au serveur "je t'envoie des données au format JSON"
      ...options?.headers,
    },
  });

  // Si la réponse n'est pas OK (erreur 400, 500, etc.)
  if (!res.ok) {
    const text = await res.text();
    let message: string;
    try {
      message = JSON.parse(text).error || text;
    } catch {
      message = text;
    }
    throw new ApiError(message, res.status);
    // ↑ Lance une erreur qu'on pourra attraper plus tard
  }

  // Si tout va bien, retourne les données au format JSON
  return res.json();
}

// Exporte 4 méthodes pour les 4 types de requêtes HTTP
export const api = {
  // GET = Récupérer des données
  // Exemple : api.get("/tas-brut") → récupère tous les tas bruts
  get: <T = any>(path: string) => request<T>(path),

  // POST = Créer de nouvelles données
  // Exemple : api.post("/tas-brut", { nom_tas: "Test" }) → crée un nouveau tas
  post: <T = any>(path: string, data: any) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data) }),

  // PUT = Modifier des données existantes
  // Exemple : api.put("/tas-brut/5", { nom_tas: "Nouveau nom" }) → modifie le tas n°5
  put: <T = any>(path: string, data: any) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),

  // DELETE = Supprimer des données
  // Exemple : api.delete("/tas-brut/5") → supprime le tas n°5
  delete: <T = any>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
```

**Analogie** : Ce fichier est comme un **facteur**. Le frontend lui donne une lettre (une requête), il la livre au backend, et il revient avec la réponse.

---

## 6. Le hook de données

### `src/hooks/useApiData.ts` — Le chargeur de données

Ce fichier est le **pont** entre l'interface utilisateur et la base de données. Il :
1. Charge les données depuis le backend
2. Transforme le format de la base de données en format compréhensible par l'interface
3. Fournit des fonctions pour ajouter/modifier/supprimer des données

```typescript
import { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
// ↑ Importe le client API (le facteur) qu'on a vu au chapitre précédent

// --- Fonctions utilitaires pour convertir les données ---

// PostgreSQL renvoie parfois les nombres sous forme de texte ("123.45")
// Cette fonction les convertit en vrais nombres
function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);        // Essaie de convertir en nombre
  return isNaN(n) ? 0 : n;     // Si ça échoue, retourne 0
}

// Pareil mais retourne null au lieu de 0 si la valeur n'existe pas
function toNumOrNull(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

// --- Transformateurs : format base de données → format application ---

// Transforme un tas de la base de données en objet "Stockpile" pour l'interface
function dbTasToStockpile(tas: any, type: "raw" | "washed"): Stockpile {
  // "tas" est un objet venant de la base de données, avec les noms en français
  // On le transforme en objet avec les noms en anglais pour l'interface

  const couches: any[] = tas.couches ?? [];
  // ↑ Récupère les couches du tas (ou un tableau vide s'il n'y en a pas)

  // Transforme chaque couche de la BD en "StockLayer" pour l'interface
  const layers: StockLayer[] = couches.map((c: any) => {
    // Transforme les fractions granulométriques
    const layerFractions: GranulometricFraction[] = (c.fractions ?? []).map(
      (f: any) => ({
        tamis: f.tamis,
        poids: toNum(f.poids),           // Convertit le poids en nombre
        BPL: toNumOrNull(f.BPL),         // Convertit BPL en nombre ou null
        CO2: toNumOrNull(f.CO2),
        SiO2: toNumOrNull(f.SiO2),
        MgO: toNumOrNull(f.MgO),
        Cd: toNumOrNull(f.Cd),
      })
    );

    // Crée l'objet chimie de la couche
    const chemistry: ChemicalAnalysis = {
      BPL: toNumOrNull(c.BPL),
      CO2: toNumOrNull(c.CO2),
      SiO2: toNumOrNull(c.SiO2),
      MgO: toNumOrNull(c.MgO),
      Cd: toNumOrNull(c.Cd),
      H2O: toNumOrNull(c.H2O),
    };

    return {
      id: `couche-${c.id}`,     // Crée un identifiant unique pour la couche
      date: c.date ?? "",
      tonnage: toNum(c.tonnage),
      chemistry,
      granulometry: layerFractions.length > 0 ? layerFractions : undefined,
    } as StockLayer;
  });

  // Retourne l'objet Stockpile complet
  return {
    id: `${type}-db-${tas.id}`,      // Ex: "raw-db-5" pour le tas brut n°5
    name: tas.nom_tas,                // Le nom du tas
    type,                              // "raw" ou "washed"
    startPosition: toNum(tas.debut_m), // Position de début en mètres
    endPosition: toNum(tas.fin_m),     // Position de fin en mètres
    totalTonnage: toNum(type === "raw" ? tas.tonnage_thc : tas.tonnage_tsm),
    unit: type === "raw" ? "THC" : "TSM",
    status: tas.statut === "caracterise" ? "caracterise" : "en_cours",
    storageMode: tas.mode_stockage === "cone" ? "cone" : "chevron",
    layers,                            // Les couches transformées
    inStockyard: tas.in_stockyard !== undefined ? tas.in_stockyard : true,
    qualitySource: tas.source_name ?? undefined,
    conformite: tas.conformite ?? undefined,
  } as Stockpile;
}

// --- Le Hook principal ---

export function useApiData() {
  // useState : crée des "variables réactives"
  // Quand elles changent, l'interface se met à jour automatiquement
  const [rawStockpiles, setRawStockpiles] = useState<Stockpile[]>([]);
  const [washedStockpiles, setWashedStockpiles] = useState<Stockpile[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  // Fonction qui charge toutes les données
  const loadData = useCallback(async () => {
    setLoading(true);    // Affiche "Chargement..."
    try {
      // Charge les 3 types de données EN PARALLÈLE (en même temps)
      const [rawData, washedData, machinesData] = await Promise.all([
        api.get("/tas-brut"),       // Récupère les tas bruts
        api.get("/tas-lave"),       // Récupère les tas lavés
        api.get("/machines"),       // Récupère les machines
      ]);

      // Transforme et stocke les données
      setRawStockpiles(
        (rawData ?? []).map((t: any) => dbTasToStockpile(t, "raw"))
      );
      setWashedStockpiles(
        (washedData ?? []).map((t: any) => dbTasToStockpile(t, "washed"))
      );
      setMachines((machinesData ?? []).map(dbMachineToMachine));
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);   // Cache "Chargement..."
    }
  }, []);

  // useEffect : s'exécute automatiquement quand la page s'ouvre
  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- Fonctions CRUD (Create, Read, Update, Delete) ---

  // Ajouter un tas brut
  const addRawStockpile = async (sp) => {
    // Envoie les données au backend via une requête POST
    await api.post("/tas-brut", {
      nom_tas: sp.name,           // Traduit les noms anglais → français pour la BD
      debut_m: sp.startPosition,
      fin_m: sp.endPosition,
      tonnage_thc: sp.totalTonnage,
      mode_stockage: sp.storageMode ?? "chevron",
      statut: sp.status,
    });
    await loadData();  // Recharge les données pour voir le nouveau tas
  };

  // Supprimer un tas brut
  const deleteRawStockpile = async (id: string) => {
    const dbId = getDbId(id);    // Extrait le numéro de la BD depuis "raw-db-5" → 5
    if (dbId) {
      await api.delete(`/tas-brut/${dbId}`);
      await loadData();
    }
  };

  // ... même principe pour les autres fonctions (modifier, ajouter couche, etc.)

  // Retourne toutes les données et fonctions pour que les composants puissent les utiliser
  return {
    rawStockpiles, washedStockpiles, machines, loading,
    reload: loadData,
    addRawStockpile, deleteRawStockpile, updateRawStockpile,
    addWashedStockpile, deleteWashedStockpile, updateWashedStockpile,
    addLayer, deleteLayer, editLayer,
    deleteMachine, updateMachine,
  };
}
```

**Analogie** : Ce hook est comme un **secrétaire** :
- Il va chercher les données au backend
- Il les traduit dans un format compréhensible
- Il fournit des "formulaires" (fonctions) pour demander des modifications

---

## 7. Les types et données

### `src/data/mockData.ts` — Définition des types et calculs

Ce fichier définit **la forme des données** (les types) et contient les **formules de calcul**.

```typescript
// ─── Qu'est-ce qu'une analyse chimique ? ───
export interface ChemicalAnalysis {
  BPL: number | null;     // Teneur en BPL (phosphate)
  CO2: number | null;     // Teneur en CO2
  SiO2: number | null;    // Teneur en silice
  MgO: number | null;     // Teneur en magnésium
  Cd: number | null;      // Teneur en cadmium
  H2O?: number | null;    // Teneur en eau (optionnel)
}
// ↑ "number | null" veut dire : soit un nombre, soit "pas de valeur"
//   Le "?" après H2O veut dire que ce champ est optionnel

// ─── Qu'est-ce qu'une fraction granulométrique ? ───
export interface GranulometricFraction {
  tamis: string;          // Nom du tamis (ex: "3150", "200", "< 40")
  poids: number;          // Poids en pourcentage
  BPL: number | null;     // ... analyses chimiques par fraction
  CO2: number | null;
  SiO2: number | null;
  MgO: number | null;
  Cd: number | null;
}

// Les 5 tailles de tamis utilisées
export const TAMIS_FRACTIONS = ["3150", "200", "160", "40", "< 40"] as const;

// ─── Qu'est-ce qu'une couche (layer) ? ───
export interface StockLayer {
  id: string;                              // Identifiant unique
  date: string;                            // Date de création
  tonnage: number;                         // Tonnage en tonnes
  chemistry: ChemicalAnalysis;             // Analyses chimiques
  granulometry?: GranulometricFraction[];   // Fractions granulométriques (optionnel)
  sourceStockpile?: string;                // Tas source (pour les tas lavés)
}

// ─── Qu'est-ce qu'un tas (stockpile) ? ───
export interface Stockpile {
  id: string;                    // Ex: "raw-db-5"
  name: string;                  // Ex: "Tas Brut MPII N°1"
  type: "raw" | "washed";       // Brut ou Lavé
  startPosition: number;        // Position début en mètres (sur la ligne)
  endPosition: number;          // Position fin en mètres
  totalTonnage: number;         // Tonnage total
  unit: string;                 // "THC" pour brut, "TSM" pour lavé
  status: "en_cours" | "caracterise";  // Statut du tas
  storageMode?: "chevron" | "cone";    // Mode de stockage
  layers: StockLayer[];         // Liste de toutes les couches
  qualitySource?: string;       // Source qualité (pour les tas lavés)
  averageChemistry?: ChemicalAnalysis; // Chimie moyenne (pré-calculée)
  inStockyard: boolean;         // Est-ce que le tas est dans le parc ?
}

// ─── Qu'est-ce qu'une machine ? ───
export interface Machine {
  id: string;                    // Ex: "machine-db-1"
  name: string;                  // Ex: "ST110"
  type: "stacker" | "reclaimer"; // Stacker (empile) ou Roue-Pelle (décharge)
  position: number;              // Position sur la ligne en mètres
  line: "raw" | "washed";       // Ligne brut ou lavé
  active: boolean;               // Machine active ou non
  dateAdded?: string;            // Date d'ajout
  associatedStockpile?: string;  // Tas actuellement associé
}

// ─── Formules de calcul ───

// Moyenne pondérée des fractions granulométriques d'une couche
// Formule : SUMPRODUCT(poids, paramètre) / SUM(poids)
export function calculateLayerWeightedAvg(granulometry) {
  const totalPoids = granulometry.reduce((sum, g) => sum + g.poids, 0);
  // ↑ Calcule le poids total : somme de tous les poids

  if (totalPoids === 0) return { BPL: null, CO2: null, ... };
  // ↑ Si le poids total est 0, on ne peut pas diviser

  // Pour chaque paramètre chimique :
  // (poids1 × BPL1 + poids2 × BPL2 + ...) / (poids1 + poids2 + ...)
  const avg = (key) => {
    const sum = granulometry.reduce((s, g) =>
      s + (g[key] != null ? g[key] * g.poids : 0), 0
    );
    return Math.round((sum / totalPoids) * 100) / 100;
    // ↑ Arrondi à 2 décimales
  };

  return { BPL: avg("BPL"), CO2: avg("CO2"), SiO2: avg("SiO2"), ... };
}

// Moyenne pondérée par tonnage (pour un tas entier)
// Formule : SUMPRODUCT(tonnage, paramètre) / SUM(tonnage)
export function calculateWeightedAverage(layers) {
  const totalTonnage = layers.reduce((sum, l) => sum + l.tonnage, 0);

  const avg = (key) => {
    // Prend seulement les couches qui ont une valeur pour ce paramètre
    const validLayers = layers.filter(l => l.chemistry[key] != null);
    if (validLayers.length === 0) return null;

    // (tonnage1 × BPL1 + tonnage2 × BPL2 + ...) / (tonnage1 + tonnage2 + ...)
    const weightedSum = validLayers.reduce(
      (sum, l) => sum + l.chemistry[key] * l.tonnage, 0
    );
    const validTonnage = validLayers.reduce((sum, l) => sum + l.tonnage, 0);
    return Math.round((weightedSum / validTonnage) * 100) / 100;
  };

  return { BPL: avg("BPL"), CO2: avg("CO2"), ... };
}
```

**En résumé** : Ce fichier dit "voici à quoi ressemblent les données" et "voici comment calculer les moyennes".

---

## 8. Les pages principales

### `src/pages/Landing.tsx` — La page d'accueil

C'est la première chose que l'utilisateur voit quand il ouvre le site.

```typescript
const Landing = () => {
  const navigate = useNavigate();
  // ↑ Fonction qui permet de naviguer vers une autre page

  return (
    <div>
      {/* Barre de navigation en haut */}
      <nav>
        <img src={ocpLogo} alt="OCP" />        {/* Logo OCP */}
        <span>Stockyard Management</span>       {/* Titre */}
        <Button onClick={() => navigate("/app")}>Get Started</Button>
        {/* ↑ Bouton qui amène au dashboard quand on clique */}
      </nav>

      {/* Section héro avec l'image de fond */}
      <section>
        <img src={heroImage} />                 {/* Photo du stockyard */}
        <h1>Stockyard Management System</h1>    {/* Grand titre */}
        <p>A comprehensive platform...</p>      {/* Description */}
        <Button onClick={() => navigate("/app")}>Get Started</Button>
      </section>

      {/* Section "À propos" */}
      <section id="about">
        <h2>Built for industrial excellence</h2>
        <p>Description du système...</p>
      </section>

      {/* Section des fonctionnalités */}
      <section>
        {features.map(feature => (
          <div>
            <feature.icon />                    {/* Icône */}
            <h3>{feature.title}</h3>            {/* Titre */}
            <p>{feature.description}</p>        {/* Description */}
          </div>
        ))}
      </section>

      {/* Pied de page */}
      <footer>
        <span>OCP Stockyard v1.0 — 2026</span>
      </footer>
    </div>
  );
};
```

---

### `src/pages/Index.tsx` — La page principale (Dashboard)

C'est la page la plus importante. Elle contient le **menu latéral** et affiche la **section active**.

```typescript
const Index = () => {
  // Quelle section est active ? Par défaut : "dashboard"
  const [activeSection, setActiveSection] = useState("dashboard");

  // Les matrices cibles (données locales, pas en base)
  const [matrices, setMatrices] = useState<TargetMatrix[]>(initialMatrices);

  // Charge TOUTES les données depuis le backend
  const {
    rawStockpiles,          // Les tas bruts
    washedStockpiles,       // Les tas lavés
    machines,               // Les machines
    loading,                // Est-ce que ça charge encore ?
    reload,                 // Fonction pour recharger
    addRawStockpile,        // Fonction pour ajouter un tas brut
    deleteRawStockpile,     // Fonction pour supprimer un tas brut
    // ... toutes les autres fonctions CRUD
  } = useApiData();

  return (
    <div className="h-screen flex flex-col">
      {/* La barre du haut avec le logo */}
      <Header />

      <div className="flex flex-1">
        {/* Le menu de gauche */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          // ↑ Quand on clique sur un élément du menu,
          //   ça change la section active
        />

        {/* Le contenu principal (à droite) */}
        <main>
          {loading ? (
            // Si les données chargent, affiche un spinner
            <Loader2 className="animate-spin" />
          ) : (
            <>
              {/* Affiche la section correspondant au menu sélectionné */}
              {activeSection === "dashboard" && (
                <DashboardSection
                  rawStockpiles={rawStockpiles}
                  washedStockpiles={washedStockpiles}
                  machines={machines}
                  matrices={matrices}
                />
              )}
              {activeSection === "raw" && (
                <RawStockSection stockpiles={rawStockpiles} ... />
              )}
              {activeSection === "washed" && (
                <WashedStockSection stockpiles={washedStockpiles} ... />
              )}
              {activeSection === "database" && (
                <DatabaseSection ... />
              )}
              {activeSection === "import" && (
                <ImportSection onImportComplete={reload} />
                {/* ↑ Après un import, recharge les données */}
              )}
              {/* ... etc pour les autres sections */}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
```

**En résumé** : Cette page est le **conteneur principal**. Elle a un header en haut, un menu à gauche, et affiche la section choisie à droite.

---

## 9. Les sections

### `DashboardSection.tsx` — Le tableau de bord

Affiche :
- **4 cartes résumé** : tonnage brut total, tonnage lavé total, machines actives, alertes conformité
- **Visualisation graphique** des tas sur les deux lignes (brut et lavé)
- **Vérification de conformité** : compare les moyennes chimiques aux matrices cibles

```typescript
// Calcule quels tas ne sont PAS conformes
const getNonConformStockpiles = (): string[] => {
  const nonConform: string[] = [];

  for (const sp of allStockpiles) {
    const avg = calculateWeightedAverage(sp.layers);
    // ↑ Calcule la moyenne pondérée de toutes les couches

    if (sp.type === "raw") {
      // Pour un tas BRUT : compare au "profil demandé"
      // BPL doit être >= seuil, MgO/SiO2/Cd doivent être <= seuil
      if (avg.BPL < target.profileDemande.BPL) → non conforme
    } else {
      // Pour un tas LAVÉ : compare au "produit fini"
      // Ex: BPL > 63, CO2 < 6.5, etc.
    }
  }
  return nonConform;
};
```

---

### `RawStockSection.tsx` — Gestion du stock brut

Permet de :
- **Voir tous les tas bruts** dans un tableau
- **Ajouter** un nouveau tas (nom, positions, tonnage, mode, statut)
- **Modifier** un tas existant
- **Supprimer** un tas (avec confirmation)
- **Archiver** un tas (le retirer du stockyard visuel)

---

### `DatabaseSection.tsx` — La base de données des couches

Affiche toutes les **couches** de tous les tas, avec :
- Les analyses chimiques (BPL, CO2, SiO2, MgO, Cd, H2O)
- Les fractions granulométriques (cliquables pour développer)
- Des boutons modifier/supprimer pour chaque couche
- Un formulaire pour ajouter une nouvelle couche

---

### `ImportSection.tsx` — L'import de fichiers Excel

Le processus d'import :

```
1. L'utilisateur choisit un fichier Excel (.xlsx)
   ↓
2. Le frontend lit le fichier avec la librairie "xlsx"
   ↓
3. Il cherche 3 feuilles : "TAS_BRUT", "TAS_FINI/TAS_LAVE", "MACHINES"
   ↓
4. Pour chaque feuille, il parse les données ligne par ligne :
   - Pour les tas bruts : nom, positions, couches, fractions
   - Pour les tas lavés : nom, positions, couches, chimie
   - Pour les machines : nom, type, ligne, position
   ↓
5. Il envoie les données au backend via 3 requêtes POST :
   - POST /api/import/brut   → pour les tas bruts
   - POST /api/import/lave   → pour les tas lavés
   - POST /api/import/machines → pour les machines
   ↓
6. Le backend fait un "upsert" (crée ou met à jour) dans PostgreSQL
   ↓
7. L'interface se rafraîchit pour afficher les nouvelles données
```

---

### `HistorySection.tsx` — L'historique

Permet de sélectionner une **date passée** et de voir l'état du stockyard à cette date :
- Filtre les couches qui ont une date ≤ la date sélectionnée
- Recalcule les tonnages et les moyennes chimiques
- Affiche le dashboard tel qu'il était à cette date

---

## 10. Le Backend

### `backend/server.js` — Le serveur principal

```javascript
require('dotenv').config();
// ↑ Charge les variables d'environnement depuis le fichier .env
//   (contient DATABASE_URL, le mot de passe de la BD, etc.)

const express = require('express');
// ↑ Express est un framework pour créer des serveurs web en Node.js

const cors = require('cors');
// ↑ CORS permet au frontend de communiquer avec le backend
//   (nécessaire quand frontend et backend sont sur des ports différents)

const helmet = require('helmet');
// ↑ Helmet ajoute des protections de sécurité automatiques

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware (traitements appliqués à CHAQUE requête) ---
app.use(helmet());                          // Sécurité
app.use(cors());                            // Autorise les requêtes cross-origin
app.use(express.json({ limit: '10mb' }));   // Parse le JSON des requêtes

// --- Routes (quelles URLs le serveur accepte) ---
app.use('/api/tas-brut', tasBrutRoutes);    // Tout ce qui commence par /api/tas-brut
app.use('/api/tas-lave', tasLaveRoutes);     // /api/tas-lave
app.use('/api/couches', couchesRoutes);      // /api/couches
app.use('/api/machines', machinesRoutes);     // /api/machines
app.use('/api/matrices', matricesRoutes);     // /api/matrices
app.use('/api/import', importRoutes);         // /api/import

// Route de santé (pour vérifier que le serveur tourne)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Démarre le serveur
app.listen(PORT, () => {
  console.log(`OCP Stockyard API running on port ${PORT}`);
});
```

**Analogie** : Le serveur est comme un **standard téléphonique** :
- Il reçoit des appels (requêtes HTTP)
- Il les redirige vers le bon service (route)
- Le service traite la demande et renvoie une réponse

---

### `backend/db/pool.js` — La connexion à PostgreSQL

```javascript
const { Pool } = require('pg');
// ↑ Importe le module PostgreSQL pour Node.js

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ↑ L'URL de connexion à la base de données
  //   Format : postgresql://utilisateur:motdepasse@localhost:5432/nom_bd
  //   Stockée dans le fichier .env pour la sécurité

  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  // ↑ En production, utilise SSL (connexion sécurisée)
  //   En développement, pas besoin
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // ↑ Si la connexion à la BD est coupée, affiche l'erreur
});

module.exports = pool;
// ↑ Exporte le pool pour que les routes puissent l'utiliser
```

**Analogie** : Le pool est comme une **file d'attente** de connexions à la base de données. Au lieu d'ouvrir une nouvelle connexion à chaque requête (lent), il garde des connexions ouvertes et les réutilise.

---

## 11. La Base de Données

### `backend/db/schema.sql` — La structure des tables

```sql
-- Table des TAS BRUTS
CREATE TABLE IF NOT EXISTS tas_brut (
  id BIGSERIAL PRIMARY KEY,          -- Identifiant unique, auto-incrémenté
  nom_tas TEXT NOT NULL,             -- Nom du tas (obligatoire)
  debut_m NUMERIC,                   -- Position de début en mètres
  fin_m NUMERIC,                     -- Position de fin en mètres
  tonnage_thc NUMERIC DEFAULT 0,     -- Tonnage en THC
  mode_stockage TEXT DEFAULT 'chevron',  -- Chevron ou cône
  statut TEXT DEFAULT 'en_cours',    -- En cours ou caractérisé
  in_stockyard BOOLEAN DEFAULT true, -- Présent au stockyard ?
  conformite TEXT,                   -- Résultat de conformité
  date_creation TIMESTAMPTZ DEFAULT now()  -- Date de création automatique
);

-- Table des TAS LAVÉS
CREATE TABLE IF NOT EXISTS tas_lave (
  id BIGSERIAL PRIMARY KEY,
  nom_tas TEXT NOT NULL,
  debut_m NUMERIC,
  fin_m NUMERIC,
  tonnage_tsm NUMERIC DEFAULT 0,     -- Tonnage en TSM (différent de THC)
  source_id BIGINT REFERENCES tas_brut(id) ON DELETE SET NULL,
  -- ↑ Référence vers le tas brut source
  --   "ON DELETE SET NULL" = si le tas brut est supprimé, source_id devient NULL
  source_name TEXT,
  statut TEXT DEFAULT 'en_cours',
  in_stockyard BOOLEAN DEFAULT true,
  date_creation TIMESTAMPTZ DEFAULT now()
);

-- Table des COUCHES (layers)
CREATE TABLE IF NOT EXISTS couches (
  id BIGSERIAL PRIMARY KEY,
  tas_brut_id BIGINT REFERENCES tas_brut(id) ON DELETE CASCADE,
  -- ↑ Lien vers le tas brut parent
  --   "ON DELETE CASCADE" = si le tas est supprimé, ses couches le sont aussi
  tas_lave_id BIGINT REFERENCES tas_lave(id) ON DELETE CASCADE,
  tonnage NUMERIC DEFAULT 0,
  date TEXT,
  type TEXT,                          -- "brut" ou "lave"
  source TEXT,                        -- Ex: "layer-1", "layer-2"
  "BPL" NUMERIC,                     -- Analyses chimiques
  "CO2" NUMERIC,
  "SiO2" NUMERIC,
  "MgO" NUMERIC,
  "Cd" NUMERIC,
  "H2O" NUMERIC
);

-- Table des FRACTIONS GRANULOMÉTRIQUES
CREATE TABLE IF NOT EXISTS fractions (
  id BIGSERIAL PRIMARY KEY,
  couche_id BIGINT NOT NULL REFERENCES couches(id) ON DELETE CASCADE,
  -- ↑ Chaque fraction appartient à une couche
  tamis TEXT NOT NULL,                -- Nom du tamis (ex: "3150")
  poids NUMERIC,                     -- Poids en %
  "BPL" NUMERIC,                     -- Analyses chimiques par fraction
  "CO2" NUMERIC,
  "SiO2" NUMERIC,
  "MgO" NUMERIC,
  "Cd" NUMERIC
);

-- Table des MACHINES
CREATE TABLE IF NOT EXISTS machines (
  id BIGSERIAL PRIMARY KEY,
  nom_machine TEXT NOT NULL,
  type TEXT,                          -- "Stacker" ou "Roue-Pelle"
  ligne TEXT,                         -- "Stock Brut" ou "Stock Lavé"
  position_m NUMERIC,                -- Position en mètres
  statut TEXT DEFAULT 'Actif',
  tas_associe TEXT,                   -- Nom du tas associé
  date_ajout TIMESTAMPTZ DEFAULT now()
);

-- INDEX (accélèrent les recherches fréquentes)
CREATE INDEX IF NOT EXISTS idx_couches_tas_brut ON couches(tas_brut_id);
-- ↑ Accélère la recherche "donne-moi toutes les couches du tas brut n°5"
```

**Relations entre les tables** :

```
tas_brut ──── 1:N ──── couches ──── 1:N ──── fractions
  (1 tas a                (1 couche a
   plusieurs               plusieurs
   couches)                fractions)

tas_lave ──── 1:N ──── couches
  (1 tas lavé a
   plusieurs couches)

tas_lave ──── N:1 ──── tas_brut
  (1 tas lavé vient
   d'1 tas brut)
```

---

## 12. Les routes API

### `backend/routes/tasBrut.js` — Routes pour les tas bruts

```javascript
// GET /api/tas-brut — Liste tous les tas bruts avec leurs couches et fractions
router.get('/', async (req, res) => {
  try {
    // 1. Récupère tous les tas
    const { rows: piles } = await pool.query('SELECT * FROM tas_brut ORDER BY id');

    // 2. Récupère toutes les couches des tas bruts
    const { rows: couches } = await pool.query(
      'SELECT * FROM couches WHERE tas_brut_id IS NOT NULL ORDER BY id'
    );

    // 3. Récupère toutes les fractions
    const coucheIds = couches.map(c => c.id);
    const { rows: fractions } = await pool.query(
      'SELECT * FROM fractions WHERE couche_id = ANY($1)',
      [coucheIds]
    );
    // ↑ ANY($1) = "dont l'id de couche est dans cette liste"

    // 4. Assemble le tout : chaque tas contient ses couches,
    //    chaque couche contient ses fractions
    const result = piles.map(tas => ({
      ...tas,
      couches: couches
        .filter(c => c.tas_brut_id === tas.id)    // Couches de CE tas
        .map(c => ({
          ...c,
          fractions: fractions.filter(f => f.couche_id === c.id),
          // ↑ Fractions de CETTE couche
        })),
    }));

    res.json(result);   // Renvoie le résultat au frontend
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/tas-brut — Crée un nouveau tas brut
router.post('/', async (req, res) => {
  const { nom_tas, debut_m, fin_m, tonnage_thc, mode_stockage, statut } = req.body;
  // ↑ Récupère les données envoyées par le frontend

  const { rows } = await pool.query(
    `INSERT INTO tas_brut (nom_tas, debut_m, fin_m, tonnage_thc, mode_stockage, statut)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [nom_tas, debut_m, fin_m, tonnage_thc || 0, mode_stockage || 'chevron', statut || 'en_cours']
  );
  // ↑ $1, $2, ... sont des paramètres sécurisés (empêchent l'injection SQL)
  //   RETURNING * = retourne la ligne qui vient d'être créée

  res.status(201).json(rows[0]);
  // ↑ 201 = "Créé avec succès"
});

// PUT /api/tas-brut/:id — Modifie un tas brut existant
router.put('/:id', async (req, res) => {
  const { id } = req.params;    // L'id est dans l'URL (ex: /api/tas-brut/5)
  const fields = req.body;       // Les champs à modifier

  // Construit dynamiquement la requête UPDATE
  const keys = Object.keys(fields);
  const sets = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
  // ↑ Produit : "nom_tas" = $1, "debut_m" = $2, ...

  await pool.query(
    `UPDATE tas_brut SET ${sets} WHERE id = $${keys.length + 1}`,
    [...values, id]
  );
});

// DELETE /api/tas-brut/:id — Supprime un tas brut
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM tas_brut WHERE id = $1', [id]);
  // ↑ Les couches et fractions sont supprimées automatiquement
  //   grâce au "ON DELETE CASCADE" dans le schéma
});
```

---

### `backend/routes/import.js` — Routes pour l'import Excel

```javascript
// POST /api/import/brut — Importe les tas bruts depuis Excel
router.post('/brut', async (req, res) => {
  const client = await pool.connect();   // Prend une connexion dédiée
  try {
    await client.query('BEGIN');          // Démarre une TRANSACTION
    // ↑ Une transaction garantit que TOUTES les opérations réussissent
    //   ou AUCUNE (en cas d'erreur, tout est annulé)

    const { piles } = req.body;

    for (const pile of piles) {
      // 1. Cherche si le tas existe déjà (par son nom)
      const { rows: existing } = await client.query(
        'SELECT id FROM tas_brut WHERE nom_tas = $1', [pile.nom_tas]
      );

      let tasId;
      if (existing.length > 0) {
        // Le tas EXISTE → on le MET À JOUR
        tasId = existing[0].id;
        await client.query('UPDATE tas_brut SET ... WHERE id = $1', ...);
      } else {
        // Le tas N'EXISTE PAS → on le CRÉE
        const { rows } = await client.query('INSERT INTO tas_brut ... RETURNING id', ...);
        tasId = rows[0].id;
      }
      // ↑ C'est le concept d'"UPSERT" : Update si existe, Insert sinon

      // 2. Pour chaque couche du tas dans l'Excel
      for (const layer of pile.layers) {
        // Même logique : met à jour si existe, crée sinon
        // + insère les fractions granulométriques
      }

      // 3. Supprime les couches "orphelines"
      //    (couches qui sont en BD mais PAS dans l'Excel)

      // 4. Met à jour le tonnage total du tas
      await client.query(
        `UPDATE tas_brut SET tonnage_thc = (
          SELECT COALESCE(SUM(tonnage), 0) FROM couches WHERE tas_brut_id = $1
        ) WHERE id = $1`,
        [tasId]
      );
      // ↑ Recalcule le tonnage = somme des tonnages de toutes les couches
    }

    await client.query('COMMIT');     // Valide toutes les opérations
  } catch (err) {
    await client.query('ROLLBACK');   // Annule tout en cas d'erreur
    res.status(500).json({ error: err.message });
  }
});
```

---

## 13. Les styles CSS

### `src/index.css` — Le système de design

```css
/* Importe les polices Google */
@import url('...IBM+Plex+Sans...&family=IBM+Plex+Mono...');

/* Définition des couleurs du thème (mode clair) */
:root {
  --background: 210 20% 96%;         /* Fond gris très clair */
  --foreground: 215 25% 15%;         /* Texte principal (presque noir) */
  --primary: 152 100% 29%;           /* Couleur principale (vert OCP) */
  --primary-foreground: 0 0% 100%;   /* Texte sur fond vert (blanc) */

  /* Couleurs des stocks */
  --raw-stock: 142 50% 45%;          /* Vert pour stock brut */
  --washed-stock: 30 85% 55%;        /* Orange pour stock lavé */

  /* Couleurs de conformité */
  --conforme: 142 70% 40%;           /* Vert = conforme */
  --non-conforme: 0 72% 51%;         /* Rouge = non conforme */
  --hors-tolerance: 40 90% 50%;      /* Jaune = hors tolérance */

  /* Couleurs des machines */
  --machine-stacker: 48 90% 50%;     /* Jaune */
  --machine-reclaimer: 15 80% 50%;   /* Orange foncé */

  /* Sidebar (menu latéral) */
  --sidebar-background: 215 25% 22%; /* Bleu-gris foncé */
  --sidebar-foreground: 210 15% 85%; /* Texte clair */
  --sidebar-primary: 152 100% 29%;   /* Vert OCP (élément actif) */
}

/* Mode sombre (si implémenté) */
.dark {
  --background: 215 30% 10%;         /* Fond très sombre */
  --primary: 152 80% 40%;            /* Vert un peu plus clair */
  /* ... */
}

/* Classes utilitaires personnalisées */
.industrial-gradient {
  background: linear-gradient(135deg, ...);
  /* ↑ Le dégradé du header (barre du haut) */
}

.stock-raw-gradient {
  background: linear-gradient(180deg, ...);
  /* ↑ Le dégradé des tas bruts dans la visualisation */
}
```

**En résumé** : Ce fichier définit toutes les couleurs, ombres et dégradés. Les couleurs sont en format **HSL** (Teinte, Saturation, Luminosité) pour faciliter les variations.

---

## 14. Résumé du flux complet

### Quand l'utilisateur ouvre le site :

```
1. Le navigateur charge index.html
   ↓
2. index.html charge src/main.tsx
   ↓
3. main.tsx monte le composant <App />
   ↓
4. App.tsx regarde l'URL :
   - "/" → affiche Landing.tsx (page d'accueil)
   - "/app" → affiche Index.tsx (dashboard)
```

### Quand l'utilisateur va sur /app :

```
1. Index.tsx s'affiche avec Header + Sidebar
   ↓
2. useApiData() est appelé automatiquement
   ↓
3. Le hook envoie 3 requêtes GET via api/client.ts :
   - GET /api/tas-brut
   - GET /api/tas-lave
   - GET /api/machines
   ↓
4. Vite redirige ces requêtes vers http://localhost:3001
   ↓
5. Le serveur Express reçoit les requêtes
   ↓
6. Il interroge PostgreSQL via pool.js
   ↓
7. PostgreSQL retourne les données
   ↓
8. Le serveur renvoie les données au format JSON
   ↓
9. useApiData() transforme les données (format BD → format app)
   ↓
10. React met à jour l'interface avec les nouvelles données
```

### Quand l'utilisateur importe un fichier Excel :

```
1. L'utilisateur dépose un fichier .xlsx
   ↓
2. ImportSection.tsx lit le fichier avec la librairie xlsx
   ↓
3. Il parse les données (tas bruts, tas lavés, machines)
   ↓
4. Il envoie 3 requêtes POST au backend :
   POST /api/import/brut   → les tas bruts
   POST /api/import/lave   → les tas lavés
   POST /api/import/machines → les machines
   ↓
5. Le backend fait un UPSERT pour chaque tas :
   - Si le tas existe → mise à jour
   - Si le tas n'existe pas → création
   ↓
6. Les couches sont synchronisées (ajout/mise à jour/suppression)
   ↓
7. Le frontend appelle reload() → recharge toutes les données
   ↓
8. L'interface se met à jour automatiquement
```

---

## 📚 Glossaire

| Terme | Explication |
|-------|-------------|
| **React** | Librairie pour construire des interfaces web interactives |
| **TypeScript** | Version améliorée de JavaScript avec vérification des types |
| **Component** | Un morceau réutilisable d'interface (bouton, tableau, etc.) |
| **Hook** | Fonction React qui gère l'état et les effets (useState, useEffect) |
| **State (état)** | Variable qui, quand elle change, met à jour l'interface |
| **Props** | Données passées d'un composant parent à un composant enfant |
| **API** | Interface de programmation — comment le frontend parle au backend |
| **Route** | URL qui correspond à une action du serveur |
| **CRUD** | Create, Read, Update, Delete — les 4 opérations de base |
| **SQL** | Langage pour interroger la base de données |
| **Upsert** | Update si existe, Insert sinon |
| **Transaction** | Groupe d'opérations SQL qui réussissent toutes ou aucune |
| **JSON** | Format de données texte (clé: valeur) |
| **Pool** | Réserve de connexions à la base de données |
| **Proxy** | Intermédiaire qui redirige les requêtes |
| **Tailwind CSS** | Framework CSS qui utilise des classes utilitaires |
| **HSL** | Format de couleur : Hue (teinte), Saturation, Lightness (luminosité) |

---

> **Fin du guide.** Si tu as des questions sur un fichier ou une fonction spécifique, n'hésite pas à demander !
