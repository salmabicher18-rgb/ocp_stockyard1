import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Stockpile, Machine, StockLayer, ChemicalAnalysis, GranulometricFraction } from "@/data/mockData";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// Convert DB rows to app types
function dbTasToStockpile(
  tas: any,
  type: "raw" | "washed",
  couches: any[],
  fractions: any[]
): Stockpile {
  const layers: StockLayer[] = couches.map(c => {
    const layerFractions = fractions
      .filter(f => f.couche_id === c.id)
      .map(f => ({
        tamis: f.tamis,
        poids: f.poids ?? 0,
        BPL: f.BPL,
        CO2: f.CO2,
        SiO2: f.SiO2,
        MgO: f.MgO,
        Cd: f.Cd,
      } as GranulometricFraction));

    const chemistry: ChemicalAnalysis = {
      BPL: c.BPL,
      CO2: c.CO2,
      SiO2: c.SiO2,
      MgO: c.MgO,
      Cd: c.Cd,
      H2O: c.H2O,
    };

    return {
      id: `couche-${c.id}`,
      date: c.date ?? "",
      tonnage: c.tonnage ?? 0,
      chemistry,
      granulometry: layerFractions.length > 0 ? layerFractions : undefined,
      // Only show source if it's not just a layer index identifier
      sourceStockpile: (c.source && !c.source.startsWith("layer-")) ? c.source : undefined,
    } as StockLayer;
  });

  return {
    id: `${type}-db-${tas.id}`,
    name: tas.nom_tas,
    type,
    startPosition: tas.debut_m ?? 0,
    endPosition: tas.fin_m ?? 0,
    totalTonnage: type === "raw" ? (tas.tonnage_thc ?? 0) : (tas.tonnage_tsm ?? 0),
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
    position: m.position_m ?? 0,
    line: m.ligne?.toLowerCase().includes("brut") ? "raw" : "washed",
    active: m.statut?.toLowerCase().includes("actif") && !m.statut?.toLowerCase().includes("non"),
    dateAdded: m.date_ajout ?? undefined,
    associatedStockpile: m.tas_associe ?? undefined,
  };
}

// Extract DB id from app id
function getDbId(appId: string): number | null {
  const match = appId.match(/db-(\d+)/);
  return match ? parseInt(match[1]) : null;
}

