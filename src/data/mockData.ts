// Types and mock data for the OCP Stockyard Management System

export interface ChemicalAnalysis {
  BPL: number | null;
  CO2: number | null;
  SiO2: number | null;
  MgO: number | null;
  Cd: number | null;
  H2O?: number | null;
}

export interface GranulometricFraction {
  tamis: string;
  poids: number;
  BPL: number | null;
  CO2: number | null;
  SiO2: number | null;
  MgO: number | null;
  Cd: number | null;
}

export const TAMIS_FRACTIONS = ["3150", "200", "160", "40", "< 40"] as const;

export interface StockLayer {
  id: string;
  date: string;
  tonnage: number;
  chemistry: ChemicalAnalysis;
  granulometry?: GranulometricFraction[];
  sourceStockpile?: string;
}

export interface Stockpile {
  id: string;
  name: string;
  type: "raw" | "washed";
  startPosition: number;
  endPosition: number;
  totalTonnage: number;
  unit: string;
  status: "en_cours" | "caracterise";
  storageMode?: "chevron" | "cone";
  layers: StockLayer[];
  qualitySource?: string;
  averageChemistry?: ChemicalAnalysis;
  inStockyard: boolean; // whether the stockpile is present in the physical stockyard
}

export interface Machine {
  id: string;
  name: string;
  type: "stacker" | "reclaimer";
  position: number;
  line: "raw" | "washed";
  active: boolean;
  dateAdded?: string;
  associatedStockpile?: string; // stockpile name
}

export interface TargetMatrixRow {
  fraction: string;
  weightMin: number | null;
  weightMoy: number | null;
  weightMax: number | null;
  BPLMin: number | null;
  BPLMax: number | null;
  CO2Min: number | null;
  CO2Max: number | null;
  MgOMin: number | null;
  MgOMax: number | null;
  SiO2Min: number | null;
  SiO2Max: number | null;
  CdMin: number | null;
  CdMax: number | null;
}

export interface TargetMatrix {
  name: string;
  type: "brut" | "lave";
  rows: TargetMatrixRow[];
  profileDemande: ChemicalAnalysis;
  produitFini: { BPL: string; CO2: string; MgO: string; SiO2: string; Cd: string };
}

