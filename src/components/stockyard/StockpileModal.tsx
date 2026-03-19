import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Stockpile, TargetMatrix, TargetMatrixRow, ChemicalAnalysis } from "@/data/mockData";
import { calculateWeightedAverage, calculateWeightedGranulometry, TAMIS_FRACTIONS } from "@/data/mockData";
import { Layers, AlertTriangle, Bell, Target } from "lucide-react";

interface StockpileModalProps {
  stockpile: Stockpile | null;
  open: boolean;
  onClose: () => void;
  matrices: TargetMatrix[];
}

function mapTamisToTargetFraction(tamis: string): string | null {
  switch (tamis) {
    case "3150": return "Sup à 3150";
    case "200": return "3150-200";
    case "160": return "200-40";
    case "40": return "200-40";
    case "< 40": return "Inf 40";
    default: return null;
  }
}

function isNonConformeFraction(value: number | null, targetRow: TargetMatrixRow | undefined, param: string): boolean {
  if (value === null || !targetRow) return false;
  switch (param) {
    case "BPL": return targetRow.BPLMin !== null && value < targetRow.BPLMin;
    case "CO2": return targetRow.CO2Max !== null && value > targetRow.CO2Max;
    case "SiO2": return targetRow.SiO2Max !== null && value > targetRow.SiO2Max;
    case "MgO": return targetRow.MgOMax !== null && value > targetRow.MgOMax;
    case "Cd": return targetRow.CdMax !== null && value > targetRow.CdMax;
    default: return false;
  }
}

function isNonConformeProfile(value: number | null, profile: ChemicalAnalysis | undefined, param: string): boolean {
  if (value === null || !profile) return false;
  switch (param) {
    case "BPL": return profile.BPL !== null && value < profile.BPL;
    case "CO2": return profile.CO2 !== null && value > profile.CO2;
    case "SiO2": return profile.SiO2 !== null && value > profile.SiO2;
    case "MgO": return profile.MgO !== null && value > profile.MgO;
    case "Cd": return profile.Cd !== null && value > profile.Cd;
    default: return false;
  }
}

function isNonConformeGlobal(value: number | null, row: TargetMatrixRow | undefined, param: string): boolean {
  if (value === null || !row) return false;
  const min = param === "BPL" ? row.BPLMin : null;
  const max = param === "BPL" ? row.BPLMax
    : param === "CO2" ? row.CO2Max
    : param === "SiO2" ? row.SiO2Max
    : param === "MgO" ? row.MgOMax
    : param === "Cd" ? row.CdMax : null;
  const minCheck = param === "CO2" ? row.CO2Min
    : param === "SiO2" ? row.SiO2Min
    : param === "MgO" ? row.MgOMin
    : param === "Cd" ? row.CdMin : min;
  if (minCheck !== null && value < minCheck) return true;
  if (max !== null && value > max) return true;
  return false;
}

// Parse produitFini string like "> 63", "< 0,67" into { op, value }
function parseProduitFiniValue(str: string): { op: ">" | "<"; value: number } | null {
  if (!str || str === "-") return null;
  const match = str.match(/([><])\s*([\d,\.]+)/);
  if (!match) return null;
  const op = match[1] as ">" | "<";
  const value = parseFloat(match[2].replace(",", "."));
  return isNaN(value) ? null : { op, value };
}

function isNonConformeProduitFini(value: number | null, produitFiniStr: string): boolean {
  if (value === null) return false;
  const parsed = parseProduitFiniValue(produitFiniStr);
  if (!parsed) return false;
  if (parsed.op === ">" && value <= parsed.value) return true;
  if (parsed.op === "<" && value >= parsed.value) return true;
  return false;
}

function CellValue({ value, nc }: { value: number | null; nc: boolean }) {
  return (
    <span className={`font-mono ${nc ? "text-non-conforme font-bold" : ""}`}>
      {value?.toFixed(2) ?? "—"}
    </span>
  );
}