export function useSupabaseData() {
  const [rawStockpiles, setRawStockpiles] = useState<Stockpile[]>([]);
  const [washedStockpiles, setWashedStockpiles] = useState<Stockpile[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [tasB, tasL, couchesRes, fractionsRes, machinesRes] = await Promise.all([
        supabase.from("TasBrut").select("*"),
        supabase.from("TasLave").select("*"),
        supabase.from("Couches").select("*"),
        supabase.from("Fractions").select("*"),
        supabase.from("Machines").select("*"),
      ]);

      const allCouches = couchesRes.data ?? [];
      const allFractions = fractionsRes.data ?? [];

      // Build raw stockpiles
      const raw = (tasB.data ?? []).map(tas => {
        const couches = allCouches.filter(c => c.tas_brut_id === tas.id);
        const fracIds = couches.map(c => c.id);
        const fracs = allFractions.filter(f => fracIds.includes(f.couche_id));
        return dbTasToStockpile(tas, "raw", couches, fracs);
      });

      // Build washed stockpiles
      const washed = (tasL.data ?? []).map(tas => {
        const couches = allCouches.filter(c => c.tas_lave_id === tas.id);
        return dbTasToStockpile(tas, "washed", couches, []);
      });

      setRawStockpiles(raw);
      setWashedStockpiles(washed);
      setMachines((machinesRes.data ?? []).map(dbMachineToMachine));
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // === CRUD for raw stockpiles ===
  const addRawStockpile = async (sp: Omit<Stockpile, "id" | "layers" | "averageChemistry">) => {
    const { data, error } = await supabase.from("TasBrut").insert({
      nom_tas: sp.name,
      debut_m: sp.startPosition,
      fin_m: sp.endPosition,
      tonnage_thc: sp.totalTonnage,
      mode_stockage: sp.storageMode ?? "chevron",
      statut: sp.status,
    }).select("id").single();
    if (!error && data) {
      await loadData();
    }
  };

  const deleteRawStockpile = async (id: string) => {
    const dbId = getDbId(id);
    if (dbId) {
      // Delete layers first
      const { data: couches } = await supabase.from("Couches").select("id").eq("tas_brut_id", dbId);
      if (couches && couches.length > 0) {
        const coucheIds = couches.map(c => c.id);
        await supabase.from("Fractions").delete().in("couche_id", coucheIds);
        await supabase.from("Couches").delete().eq("tas_brut_id", dbId);
      }
      await supabase.from("TasBrut").delete().eq("id", dbId);
      await loadData();
    }
  };

  const updateRawStockpile = async (id: string, updates: Partial<Stockpile>) => {
    const dbId = getDbId(id);
    if (dbId) {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.nom_tas = updates.name;
      if (updates.startPosition !== undefined) dbUpdates.debut_m = updates.startPosition;
      if (updates.endPosition !== undefined) dbUpdates.fin_m = updates.endPosition;
      if (updates.totalTonnage !== undefined) dbUpdates.tonnage_thc = updates.totalTonnage;
      if (updates.storageMode !== undefined) dbUpdates.mode_stockage = updates.storageMode;
      if (updates.status !== undefined) dbUpdates.statut = updates.status;
      if (updates.inStockyard !== undefined) dbUpdates.in_stockyard = updates.inStockyard;
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from("TasBrut").update(dbUpdates).eq("id", dbId);
        await loadData();
      }
    }
  };

  // === CRUD for washed stockpiles ===
  const addWashedStockpile = async (sp: Omit<Stockpile, "id" | "layers" | "averageChemistry">) => {
    const { data, error } = await supabase.from("TasLave").insert({
      nom_tas: sp.name,
      debut_m: sp.startPosition,
      fin_m: sp.endPosition,
      tonnage_tsm: sp.totalTonnage,
      source_name: sp.qualitySource ?? null,
      statut: sp.status,
    }).select("id").single();
    if (!error && data) {
      await loadData();
    }
  };

  const deleteWashedStockpile = async (id: string) => {
    const dbId = getDbId(id);
    if (dbId) {
      await supabase.from("Couches").delete().eq("tas_lave_id", dbId);
      await supabase.from("TasLave").delete().eq("id", dbId);
      await loadData();
    }
  };

  const updateWashedStockpile = async (id: string, updates: Partial<Stockpile>) => {
    const dbId = getDbId(id);
    if (dbId) {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.nom_tas = updates.name;
      if (updates.startPosition !== undefined) dbUpdates.debut_m = updates.startPosition;
      if (updates.endPosition !== undefined) dbUpdates.fin_m = updates.endPosition;
      if (updates.totalTonnage !== undefined) dbUpdates.tonnage_tsm = updates.totalTonnage;
      if (updates.qualitySource !== undefined) dbUpdates.source_name = updates.qualitySource;
      if (updates.status !== undefined) dbUpdates.statut = updates.status;
      if (updates.inStockyard !== undefined) dbUpdates.in_stockyard = updates.inStockyard;
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from("TasLave").update(dbUpdates).eq("id", dbId);
        await loadData();
      }
    }
  };

  // === Layer CRUD ===
  const addLayer = async (stockpileId: string, layer: Omit<StockLayer, "id">) => {
    const dbId = getDbId(stockpileId);
    if (!dbId) return;

    const isRaw = stockpileId.includes("raw");
    const coucheData: any = {
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
    if (isRaw) coucheData.tas_brut_id = dbId;
    else coucheData.tas_lave_id = dbId;

    const { data: couche, error } = await supabase.from("Couches").insert(coucheData).select("id").single();
    if (error || !couche) return;

    // Insert fractions if raw
    if (isRaw && layer.granulometry && layer.granulometry.length > 0) {
      await supabase.from("Fractions").insert(
        layer.granulometry.map(g => ({
          couche_id: couche.id,
          tamis: g.tamis,
          poids: g.poids,
          BPL: g.BPL,
          CO2: g.CO2,
          SiO2: g.SiO2,
          MgO: g.MgO,
          Cd: g.Cd,
        }))
      );
    }

    // Update tonnage
    if (isRaw) {
      const { data: allC } = await supabase.from("Couches").select("tonnage").eq("tas_brut_id", dbId);
      const total = (allC ?? []).reduce((s, c) => s + (c.tonnage ?? 0), 0);
      await supabase.from("TasBrut").update({ tonnage_thc: total }).eq("id", dbId);
    } else {
      const { data: allC } = await supabase.from("Couches").select("tonnage").eq("tas_lave_id", dbId);
      const total = (allC ?? []).reduce((s, c) => s + (c.tonnage ?? 0), 0);
      await supabase.from("TasLave").update({ tonnage_tsm: total }).eq("id", dbId);
    }

    await loadData();
  };

  const deleteLayer = async (stockpileId: string, layerId: string) => {
    const coucheDbId = getDbId(layerId);
    if (!coucheDbId) return;
    await supabase.from("Fractions").delete().eq("couche_id", coucheDbId);
    await supabase.from("Couches").delete().eq("id", coucheDbId);
    await loadData();
  };

  const editLayer = async (stockpileId: string, layerId: string, layer: Omit<StockLayer, "id">) => {
    const coucheDbId = getDbId(layerId);
    if (!coucheDbId) return;

    await supabase.from("Couches").update({
      tonnage: layer.tonnage,
      date: layer.date,
      BPL: layer.chemistry.BPL,
      CO2: layer.chemistry.CO2,
      SiO2: layer.chemistry.SiO2,
      MgO: layer.chemistry.MgO,
      Cd: layer.chemistry.Cd,
      H2O: layer.chemistry.H2O ?? null,
    }).eq("id", coucheDbId);

    // Update fractions if raw
    if (layer.granulometry && layer.granulometry.length > 0) {
      await supabase.from("Fractions").delete().eq("couche_id", coucheDbId);
      await supabase.from("Fractions").insert(
        layer.granulometry.map(g => ({
          couche_id: coucheDbId,
          tamis: g.tamis,
          poids: g.poids,
          BPL: g.BPL,
          CO2: g.CO2,
          SiO2: g.SiO2,
          MgO: g.MgO,
          Cd: g.Cd,
        }))
      );
    }

    await loadData();
  };

  // === Machine CRUD ===
  const deleteMachine = async (id: string) => {
    const dbId = getDbId(id);
    if (dbId) {
      await supabase.from("Machines").delete().eq("id", dbId);
      await loadData();
    }
  };

  const updateMachine = async (id: string, updates: Partial<Machine>) => {
    const dbId = getDbId(id);
    if (dbId) {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.nom_machine = updates.name;
      if (updates.type !== undefined) dbUpdates.type = updates.type === "stacker" ? "Stacker" : "Roue-Pelle";
      if (updates.line !== undefined) dbUpdates.ligne = updates.line === "raw" ? "Stock Brut" : "Stock Lavé";
      if (updates.position !== undefined) dbUpdates.position_m = updates.position;
      if (updates.active !== undefined) dbUpdates.statut = updates.active ? "Actif" : "non actif";
      if (updates.dateAdded !== undefined) dbUpdates.date_ajout = updates.dateAdded;
      if (updates.associatedStockpile !== undefined) dbUpdates.tas_associe = updates.associatedStockpile || null;
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from("Machines").update(dbUpdates).eq("id", dbId);
        await loadData();
      }
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
