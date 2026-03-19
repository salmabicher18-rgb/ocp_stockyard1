import { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import type {
  Stockpile,
  Machine,
  StockLayer,
  ChemicalAnalysis,
  GranulometricFraction,
} from "@/data/mockData";

// ─── Helper: safely parse a DB value to number ──────────────
function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function toNumOrNull(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

// ─── Mappers: DB row → App type ─────────────────────────────

function dbTasToStockpile(
  tas: any,
  type: "raw" | "washed"
): Stockpile {
  const couches: any[] = tas.couches ?? [];

  const layers: StockLayer[] = couches.map((c: any) => {
    const layerFractions: GranulometricFraction[] = (c.fractions ?? []).map(
      (f: any) => ({
        tamis: f.tamis,
        poids: toNum(f.poids),
        BPL: toNumOrNull(f.BPL),
        CO2: toNumOrNull(f.CO2),
        SiO2: toNumOrNull(f.SiO2),
        MgO: toNumOrNull(f.MgO),
        Cd: toNumOrNull(f.Cd),
      })
    );

    const chemistry: ChemicalAnalysis = {
      BPL: toNumOrNull(c.BPL),
      CO2: toNumOrNull(c.CO2),
      SiO2: toNumOrNull(c.SiO2),
      MgO: toNumOrNull(c.MgO),
      Cd: toNumOrNull(c.Cd),
      H2O: toNumOrNull(c.H2O),
    };

    return {
      id: `couche-${c.id}`,
      date: c.date ?? "",
      tonnage: toNum(c.tonnage),
      chemistry,
      granulometry: layerFractions.length > 0 ? layerFractions : undefined,
      sourceStockpile:
        c.source && !c.source.startsWith("layer-") ? c.source : undefined,
    } as StockLayer;
  });

  return {
    id: `${type}-db-${tas.id}`,
    name: tas.nom_tas,
    type,
    startPosition: toNum(tas.debut_m),
    endPosition: toNum(tas.fin_m),
    totalTonnage: toNum(type === "raw" ? tas.tonnage_thc : tas.tonnage_tsm),
    unit: type === "raw" ? "THC" : "TSM",
    status: tas.statut === "caracterise" ? "caracterise" : "en_cours",
    storageMode: tas.mode_stockage === "cone" ? "cone" : "chevron",
    layers,
    inStockyard: tas.in_stockyard !== undefined ? tas.in_stockyard : true,
    qualitySource: tas.source_name ?? undefined,
    conformite: tas.conformite ?? undefined,
  } as Stockpile;
}

function dbMachineToMachine(m: any): Machine {
  return {
    id: `machine-db-${m.id}`,
    name: m.nom_machine,
    type: m.type?.toLowerCase().includes("stacker") ? "stacker" : "reclaimer",
    position: toNum(m.position_m),
    line: m.ligne?.toLowerCase().includes("brut") ? "raw" : "washed",
    active:
      m.statut?.toLowerCase().includes("actif") &&
      !m.statut?.toLowerCase().includes("non"),
    dateAdded: m.date_ajout ?? undefined,
    associatedStockpile: m.tas_associe ?? undefined,
  };
}

// Extract DB id from app id
function getDbId(appId: string): number | null {
  const match = appId.match(/db-(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// ─── Hook ────────────────────────────────────────────────────

export function useApiData() {
  const [rawStockpiles, setRawStockpiles] = useState<Stockpile[]>([]);
  const [washedStockpiles, setWashedStockpiles] = useState<Stockpile[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rawData, washedData, machinesData] = await Promise.all([
        api.get("/tas-brut"),
        api.get("/tas-lave"),
        api.get("/machines"),
      ]);

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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // === CRUD for raw stockpiles ===
  const addRawStockpile = async (
    sp: Omit<Stockpile, "id" | "layers" | "averageChemistry">
  ) => {
    await api.post("/tas-brut", {
      nom_tas: sp.name,
      debut_m: sp.startPosition,
      fin_m: sp.endPosition,
      tonnage_thc: sp.totalTonnage,
      mode_stockage: sp.storageMode ?? "chevron",
      statut: sp.status,
    });
    await loadData();
  };

  const deleteRawStockpile = async (id: string) => {
    const dbId = getDbId(id);
    if (dbId) {
      await api.delete(`/tas-brut/${dbId}`);
      await loadData();
    }
  };

  const updateRawStockpile = async (
    id: string,
    updates: Partial<Stockpile>
  ) => {
    const dbId = getDbId(id);
    if (!dbId) return;
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.nom_tas = updates.name;
    if (updates.startPosition !== undefined)
      dbUpdates.debut_m = updates.startPosition;
    if (updates.endPosition !== undefined)
      dbUpdates.fin_m = updates.endPosition;
    if (updates.totalTonnage !== undefined)
      dbUpdates.tonnage_thc = updates.totalTonnage;
    if (updates.storageMode !== undefined)
      dbUpdates.mode_stockage = updates.storageMode;
    if (updates.status !== undefined) dbUpdates.statut = updates.status;
    if (updates.inStockyard !== undefined)
      dbUpdates.in_stockyard = updates.inStockyard;
    if (Object.keys(dbUpdates).length > 0) {
      await api.put(`/tas-brut/${dbId}`, dbUpdates);
      await loadData();
    }
  };

  // === CRUD for washed stockpiles ===
  const addWashedStockpile = async (
    sp: Omit<Stockpile, "id" | "layers" | "averageChemistry">
  ) => {
    await api.post("/tas-lave", {
      nom_tas: sp.name,
      debut_m: sp.startPosition,
      fin_m: sp.endPosition,
      tonnage_tsm: sp.totalTonnage,
      source_name: sp.qualitySource ?? null,
      statut: sp.status,
    });
    await loadData();
  };

  const deleteWashedStockpile = async (id: string) => {
    const dbId = getDbId(id);
    if (dbId) {
      await api.delete(`/tas-lave/${dbId}`);
      await loadData();
    }
  };

  const updateWashedStockpile = async (
    id: string,
    updates: Partial<Stockpile>
  ) => {
    const dbId = getDbId(id);
    if (!dbId) return;
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.nom_tas = updates.name;
    if (updates.startPosition !== undefined)
      dbUpdates.debut_m = updates.startPosition;
    if (updates.endPosition !== undefined)
      dbUpdates.fin_m = updates.endPosition;
    if (updates.totalTonnage !== undefined)
      dbUpdates.tonnage_tsm = updates.totalTonnage;
    if (updates.qualitySource !== undefined)
      dbUpdates.source_name = updates.qualitySource;
    if (updates.status !== undefined) dbUpdates.statut = updates.status;
    if (updates.inStockyard !== undefined)
      dbUpdates.in_stockyard = updates.inStockyard;
    if (Object.keys(dbUpdates).length > 0) {
      await api.put(`/tas-lave/${dbId}`, dbUpdates);
      await loadData();
    }
  };

  // === Layer CRUD ===
  const addLayer = async (
    stockpileId: string,
    layer: Omit<StockLayer, "id">
  ) => {
    const dbId = getDbId(stockpileId);
    if (!dbId) return;

    const isRaw = stockpileId.includes("raw");
    const body: any = {
      tonnage: layer.tonnage,
      date: layer.date,
      type: isRaw ? "brut" : "lave",
      BPL: layer.chemistry.BPL,
      CO2: layer.chemistry.CO2,
      SiO2: layer.chemistry.SiO2,
      MgO: layer.chemistry.MgO,
      Cd: layer.chemistry.Cd,
      H2O: layer.chemistry.H2O ?? null,
    };
    if (isRaw) body.tas_brut_id = dbId;
    else body.tas_lave_id = dbId;

    if (isRaw && layer.granulometry && layer.granulometry.length > 0) {
      body.fractions = layer.granulometry.map((g) => ({
        tamis: g.tamis,
        poids: g.poids,
        BPL: g.BPL,
        CO2: g.CO2,
        SiO2: g.SiO2,
        MgO: g.MgO,
        Cd: g.Cd,
      }));
    }

    await api.post("/couches", body);
    await loadData();
  };

  const deleteLayer = async (stockpileId: string, layerId: string) => {
    const coucheDbId = getDbId(layerId);
    if (!coucheDbId) return;
    await api.delete(`/couches/${coucheDbId}`);
    await loadData();
  };

  const editLayer = async (
    stockpileId: string,
    layerId: string,
    layer: Omit<StockLayer, "id">
  ) => {
    const coucheDbId = getDbId(layerId);
    if (!coucheDbId) return;

    const body: any = {
      tonnage: layer.tonnage,
      date: layer.date,
      BPL: layer.chemistry.BPL,
      CO2: layer.chemistry.CO2,
      SiO2: layer.chemistry.SiO2,
      MgO: layer.chemistry.MgO,
      Cd: layer.chemistry.Cd,
      H2O: layer.chemistry.H2O ?? null,
    };

    if (layer.granulometry && layer.granulometry.length > 0) {
      body.fractions = layer.granulometry.map((g) => ({
        tamis: g.tamis,
        poids: g.poids,
        BPL: g.BPL,
        CO2: g.CO2,
        SiO2: g.SiO2,
        MgO: g.MgO,
        Cd: g.Cd,
      }));
    }

    await api.put(`/couches/${coucheDbId}`, body);
    await loadData();
  };

  // === Machine CRUD ===
  const deleteMachine = async (id: string) => {
    const dbId = getDbId(id);
    if (dbId) {
      await api.delete(`/machines/${dbId}`);
      await loadData();
    }
  };

  const updateMachine = async (id: string, updates: Partial<Machine>) => {
    const dbId = getDbId(id);
    if (!dbId) return;
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.nom_machine = updates.name;
    if (updates.type !== undefined)
      dbUpdates.type = updates.type === "stacker" ? "Stacker" : "Roue-Pelle";
    if (updates.line !== undefined)
      dbUpdates.ligne = updates.line === "raw" ? "Stock Brut" : "Stock Lavé";
    if (updates.position !== undefined) dbUpdates.position_m = updates.position;
    if (updates.active !== undefined)
      dbUpdates.statut = updates.active ? "Actif" : "non actif";
    if (updates.dateAdded !== undefined)
      dbUpdates.date_ajout = updates.dateAdded;
    if (updates.associatedStockpile !== undefined)
      dbUpdates.tas_associe = updates.associatedStockpile || null;
    if (Object.keys(dbUpdates).length > 0) {
      await api.put(`/machines/${dbId}`, dbUpdates);
      await loadData();
    }
  };

  return {
    rawStockpiles,
    washedStockpiles,
    machines,
    loading,
    reload: loadData,
    addRawStockpile,
    deleteRawStockpile,
    updateRawStockpile,
    addWashedStockpile,
    deleteWashedStockpile,
    updateWashedStockpile,
    addLayer,
    deleteLayer,
    editLayer,
    deleteMachine,
    updateMachine,
  };
}