// Target matrices from Excel
export const targetMatrices: TargetMatrix[] = [
  {
    name: "SAFI-MPII",
    type: "brut",
    rows: [
      { fraction: "Sup à 3150", weightMin: 1.5, weightMoy: 1.8, weightMax: 2.2, BPLMin: 40.3, BPLMax: null, CO2Min: null, CO2Max: null, MgOMin: null, MgOMax: 3, SiO2Min: null, SiO2Max: 20, CdMin: null, CdMax: 23 },
      { fraction: "3150-200", weightMin: 34.4, weightMoy: 43, weightMax: 51.6, BPLMin: 67, BPLMax: null, CO2Min: null, CO2Max: null, MgOMin: null, MgOMax: 0.6, SiO2Min: null, SiO2Max: 9, CdMin: null, CdMax: 6.5 },
      { fraction: "200-40", weightMin: 32.3, weightMoy: 40.4, weightMax: 48.5, BPLMin: 52, BPLMax: null, CO2Min: null, CO2Max: null, MgOMin: null, MgOMax: 0.8, SiO2Min: null, SiO2Max: 14, CdMin: null, CdMax: 9 },
      { fraction: "Inf 40", weightMin: null, weightMoy: 14.8, weightMax: 17.7, BPLMin: 20, BPLMax: null, CO2Min: null, CO2Max: null, MgOMin: null, MgOMax: 3, SiO2Min: null, SiO2Max: 18, CdMin: null, CdMax: 24 },
    ],
    profileDemande: { BPL: 53.5, CO2: null, SiO2: 12.55, MgO: 1.08, Cd: 10.4 },
    produitFini: { BPL: "> 63", CO2: "-", MgO: "< 0,67", SiO2: "< 8,5", Cd: "< 7" },
  },
  {
    name: "BG10",
    type: "brut",
    rows: [
      { fraction: "Sup à 3150", weightMin: 1.5, weightMoy: 1.8, weightMax: 2.2, BPLMin: 40.3, BPLMax: null, CO2Min: 15, CO2Max: null, MgOMin: null, MgOMax: 3, SiO2Min: null, SiO2Max: 20, CdMin: null, CdMax: 23 },
      { fraction: "3150-200", weightMin: 34.4, weightMoy: 43, weightMax: 51.6, BPLMin: 68, BPLMax: null, CO2Min: 6, CO2Max: null, MgOMin: null, MgOMax: 0.6, SiO2Min: null, SiO2Max: 7.8, CdMin: null, CdMax: 7 },
      { fraction: "200-40", weightMin: 32.3, weightMoy: 40.4, weightMax: 48.5, BPLMin: 54, BPLMax: null, CO2Min: 7, CO2Max: null, MgOMin: null, MgOMax: 0.72, SiO2Min: null, SiO2Max: 13.5, CdMin: null, CdMax: 9 },
      { fraction: "Inf 40", weightMin: null, weightMoy: 14.8, weightMax: 17.7, BPLMin: 20, BPLMax: null, CO2Min: 18, CO2Max: null, MgOMin: null, MgOMax: 3, SiO2Min: null, SiO2Max: 18, CdMin: null, CdMax: 26 },
    ],
    profileDemande: { BPL: 54.7, CO2: 8.3, SiO2: 11.83, MgO: 1.05, Cd: 10.91 },
    produitFini: { BPL: "> 65", CO2: "< 6,5", MgO: "< 0,65", SiO2: "< 7", Cd: "< 8" },
  },
  {
    name: "G10 Low Cd",
    type: "brut",
    rows: [
      { fraction: "Sup à 3150", weightMin: 1.5, weightMoy: 1.8, weightMax: 2.2, BPLMin: 40.3, BPLMax: null, CO2Min: 15, CO2Max: null, MgOMin: null, MgOMax: 3, SiO2Min: null, SiO2Max: 20, CdMin: null, CdMax: 23 },
      { fraction: "3150-200", weightMin: 34.4, weightMoy: 43, weightMax: 51.6, BPLMin: 65, BPLMax: null, CO2Min: 6, CO2Max: null, MgOMin: null, MgOMax: 0.85, SiO2Min: null, SiO2Max: 8, CdMin: null, CdMax: 12 },
      { fraction: "200-40", weightMin: 32.3, weightMoy: 40.4, weightMax: 48.5, BPLMin: 52, BPLMax: null, CO2Min: 7, CO2Max: null, MgOMin: null, MgOMax: 0.9, SiO2Min: null, SiO2Max: 12, CdMin: null, CdMax: 13.5 },
      { fraction: "Inf 40", weightMin: null, weightMoy: 14.8, weightMax: 17.7, BPLMin: 29, BPLMax: null, CO2Min: 18, CO2Max: null, MgOMin: null, MgOMax: 2, SiO2Min: null, SiO2Max: 19, CdMin: null, CdMax: 26 },
    ],
    profileDemande: { BPL: 54, CO2: 8.3, SiO2: 11.46, MgO: 1.08, Cd: 14.88 },
    produitFini: { BPL: "> 62,5", CO2: "< 6,5", MgO: "< 0,8", SiO2: "< 7,5", Cd: "< 12" },
  },
];

export const stockTotals = {
  raw: { MPII: 71000, BG10: 0 },
  washed: { MPII: 56123, BG10: 21672, G10: 0, TBT: 16120 },
};

