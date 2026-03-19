import { useState } from "react";
import type { TargetMatrix, TargetMatrixRow } from "@/data/mockData";
import { TAMIS_FRACTIONS } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Target, Layers, Droplets } from "lucide-react";

interface TargetMatrixSectionProps {
  matrices: TargetMatrix[];
  onAddMatrix: (matrix: TargetMatrix) => void;
  onDeleteMatrix: (name: string) => void;
  onUpdateMatrix: (name: string, matrix: TargetMatrix) => void;
}

const FRACTION_NAMES = ["Sup à 3150", "3150-200", "200-40", "Inf 40"];

const emptyRow = (fraction: string): TargetMatrixRow => ({
  fraction, weightMin: null, weightMoy: null, weightMax: null,
  BPLMin: null, BPLMax: null, CO2Min: null, CO2Max: null,
  MgOMin: null, MgOMax: null, SiO2Min: null, SiO2Max: null, CdMin: null, CdMax: null,
});

const TargetMatrixSection = ({ matrices, onAddMatrix, onDeleteMatrix, onUpdateMatrix }: TargetMatrixSectionProps) => {
  const [addOpen, setAddOpen] = useState(false);
  const [editName, setEditName] = useState<string | null>(null);
  const [formType, setFormType] = useState<"brut" | "lave">("brut");

  const [formName, setFormName] = useState("");
  // Brut: per-fraction rows
  const [formRows, setFormRows] = useState<TargetMatrixRow[]>(FRACTION_NAMES.map(f => emptyRow(f)));
  // Profile demandé
  const [profileBPL, setProfileBPL] = useState("");
  const [profileCO2, setProfileCO2] = useState("");
  const [profileSiO2, setProfileSiO2] = useState("");
  const [profileMgO, setProfileMgO] = useState("");
  const [profileCd, setProfileCd] = useState("");
  // Produit fini
  const [finiBPL, setFiniBPL] = useState("");
  const [finiCO2, setFiniCO2] = useState("");
  const [finiSiO2, setFiniSiO2] = useState("");
  const [finiMgO, setFiniMgO] = useState("");
  const [finiCd, setFiniCd] = useState("");
  // Lavé: simple global limits
  const [bplMin, setBplMin] = useState(""); const [bplMax, setBplMax] = useState("");
  const [co2Min, setCo2Min] = useState(""); const [co2Max, setCo2Max] = useState("");
  const [sio2Min, setSio2Min] = useState(""); const [sio2Max, setSio2Max] = useState("");
  const [mgoMin, setMgoMin] = useState(""); const [mgoMax, setMgoMax] = useState("");
  const [cdMin, setCdMin] = useState(""); const [cdMax, setCdMax] = useState("");

  const brutMatrices = matrices.filter(m => m.type === "brut");
  const laveMatrices = matrices.filter(m => m.type === "lave");

  const resetForm = () => {
    setFormName(""); setEditName(null);
    setFormRows(FRACTION_NAMES.map(f => emptyRow(f)));
    setProfileBPL(""); setProfileCO2(""); setProfileSiO2(""); setProfileMgO(""); setProfileCd("");
    setFiniBPL(""); setFiniCO2(""); setFiniSiO2(""); setFiniMgO(""); setFiniCd("");
    setBplMin(""); setBplMax(""); setCo2Min(""); setCo2Max("");
    setSio2Min(""); setSio2Max(""); setMgoMin(""); setMgoMax("");
    setCdMin(""); setCdMax("");
  };

  const updateRowField = (idx: number, field: keyof TargetMatrixRow, value: string) => {
    setFormRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value ? parseFloat(value) : null } : r));
  };

  const buildMatrix = (): TargetMatrix => {
    if (formType === "brut") {
      return {
        name: formName,
        type: "brut",
        rows: formRows,
        profileDemande: {
          BPL: profileBPL ? parseFloat(profileBPL) : null,
          CO2: profileCO2 ? parseFloat(profileCO2) : null,
          SiO2: profileSiO2 ? parseFloat(profileSiO2) : null,
          MgO: profileMgO ? parseFloat(profileMgO) : null,
          Cd: profileCd ? parseFloat(profileCd) : null,
        },
        produitFini: {
          BPL: finiBPL || "-", CO2: finiCO2 || "-",
          SiO2: finiSiO2 || "-", MgO: finiMgO || "-", Cd: finiCd || "-",
        },
      };
    }
    return {
      name: formName,
      type: "lave",
      rows: [{
        fraction: "Global",
        weightMin: null, weightMoy: null, weightMax: null,
        BPLMin: bplMin ? parseFloat(bplMin) : null, BPLMax: bplMax ? parseFloat(bplMax) : null,
        CO2Min: co2Min ? parseFloat(co2Min) : null, CO2Max: co2Max ? parseFloat(co2Max) : null,
        SiO2Min: sio2Min ? parseFloat(sio2Min) : null, SiO2Max: sio2Max ? parseFloat(sio2Max) : null,
        MgOMin: mgoMin ? parseFloat(mgoMin) : null, MgOMax: mgoMax ? parseFloat(mgoMax) : null,
        CdMin: cdMin ? parseFloat(cdMin) : null, CdMax: cdMax ? parseFloat(cdMax) : null,
      }],
      profileDemande: {
        BPL: bplMin ? parseFloat(bplMin) : null,
        CO2: co2Max ? parseFloat(co2Max) : null,
        SiO2: sio2Max ? parseFloat(sio2Max) : null,
        MgO: mgoMax ? parseFloat(mgoMax) : null,
        Cd: cdMax ? parseFloat(cdMax) : null,
      },
      produitFini: {
        BPL: bplMin ? `> ${bplMin}` : "-", CO2: co2Max ? `< ${co2Max}` : "-",
        MgO: mgoMax ? `< ${mgoMax}` : "-", SiO2: sio2Max ? `< ${sio2Max}` : "-",
        Cd: cdMax ? `< ${cdMax}` : "-",
      },
    };
  };

  const handleSave = () => {
    if (!formName) return;
    if (editName) {
      onUpdateMatrix(editName, buildMatrix());
    } else {
      onAddMatrix(buildMatrix());
    }
    resetForm();
    setAddOpen(false);
  };

  const handleEditBrut = (matrix: TargetMatrix) => {
    setEditName(matrix.name);
    setFormType("brut");
    setFormName(matrix.name);
    setFormRows(FRACTION_NAMES.map(f => {
      const existing = matrix.rows.find(r => r.fraction === f);
      return existing || emptyRow(f);
    }));
    setProfileBPL(matrix.profileDemande.BPL?.toString() || "");
    setProfileCO2(matrix.profileDemande.CO2?.toString() || "");
    setProfileSiO2(matrix.profileDemande.SiO2?.toString() || "");
    setProfileMgO(matrix.profileDemande.MgO?.toString() || "");
    setProfileCd(matrix.profileDemande.Cd?.toString() || "");
    setFiniBPL(matrix.produitFini.BPL); setFiniCO2(matrix.produitFini.CO2);
    setFiniSiO2(matrix.produitFini.SiO2); setFiniMgO(matrix.produitFini.MgO);
    setFiniCd(matrix.produitFini.Cd);
    setAddOpen(true);
  };

  const handleEditLave = (matrix: TargetMatrix) => {
    setEditName(matrix.name);
    setFormType("lave");
    setFormName(matrix.name);
    const row = matrix.rows[0];
    if (row) {
      setBplMin(row.BPLMin?.toString() || ""); setBplMax(row.BPLMax?.toString() || "");
      setCo2Min(row.CO2Min?.toString() || ""); setCo2Max(row.CO2Max?.toString() || "");
      setSio2Min(row.SiO2Min?.toString() || ""); setSio2Max(row.SiO2Max?.toString() || "");
      setMgoMin(row.MgOMin?.toString() || ""); setMgoMax(row.MgOMax?.toString() || "");
      setCdMin(row.CdMin?.toString() || ""); setCdMax(row.CdMax?.toString() || "");
    }
    setAddOpen(true);
  };

  const renderMatrixCard = (matrix: TargetMatrix) => (
    <div key={matrix.name} className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
      <div className="flex items-center justify-between bg-primary/10 px-3 py-2">
        <span className="text-xs font-semibold text-primary">{matrix.name}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => matrix.type === "brut" ? handleEditBrut(matrix) : handleEditLave(matrix)}
            className="p-1 rounded hover:bg-primary/20 transition-colors text-primary">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDeleteMatrix(matrix.name)}
            className="p-1 rounded hover:bg-destructive/10 transition-colors text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-muted">
              <th className="px-2 py-1.5 text-left font-semibold text-muted-foreground">Fraction</th>
              {matrix.type === "brut" && (
                <>
                  <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Poids Min</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Moy</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Max</th>
                </>
              )}
              <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">BPL Min</th>
              <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">BPL Max</th>
              <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">CO2 Min</th>
              <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">CO2 Max</th>
              <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">MgO Max</th>
              <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">SiO2 Max</th>
              <th className="px-2 py-1.5 text-right font-semibold text-muted-foreground">Cd Max</th>
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-2 py-1.5 font-medium">{row.fraction}</td>
                {matrix.type === "brut" && (
                  <>
                    <td className="px-2 py-1.5 text-right font-mono">{row.weightMin ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{row.weightMoy ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right font-mono">{row.weightMax ?? "—"}</td>
                  </>
                )}
                <td className="px-2 py-1.5 text-right font-mono">{row.BPLMin ?? "—"}</td>
                <td className="px-2 py-1.5 text-right font-mono">{row.BPLMax ?? "—"}</td>
                <td className="px-2 py-1.5 text-right font-mono">{row.CO2Min ?? "—"}</td>
                <td className="px-2 py-1.5 text-right font-mono">{row.CO2Max ?? "—"}</td>
                <td className="px-2 py-1.5 text-right font-mono">{row.MgOMax ?? "—"}</td>
                <td className="px-2 py-1.5 text-right font-mono">{row.SiO2Max ?? "—"}</td>
                <td className="px-2 py-1.5 text-right font-mono">{row.CdMax ?? "—"}</td>
              </tr>
            ))}
            {matrix.type === "brut" && (
              <tr className="border-t-2 border-accent/40 bg-accent/10 font-semibold">
                <td className="px-2 py-1.5" colSpan={4}>Profil demandé</td>
                <td className="px-2 py-1.5 text-right font-mono">{matrix.profileDemande.BPL ?? "—"}</td>
                <td className="px-2 py-1.5 text-right font-mono">—</td>
                <td className="px-2 py-1.5 text-right font-mono">{matrix.profileDemande.CO2 ?? "—"}</td>
                <td className="px-2 py-1.5 text-right font-mono">—</td>
                <td className="px-2 py-1.5 text-right font-mono">{matrix.profileDemande.MgO ?? "—"}</td>
                <td className="px-2 py-1.5 text-right font-mono">{matrix.profileDemande.SiO2 ?? "—"}</td>
                <td className="px-2 py-1.5 text-right font-mono">{matrix.profileDemande.Cd ?? "—"}</td>
              </tr>
            )}
            <tr className="border-t-2 border-primary/30 bg-primary/5 font-semibold">
              <td className="px-2 py-1.5 text-primary" colSpan={matrix.type === "brut" ? 4 : 2}>
                Produit fini <span className="text-[8px] font-normal text-muted-foreground">(Matrice Stock Lavé)</span>
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-[9px]">{matrix.produitFini.BPL}</td>
              <td className="px-2 py-1.5 text-right font-mono text-[9px]">—</td>
              <td className="px-2 py-1.5 text-right font-mono text-[9px]">{matrix.produitFini.CO2}</td>
              <td className="px-2 py-1.5 text-right font-mono text-[9px]">—</td>
              <td className="px-2 py-1.5 text-right font-mono text-[9px]">{matrix.produitFini.MgO}</td>
              <td className="px-2 py-1.5 text-right font-mono text-[9px]">{matrix.produitFini.SiO2}</td>
              <td className="px-2 py-1.5 text-right font-mono text-[9px]">{matrix.produitFini.Cd}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBrutEditForm = () => (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto">
      <div>
        <Label className="text-xs">Nom de la matrice</Label>
        <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: SAFI-MPII" className="mt-1 text-sm" />
      </div>

      <div className="text-[10px] font-semibold text-muted-foreground">Limites par fraction</div>
      <div className="overflow-x-auto border border-border rounded-md">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-muted">
              <th className="px-2 py-1.5 text-left font-semibold">Fraction</th>
              <th className="px-2 py-1.5 text-center font-semibold">Poids Min</th>
              <th className="px-2 py-1.5 text-center font-semibold">Moy</th>
              <th className="px-2 py-1.5 text-center font-semibold">Max</th>
              <th className="px-2 py-1.5 text-center font-semibold">BPL Min</th>
              <th className="px-2 py-1.5 text-center font-semibold">CO2 Min</th>
              <th className="px-2 py-1.5 text-center font-semibold">MgO Max</th>
              <th className="px-2 py-1.5 text-center font-semibold">SiO2 Max</th>
              <th className="px-2 py-1.5 text-center font-semibold">Cd Max</th>
            </tr>
          </thead>
          <tbody>
            {formRows.map((row, idx) => (
              <tr key={row.fraction} className="border-t border-border">
                <td className="px-2 py-1 font-medium text-xs">{row.fraction}</td>
                <td className="px-1 py-1"><Input type="number" step="0.01" value={row.weightMin ?? ""} onChange={e => updateRowField(idx, "weightMin", e.target.value)} className="h-6 text-[10px] px-1" /></td>
                <td className="px-1 py-1"><Input type="number" step="0.01" value={row.weightMoy ?? ""} onChange={e => updateRowField(idx, "weightMoy", e.target.value)} className="h-6 text-[10px] px-1" /></td>
                <td className="px-1 py-1"><Input type="number" step="0.01" value={row.weightMax ?? ""} onChange={e => updateRowField(idx, "weightMax", e.target.value)} className="h-6 text-[10px] px-1" /></td>
                <td className="px-1 py-1"><Input type="number" step="0.01" value={row.BPLMin ?? ""} onChange={e => updateRowField(idx, "BPLMin", e.target.value)} className="h-6 text-[10px] px-1" /></td>
                <td className="px-1 py-1"><Input type="number" step="0.01" value={row.CO2Min ?? ""} onChange={e => updateRowField(idx, "CO2Min", e.target.value)} className="h-6 text-[10px] px-1" /></td>
                <td className="px-1 py-1"><Input type="number" step="0.01" value={row.MgOMax ?? ""} onChange={e => updateRowField(idx, "MgOMax", e.target.value)} className="h-6 text-[10px] px-1" /></td>
                <td className="px-1 py-1"><Input type="number" step="0.01" value={row.SiO2Max ?? ""} onChange={e => updateRowField(idx, "SiO2Max", e.target.value)} className="h-6 text-[10px] px-1" /></td>
                <td className="px-1 py-1"><Input type="number" step="0.01" value={row.CdMax ?? ""} onChange={e => updateRowField(idx, "CdMax", e.target.value)} className="h-6 text-[10px] px-1" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-[10px] font-semibold text-muted-foreground">Phosphate Profile Demandé</div>
      <div className="grid grid-cols-5 gap-2">
        <div><Label className="text-[10px]">BPL</Label><Input type="number" step="0.01" value={profileBPL} onChange={e => setProfileBPL(e.target.value)} className="mt-0.5 text-sm h-7" /></div>
        <div><Label className="text-[10px]">CO2</Label><Input type="number" step="0.01" value={profileCO2} onChange={e => setProfileCO2(e.target.value)} className="mt-0.5 text-sm h-7" /></div>
        <div><Label className="text-[10px]">SiO2</Label><Input type="number" step="0.01" value={profileSiO2} onChange={e => setProfileSiO2(e.target.value)} className="mt-0.5 text-sm h-7" /></div>
        <div><Label className="text-[10px]">MgO</Label><Input type="number" step="0.01" value={profileMgO} onChange={e => setProfileMgO(e.target.value)} className="mt-0.5 text-sm h-7" /></div>
        <div><Label className="text-[10px]">Cd</Label><Input type="number" step="0.01" value={profileCd} onChange={e => setProfileCd(e.target.value)} className="mt-0.5 text-sm h-7" /></div>
      </div>

      <div className="text-[10px] font-semibold text-muted-foreground">Produit Fini (texte libre)</div>
      <div className="grid grid-cols-5 gap-2">
        <div><Label className="text-[10px]">BPL</Label><Input value={finiBPL} onChange={e => setFiniBPL(e.target.value)} placeholder="> 63" className="mt-0.5 text-sm h-7" /></div>
        <div><Label className="text-[10px]">CO2</Label><Input value={finiCO2} onChange={e => setFiniCO2(e.target.value)} placeholder="< 6,5" className="mt-0.5 text-sm h-7" /></div>
        <div><Label className="text-[10px]">SiO2</Label><Input value={finiSiO2} onChange={e => setFiniSiO2(e.target.value)} placeholder="< 8,5" className="mt-0.5 text-sm h-7" /></div>
        <div><Label className="text-[10px]">MgO</Label><Input value={finiMgO} onChange={e => setFiniMgO(e.target.value)} placeholder="< 0,67" className="mt-0.5 text-sm h-7" /></div>
        <div><Label className="text-[10px]">Cd</Label><Input value={finiCd} onChange={e => setFiniCd(e.target.value)} placeholder="< 7" className="mt-0.5 text-sm h-7" /></div>
      </div>

      <Button onClick={handleSave} className="w-full text-xs" size="sm">
        {editName ? "Enregistrer" : "Ajouter"}
      </Button>
    </div>
  );

  const renderLaveEditForm = () => (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Nom de la matrice</Label>
        <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: MPII Lavé" className="mt-1 text-sm" />
      </div>
      <div className="text-[10px] font-semibold text-muted-foreground">Limites chimiques globales</div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-[10px]">BPL Min</Label><Input type="number" step="0.01" value={bplMin} onChange={e => setBplMin(e.target.value)} className="mt-0.5 text-sm h-8" /></div>
        <div><Label className="text-[10px]">BPL Max</Label><Input type="number" step="0.01" value={bplMax} onChange={e => setBplMax(e.target.value)} className="mt-0.5 text-sm h-8" /></div>
        <div><Label className="text-[10px]">CO2 Min</Label><Input type="number" step="0.01" value={co2Min} onChange={e => setCo2Min(e.target.value)} className="mt-0.5 text-sm h-8" /></div>
        <div><Label className="text-[10px]">CO2 Max</Label><Input type="number" step="0.01" value={co2Max} onChange={e => setCo2Max(e.target.value)} className="mt-0.5 text-sm h-8" /></div>
        <div><Label className="text-[10px]">SiO2 Min</Label><Input type="number" step="0.01" value={sio2Min} onChange={e => setSio2Min(e.target.value)} className="mt-0.5 text-sm h-8" /></div>
        <div><Label className="text-[10px]">SiO2 Max</Label><Input type="number" step="0.01" value={sio2Max} onChange={e => setSio2Max(e.target.value)} className="mt-0.5 text-sm h-8" /></div>
        <div><Label className="text-[10px]">MgO Min</Label><Input type="number" step="0.01" value={mgoMin} onChange={e => setMgoMin(e.target.value)} className="mt-0.5 text-sm h-8" /></div>
        <div><Label className="text-[10px]">MgO Max</Label><Input type="number" step="0.01" value={mgoMax} onChange={e => setMgoMax(e.target.value)} className="mt-0.5 text-sm h-8" /></div>
        <div><Label className="text-[10px]">Cd Min</Label><Input type="number" step="0.01" value={cdMin} onChange={e => setCdMin(e.target.value)} className="mt-0.5 text-sm h-8" /></div>
        <div><Label className="text-[10px]">Cd Max</Label><Input type="number" step="0.01" value={cdMax} onChange={e => setCdMax(e.target.value)} className="mt-0.5 text-sm h-8" /></div>
      </div>
      <Button onClick={handleSave} className="w-full text-xs" size="sm">
        {editName ? "Enregistrer" : "Ajouter"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Matrices Cibles</h3>
        </div>
        <Button size="sm" className="text-xs" onClick={() => { resetForm(); setFormType("brut"); setAddOpen(true); }}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Nouvelle Matrice
        </Button>
      </div>

      <div className="space-y-4">
        {matrices.map(renderMatrixCard)}
        {matrices.length === 0 && (
          <div className="bg-card rounded-lg shadow-card border border-border p-6 text-center text-muted-foreground text-sm">
            Aucune matrice cible configurée
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={addOpen} onOpenChange={o => { if (!o) { setAddOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editName ? "Modifier la matrice" : "Nouvelle Matrice Cible"}
            </DialogTitle>
          </DialogHeader>
          {renderBrutEditForm()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TargetMatrixSection;
