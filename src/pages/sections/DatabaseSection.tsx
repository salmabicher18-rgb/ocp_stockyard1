import { useState, Fragment } from "react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import type { Stockpile, StockLayer, ChemicalAnalysis, GranulometricFraction } from "@/data/mockData";
import { TAMIS_FRACTIONS, calculateLayerWeightedAvg } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Database, Layers, Droplets, ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";

interface DatabaseSectionProps {
  rawStockpiles: Stockpile[];
  washedStockpiles: Stockpile[];
  onAddLayer: (stockpileId: string, layer: Omit<StockLayer, "id">) => void;
  onDeleteLayer: (stockpileId: string, layerId: string) => void;
  onEditLayer: (stockpileId: string, layerId: string, layer: Omit<StockLayer, "id">) => void;
}

const emptyFractions = (): Record<string, { poids: string; BPL: string; CO2: string; SiO2: string; MgO: string; Cd: string }> =>
  Object.fromEntries(TAMIS_FRACTIONS.map(t => [t, { poids: "", BPL: "", CO2: "", SiO2: "", MgO: "", Cd: "" }]));

const DatabaseSection = ({ rawStockpiles, washedStockpiles, onAddLayer, onDeleteLayer, onEditLayer }: DatabaseSectionProps) => {
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<"raw" | "washed">("raw");
  const [selectedStockpileId, setSelectedStockpileId] = useState("");
  const [date, setDate] = useState("");
  const [tonnage, setTonnage] = useState("");
  const [source, setSource] = useState("");
  const [h2o, setH2o] = useState("");
  const [deleteLayerTarget, setDeleteLayerTarget] = useState<{ stockpileId: string; layerId: string } | null>(null);
  const [bpl, setBpl] = useState("");
  const [co2, setCo2] = useState("");
  const [sio2, setSio2] = useState("");
  const [mgo, setMgo] = useState("");
  const [cd, setCd] = useState("");
  const [fractions, setFractions] = useState(emptyFractions());

  // For expand/collapse layers
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  // For editing
  const [editingLayer, setEditingLayer] = useState<{ stockpileId: string; layerId: string } | null>(null);
  // For detail view dialog
  const [detailLayer, setDetailLayer] = useState<{ layer: StockLayer; stockpileName: string } | null>(null);

  const resetForm = () => {
    setSelectedStockpileId(""); setDate(""); setTonnage(""); setSource(""); setH2o("");
    setBpl(""); setCo2(""); setSio2(""); setMgo(""); setCd("");
    setFractions(emptyFractions()); setEditingLayer(null);
  };

  const updateFraction = (tamis: string, field: string, value: string) => {
    setFractions(prev => ({ ...prev, [tamis]: { ...prev[tamis], [field]: value } }));
  };

  const toggleExpand = (layerId: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId); else next.add(layerId);
      return next;
    });
  };

  const buildRawLayer = (): Omit<StockLayer, "id"> => {
    const grano: GranulometricFraction[] = TAMIS_FRACTIONS.map(tamis => ({
      tamis, poids: parseFloat(fractions[tamis].poids) || 0,
      BPL: fractions[tamis].BPL ? parseFloat(fractions[tamis].BPL) : null,
      CO2: fractions[tamis].CO2 ? parseFloat(fractions[tamis].CO2) : null,
      SiO2: fractions[tamis].SiO2 ? parseFloat(fractions[tamis].SiO2) : null,
      MgO: fractions[tamis].MgO ? parseFloat(fractions[tamis].MgO) : null,
      Cd: fractions[tamis].Cd ? parseFloat(fractions[tamis].Cd) : null,
    }));
    // Chemistry = weighted avg from fractions: SUMPRODUCT(poids, param) / SUM(poids)
    const chemistry = calculateLayerWeightedAvg(grano);
    chemistry.H2O = h2o ? parseFloat(h2o) : null;
    return { date, tonnage: parseFloat(tonnage), chemistry, granulometry: grano };
  };

  const buildWashedLayer = (): Omit<StockLayer, "id"> => {
    const chemistry: ChemicalAnalysis = {
      BPL: bpl ? parseFloat(bpl) : null, CO2: co2 ? parseFloat(co2) : null,
      SiO2: sio2 ? parseFloat(sio2) : null, MgO: mgo ? parseFloat(mgo) : null,
      Cd: cd ? parseFloat(cd) : null, H2O: h2o ? parseFloat(h2o) : null,
    };
    return { date, tonnage: parseFloat(tonnage), chemistry, ...(source ? { sourceStockpile: source } : {}) };
  };

  const handleAdd = () => {
    if (!selectedStockpileId || !date || !tonnage) return;
    const layer = addType === "raw" ? buildRawLayer() : buildWashedLayer();
    onAddLayer(selectedStockpileId, layer);
    resetForm(); setAddOpen(false);
  };

  const handleEdit = (stockpileId: string, layer: StockLayer, type: "raw" | "washed") => {
    setEditingLayer({ stockpileId, layerId: layer.id });
    setAddType(type);
    setSelectedStockpileId(stockpileId);
    setDate(layer.date);
    setTonnage(layer.tonnage.toString());
    setH2o(layer.chemistry.H2O?.toString() ?? "");
    if (type === "raw" && layer.granulometry) {
      const f = emptyFractions();
      layer.granulometry.forEach(g => {
        f[g.tamis] = {
          poids: g.poids.toString(), BPL: g.BPL?.toString() ?? "", CO2: g.CO2?.toString() ?? "",
          SiO2: g.SiO2?.toString() ?? "", MgO: g.MgO?.toString() ?? "", Cd: g.Cd?.toString() ?? "",
        };
      });
      setFractions(f);
    } else {
      setBpl(layer.chemistry.BPL?.toString() ?? "");
      setCo2(layer.chemistry.CO2?.toString() ?? "");
      setSio2(layer.chemistry.SiO2?.toString() ?? "");
      setMgo(layer.chemistry.MgO?.toString() ?? "");
      setCd(layer.chemistry.Cd?.toString() ?? "");
      setSource(layer.sourceStockpile ?? "");
    }
    setAddOpen(true);
  };

  const handleSave = () => {
    if (!selectedStockpileId || !date || !tonnage) return;
    const layer = addType === "raw" ? buildRawLayer() : buildWashedLayer();
    if (editingLayer) {
      onEditLayer(editingLayer.stockpileId, editingLayer.layerId, layer);
    } else {
      onAddLayer(selectedStockpileId, layer);
    }
    resetForm(); setAddOpen(false);
  };

  // Render raw layers table with expandable rows
  const renderRawLayersTable = () => {
    const allLayers = rawStockpiles.filter(sp => sp.inStockyard).flatMap(sp =>
      sp.layers.map(l => ({ ...l, stockpileName: sp.name, stockpileId: sp.id }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted">
                <th className="px-2 py-2 w-6"></th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Tas</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Date</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Tonnage</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">BPL %</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">CO2 %</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">SiO2 %</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">MgO %</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Cd ppm</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">H2O %</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allLayers.map((layer) => {
                const isExpanded = expandedLayers.has(layer.id);
                const hasGrano = layer.granulometry && layer.granulometry.length > 0;
                return (
                  <Fragment key={layer.id}>
                    <tr className="border-t border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => hasGrano && toggleExpand(layer.id)}>
                      <td className="px-2 py-2 text-muted-foreground">
                        {hasGrano && (isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
                      </td>
                      <td className="px-3 py-2 font-medium text-foreground">{layer.stockpileName}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{new Date(layer.date).toLocaleDateString("fr-FR")}</td>
                      <td className="px-3 py-2 text-right font-mono">{layer.tonnage.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-mono">{layer.chemistry.BPL?.toFixed(2) ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{layer.chemistry.CO2?.toFixed(2) ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{layer.chemistry.SiO2?.toFixed(2) ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{layer.chemistry.MgO?.toFixed(2) ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{layer.chemistry.Cd?.toFixed(2) ?? "—"}</td>
                      <td className="px-3 py-2 text-right font-mono">{layer.chemistry.H2O ?? "—"}</td>
                      <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(layer.stockpileId, layer, "raw")}
                            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteLayerTarget({ stockpileId: layer.stockpileId, layerId: layer.id })}
                            className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && hasGrano && (
                      <tr>
                        <td colSpan={11} className="p-0">
                          <div className="bg-muted/30 px-6 py-2">
                            <table className="w-full text-[10px]">
                              <thead>
                                <tr className="text-muted-foreground">
                                  <th className="px-2 py-1 text-left font-semibold">Tranche</th>
                                  <th className="px-2 py-1 text-right font-semibold">POIDS %</th>
                                  <th className="px-2 py-1 text-right font-semibold">BPL %</th>
                                  <th className="px-2 py-1 text-right font-semibold">CO2 %</th>
                                  <th className="px-2 py-1 text-right font-semibold">SiO2 %</th>
                                  <th className="px-2 py-1 text-right font-semibold">MgO %</th>
                                  <th className="px-2 py-1 text-right font-semibold">Cd ppm</th>
                                </tr>
                              </thead>
                              <tbody>
                                {layer.granulometry!.map(g => (
                                  <tr key={g.tamis} className="border-t border-border/30">
                                    <td className="px-2 py-1 font-medium">{g.tamis}</td>
                                    <td className="px-2 py-1 text-right font-mono">{g.poids.toFixed(2)}</td>
                                    <td className="px-2 py-1 text-right font-mono">{g.BPL?.toFixed(2) ?? "—"}</td>
                                    <td className="px-2 py-1 text-right font-mono">{g.CO2?.toFixed(2) ?? "—"}</td>
                                    <td className="px-2 py-1 text-right font-mono">{g.SiO2?.toFixed(2) ?? "—"}</td>
                                    <td className="px-2 py-1 text-right font-mono">{g.MgO?.toFixed(2) ?? "—"}</td>
                                    <td className="px-2 py-1 text-right font-mono">{g.Cd?.toFixed(2) ?? "—"}</td>
                                  </tr>
                                ))}
                                <tr className="border-t border-primary/30 bg-primary/5 font-semibold text-primary">
                                  <td className="px-2 py-1" colSpan={2}>Moy pondérée</td>
                                  <td className="px-2 py-1 text-right font-mono">{layer.chemistry.BPL?.toFixed(2) ?? "—"}</td>
                                  <td className="px-2 py-1 text-right font-mono">{layer.chemistry.CO2?.toFixed(2) ?? "—"}</td>
                                  <td className="px-2 py-1 text-right font-mono">{layer.chemistry.SiO2?.toFixed(2) ?? "—"}</td>
                                  <td className="px-2 py-1 text-right font-mono">{layer.chemistry.MgO?.toFixed(2) ?? "—"}</td>
                                  <td className="px-2 py-1 text-right font-mono">{layer.chemistry.Cd?.toFixed(2) ?? "—"}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {allLayers.length === 0 && (
                <tr><td colSpan={11} className="px-3 py-6 text-center text-muted-foreground text-sm">Aucune layer</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render washed layers table (simple)
  const renderWashedLayersTable = () => {
    const allLayers = washedStockpiles.filter(sp => sp.inStockyard).flatMap(sp =>
      sp.layers.map(l => ({ ...l, stockpileName: sp.name, stockpileId: sp.id }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Tas</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Source</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Date</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Tonnage</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">BPL %</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">CO2 %</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">SiO2 %</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">MgO %</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Cd ppm</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">H2O %</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allLayers.map((layer) => (
                <tr key={layer.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium text-foreground">{layer.stockpileName}</td>
                  <td className="px-3 py-2 text-muted-foreground text-[10px]">{rawStockpiles.find(r => r.id === layer.sourceStockpile)?.name || layer.sourceStockpile || "—"}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{new Date(layer.date).toLocaleDateString("fr-FR")}</td>
                  <td className="px-3 py-2 text-right font-mono">{layer.tonnage.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-mono">{layer.chemistry.BPL?.toFixed(2) ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{layer.chemistry.CO2?.toFixed(2) ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{layer.chemistry.SiO2?.toFixed(2) ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{layer.chemistry.MgO?.toFixed(2) ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{layer.chemistry.Cd?.toFixed(2) ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{layer.chemistry.H2O ?? "—"}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(layer.stockpileId, layer, "washed")}
                        className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteLayerTarget({ stockpileId: layer.stockpileId, layerId: layer.id })}
                        className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {allLayers.length === 0 && (
                <tr><td colSpan={11} className="px-3 py-6 text-center text-muted-foreground text-sm">Aucune layer</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Base de données — Layers journalières</h3>
      </div>

      <Tabs defaultValue="raw" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="raw" className="flex items-center gap-1.5 text-xs">
            <Layers className="w-3.5 h-3.5" /> Stock Brut
          </TabsTrigger>
          <TabsTrigger value="washed" className="flex items-center gap-1.5 text-xs">
            <Droplets className="w-3.5 h-3.5" /> Stock Lavé
          </TabsTrigger>
        </TabsList>
        <TabsContent value="raw" className="space-y-3 mt-3">
          <div className="flex justify-end">
            <Button size="sm" className="text-xs" onClick={() => { resetForm(); setAddType("raw"); setAddOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Nouvelle Layer (Brut)
            </Button>
          </div>
          {renderRawLayersTable()}
        </TabsContent>
        <TabsContent value="washed" className="space-y-3 mt-3">
          <div className="flex justify-end">
            <Button size="sm" className="text-xs" onClick={() => { resetForm(); setAddType("washed"); setAddOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Nouvelle Layer (Lavé)
            </Button>
          </div>
          {renderWashedLayersTable()}
        </TabsContent>
      </Tabs>

      {/* Add/Edit layer dialog */}
      <Dialog open={addOpen} onOpenChange={o => { if (!o) { setAddOpen(false); resetForm(); } }}>
        <DialogContent className={`${addType === "raw" ? "sm:max-w-3xl" : "sm:max-w-lg"} max-h-[85vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingLayer ? "Modifier la Layer" : "Nouvelle Layer"} — {addType === "raw" ? "Stock Brut" : "Stock Lavé"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Tas</Label>
              <Select value={selectedStockpileId} onValueChange={setSelectedStockpileId} disabled={!!editingLayer}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sélectionner un tas" /></SelectTrigger>
                <SelectContent>
                  {(addType === "raw" ? rawStockpiles : washedStockpiles).map(sp => (
                    <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Tonnage</Label>
                <Input type="number" min={0} value={tonnage} onChange={e => setTonnage(e.target.value)} placeholder="Ex: 4200" className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">H2O %</Label>
                <Input type="number" step="0.01" value={h2o} onChange={e => setH2o(e.target.value)} className="mt-1 text-sm" />
              </div>
            </div>

            {addType === "washed" && (
              <>
                <div>
                  <Label className="text-xs">Source (tas brut)</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sélectionner la source" /></SelectTrigger>
                    <SelectContent>
                      {rawStockpiles.map(rsp => (<SelectItem key={rsp.id} value={rsp.name}>{rsp.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs">BPL %</Label><Input type="number" step="0.01" value={bpl} onChange={e => setBpl(e.target.value)} className="mt-1 text-sm" /></div>
                  <div><Label className="text-xs">CO2 %</Label><Input type="number" step="0.01" value={co2} onChange={e => setCo2(e.target.value)} className="mt-1 text-sm" /></div>
                  <div><Label className="text-xs">SiO2 %</Label><Input type="number" step="0.01" value={sio2} onChange={e => setSio2(e.target.value)} className="mt-1 text-sm" /></div>
                  <div><Label className="text-xs">MgO %</Label><Input type="number" step="0.01" value={mgo} onChange={e => setMgo(e.target.value)} className="mt-1 text-sm" /></div>
                  <div><Label className="text-xs">Cd ppm</Label><Input type="number" step="0.01" value={cd} onChange={e => setCd(e.target.value)} className="mt-1 text-sm" /></div>
                </div>
              </>
            )}

            {addType === "raw" && (
              <div>
                <Label className="text-xs font-semibold">Fractions granulométriques (TAMIS)</Label>
                <div className="mt-2 border border-border rounded-md overflow-hidden">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Tranche</th>
                        <th className="px-2 py-1.5 text-center font-semibold text-muted-foreground">POIDS %</th>
                        <th className="px-2 py-1.5 text-center font-semibold">BPL %</th>
                        <th className="px-2 py-1.5 text-center font-semibold">CO2 %</th>
                        <th className="px-2 py-1.5 text-center font-semibold">SiO2 %</th>
                        <th className="px-2 py-1.5 text-center font-semibold">MgO %</th>
                        <th className="px-2 py-1.5 text-center font-semibold">Cd ppm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TAMIS_FRACTIONS.map(tamis => (
                        <tr key={tamis} className="border-t border-border">
                          <td className="px-2 py-1 font-medium text-foreground">{tamis}</td>
                          {(["poids", "BPL", "CO2", "SiO2", "MgO", "Cd"] as const).map(field => (
                            <td key={field} className="px-1 py-0.5">
                              <Input type="number" step="0.01" value={fractions[tamis]?.[field] ?? ""}
                                onChange={e => updateFraction(tamis, field, e.target.value)}
                                className="h-6 text-[10px] text-center px-1" />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Button onClick={handleSave} className="w-full text-xs" size="sm">
              {editingLayer ? "Enregistrer les modifications" : "Ajouter la layer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={!!deleteLayerTarget}
        onOpenChange={(open) => !open && setDeleteLayerTarget(null)}
        onConfirm={() => {
          if (deleteLayerTarget) {
            onDeleteLayer(deleteLayerTarget.stockpileId, deleteLayerTarget.layerId);
            setDeleteLayerTarget(null);
          }
        }}
        description="Cette couche et ses fractions granulométriques seront supprimées définitivement. Cette action est irréversible."
      />
    </div>
  );
};


export default DatabaseSection;
