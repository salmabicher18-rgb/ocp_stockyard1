-- OCP Stockyard Management System - PostgreSQL Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- RAW STOCKPILES (TasBrut)
-- =============================================
CREATE TABLE IF NOT EXISTS tas_brut (
  id BIGSERIAL PRIMARY KEY,
  nom_tas TEXT NOT NULL,
  debut_m NUMERIC,
  fin_m NUMERIC,
  tonnage_thc NUMERIC DEFAULT 0,
  mode_stockage TEXT DEFAULT 'chevron',
  statut TEXT DEFAULT 'en_cours',
  in_stockyard BOOLEAN NOT NULL DEFAULT true,
  conformite TEXT,
  date_creation TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- WASHED STOCKPILES (TasLave)
-- =============================================
CREATE TABLE IF NOT EXISTS tas_lave (
  id BIGSERIAL PRIMARY KEY,
  nom_tas TEXT NOT NULL,
  debut_m NUMERIC,
  fin_m NUMERIC,
  tonnage_tsm NUMERIC DEFAULT 0,
  source_id BIGINT REFERENCES tas_brut(id) ON DELETE SET NULL,
  source_name TEXT,
  statut TEXT DEFAULT 'en_cours',
  conformite TEXT,
  in_stockyard BOOLEAN NOT NULL DEFAULT true,
  date_creation TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- LAYERS (Couches)
-- =============================================
CREATE TABLE IF NOT EXISTS couches (
  id BIGSERIAL PRIMARY KEY,
  tas_brut_id BIGINT REFERENCES tas_brut(id) ON DELETE CASCADE,
  tas_lave_id BIGINT REFERENCES tas_lave(id) ON DELETE CASCADE,
  tonnage NUMERIC DEFAULT 0,
  date TEXT,
  type TEXT,
  source TEXT,
  "BPL" NUMERIC,
  "CO2" NUMERIC,
  "SiO2" NUMERIC,
  "MgO" NUMERIC,
  "Cd" NUMERIC,
  "H2O" NUMERIC
);

-- =============================================
-- GRANULOMETRIC FRACTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS fractions (
  id BIGSERIAL PRIMARY KEY,
  couche_id BIGINT NOT NULL REFERENCES couches(id) ON DELETE CASCADE,
  tamis TEXT NOT NULL,
  poids NUMERIC,
  "BPL" NUMERIC,
  "CO2" NUMERIC,
  "SiO2" NUMERIC,
  "MgO" NUMERIC,
  "Cd" NUMERIC
);

-- =============================================
-- MACHINES
-- =============================================
CREATE TABLE IF NOT EXISTS machines (
  id BIGSERIAL PRIMARY KEY,
  nom_machine TEXT NOT NULL,
  type TEXT,
  ligne TEXT,
  position_m NUMERIC,
  statut TEXT DEFAULT 'Actif',
  tas_associe TEXT,
  date_ajout TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TARGET MATRICES (MatricesCible)
-- =============================================
CREATE TABLE IF NOT EXISTS matrices_cible (
  id BIGSERIAL PRIMARY KEY,
  nom_matrice TEXT NOT NULL,
  type TEXT,
  "BPL_min" NUMERIC, "BPL_max" NUMERIC,
  "CO2_min" NUMERIC, "CO2_max" NUMERIC,
  "SiO2_min" NUMERIC, "SiO2_max" NUMERIC,
  "MgO_min" NUMERIC, "MgO_max" NUMERIC,
  "Cd_min" NUMERIC, "Cd_max" NUMERIC,
  date_creation TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- IMPORT HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS import_history (
  id BIGSERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  raw_count INTEGER DEFAULT 0,
  washed_count INTEGER DEFAULT 0,
  machine_count INTEGER DEFAULT 0,
  layer_count INTEGER DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ACTION HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS action_history (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  element TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Système',
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_couches_tas_brut ON couches(tas_brut_id);
CREATE INDEX IF NOT EXISTS idx_couches_tas_lave ON couches(tas_lave_id);
CREATE INDEX IF NOT EXISTS idx_fractions_couche ON fractions(couche_id);
CREATE INDEX IF NOT EXISTS idx_tas_brut_stockyard ON tas_brut(in_stockyard);
CREATE INDEX IF NOT EXISTS idx_tas_lave_stockyard ON tas_lave(in_stockyard);
CREATE INDEX IF NOT EXISTS idx_machines_ligne ON machines(ligne);
CREATE INDEX IF NOT EXISTS idx_action_history_created ON action_history(created_at DESC);
