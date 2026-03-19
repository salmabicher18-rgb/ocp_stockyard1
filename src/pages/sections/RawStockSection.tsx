import { useState, useCallback } from "react";
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

interface RawStockSectionProps {
  stockpiles: Stockpile[];
  machines: Machine[];
  matrices: TargetMatrix[];
  onAddStockpile: (stockpile: Omit<Stockpile, "id" | "layers" | "averageChemistry">) => void;
  onDeleteStockpile: (id: string) => void;
  onUpdateStockpile: (id: string, updates: Partial<Stockpile>) => void;
}

const RawStockSection = ({ stockpiles, machines, matrices, onAddStockpile, onDeleteStockpile, onUpdateStockpile }: RawStockSectionProps) => {
  const [selectedStockpile, setSelectedStockpile] = useState<Stockpile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formTonnage, setFormTonnage] = useState("");
  const [formStorageMode, setFormStorageMode] = useState<"chevron" | "cone">("chevron");
  const [formStatus, setFormStatus] = useState<"en_cours" | "caracterise">("en_cours");
  const [formInStockyard, setFormInStockyard] = useState(true);

  const resetForm = () => { setFormName(""); setFormStart(""); setFormEnd(""); setFormTonnage(""); setFormStorageMode("chevron"); setFormStatus("en_cours"); setFormInStockyard(true); };

  const handleAdd = () => {
    if (!formName || !formStart || !formEnd || !formTonnage) return;
    onAddStockpile({
      name: formName, type: "raw",
      startPosition: parseFloat(formStart), endPosition: parseFloat(formEnd),
      totalTonnage: parseFloat(formTonnage), unit: "THC",
      status: formStatus, storageMode: formStorageMode, inStockyard: formInStockyard,
    });
    resetForm(); setAddOpen(false);
  };

  const handleEdit = (sp: Stockpile) => {
    setEditId(sp.id); setFormName(sp.name);
    setFormStart(sp.startPosition.toString()); setFormEnd(sp.endPosition.toString());
    setFormTonnage(sp.totalTonnage.toString()); setFormStorageMode(sp.storageMode || "chevron");
    setFormStatus(sp.status); setFormInStockyard(sp.inStockyard); setAddOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editId || !formName || !formStart || !formEnd || !formTonnage) return;
    // If toggling off inStockyard, show confirmation first
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
      totalTonnage: parseFloat(formTonnage), storageMode: formStorageMode, status: formStatus, inStockyard: formInStockyard,
    });
    resetForm(); setEditId(null); setAddOpen(false);
  };

  const getConformityStatus = (sp: Stockpile): "conforme" | "non_conforme" => {
    const avg = sp.averageChemistry ?? calculateWeightedAverage(sp.layers);
    const matchingMatrices = matrices.filter(m => m.type === "brut");
    if (matchingMatrices.length === 0) return "non_conforme";
    const target = matchingMatrices[0];
    const checks: boolean[] = [];
    if (avg.BPL !== null && target.profileDemande.BPL !== null) checks.push(avg.BPL >= target.profileDemande.BPL);
    if (avg.MgO !== null && target.profileDemande.MgO !== null) checks.push(avg.MgO <= target.profileDemande.MgO);
    if (avg.SiO2 !== null && target.profileDemande.SiO2 !== null) checks.push(avg.SiO2 <= target.profileDemande.SiO2);
    if (avg.Cd !== null && target.profileDemande.Cd !== null) checks.push(avg.Cd <= target.profileDemande.Cd);
    if (checks.length === 0) return "non_conforme";
    return checks.every(Boolean) ? "conforme" : "non_conforme";
  };

  const visibleStockpiles = stockpiles.filter(sp => sp.inStockyard);

  return (
    <div className="space-y-4">
      <StockArea title="Stock du Produit Brut" type="raw" stockpiles={visibleStockpiles} machines={machines}
        onStockpileClick={(sp) => { setSelectedStockpile(sp); setModalOpen(true); }} />

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">Tableau récapitulatif — Stock Brut</h3>
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
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Position (m)</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Tonnage (THC)</th>
                
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Mode</th>
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
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">{sp.startPosition}m → {sp.endPosition}m</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-foreground">{sp.totalTonnage.toLocaleString()}</td>
                    
                    <td className="px-3 py-2 text-center">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground">
                        {(sp.storageMode || "chevron") === "chevron" ? "Chevron" : "Cône"}
                      </span>
                    </td>
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
                <tr><td colSpan={9} className="px-3 py-6 text-center text-muted-foreground text-sm">Aucun tas brut</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditId(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{editId ? "Modifier le tas" : "Nouveau Tas Brut"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nom du tas</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Tas Brut MPII N°5" className="mt-1 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Début (m)</Label>
                <Input type="number" min={0} max={500} value={formStart} onChange={e => setFormStart(e.target.value)} placeholder="Ex: 180" className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Fin (m)</Label>
                <Input type="number" min={0} max={500} value={formEnd} onChange={e => setFormEnd(e.target.value)} placeholder="Ex: 100" className="mt-1 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Tonnage (THC)</Label>
              <Input type="number" min={0} value={formTonnage} onChange={e => setFormTonnage(e.target.value)} placeholder="Ex: 18500" className="mt-1 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Mode de stockage</Label>
                <Select value={formStorageMode} onValueChange={(v: "chevron" | "cone") => setFormStorageMode(v)}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chevron">Chevron (Trapèze)</SelectItem>
                    <SelectItem value="cone">Cône</SelectItem>
                  </SelectContent>
                </Select>
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
        description="Ce tas brut et toutes ses couches seront supprimés définitivement. Cette action est irréversible."
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

export default RawStockSection;