// Mock stockpiles - Raw
export const rawStockpiles: Stockpile[] = [
  {
    id: "raw-1",
    name: "Tas Brut MPII N°1",
    type: "raw",
    storageMode: "chevron",
    startPosition: 180,
    endPosition: 100,
    totalTonnage: 18500,
    unit: "THC",
    status: "en_cours",
    inStockyard: true,
    layers: [
      {
        id: "r1-l1", date: "2026-02-11", tonnage: 4200,
        chemistry: { BPL: 52.8, CO2: 6.1, SiO2: 13.2, MgO: 1.1, Cd: 10.8, H2O: 11.2 },
        granulometry: [
          { tamis: "3150", poids: 8.27, BPL: 35.31, CO2: 7.96, SiO2: 33.80, MgO: 3.24, Cd: 14.29 },
          { tamis: "200", poids: 30.23, BPL: 63.63, CO2: 4.59, SiO2: 27.81, MgO: 1.05, Cd: 6.85 },
          { tamis: "160", poids: 10.92, BPL: 73.67, CO2: 4.79, SiO2: 14.39, MgO: 0.36, Cd: 3.73 },
          { tamis: "40", poids: 36.39, BPL: 48.58, CO2: 3.63, SiO2: 37.26, MgO: 0.63, Cd: 4.39 },
          { tamis: "< 40", poids: 14.19, BPL: 45.71, CO2: 7.36, SiO2: 24.71, MgO: 2.51, Cd: 12.92 },
        ],
      },
      {
        id: "r1-l2", date: "2026-02-12", tonnage: 5100,
        chemistry: { BPL: 53.5, CO2: 5.9, SiO2: 12.8, MgO: 1.05, Cd: 10.2, H2O: 10.9 },
        granulometry: [
          { tamis: "3150", poids: 7.80, BPL: 36.10, CO2: 7.50, SiO2: 34.20, MgO: 3.10, Cd: 13.80 },
          { tamis: "200", poids: 31.50, BPL: 64.80, CO2: 4.40, SiO2: 26.90, MgO: 0.98, Cd: 6.50 },
          { tamis: "160", poids: 11.20, BPL: 74.10, CO2: 4.60, SiO2: 13.80, MgO: 0.34, Cd: 3.50 },
          { tamis: "40", poids: 35.80, BPL: 49.20, CO2: 3.50, SiO2: 36.80, MgO: 0.60, Cd: 4.20 },
          { tamis: "< 40", poids: 13.70, BPL: 46.30, CO2: 7.10, SiO2: 24.20, MgO: 2.40, Cd: 12.50 },
        ],
      },
      {
        id: "r1-l3", date: "2026-02-13", tonnage: 4800,
        chemistry: { BPL: 54.1, CO2: 5.7, SiO2: 12.5, MgO: 1.02, Cd: 9.8, H2O: 10.5 },
        granulometry: [
          { tamis: "3150", poids: 8.00, BPL: 35.80, CO2: 7.80, SiO2: 33.50, MgO: 3.18, Cd: 14.00 },
          { tamis: "200", poids: 30.80, BPL: 64.20, CO2: 4.50, SiO2: 27.50, MgO: 1.00, Cd: 6.70 },
          { tamis: "160", poids: 11.00, BPL: 73.90, CO2: 4.70, SiO2: 14.10, MgO: 0.35, Cd: 3.60 },
          { tamis: "40", poids: 36.00, BPL: 48.90, CO2: 3.55, SiO2: 37.00, MgO: 0.62, Cd: 4.30 },
          { tamis: "< 40", poids: 14.20, BPL: 45.90, CO2: 7.25, SiO2: 24.50, MgO: 2.48, Cd: 12.70 },
        ],
      },
      {
        id: "r1-l4", date: "2026-02-14", tonnage: 4400,
        chemistry: { BPL: 53.2, CO2: 6.0, SiO2: 13.0, MgO: 1.08, Cd: 10.5 },
      },
    ],
  },
  {
    id: "raw-2",
    name: "Tas Brut MPII N°3",
    type: "raw",
    storageMode: "chevron",
    startPosition: 350,
    endPosition: 280,
    totalTonnage: 22000,
    unit: "THC",
    status: "caracterise",
    inStockyard: true,
    averageChemistry: { BPL: 53.8, CO2: 5.8, SiO2: 12.6, MgO: 1.04, Cd: 10.1 },
    layers: [
      {
        id: "r2-l1", date: "2026-02-06", tonnage: 5500,
        chemistry: { BPL: 54.2, CO2: 5.6, SiO2: 12.3, MgO: 1.00, Cd: 9.5, H2O: 10.8 },
        granulometry: [
          { tamis: "3150", poids: 7.50, BPL: 36.50, CO2: 7.30, SiO2: 34.50, MgO: 3.00, Cd: 13.50 },
          { tamis: "200", poids: 32.00, BPL: 65.20, CO2: 4.30, SiO2: 26.50, MgO: 0.95, Cd: 6.30 },
          { tamis: "160", poids: 11.50, BPL: 74.50, CO2: 4.50, SiO2: 13.50, MgO: 0.32, Cd: 3.40 },
          { tamis: "40", poids: 35.50, BPL: 49.50, CO2: 3.40, SiO2: 36.50, MgO: 0.58, Cd: 4.10 },
          { tamis: "< 40", poids: 13.50, BPL: 46.50, CO2: 7.00, SiO2: 24.00, MgO: 2.35, Cd: 12.30 },
        ],
      },
      {
        id: "r2-l2", date: "2026-02-07", tonnage: 5800,
        chemistry: { BPL: 53.5, CO2: 5.9, SiO2: 12.8, MgO: 1.06, Cd: 10.3 },
      },
      {
        id: "r2-l3", date: "2026-02-08", tonnage: 5200,
        chemistry: { BPL: 53.2, CO2: 6.0, SiO2: 12.9, MgO: 1.08, Cd: 10.5 },
      },
      {
        id: "r2-l4", date: "2026-02-09", tonnage: 5500,
        chemistry: { BPL: 54.0, CO2: 5.7, SiO2: 12.4, MgO: 1.02, Cd: 10.0 },
      },
    ],
  },
  {
    id: "raw-3",
    name: "Tas Brut MPII N°4",
    type: "raw",
    storageMode: "cone",
    startPosition: 460,
    endPosition: 400,
    totalTonnage: 15000,
    unit: "THC",
    status: "en_cours",
    inStockyard: true,
    layers: [
      {
        id: "r3-l1", date: "2026-02-15", tonnage: 5000,
        chemistry: { BPL: 52.5, CO2: 6.3, SiO2: 13.5, MgO: 1.12, Cd: 11.0, H2O: 11.5 },
        granulometry: [
          { tamis: "3150", poids: 8.50, BPL: 34.80, CO2: 8.10, SiO2: 34.80, MgO: 3.30, Cd: 14.80 },
          { tamis: "200", poids: 29.50, BPL: 62.80, CO2: 4.80, SiO2: 28.50, MgO: 1.10, Cd: 7.10 },
          { tamis: "160", poids: 10.50, BPL: 73.00, CO2: 5.00, SiO2: 15.00, MgO: 0.38, Cd: 3.90 },
          { tamis: "40", poids: 37.00, BPL: 47.80, CO2: 3.80, SiO2: 38.00, MgO: 0.68, Cd: 4.60 },
          { tamis: "< 40", poids: 14.50, BPL: 45.00, CO2: 7.60, SiO2: 25.20, MgO: 2.60, Cd: 13.20 },
        ],
      },
      {
        id: "r3-l2", date: "2026-02-16", tonnage: 5200,
        chemistry: { BPL: 53.0, CO2: 6.1, SiO2: 13.2, MgO: 1.10, Cd: 10.8 },
      },
      {
        id: "r3-l3", date: "2026-02-17", tonnage: 4800,
        chemistry: { BPL: 53.8, CO2: 5.8, SiO2: 12.7, MgO: 1.05, Cd: 10.2 },
      },
    ],
  },
];

