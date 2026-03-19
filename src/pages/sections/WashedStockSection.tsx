import { useState } from "react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import type { Stockpile, Machine, TargetMatrix } from "@/data/mockData";
import { calculateWeightedAverage } from "@/data/mockData";
import StockArea from "@/components/stockyard/StockArea";
import StockpileModal from "@/components/stockyard/StockpileModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Clock, Eye, EyeOff } from "lucide-react";

interface WashedStockSectionProps {
  stockpiles: Stockpile[];
  rawStockpiles: Stockpile[];
  machines: Machine[];
  matrices: TargetMatrix[];
  onAddStockpile: (stockpile: Omit<Stockpile, "id" | "layers" | "averageChemistry">) => void;
  onDeleteStockpile: (id: string) => void;
  onUpdateStockpile: (id: string, updates: Partial<Stockpile>) => void;
}

const WashedStockSection = ({ stockpiles, rawStockpiles, machines, matrices, onAddStockpile, onDeleteStockpile, onUpdateStockpile }: WashedStockSectionProps) => {
  const [selectedStockpile, setSelectedStockpile] = useState<Stockpile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formTonnage, setFormTonnage] = useState("");
  const [formSource, setFormSource] = useState("");
  const [formStatus, setFormStatus] = useState<"en_cours" | "caracterise">("en_cours");
  const [formInStockyard, setFormInStockyard] = useState(true);

  const resetForm = () => { setFormName(""); setFormStart(""); setFormEnd(""); setFormTonnage(""); setFormSource(""); setFormStatus("en_cours"); setFormInStockyard(true); };

  const handleAdd = () => {
    if (!formName || !formStart || !formEnd || !formTonnage) return;
    onAddStockpile({
      name: formName, type: "washed",
      startPosition: parseFloat(formStart), endPosition: parseFloat(formEnd),
      totalTonnage: parseFloat(formTonnage), unit: "TSM", status: formStatus,
      qualitySource: formSource || undefined, inStockyard: formInStockyard,
    });
    resetForm(); setAddOpen(false);
  };

  const handleEdit = (sp: Stockpile) => {
    setEditId(sp.id); setFormName(sp.name);
    setFormStart(sp.startPosition.toString()); setFormEnd(sp.endPosition.toString());
    setFormTonnage(sp.totalTonnage.toString()); setFormSource(sp.qualitySource || "");
    setFormStatus(sp.status); setFormInStockyard(sp.inStockyard); setAddOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editId || !formName || !formStart || !formEnd || !formTonnage) return;
    const currentSp = stockpiles.find(s => s.id === editId);
    if (currentSp?.inStockyard && !formInStockyard) {
      setArchiveConfirmOpen(true);
      return;
    }
    doSaveEdit();
  };

  const doSaveEdit = () => {
    if (!editId) return;
    onUpdateStockpile(editId, {
      name: formName, startPosition: parseFloat(formStart), endPosition: parseFloat(formEnd),
      totalTonnage: parseFloat(formTonnage), qualitySource: formSource || undefined, status: formStatus, inStockyard: formInStockyard,
    });
    resetForm(); setEditId(null); setAddOpen(false);
  };

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

  const getConformityStatus = (sp: Stockpile): "conforme" | "non_conforme" => {
    const avg = sp.averageChemistry ?? calculateWeightedAverage(sp.layers);
    // Use all matrices (they all have produitFini for washed)
    if (matrices.length === 0) return "non_conforme";
    const target = matrices[0];
    const pf = target.produitFini;
    const checks: boolean[] = [];
    if (avg.BPL !== null && pf.BPL && pf.BPL !== "-") checks.push(!isNonConformePF(avg.BPL, pf.BPL));
    if (avg.CO2 !== null && pf.CO2 && pf.CO2 !== "-") checks.push(!isNonConformePF(avg.CO2, pf.CO2));
    if (avg.MgO !== null && pf.MgO && pf.MgO !== "-") checks.push(!isNonConformePF(avg.MgO, pf.MgO));
    if (avg.SiO2 !== null && pf.SiO2 && pf.SiO2 !== "-") checks.push(!isNonConformePF(avg.SiO2, pf.SiO2));
    if (avg.Cd !== null && pf.Cd && pf.Cd !== "-") checks.push(!isNonConformePF(avg.Cd, pf.Cd));
    if (checks.length === 0) return "non_conforme";
    return checks.every(Boolean) ? "conforme" : "non_conforme";
  };

  return (
    <div className="space-y-4">
      <StockArea title="Stock des Produits Finis (Lavé)" type="washed" stockpiles={stockpiles.filter(sp => sp.inStockyard)} machines={machines}
        onStockpileClick={(sp) => { setSelectedStockpile(sp); setModalOpen(true); }} />

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">Tableau récapitulatif — Stock Lavé</h3>
        <Button size="sm" className="text-xs" onClick={() => { resetForm(); setEditId(null); setAddOpen(true); }}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Nouveau Tas
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Nom du Tas</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Source</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Position (m)</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Tonnage (TSM)</th>
                
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Statut</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Au stockyard</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Conformité</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockpiles.filter(sp => sp.inStockyard).map((sp) => {
                const conformity = getConformityStatus(sp);
                const avg = sp.averageChemistry ?? calculateWeightedAverage(sp.layers);
                return (
                  <tr key={sp.id} className="border-t border-border hover:bg-muted/50">
                    <td className="px-3 py-2 font-medium text-foreground">{sp.name}</td>
                    <td className="px-3 py-2 text-muted-foreground text-[10px]">{sp.qualitySource || "—"}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">{sp.startPosition}m → {sp.endPosition}m</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-foreground">{sp.totalTonnage.toLocaleString()}</td>
                    
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        sp.status === "caracterise" ? "bg-conforme/15 text-conforme" : "bg-hors-tolerance/15 text-hors-tolerance"
                      }`}>
                        {sp.status === "caracterise" ? <><CheckCircle2 className="w-3 h-3" /> Caractérisé</> : <><Clock className="w-3 h-3" /> En cours</>}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => onUpdateStockpile(sp.id, sp.inStockyard ? { inStockyard: false, status: "caracterise" as const } : { inStockyard: true })}
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                          sp.inStockyard ? "bg-conforme/15 text-conforme" : "bg-muted text-muted-foreground"
                        }`}
                        title={sp.inStockyard ? "Retirer du stockyard (archiver)" : "Remettre au stockyard"}
                      >
                        {sp.inStockyard ? <><Eye className="w-3 h-3" /> Oui</> : <><EyeOff className="w-3 h-3" /> Non</>}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        conformity === "conforme" ? "bg-conforme/15 text-conforme" : "bg-non-conforme/15 text-non-conforme"
                      }`}>
                        {conformity === "conforme" ? <><CheckCircle2 className="w-3 h-3" /> Conforme</> :
                         <><XCircle className="w-3 h-3" /> Non conforme</>}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(sp)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(sp.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {stockpiles.length === 0 && (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-muted-foreground text-sm">Aucun tas lavé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditId(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{editId ? "Modifier le tas" : "Nouveau Tas Lavé"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nom du tas</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Tas Lavé MPII N°3" className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Source (tas brut)</Label>
              <Select value={formSource} onValueChange={setFormSource}>
                <SelectTrigger className="mt-1 text-sm"><SelectValue placeholder="Sélectionner la source" /></SelectTrigger>
                <SelectContent>
                  {rawStockpiles.map(rsp => (
                    <SelectItem key={rsp.id} value={rsp.name}>{rsp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Début (m)</Label>
                <Input type="number" min={0} max={500} value={formStart} onChange={e => setFormStart(e.target.value)} placeholder="Ex: 140" className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Fin (m)</Label>
                <Input type="number" min={0} max={500} value={formEnd} onChange={e => setFormEnd(e.target.value)} placeholder="Ex: 60" className="mt-1 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tonnage (TSM)</Label>
                <Input type="number" min={0} value={formTonnage} onChange={e => setFormTonnage(e.target.value)} placeholder="Ex: 6037" className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Statut</Label>
                <Select value={formStatus} onValueChange={(v: "en_cours" | "caracterise") => setFormStatus(v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="caracterise">Caractérisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editId && (
              <div className="flex items-center justify-between px-1">
                <Label className="text-xs">Présent au stockyard</Label>
                <Switch checked={formInStockyard} onCheckedChange={setFormInStockyard} />
              </div>
            )}
            <Button onClick={editId ? handleSaveEdit : handleAdd} className="w-full text-xs" size="sm">
              {editId ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <StockpileModal stockpile={selectedStockpile} open={modalOpen} onClose={() => setModalOpen(false)} matrices={matrices} />
      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { onDeleteStockpile(deleteId); setDeleteId(null); } }}
        description="Ce tas lavé et toutes ses couches seront supprimés définitivement. Cette action est irréversible."
      />
      <ConfirmDeleteDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        onConfirm={() => { setArchiveConfirmOpen(false); doSaveEdit(); }}
        title="Retirer du stockyard"
        description="Ce tas sera retiré de la visualisation du stockyard et archivé dans l'historique. Voulez-vous continuer ?"
      />
    </div>
  );
};

export default WashedStockSection;