const StockpileModal = ({ stockpile, open, onClose, matrices }: StockpileModalProps) => {
  const [selectedMatrixName, setSelectedMatrixName] = useState("");
  if (!stockpile) return null;

  const isRaw = stockpile.type === "raw";
  // For raw: filter by type "brut". For washed: use all matrices (they all have produitFini)
  const availableMatrices = isRaw ? matrices.filter(m => m.type === "brut") : matrices;
  
  // Auto-select first if current selection is invalid
  const effectiveMatrixName = availableMatrices.find(m => m.name === selectedMatrixName)
    ? selectedMatrixName
    : (availableMatrices[0]?.name || "");
  const selectedMatrix = availableMatrices.find(m => m.name === effectiveMatrixName);

  const granoData = isRaw ? calculateWeightedGranulometry(stockpile.layers) : null;
  const avg = isRaw && granoData
    ? granoData.phosphateProfile
    : (stockpile.averageChemistry ?? calculateWeightedAverage(stockpile.layers));

  const getTargetRow = (tamis: string) => {
    if (!selectedMatrix) return undefined;
    const fractionName = mapTamisToTargetFraction(tamis);
    return selectedMatrix.rows.find(r => r.fraction === fractionName);
  };

  const globalRow = selectedMatrix?.rows.find(r => r.fraction === "Global");

  // Collect non-conformity alerts
  const profileAlerts: { param: string; value: number; target: string; op: string }[] = [];
  if (selectedMatrix) {
    const params = ["BPL", "CO2", "SiO2", "MgO", "Cd"] as const;
    if (isRaw) {
      const profile = selectedMatrix.profileDemande;
      params.forEach(p => {
        const v = avg[p];
        if (v === null || profile[p] === null) return;
        if (p === "BPL" && v < profile[p]!) profileAlerts.push({ param: p, value: v, target: profile[p]!.toString(), op: "<" });
        if (p !== "BPL" && v > profile[p]!) profileAlerts.push({ param: p, value: v, target: profile[p]!.toString(), op: ">" });
      });
    } else {
      const pf = selectedMatrix.produitFini;
      params.forEach(p => {
        const v = avg[p];
        const pfStr = pf[p];
        if (v === null || !pfStr || pfStr === "-") return;
        if (isNonConformeProduitFini(v, pfStr)) {
          const parsed = parseProduitFiniValue(pfStr);
          profileAlerts.push({ param: p, value: v, target: pfStr, op: parsed?.op === ">" ? "≤" : "≥" });
        }
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className={`w-3 h-3 rounded-sm ${isRaw ? "stock-raw-gradient" : "stock-washed-gradient"}`} />
            {stockpile.name}
            {isRaw && stockpile.storageMode && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                Mode: {stockpile.storageMode === "chevron" ? "Chevron (Trapèze)" : "Cône"}
              </span>
            )}
            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
              stockpile.status === "caracterise" ? "bg-conforme/15 text-conforme" : "bg-hors-tolerance/15 text-hors-tolerance"
            }`}>
              {stockpile.status === "caracterise" ? "Caractérisé" : "En cours"}
            </span>
            {!stockpile.inStockyard && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                Hors stockyard
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 my-3">
          {[
            { label: "Tonnage total", value: `${stockpile.totalTonnage.toLocaleString()} ${stockpile.unit}` },
            { label: "Position", value: `${stockpile.startPosition}m → ${stockpile.endPosition}m` },
            { label: "Longueur", value: `${Math.abs(stockpile.startPosition - stockpile.endPosition)}m` },
            { label: "Layers", value: `${stockpile.layers.length}` },
          ].map((item) => (
            <div key={item.label} className="bg-muted rounded-md p-2">
              <div className="text-[9px] text-muted-foreground">{item.label}</div>
              <div className="text-sm font-semibold font-mono text-foreground">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Target matrix selector */}
        {availableMatrices.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-hors-tolerance" />
            <span className="text-xs font-semibold text-foreground">Matrice cible :</span>
            <Select value={effectiveMatrixName} onValueChange={setSelectedMatrixName}>
              <SelectTrigger className="w-48 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMatrices.map(m => (
                  <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Non-conformity alerts */}
        {profileAlerts.length > 0 && (
          <div className="mb-3 p-2 bg-non-conforme/10 border border-non-conforme/30 rounded-md">
            <div className="flex items-center gap-1.5 mb-1">
              <Bell className="w-3.5 h-3.5 text-non-conforme" />
              <span className="text-xs font-semibold text-non-conforme">Alertes de non-conformité</span>
            </div>
            <ul className="text-[10px] text-non-conforme space-y-0.5">
              {profileAlerts.map((a, i) => (
                <li key={i}>• {a.param} ({a.value.toFixed(2)}) {a.op} cible ({a.target})</li>
              ))}
            </ul>
          </div>
        )}

        {/* RAW STOCKPILE */}
        {isRaw && granoData && granoData.fractions.length > 0 && (
          <>
            {/* Caractéristiques moyennes du parc constitué */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold mb-2 text-foreground bg-conforme/10 px-2 py-1 rounded">
                Caractéristiques moyennes du parc constitué
              </h4>
              <div className="overflow-x-auto border border-border rounded-md">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Tranche</th>
                      <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">POIDS %</th>
                      <th className="px-2 py-1.5 text-right font-semibold">BPL %</th>
                      <th className="px-2 py-1.5 text-right font-semibold">CO2 %</th>
                      <th className="px-2 py-1.5 text-right font-semibold">SiO2 %</th>
                      <th className="px-2 py-1.5 text-right font-semibold">MgO %</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Cd ppm</th>
                      <th className="px-2 py-1.5 text-right font-semibold">H₂O %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {granoData.fractions.map((g, index) => {
                      const tr = getTargetRow(g.tamis);
                      return (
                        <tr key={g.tamis} className="border-t border-border">
                          <td className="px-2 py-1.5 font-medium">{g.tamis}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{g.poids?.toFixed(2)}</td>
                          <td className="px-2 py-1.5 text-right"><CellValue value={g.BPL} nc={isNonConformeFraction(g.BPL, tr, "BPL")} /></td>
                          <td className="px-2 py-1.5 text-right"><CellValue value={g.CO2} nc={isNonConformeFraction(g.CO2, tr, "CO2")} /></td>
                          <td className="px-2 py-1.5 text-right"><CellValue value={g.SiO2} nc={isNonConformeFraction(g.SiO2, tr, "SiO2")} /></td>
                          <td className="px-2 py-1.5 text-right"><CellValue value={g.MgO} nc={isNonConformeFraction(g.MgO, tr, "MgO")} /></td>
                          <td className="px-2 py-1.5 text-right"><CellValue value={g.Cd} nc={isNonConformeFraction(g.Cd, tr, "Cd")} /></td>
                          {index === 0 && (
                            <td 
                              className="px-2 py-1.5 text-center align-middle font-mono font-semibold border-l border-border bg-muted/30" 
                              rowSpan={granoData.fractions.length + 1}
                            >
                              {avg.H2O != null ? avg.H2O.toFixed(2) : "—"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {/* Phosphate Profile row */}
                    <tr className="border-t-2 border-primary/30 bg-primary/5 font-semibold">
                      <td className="px-2 py-1.5 text-primary" colSpan={2}>Phosphate Profile</td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={avg.BPL} nc={isNonConformeProfile(avg.BPL, selectedMatrix?.profileDemande, "BPL")} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={avg.CO2} nc={isNonConformeProfile(avg.CO2, selectedMatrix?.profileDemande, "CO2")} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={avg.SiO2} nc={isNonConformeProfile(avg.SiO2, selectedMatrix?.profileDemande, "SiO2")} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={avg.MgO} nc={isNonConformeProfile(avg.MgO, selectedMatrix?.profileDemande, "MgO")} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={avg.Cd} nc={isNonConformeProfile(avg.Cd, selectedMatrix?.profileDemande, "Cd")} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Individual layer tables */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5 text-foreground">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Détail des Layers ({stockpile.layers.length} layers)
              </h4>
              <div className="space-y-3">
                {stockpile.layers.map((layer, idx) => (
                  <div key={layer.id} className="border border-border rounded-md overflow-hidden">
                    <div className="px-3 py-1.5 bg-muted flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-foreground">
                        Layer {idx + 1} — {new Date(layer.date).toLocaleDateString("fr-FR")}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        Tonnage: {layer.tonnage.toLocaleString()} t
                        {layer.chemistry.H2O != null && ` • H2O: ${layer.chemistry.H2O}%`}
                      </span>
                    </div>
                    {layer.granulometry && layer.granulometry.length > 0 ? (
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-2 py-1 text-left font-semibold text-muted-foreground">Tranche</th>
                            <th className="px-2 py-1 text-right font-semibold text-muted-foreground">POIDS %</th>
                            <th className="px-2 py-1 text-right font-semibold">BPL %</th>
                            <th className="px-2 py-1 text-right font-semibold">CO2 %</th>
                            <th className="px-2 py-1 text-right font-semibold">SiO2 %</th>
                            <th className="px-2 py-1 text-right font-semibold">MgO %</th>
                            <th className="px-2 py-1 text-right font-semibold">Cd ppm</th>
                          </tr>
                        </thead>
                        <tbody>
                          {layer.granulometry.map(g => {
                            const tr = getTargetRow(g.tamis);
                            return (
                              <tr key={g.tamis} className="border-t border-border/50">
                                <td className="px-2 py-1 font-medium">{g.tamis}</td>
                                <td className="px-2 py-1 text-right font-mono">{g.poids?.toFixed(2)}</td>
                                <td className="px-2 py-1 text-right"><CellValue value={g.BPL} nc={isNonConformeFraction(g.BPL, tr, "BPL")} /></td>
                                <td className="px-2 py-1 text-right"><CellValue value={g.CO2} nc={isNonConformeFraction(g.CO2, tr, "CO2")} /></td>
                                <td className="px-2 py-1 text-right"><CellValue value={g.SiO2} nc={isNonConformeFraction(g.SiO2, tr, "SiO2")} /></td>
                                <td className="px-2 py-1 text-right"><CellValue value={g.MgO} nc={isNonConformeFraction(g.MgO, tr, "MgO")} /></td>
                                <td className="px-2 py-1 text-right"><CellValue value={g.Cd} nc={isNonConformeFraction(g.Cd, tr, "Cd")} /></td>
                              </tr>
                            );
                          })}
                          <tr className="border-t border-conforme/30 bg-conforme/5 font-semibold text-conforme">
                            <td className="px-2 py-1" colSpan={2}>Moy pondérée</td>
                            <td className="px-2 py-1 text-right"><CellValue value={layer.chemistry.BPL} nc={isNonConformeProfile(layer.chemistry.BPL, selectedMatrix?.profileDemande, "BPL")} /></td>
                            <td className="px-2 py-1 text-right"><CellValue value={layer.chemistry.CO2} nc={isNonConformeProfile(layer.chemistry.CO2, selectedMatrix?.profileDemande, "CO2")} /></td>
                            <td className="px-2 py-1 text-right"><CellValue value={layer.chemistry.SiO2} nc={isNonConformeProfile(layer.chemistry.SiO2, selectedMatrix?.profileDemande, "SiO2")} /></td>
                            <td className="px-2 py-1 text-right"><CellValue value={layer.chemistry.MgO} nc={isNonConformeProfile(layer.chemistry.MgO, selectedMatrix?.profileDemande, "MgO")} /></td>
                            <td className="px-2 py-1 text-right"><CellValue value={layer.chemistry.Cd} nc={isNonConformeProfile(layer.chemistry.Cd, selectedMatrix?.profileDemande, "Cd")} /></td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      <div className="px-3 py-2 text-[10px] text-muted-foreground">
                        Pas de données granulométriques —
                        BPL: {layer.chemistry.BPL ?? "—"} | CO2: {layer.chemistry.CO2 ?? "—"} | SiO2: {layer.chemistry.SiO2 ?? "—"} | MgO: {layer.chemistry.MgO ?? "—"} | Cd: {layer.chemistry.Cd ?? "—"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* WASHED STOCKPILE */}
        {!isRaw && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold mb-2 text-foreground">Layers journalières</h4>
            <div className="overflow-x-auto border border-border rounded-md">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Date</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Tonnage</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">BPL %</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">CO2 %</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">SiO2 %</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">MgO %</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Cd ppm</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">H₂O %</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {stockpile.layers.map((layer) => {
                    const pf = selectedMatrix?.produitFini;
                    return (
                    <tr key={layer.id} className="border-t border-border hover:bg-muted/50">
                      <td className="px-2 py-1.5 font-mono">{new Date(layer.date).toLocaleDateString("fr-FR")}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{layer.tonnage.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={layer.chemistry.BPL} nc={pf ? isNonConformeProduitFini(layer.chemistry.BPL, pf.BPL) : false} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={layer.chemistry.CO2} nc={pf ? isNonConformeProduitFini(layer.chemistry.CO2, pf.CO2) : false} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={layer.chemistry.SiO2} nc={pf ? isNonConformeProduitFini(layer.chemistry.SiO2, pf.SiO2) : false} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={layer.chemistry.MgO} nc={pf ? isNonConformeProduitFini(layer.chemistry.MgO, pf.MgO) : false} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={layer.chemistry.Cd} nc={pf ? isNonConformeProduitFini(layer.chemistry.Cd, pf.Cd) : false} /></td>
                      <td className="px-2 py-1.5 text-right font-mono">{layer.chemistry.H2O != null ? layer.chemistry.H2O.toFixed(2) : "—"}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{layer.sourceStockpile ?? "—"}</td>
                    </tr>
                    );
                  })}
                  {(() => {
                    const pf = selectedMatrix?.produitFini;
                    return (
                    <tr className="border-t-2 border-primary/30 bg-primary/5 font-semibold">
                      <td className="px-2 py-1.5">Moyenne pondérée</td>
                      <td className="px-2 py-1.5 text-right font-mono">{stockpile.totalTonnage.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={avg.BPL} nc={pf ? isNonConformeProduitFini(avg.BPL, pf.BPL) : false} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={avg.CO2} nc={pf ? isNonConformeProduitFini(avg.CO2, pf.CO2) : false} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={avg.SiO2} nc={pf ? isNonConformeProduitFini(avg.SiO2, pf.SiO2) : false} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={avg.MgO} nc={pf ? isNonConformeProduitFini(avg.MgO, pf.MgO) : false} /></td>
                      <td className="px-2 py-1.5 text-right"><CellValue value={avg.Cd} nc={pf ? isNonConformeProduitFini(avg.Cd, pf.Cd) : false} /></td>
                      <td className="px-2 py-1.5 text-right font-mono">{avg.H2O != null ? avg.H2O.toFixed(2) : "—"}</td>
                      <td />
                    </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {stockpile.qualitySource && (
          <div className="text-[10px] text-muted-foreground">
            Source qualité: {stockpile.qualitySource}
          </div>
        )}

        {/* Comparaison avec matrice cible — Phosphate Profile */}
        {selectedMatrix && isRaw && granoData && granoData.fractions.length > 0 && (
          <div className="mt-4 border border-border rounded-md overflow-hidden">
            <div className="bg-hors-tolerance/10 px-3 py-2 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-hors-tolerance" />
              <span className="text-xs font-semibold text-hors-tolerance">Comparaison avec matrice cible — {selectedMatrix.name}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Paramètre</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Phosphate Profile</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Cible</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-muted-foreground">Conformité</th>
                  </tr>
                </thead>
                <tbody>
                  {(["BPL", "CO2", "SiO2", "MgO", "Cd"] as const).map(param => {
                    const value = avg[param];
                    const target = selectedMatrix.profileDemande[param];
                    const nc = isNonConformeProfile(value, selectedMatrix.profileDemande, param);
                    const op = param === "BPL" ? "≥" : "≤";
                    return (
                      <tr key={param} className={`border-t border-border ${nc ? "bg-non-conforme/5" : ""}`}>
                        <td className="px-2 py-1.5 font-medium">{param}</td>
                        <td className="px-2 py-1.5 text-right">
                          <CellValue value={value} nc={nc} />
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">
                          {target !== null ? `${op} ${target}` : "—"}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {target === null || value === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : nc ? (
                            <span className="text-non-conforme font-bold text-[9px] px-2 py-0.5 rounded-full bg-non-conforme/10">Non conforme</span>
                          ) : (
                            <span className="text-conforme font-medium text-[9px] px-2 py-0.5 rounded-full bg-conforme/10">Conforme</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Comparaison for washed — Produit fini */}
        {selectedMatrix && !isRaw && (
          <div className="mt-4 border border-border rounded-md overflow-hidden">
            <div className="bg-hors-tolerance/10 px-3 py-2 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-hors-tolerance" />
              <span className="text-xs font-semibold text-hors-tolerance">Comparaison avec matrice cible — {selectedMatrix.name} (Produit fini)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Paramètre</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Moyenne pondérée</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Cible (Produit fini)</th>
                    <th className="px-2 py-1.5 text-center font-semibold text-muted-foreground">Conformité</th>
                  </tr>
                </thead>
                <tbody>
                  {(["BPL", "CO2", "SiO2", "MgO", "Cd"] as const).map(param => {
                    const value = avg[param];
                    const pfStr = selectedMatrix.produitFini[param];
                    const nc = isNonConformeProduitFini(value, pfStr);
                    return (
                      <tr key={param} className={`border-t border-border ${nc ? "bg-non-conforme/5" : ""}`}>
                        <td className="px-2 py-1.5 font-medium">{param}</td>
                        <td className="px-2 py-1.5 text-right"><CellValue value={value} nc={nc} /></td>
                        <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{pfStr || "—"}</td>
                        <td className="px-2 py-1.5 text-center">
                          {!pfStr || pfStr === "-" || value === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : nc ? (
                            <span className="text-non-conforme font-bold text-[9px] px-2 py-0.5 rounded-full bg-non-conforme/10">Non conforme</span>
                          ) : (
                            <span className="text-conforme font-medium text-[9px] px-2 py-0.5 rounded-full bg-conforme/10">Conforme</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StockpileModal;