// Mock stockpiles - Washed
export const washedStockpiles: Stockpile[] = [
  {
    id: "washed-1",
    name: "Tas Lavé MPII N°1",
    type: "washed",
    startPosition: 140,
    endPosition: 60,
    totalTonnage: 6037,
    unit: "TSM",
    status: "en_cours",
    inStockyard: true,
    qualitySource: "Tas brut MPII N°1",
    layers: [
      { id: "w1-l1", date: "2026-01-22", tonnage: 2100, chemistry: { BPL: 64.5, CO2: 5.8, SiO2: 7.2, MgO: 0.58, Cd: 6.2 }, sourceStockpile: "raw-1" },
      { id: "w1-l2", date: "2026-01-21", tonnage: 2050, chemistry: { BPL: 65.0, CO2: 5.6, SiO2: 7.0, MgO: 0.55, Cd: 6.0 }, sourceStockpile: "raw-1" },
      { id: "w1-l3", date: "2026-01-20", tonnage: 1887, chemistry: { BPL: 64.8, CO2: 5.7, SiO2: 7.1, MgO: 0.57, Cd: 6.1 }, sourceStockpile: "raw-1" },
    ],
  },
  {
    id: "washed-2",
    name: "Tas Lavé MPII N°2",
    type: "washed",
    startPosition: 220,
    endPosition: 160,
    totalTonnage: 5382,
    unit: "TSM",
    status: "caracterise",
    inStockyard: true,
    qualitySource: "Tas brut MPII N°3",
    averageChemistry: { BPL: 65.2, CO2: 5.5, SiO2: 6.8, MgO: 0.54, Cd: 5.8 },
    layers: [
      { id: "w2-l1", date: "2026-01-19", tonnage: 3188, chemistry: { BPL: 65.5, CO2: 5.4, SiO2: 6.7, MgO: 0.52, Cd: 5.6 }, sourceStockpile: "raw-2" },
      { id: "w2-l2", date: "2026-01-08", tonnage: 2194, chemistry: { BPL: 64.8, CO2: 5.7, SiO2: 7.0, MgO: 0.56, Cd: 6.0 }, sourceStockpile: "raw-2" },
    ],
  },
  {
    id: "washed-3",
    name: "Tas Lavé BG10 N°1",
    type: "washed",
    startPosition: 320,
    endPosition: 250,
    totalTonnage: 8082,
    unit: "TSM",
    status: "en_cours",
    inStockyard: true,
    qualitySource: "Tas brut BG10 N°4 et N°5",
    layers: [
      { id: "w3-l1", date: "2026-02-14", tonnage: 2800, chemistry: { BPL: 66.0, CO2: 5.2, SiO2: 6.5, MgO: 0.50, Cd: 5.5 }, sourceStockpile: "raw-3" },
      { id: "w3-l2", date: "2026-02-13", tonnage: 2682, chemistry: { BPL: 65.8, CO2: 5.3, SiO2: 6.6, MgO: 0.52, Cd: 5.7 }, sourceStockpile: "raw-3" },
      { id: "w3-l3", date: "2026-02-12", tonnage: 2600, chemistry: { BPL: 65.5, CO2: 5.5, SiO2: 6.8, MgO: 0.54, Cd: 5.9 }, sourceStockpile: "raw-3" },
    ],
  },
  {
    id: "washed-4",
    name: "Tas Lavé TBT",
    type: "washed",
    startPosition: 440,
    endPosition: 370,
    totalTonnage: 6806,
    unit: "TSM",
    status: "en_cours",
    inStockyard: true,
    qualitySource: "Stock TBT",
    layers: [
      { id: "w4-l1", date: "2026-02-09", tonnage: 2300, chemistry: { BPL: 63.8, CO2: 6.0, SiO2: 7.5, MgO: 0.62, Cd: 6.5 }, sourceStockpile: "raw-1" },
      { id: "w4-l2", date: "2026-02-11", tonnage: 2206, chemistry: { BPL: 64.0, CO2: 5.9, SiO2: 7.3, MgO: 0.60, Cd: 6.3 }, sourceStockpile: "raw-2" },
      { id: "w4-l3", date: "2026-02-06", tonnage: 2300, chemistry: { BPL: 63.5, CO2: 6.1, SiO2: 7.6, MgO: 0.63, Cd: 6.6 }, sourceStockpile: "raw-3" },
    ],
  },
];

