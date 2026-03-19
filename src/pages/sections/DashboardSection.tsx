import type { Stockpile, Machine, TargetMatrix } from "@/data/mockData";
import { calculateWeightedAverage } from "@/data/mockData";
import StockArea from "@/components/stockyard/StockArea";
import StockpileModal from "@/components/stockyard/StockpileModal";
import { useState } from "react";
import { Layers, Droplets, BarChart3, AlertTriangle } from "lucide-react";

interface DashboardSectionProps {
  rawStockpiles: Stockpile[];
  washedStockpiles: Stockpile[];
  machines: Machine[];
  matrices: TargetMatrix[];
}

const DashboardSection = ({ rawStockpiles, washedStockpiles, machines, matrices }: DashboardSectionProps) => {
  const [selectedStockpile, setSelectedStockpile] = useState<Stockpile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleStockpileClick = (stockpile: Stockpile) => {
    setSelectedStockpile(stockpile);
    setModalOpen(true);
  };

  // Only show stockpiles that are in the stockyard
  const visibleRaw = rawStockpiles.filter(sp => sp.inStockyard);
  const visibleWashed = washedStockpiles.filter(sp => sp.inStockyard);

  const totalRawTonnage = rawStockpiles.reduce((s, sp) => s + sp.totalTonnage, 0);
  const totalWashedTonnage = washedStockpiles.reduce((s, sp) => s + sp.totalTonnage, 0);

  const parseProduitFiniValue = (str: string): { op: ">" | "<"; value: number } | null => {
    if (!str || str === "-") return null;
    const match = str.match(/([><])\s*([\d,\.]+)/);
    if (!match) return null;
    const op = match[1] as ">" | "<";
    const value = parseFloat(match[2].replace(",", "."));
    return isNaN(value) ? null : { op, value };
  };

  const isNonConformePF = (val: number | null, pfStr: string): boolean => {
    if (val === null) return false;
    const parsed = parseProduitFiniValue(pfStr);
    if (!parsed) return false;
    if (parsed.op === ">" && val <= parsed.value) return true;
    if (parsed.op === "<" && val >= parsed.value) return true;
    return false;
  };

  // Check non-conformity for characterized stockpiles
  const getNonConformStockpiles = (): string[] => {
    const nonConform: string[] = [];
    const allStockpiles = [...rawStockpiles, ...washedStockpiles].filter(sp => sp.inStockyard);
    for (const sp of allStockpiles) {
      const avg = sp.averageChemistry ?? calculateWeightedAverage(sp.layers);
      if (sp.type === "raw") {
        // Raw: compare against profileDemande
        const matchingMatrices = matrices.filter(m => m.type === "brut");
        if (matchingMatrices.length === 0) { nonConform.push(sp.name); continue; }
        const target = matchingMatrices[0];
        const profile = target.profileDemande;
        const checks: boolean[] = [];
        if (avg.BPL !== null && profile.BPL !== null) checks.push(avg.BPL >= profile.BPL);
        if (avg.MgO !== null && profile.MgO !== null) checks.push(avg.MgO <= profile.MgO);
        if (avg.SiO2 !== null && profile.SiO2 !== null) checks.push(avg.SiO2 <= profile.SiO2);
        if (avg.Cd !== null && profile.Cd !== null) checks.push(avg.Cd <= profile.Cd);
        if (checks.length === 0 || !checks.every(Boolean)) nonConform.push(sp.name);
      } else {
        // Washed: compare against produitFini
        if (matrices.length === 0) { nonConform.push(sp.name); continue; }
        const target = matrices[0];
        const pf = target.produitFini;
        const checks: boolean[] = [];
        if (avg.BPL !== null && pf.BPL && pf.BPL !== "-") checks.push(!isNonConformePF(avg.BPL, pf.BPL));
        if (avg.CO2 !== null && pf.CO2 && pf.CO2 !== "-") checks.push(!isNonConformePF(avg.CO2, pf.CO2));
        if (avg.MgO !== null && pf.MgO && pf.MgO !== "-") checks.push(!isNonConformePF(avg.MgO, pf.MgO));
        if (avg.SiO2 !== null && pf.SiO2 && pf.SiO2 !== "-") checks.push(!isNonConformePF(avg.SiO2, pf.SiO2));
        if (avg.Cd !== null && pf.Cd && pf.Cd !== "-") checks.push(!isNonConformePF(avg.Cd, pf.Cd));
        if (checks.length === 0 || !checks.every(Boolean)) nonConform.push(sp.name);
      }
    }
    return nonConform;
  };

  const nonConformStockpiles = getNonConformStockpiles();
  const hasAlerts = nonConformStockpiles.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Layers, label: "Stock Produit Brut", value: `${totalRawTonnage.toLocaleString()} THC`, count: `${visibleRaw.length} tas`, alert: false },
          { icon: Droplets, label: "Stock Produit Fini", value: `${totalWashedTonnage.toLocaleString()} TSM`, count: `${visibleWashed.length} tas`, alert: false },
          { icon: BarChart3, label: "Machines actives", value: `${machines.filter(m => m.active).length}`, count: `${machines.filter(m => m.type === "stacker").length} ST / ${machines.filter(m => m.type === "reclaimer").length} RP`, alert: false },
        ].map((card) => (
          <div key={card.label} className="bg-card rounded-lg shadow-card border border-border p-3">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">{card.label}</span>
            </div>
            <div className="text-lg font-bold font-mono text-foreground">{card.value}</div>
            <div className="text-[9px] text-muted-foreground">{card.count}</div>
          </div>
        ))}

        {/* Conformity alert card */}
        <div className={`rounded-lg shadow-card border p-3 ${hasAlerts ? "bg-non-conforme/10 border-non-conforme/40" : "bg-conforme/10 border-conforme/40"}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-4 h-4 ${hasAlerts ? "text-non-conforme" : "text-conforme"}`} />
            <span className={`text-[10px] font-medium ${hasAlerts ? "text-non-conforme" : "text-conforme"}`}>
              {hasAlerts ? "Alerte Conformité" : "Conformité OK"}
            </span>
          </div>
          {hasAlerts ? (
            <>
              <div className="text-lg font-bold font-mono text-non-conforme">{nonConformStockpiles.length} Alerte{nonConformStockpiles.length > 1 ? "s" : ""}</div>
              <div className="text-[9px] text-non-conforme/80 leading-tight max-h-10 overflow-y-auto">
                {nonConformStockpiles.join(", ")}
              </div>
            </>
          ) : (
            <>
              <div className="text-lg font-bold font-mono text-conforme">0 Alerte</div>
              <div className="text-[9px] text-conforme/80">Tous les tas sont conformes</div>
            </>
          )}
        </div>
      </div>

      <StockArea
        title="Stock du Produit Brut"
        type="raw"
        stockpiles={visibleRaw}
        machines={machines}
        onStockpileClick={handleStockpileClick}
      />

      <StockArea
        title="Stock des Produits Finis (Lavé)"
        type="washed"
        stockpiles={visibleWashed}
        machines={machines}
        onStockpileClick={handleStockpileClick}
      />

      <StockpileModal
        stockpile={selectedStockpile}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        matrices={matrices}
      />
    </div>
  );
};

export default DashboardSection;
