import { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, X, Loader2, History, CalendarIcon, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SheetPreview {
  name: string;
  rows: number;
  headers: string[];
}

interface ImportResult {
  tasCreated: number;
  tasUpdated: number;
  layersAdded: number;
  layersUpdated: number;
  machinesCreated: number;
  machinesUpdated: number;
  errors: string[];
}

interface ParsedTasBrut {
  nom_tas: string;
  debut_m: number | null;
  fin_m: number | null;
  mode_stockage: string;
  statut: string;
  layers: ParsedLayer[];
}

interface ParsedLayer {
  layerIdx: number;
  tonnage: number;
  date: string | null;
  h2o: number | null;
  fractions: ParsedFraction[];
}

interface ParsedFraction {
  tamis: string;
  poids: number | null;
  BPL: number | null;
  CO2: number | null;
  SiO2: number | null;
  MgO: number | null;
  Cd: number | null;
}

interface ParsedTasLave {
  nom_tas: string;
  debut_m: number | null;
  fin_m: number | null;
  source_name: string | null;
  statut: string;
  layers: ParsedLayerLave[];
}

interface ParsedLayerLave {
  layerIdx: number;
  tonnage: number;
  date: string | null;
  BPL: number | null;
  CO2: number | null;
  SiO2: number | null;
  MgO: number | null;
  Cd: number | null;
  H2O: number | null;
}

interface ParsedMachine {
  nom_machine: string;
  type: string;
  ligne: string | null;
  position_m: number | null;
  statut: string;
  date_ajout?: string | null;
}

const parseDate = (val: unknown): string | null => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(date.getTime())) return date.toISOString().split("T")[0];
    return null;
  }
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString().split("T")[0];
  }
  const s = String(val).trim();
  if (!s) return null;
  const parts = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (parts) {
    const day = parseInt(parts[1]);
    const month = parseInt(parts[2]) - 1;
    const year = parseInt(parts[3]) < 100 ? 2000 + parseInt(parts[3]) : parseInt(parts[3]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return null;
};

const parseNum = (val: unknown): number | null => {
  if (val === null || val === undefined || val === "" || String(val).includes("DIV")) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
};

// ===== PARSE ALL DATA FROM EXCEL IN MEMORY =====

function parseTasBrutSheet(wb: XLSX.WorkBook): ParsedTasBrut[] {
  const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes("brut"));
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

  const result: ParsedTasBrut[] = [];
  let current: ParsedTasBrut | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const nomTas = row["Nom Tas Brut"] ?? row["nom_tas"] ?? null;
    const tranche = row["Tranche"] ?? row["tranche"] ?? null;
    const trancheStr = String(tranche ?? "").toLowerCase();

    if (trancheStr.includes("moy") || String(tranche) === "%" || tranche === "Tranche") continue;
    if (String(nomTas).toLowerCase().includes("caractéristiques") || String(nomTas).toLowerCase().includes("caracteristiques")) continue;
    if (String(row["Tonnage (THC)"] ?? "").toLowerCase().includes("tonnage total")) continue;

    if (nomTas && String(nomTas).trim() !== "") {
      const mode = String(row["Mode de stockage"] ?? row["mode_stockage"] ?? "chevron").toLowerCase();
      const statut = String(row["Statut"] ?? row["statut"] ?? "en_cours").toLowerCase().replace(/ /g, "_");
      current = {
        nom_tas: String(nomTas).trim(),
        debut_m: parseNum(row["Début (m)"] ?? row["debut_m"]),
        fin_m: parseNum(row["Fin (m)"] ?? row["fin_m"]),
        mode_stockage: mode.includes("chevron") ? "chevron" : "cone",
        statut: statut.includes("caracteris") ? "caracterise" : "en_cours",
        layers: [],
      };
      result.push(current);
    }

    const layerIdx = parseNum(row["Layers"] ?? row["layers"]);
    if (layerIdx && current) {
      const tonnage = parseNum(row["Tonnage (THC)"] ?? row["tonnage_thc"]) ?? 0;
      const date = parseDate(row["Date"] ?? row["date"]);
      const bpl = parseNum(row["BPL"]);
      const poids = parseNum(row["POIDS"]);
      const h2o = parseNum(row["H2O"]);
      if (tonnage === 0 && !date && !bpl && !poids && !h2o) continue;

      const layer: ParsedLayer = {
        layerIdx,
        tonnage,
        date,
        h2o,
        fractions: [],
      };

      const firstTranche = String(tranche ?? "");
      if (firstTranche && parseNum(row["POIDS"]) !== null) {
        layer.fractions.push({
          tamis: firstTranche,
          poids: parseNum(row["POIDS"]),
          BPL: parseNum(row["BPL"]),
          CO2: parseNum(row["CO2"]),
          SiO2: parseNum(row["SiO2"]),
          MgO: parseNum(row["MgO"]),
          Cd: parseNum(row["Cd"]),
        });
      }

      for (let j = i + 1; j < rows.length; j++) {
        const fRow = rows[j];
        const fTranche = fRow["Tranche"] ?? fRow["tranche"];
        if (!fTranche || String(fTranche).toLowerCase().includes("moy")) break;
        const fNom = fRow["Nom Tas Brut"] ?? fRow["nom_tas"];
        const fLayer = fRow["Layers"] ?? fRow["layers"];
        if ((fNom && String(fNom).trim() !== "") || (fLayer && fLayer !== layerIdx)) break;

        layer.fractions.push({
          tamis: String(fTranche),
          poids: parseNum(fRow["POIDS"]),
          BPL: parseNum(fRow["BPL"]),
          CO2: parseNum(fRow["CO2"]),
          SiO2: parseNum(fRow["SiO2"]),
          MgO: parseNum(fRow["MgO"]),
          Cd: parseNum(fRow["Cd"]),
        });
      }

      current.layers.push(layer);
    }
  }
  return result;
}