// Mock machines
export const initialMachines: Machine[] = [
  { id: "st110-1", name: "ST110", type: "stacker", position: 150, line: "raw", active: true },
  { id: "rp120-1", name: "RP120", type: "reclaimer", position: 100, line: "raw", active: true },
  { id: "st110-2", name: "ST110", type: "stacker", position: 200, line: "washed", active: true },
  { id: "rp120-2", name: "RP120", type: "reclaimer", position: 60, line: "washed", active: true },
];

/**
 * Calculate layer weighted average from its granulometric fractions.
 * Formula: SUMPRODUCT(poids, param) / SUM(poids)
 */
export function calculateLayerWeightedAvg(granulometry: GranulometricFraction[]): ChemicalAnalysis {
  const totalPoids = granulometry.reduce((s, g) => s + g.poids, 0);
  if (totalPoids === 0) return { BPL: null, CO2: null, SiO2: null, MgO: null, Cd: null };

  const avg = (key: keyof Omit<GranulometricFraction, "tamis" | "poids">) => {
    const sum = granulometry.reduce((s, g) => s + (g[key] != null ? g[key]! * g.poids : 0), 0);
    return Math.round((sum / totalPoids) * 100) / 100;
  };

  return { BPL: avg("BPL"), CO2: avg("CO2"), SiO2: avg("SiO2"), MgO: avg("MgO"), Cd: avg("Cd") };
}

