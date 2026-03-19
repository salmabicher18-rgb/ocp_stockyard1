import { useState, useMemo } from "react";
import type { Stockpile, Machine, TargetMatrix } from "@/data/mockData";
import { calculateWeightedAverage } from "@/data/mockData";
import StockArea from "@/components/stockyard/StockArea";
import StockpileModal from "@/components/stockyard/StockpileModal";
import { Calendar as CalendarIcon, Layers, Droplets, BarChart3, AlertTriangle, History } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface HistorySectionProps {
  rawStockpiles: Stockpile[];
  washedStockpiles: Stockpile[];
  machines: Machine[];
  matrices: TargetMatrix[];
}

const HistorySection = ({ rawStockpiles, washedStockpiles, machines, matrices }: HistorySectionProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedStockpile, setSelectedStockpile] = useState<Stockpile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleStockpileClick = (stockpile: Stockpile) => {
    setSelectedStockpile(stockpile);
    setModalOpen(true);
  };

  // Filter stockpiles to show state at selected date
  const { filteredRaw, filteredWashed } = useMemo(() => {
    if (!selectedDate) return { filteredRaw: [], filteredWashed: [] };

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const filterByDate = (stockpiles: Stockpile[]): Stockpile[] => {
      return stockpiles
        .map(sp => {
          // Keep only layers with date <= selected date
          const validLayers = sp.layers.filter(l => {
            if (!l.date) return false;
            return l.date <= dateStr;
          });

          if (validLayers.length === 0) return null;

          const totalTonnage = validLayers.reduce((sum, l) => sum + l.tonnage, 0);

          return {
            ...sp,
            layers: validLayers,
            totalTonnage,
            averageChemistry: calculateWeightedAverage(validLayers),
          } as Stockpile;
        })
        .filter((sp): sp is Stockpile => sp !== null);
    };

    return {
      filteredRaw: filterByDate(rawStockpiles),
      filteredWashed: filterByDate(washedStockpiles),
    };
  }, [selectedDate, rawStockpiles, washedStockpiles]);

  const visibleRaw = filteredRaw.filter(sp => sp.inStockyard);
  const visibleWashed = filteredWashed.filter(sp => sp.inStockyard);

  const totalRawTonnage = filteredRaw.reduce((s, sp) => s + sp.totalTonnage, 0);
  const totalWashedTonnage = filteredWashed.reduce((s, sp) => s + sp.totalTonnage, 0);

  // Conformity check (same logic as Dashboard)
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

  const getNonConformStockpiles = (): string[] => {
    if (!selectedDate) return [];
    const nonConform: string[] = [];
    const allStockpiles = [...filteredRaw, ...filteredWashed].filter(sp => sp.inStockyard);
    for (const sp of allStockpiles) {
      const avg = sp.averageChemistry ?? calculateWeightedAverage(sp.layers);
      if (sp.type === "raw") {
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
      {/* Header with date picker */}
      <div className="bg-card rounded-lg shadow-card border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm text-card-foreground">Historique du Stockyard</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sélectionner une date :</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal text-xs",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {selectedDate ? format(selectedDate, "dd MMMM yyyy", { locale: fr }) : "Choisir une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {selectedDate && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Affichage de l'état du stockyard au {format(selectedDate, "dd/MM/yyyy")} — seules les couches ajoutées jusqu'à cette date sont prises en compte.
          </p>
        )}
      </div>

      {!selectedDate ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <History className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Sélectionnez une date pour visualiser l'état du stockyard</p>
          <p className="text-xs mt-1">Le dashboard historique affichera la situation des stocks à la date choisie</p>
        </div>
      ) : (
        <>
          {/* Dashboard cards */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Layers, label: "Stock Produit Brut", value: `${totalRawTonnage.toLocaleString()} THC`, count: `${visibleRaw.length} tas` },
              { icon: Droplets, label: "Stock Produit Fini", value: `${totalWashedTonnage.toLocaleString()} TSM`, count: `${visibleWashed.length} tas` },
              { icon: BarChart3, label: "Machines actives", value: `${machines.filter(m => m.active).length}`, count: `${machines.filter(m => m.type === "stacker").length} ST / ${machines.filter(m => m.type === "reclaimer").length} RP` },
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

          {/* Stock areas */}
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
        </>
      )}
    </div>
  );
};

export default HistorySection;