function parseTasLaveSheet(wb: XLSX.WorkBook): ParsedTasLave[] {
  const sheetName = wb.SheetNames.find(s =>
    s.toLowerCase().includes("fini") || s.toLowerCase().includes("lav") || s.toLowerCase().includes("final")
  );
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

  const result: ParsedTasLave[] = [];
  let current: ParsedTasLave | null = null;

  for (const row of rows) {
    const nomTas = row["Nom Tas Fini"] ?? row["Nom Tas Lavé"] ?? row["nom_tas"] ?? null;
    if (String(nomTas).toLowerCase().includes("caractéristiques") || String(nomTas).toLowerCase().includes("caracteristiques")) continue;
    if (String(row["BPL"]) === "%" || String(row["BPL"]) === "BPL") continue;

    if (nomTas && String(nomTas).trim() !== "") {
      const statut = String(row["Statut"] ?? row["statut"] ?? "en_cours");
      current = {
        nom_tas: String(nomTas).trim(),
        debut_m: parseNum(row["Début (m)"] ?? row["debut_m"]),
        fin_m: parseNum(row["Fin (m)"] ?? row["fin_m"]),
        source_name: String(row["Source"] ?? row["source"] ?? "").trim() || null,
        statut: statut.includes("caracteris") ? "caracterise" : "en_cours",
        layers: [],
      };
      result.push(current);
    }

    const layerIdx = parseNum(row["Layers"] ?? row["layers"]);
    if (layerIdx && current) {
      const tonnage = parseNum(row["Tonnage (TSM)"] ?? row["tonnage_tsm"]) ?? 0;
      const date = parseDate(row["Date"] ?? row["date"]);
      const bpl = parseNum(row["BPL"]);
      const co2 = parseNum(row["CO2"]);
      const sio2 = parseNum(row["SiO2"]);
      const mgo = parseNum(row["MgO"]);
      const cd = parseNum(row["Cd"]);
      const h2o = parseNum(row["H2O"]);
      if (tonnage === 0 && !date && !bpl && !co2 && !sio2 && !mgo && !cd && !h2o) continue;

      current.layers.push({
        layerIdx, tonnage, date,
        BPL: bpl, CO2: co2, SiO2: sio2, MgO: mgo, Cd: cd, H2O: h2o,
      });
    }
  }
  return result;
}

function parseMachinesSheet(wb: XLSX.WorkBook): ParsedMachine[] {
  const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes("machine"));
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

  const result: ParsedMachine[] = [];
  for (const row of rows) {
    const nom = String(row["Nom Machine"] ?? row["nom_machine"] ?? "").trim();
    if (!nom) continue;
    const type = String(row["Type"] ?? row["type"] ?? "").toLowerCase();
    const ligne = String(row["Ligne"] ?? row["ligne"] ?? "").trim();
    const position = parseNum(row["Position (m)"] ?? row["position_m"]);
    const statut = String(row["Statut"] ?? row["statut"] ?? "Actif").trim();

    result.push({
      nom_machine: nom,
      type: type.includes("stacker") ? "Stacker" : type.includes("roue") || type.includes("reclaimer") ? "Roue-Pelle" : type,
      ligne: ligne || null,
      position_m: position,
      statut: statut.toLowerCase().includes("actif") && !statut.toLowerCase().includes("non") ? "Actif" : "non actif",
    });
  }
  return result;
}