/**
 * Calculate washed stock weighted average (tonnage-weighted).
 * Formula: SUMPRODUCT(tonnage, param) / SUM(tonnage)
 */
export function calculateWeightedAverage(layers: StockLayer[]): ChemicalAnalysis {
  const totalTonnage = layers.reduce((sum, l) => sum + l.tonnage, 0);
  if (totalTonnage === 0) return { BPL: null, CO2: null, SiO2: null, MgO: null, Cd: null, H2O: null };

  const avg = (key: keyof ChemicalAnalysis) => {
    const validLayers = layers.filter(l => l.chemistry[key] != null);
    if (validLayers.length === 0) return null;
    const weightedSum = validLayers.reduce((sum, l) => sum + (l.chemistry[key] as number) * l.tonnage, 0);
    const validTonnage = validLayers.reduce((sum, l) => sum + l.tonnage, 0);
    return Math.round((weightedSum / validTonnage) * 100) / 100;
  };

  return { BPL: avg("BPL"), CO2: avg("CO2"), SiO2: avg("SiO2"), MgO: avg("MgO"), Cd: avg("Cd"), H2O: avg("H2O") };
}

/**
 * Calculate weighted granulometry across all layers of a raw stockpile.
 * 
 * Poids per fraction: SUM(tonnage_i * poids_Xi) / SUM(tonnage_i)
 * BPL per fraction:   SUM(BPL_Xi * poids_Xi * tonnage_i) / SUM(poids_Xi * tonnage_i)
 * Phosphate Profile:  SUMPRODUCT(BPL_fractions, poids_fractions) / 100
 */
