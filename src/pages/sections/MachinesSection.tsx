import { useState } from "react";
import type { Machine, Stockpile } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Cog, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MachinesSectionProps {
  machines: Machine[];
  rawStockpiles: Stockpile[];
  washedStockpiles: Stockpile[];
  onUpdateMachine: (id: string, updates: Partial<Machine>) => void;
}

const MachinesSection = ({ machines, rawStockpiles, washedStockpiles, onUpdateMachine }: MachinesSectionProps) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  const [formPosition, setFormPosition] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formDate, setFormDate] = useState("");
  const [formAssociatedStockpile, setFormAssociatedStockpile] = useState("");

  const handleEdit = (m: Machine) => {
    setEditMachine(m);
    setEditId(m.id);
    setFormPosition(m.position.toString());
    setFormActive(m.active);
    setFormDate(m.dateAdded ? new Date(m.dateAdded).toISOString().slice(0, 10) : "");
    setFormAssociatedStockpile(m.associatedStockpile || "");
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editId) return;
    const pos = parseFloat(formPosition);
    if (isNaN(pos) || pos < 0 || pos > 500) return;
    onUpdateMachine(editId, {
      position: pos,
      active: formActive,
      dateAdded: formDate || undefined,
      associatedStockpile: formAssociatedStockpile || undefined,
    });
    setEditId(null);
    setEditMachine(null);
    setEditOpen(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "—";
    }
  };

  const fixedOrder = [
    { name: "ST110", type: "stacker" as const, line: "raw" as const },
    { name: "RP120", type: "reclaimer" as const, line: "raw" as const },
    { name: "ST110", type: "stacker" as const, line: "washed" as const },
    { name: "RP120", type: "reclaimer" as const, line: "washed" as const },
  ];

  const sortedMachines = fixedOrder.map(def => {
    return machines.find(m => m.name === def.name && m.line === def.line) ?? {
      id: `fixed-${def.name}-${def.line}`,
      name: def.name,
      type: def.type,
      line: def.line,
      position: 0,
      active: true,
    } as Machine;
  });

  // Get stockpiles filtered by line for the edit dialog
  const getStockpilesForLine = (line: "raw" | "washed") => {
    const stockpiles = line === "raw" ? rawStockpiles : washedStockpiles;
    return stockpiles.filter(sp => sp.inStockyard);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Cog className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Gestion des Machines</h3>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">4 machines fixes</span>
      </div>

      <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Nom</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Ligne</th>
                <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Position (m)</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Tas Associé</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Date</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Statut</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Modifier</th>
              </tr>
            </thead>
            <tbody>
              {sortedMachines.map(m => (
                <tr key={m.id} className="border-t border-border hover:bg-muted/50">
                  <td className="px-3 py-2 font-medium text-foreground">{m.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.type === "stacker" ? "Stacker" : "Roue-Pelle"}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${m.line === "raw" ? "bg-conforme/15 text-conforme" : "bg-hors-tolerance/15 text-hors-tolerance"}`}>
                      {m.line === "raw" ? "Stock Brut" : "Stock Lavé"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{m.position}m</td>
                  <td className="px-3 py-2 text-left">
                    {m.associatedStockpile ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        {m.associatedStockpile}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-muted-foreground">{formatDate(m.dateAdded)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${m.active ? "bg-conforme/15 text-conforme" : "bg-muted text-muted-foreground"}`}>
                      {m.active ? <><CheckCircle2 className="w-3 h-3" /> Actif</> : <><XCircle className="w-3 h-3" /> Inactif</>}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => handleEdit(m)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={o => { if (!o) { setEditOpen(false); setEditId(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Modifier la machine</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Machine</Label>
              <Input value={editMachine ? `${editMachine.name} — ${editMachine.type === "stacker" ? "Stacker" : "Roue-Pelle"} — ${editMachine.line === "raw" ? "Stock Brut" : "Stock Lavé"}` : ""} readOnly className="mt-1 text-sm bg-muted" />
            </div>
            <div>
              <Label className="text-xs">Position (0 - 500 m)</Label>
              <Input type="number" min={0} max={500} value={formPosition} onChange={e => setFormPosition(e.target.value)} placeholder="Ex: 250" className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Tas Associé</Label>
              <Select value={formAssociatedStockpile} onValueChange={setFormAssociatedStockpile}>
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue placeholder="Sélectionner un tas..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucun</SelectItem>
                  {editMachine && getStockpilesForLine(editMachine.line).map(sp => (
                    <SelectItem key={sp.id} value={sp.name}>{sp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="mt-1 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)} id="machine-active" className="rounded" />
              <Label htmlFor="machine-active" className="text-xs">Machine active</Label>
            </div>
            <Button onClick={() => {
              if (formAssociatedStockpile === "__none__") setFormAssociatedStockpile("");
              handleSaveEdit();
            }} className="w-full text-xs" size="sm">Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MachinesSection;
