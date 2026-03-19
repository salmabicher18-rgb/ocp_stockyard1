import { useState, useEffect } from "react";
import { api } from "@/api/client";
import { Input } from "@/components/ui/input";
import { History, Search, FileSpreadsheet, ChevronDown, ChevronRight } from "lucide-react";

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

const ImportHistorySection = () => {
  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
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
    if (!filter) return true;
    const f = filter.toLowerCase().trim();
    const date = new Date(r.created_at);
    const dateFR = date.toLocaleDateString("fr-FR"); // dd/mm/yyyy
    const dateShort = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }); // dd/mm
    const dateISO = date.toISOString().split("T")[0]; // yyyy-mm-dd
    const timeFR = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const day = date.toLocaleDateString("fr-FR", { day: "2-digit" });
    const month = date.toLocaleDateString("fr-FR", { month: "2-digit" });
    const year = date.getFullYear().toString();
    const fullStr = `${dateFR} ${timeFR} ${dateISO} ${dateShort} ${day} ${month} ${year}`.toLowerCase();
    return r.file_name.toLowerCase().includes(f) || fullStr.includes(f);
  });

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Historique des importations</h3>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Filtrer par date ou fichier..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
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
                    <tr
                      key={r.id}
                      className="border-t border-border hover:bg-muted/50 cursor-pointer"
                      onClick={() => hasErrors && toggleExpand(r.id)}
                    >
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

export default ImportHistorySection;