export function calculateWeightedGranulometry(layers: StockLayer[]): {
  fractions: GranulometricFraction[];
  phosphateProfile: ChemicalAnalysis;
} {
  const layersWithGrano = layers.filter(l => l.granulometry && l.granulometry.length > 0);
  if (layersWithGrano.length === 0) return { fractions: [], phosphateProfile: { BPL: null, CO2: null, SiO2: null, MgO: null, Cd: null } };

  const totalTonnage = layersWithGrano.reduce((sum, l) => sum + l.tonnage, 0);

  const fractions: GranulometricFraction[] = TAMIS_FRACTIONS.map(tamis => {
    // Poids = SUM(tonnage_i * poids_i) / SUM(tonnage_i)
    let sumTonnagePoids = 0;
    let sumBplPoidsTonnage = 0;
    let sumCo2PoidsTonnage = 0;
    let sumSio2PoidsTonnage = 0;
    let sumMgoPoidsTonnage = 0;
    let sumCdPoidsTonnage = 0;
    let sumPoidsTonnage = 0; // denominator for characteristics

    layersWithGrano.forEach(layer => {
      const frac = layer.granulometry!.find(g => g.tamis === tamis);
      if (frac) {
        const t = layer.tonnage;
        const p = frac.poids;
        sumTonnagePoids += t * p;
        sumPoidsTonnage += p * t;
        if (frac.BPL != null) sumBplPoidsTonnage += frac.BPL * p * t;
        if (frac.CO2 != null) sumCo2PoidsTonnage += frac.CO2 * p * t;
        if (frac.SiO2 != null) sumSio2PoidsTonnage += frac.SiO2 * p * t;
        if (frac.MgO != null) sumMgoPoidsTonnage += frac.MgO * p * t;
        if (frac.Cd != null) sumCdPoidsTonnage += frac.Cd * p * t;
      }
    });

    const poids = totalTonnage > 0 ? Math.round((sumTonnagePoids / totalTonnage) * 100) / 100 : 0;

    return {
      tamis,
      poids,
      BPL: sumPoidsTonnage > 0 ? Math.round((sumBplPoidsTonnage / sumPoidsTonnage) * 100) / 100 : null,
      CO2: sumPoidsTonnage > 0 ? Math.round((sumCo2PoidsTonnage / sumPoidsTonnage) * 100) / 100 : null,
      SiO2: sumPoidsTonnage > 0 ? Math.round((sumSio2PoidsTonnage / sumPoidsTonnage) * 100) / 100 : null,
      MgO: sumPoidsTonnage > 0 ? Math.round((sumMgoPoidsTonnage / sumPoidsTonnage) * 100) / 100 : null,
      Cd: sumPoidsTonnage > 0 ? Math.round((sumCdPoidsTonnage / sumPoidsTonnage) * 100) / 100 : null,
    };
  });

  // Phosphate Profile = SUMPRODUCT(param_column, poids_column) / 100
  const phosphateProfile: ChemicalAnalysis = {
    BPL: Math.round(fractions.reduce((s, f) => s + (f.BPL ?? 0) * f.poids, 0) / 100 * 100) / 100,
    CO2: Math.round(fractions.reduce((s, f) => s + (f.CO2 ?? 0) * f.poids, 0) / 100 * 100) / 100,
    SiO2: Math.round(fractions.reduce((s, f) => s + (f.SiO2 ?? 0) * f.poids, 0) / 100 * 100) / 100,
    MgO: Math.round(fractions.reduce((s, f) => s + (f.MgO ?? 0) * f.poids, 0) / 100 * 100) / 100,
    Cd: Math.round(fractions.reduce((s, f) => s + (f.Cd ?? 0) * f.poids, 0) / 100 * 100) / 100,
  };

  return { fractions, phosphateProfile };
}

// Helper: compare with target
export function compareWithTarget(value: number | null, min: number | null, max: number | null): "conforme" | "hors_tolerance" | "non_conforme" {
  if (value === null) return "conforme";
  if (min !== null && value < min) return "non_conforme";
  if (max !== null && value > max) return "non_conforme";
  return "conforme";
}