// ===== COMPONENT =====

const ImportSection = ({ onImportComplete }: { onImportComplete?: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<SheetPreview[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null); setWorkbook(null); setSheets([]); setResult(null); setError(null); setProgress(0);
  };

  const processFile = useCallback((f: File) => {
    resetState();
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        setWorkbook(wb);

        const previews: SheetPreview[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const json = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
          const headers = json.length > 0 ? (json[0] as string[]).map(h => String(h ?? "")) : [];
          return { name, rows: Math.max(0, json.length - 1), headers };
        });
        setSheets(previews);

        const sheetNames = wb.SheetNames.map(s => s.toLowerCase().trim());
        const missing: string[] = [];
        if (!sheetNames.some(s => s.includes("brut"))) missing.push("TAS_BRUT");
        if (!sheetNames.some(s => s.includes("fini") || s.includes("lav") || s.includes("final"))) missing.push("TAS_LAVE/TAS_FINI/TAS_FINAL");
        if (!sheetNames.some(s => s.includes("machine"))) missing.push("MACHINES");
        if (missing.length > 0) {
          setError(`Feuilles manquantes: ${missing.join(", ")}. Vérifiez le fichier.`);
        }
      } catch {
        setError("Impossible de lire le fichier Excel. Vérifiez le format.");
      }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      processFile(f);
    } else {
      setError("Veuillez déposer un fichier Excel (.xlsx ou .xls)");
    }
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const startImport = async () => {
    if (!workbook || error) return;
    setImporting(true);
    setProgress(0);
    setResult(null);

    const res: ImportResult = { tasCreated: 0, tasUpdated: 0, layersAdded: 0, layersUpdated: 0, machinesCreated: 0, machinesUpdated: 0, errors: [] };

    try {
      // Step 1: Parse all data in memory
      setProgress(10);
      const tasBrut = parseTasBrutSheet(workbook);
      const tasLave = parseTasLaveSheet(workbook);
      const machines = parseMachinesSheet(workbook);
      setProgress(20);

      // Step 2: Send TAS_BRUT to backend API
      if (tasBrut.length > 0) {
        try {
          const brutResult = await api.post('/import/brut', { piles: tasBrut });
          res.tasCreated += brutResult.tasCreated || 0;
          res.tasUpdated += brutResult.tasUpdated || 0;
          res.layersAdded += brutResult.layersAdded || 0;
          res.layersUpdated += brutResult.layersUpdated || 0;
        } catch (e: any) {
          res.errors.push(`Import brut: ${e.message}`);
        }
      }
      setProgress(50);

      // Step 3: Send TAS_LAVE to backend API
      if (tasLave.length > 0) {
        try {
          const laveResult = await api.post('/import/lave', { piles: tasLave });
          res.tasCreated += laveResult.tasCreated || 0;
          res.tasUpdated += laveResult.tasUpdated || 0;
          res.layersAdded += laveResult.layersAdded || 0;
          res.layersUpdated += laveResult.layersUpdated || 0;
        } catch (e: any) {
          res.errors.push(`Import lavé: ${e.message}`);
        }
      }
      setProgress(80);

      // Step 4: Send MACHINES to backend API
      if (machines.length > 0) {
        try {
          const machResult = await api.post('/import/machines', { machines });
          res.machinesUpdated += machResult.machinesUpdated || 0;
        } catch (e: any) {
          res.errors.push(`Import machines: ${e.message}`);
        }
      }
      setProgress(95);

      // Step 5: Save import history via API
      try {
        await api.post('/import/log', {
          file_name: file?.name ?? "unknown",
          raw_count: res.tasCreated + res.tasUpdated,
          washed_count: res.layersAdded + res.layersUpdated,
          layer_count: res.layersAdded,
          machine_count: res.machinesUpdated,
          errors: res.errors.length > 0 ? res.errors : null,
        });
      } catch (e: any) {
        console.error("Failed to save import history:", e);
      }

      setProgress(100);
      setResult(res);
      onImportComplete?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      res.errors.push(msg);
      setResult(res);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Upload className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Import Données</h3>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />
        <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">Glissez-déposez votre fichier Excel ici</p>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-3.5 h-3.5 mr-1.5" /> Choisir un fichier
        </Button>
        {file && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-foreground">
            <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium">{file.name}</span>
            <button onClick={resetState} className="text-muted-foreground hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {sheets.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feuilles détectées</h4>
          <div className="grid gap-2">
            {sheets.map((s) => (
              <div key={s.name} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm font-medium text-foreground">{s.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{s.rows} lignes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {sheets.length > 0 && !result && (
        <Button onClick={startImport} disabled={importing || !!error} className="w-full">
          {importing ? (
            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Importation en cours...</>
          ) : (
            <><Upload className="w-4 h-4 mr-1.5" /> Lancer l'importation</>
          )}
        </Button>
      )}

      {importing && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">{progress}%</p>
        </div>
      )}

      {result && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            {result.errors.length === 0 ? (
              <CheckCircle className="w-5 h-5 text-primary" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-accent" />
            )}
            <h4 className="text-sm font-semibold text-foreground">
              {result.errors.length === 0 ? "Importation terminée avec succès" : "Importation terminée avec des avertissements"}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/50 rounded-md px-3 py-2">
              <span className="text-muted-foreground">Tas créés</span>
              <p className="font-semibold text-foreground text-lg">{result.tasCreated}</p>
            </div>
            <div className="bg-muted/50 rounded-md px-3 py-2">
              <span className="text-muted-foreground">Tas mis à jour</span>
              <p className="font-semibold text-foreground text-lg">{result.tasUpdated}</p>
            </div>
            <div className="bg-muted/50 rounded-md px-3 py-2">
              <span className="text-muted-foreground">Couches ajoutées</span>
              <p className="font-semibold text-foreground text-lg">{result.layersAdded}</p>
            </div>
            <div className="bg-muted/50 rounded-md px-3 py-2">
              <span className="text-muted-foreground">Couches mises à jour</span>
              <p className="font-semibold text-foreground text-lg">{result.layersUpdated}</p>
            </div>
            <div className="bg-muted/50 rounded-md px-3 py-2">
              <span className="text-muted-foreground">Machines créées</span>
              <p className="font-semibold text-foreground text-lg">{result.machinesCreated}</p>
            </div>
            <div className="bg-muted/50 rounded-md px-3 py-2">
              <span className="text-muted-foreground">Machines mises à jour</span>
              <p className="font-semibold text-foreground text-lg">{result.machinesUpdated}</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-destructive">Erreurs:</p>
              {result.errors.map((e, i) => (
                <p key={i} className="text-[10px] text-destructive/80 bg-destructive/5 rounded px-2 py-1">{e}</p>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={resetState}>Nouvel import</Button>
        </div>
      )}

      <ImportHistoryInline />
    </div>
  );
};

// === Import History inline component (uses API) ===
interface ImportRecord {
  id: number;
  created_at: string;
  file_name: string;
  raw_count: number | null;
  washed_count: number | null;
  layer_count: number | null;
  machine_count: number | null;
  errors: string[] | null;
}

const ImportHistoryInline = () => {
  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await api.get('/import/history');
        setRecords(data ?? []);
      } catch (err) {
        console.error("Failed to load import history:", err);
        setRecords([]);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const filtered = records.filter((r) => {
    if (!dateFilter) return true;
    const recDate = new Date(r.created_at);
    return (
      recDate.getFullYear() === dateFilter.getFullYear() &&
      recDate.getMonth() === dateFilter.getMonth() &&
      recDate.getDate() === dateFilter.getDate()
    );
  });

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3 mt-6 pt-6 border-t border-border">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-sm text-foreground">Historique des importations</h4>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left font-normal h-8 text-xs",
                !dateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {dateFilter ? format(dateFilter, "dd/MM/yyyy") : <span>jj/mm/aaaa</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              locale={fr}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        {dateFilter && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDateFilter(undefined)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted">
              <th className="w-6 px-2 py-2"></th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Date</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Fichier</th>
              <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Tas créés</th>
              <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Couches ajoutées</th>
              <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Machines</th>
              <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Statut</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Chargement...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Aucun historique</td></tr>
            ) : (
              filtered.map((r) => {
                const isExpanded = expanded.has(r.id);
                const hasErrors = r.errors && r.errors.length > 0;
                return (
                  <>
                    <tr key={r.id} className="border-t border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => hasErrors && toggleExpand(r.id)}>
                      <td className="px-2 py-2 text-muted-foreground">
                        {hasErrors && (isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
                      </td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("fr-FR")} {new Date(r.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium text-foreground">{r.file_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{r.raw_count ?? 0}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.layer_count ?? 0}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.machine_count ?? 0}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          hasErrors ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
                        }`}>
                          {hasErrors ? "Avec erreurs" : "Succès"}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && hasErrors && (
                      <tr key={`${r.id}-errors`}>
                        <td colSpan={7} className="p-0">
                          <div className="bg-destructive/5 px-6 py-2 space-y-1">
                            {r.errors!.map((e, i) => (
                              <p key={i} className="text-[10px] text-destructive/80">{e}</p>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ImportSection;
