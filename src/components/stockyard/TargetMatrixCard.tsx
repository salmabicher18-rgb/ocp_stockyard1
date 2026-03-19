import { targetMatrices, stockTotals } from "@/data/mockData";
import { Target } from "lucide-react";

const TargetMatrixCard = () => (
  <div className="bg-card rounded-lg shadow-card border border-border p-4">
    <div className="flex items-center gap-2 mb-3">
      <Target className="w-4 h-4 text-primary" />
      <h3 className="font-semibold text-sm text-card-foreground">Matrice Cible - Valeurs Contractuelles</h3>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {targetMatrices.map((matrix) => (
        <div key={matrix.name} className="border border-border rounded-md overflow-hidden">
          <div className="bg-primary/10 px-3 py-1.5">
            <span className="text-xs font-semibold text-primary">{matrix.name}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead>
                <tr className="bg-muted">
                  <th className="px-2 py-1 text-left text-muted-foreground">Fraction</th>
                  <th className="px-1.5 py-1 text-right text-muted-foreground">Poids Min</th>
                  <th className="px-1.5 py-1 text-right text-muted-foreground">Moy</th>
                  <th className="px-1.5 py-1 text-right text-muted-foreground">Max</th>
                  <th className="px-1.5 py-1 text-right text-muted-foreground">BPL</th>
                  <th className="px-1.5 py-1 text-right text-muted-foreground">MgO</th>
                  <th className="px-1.5 py-1 text-right text-muted-foreground">SiO2</th>
                  <th className="px-1.5 py-1 text-right text-muted-foreground">Cd</th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row) => (
                  <tr key={row.fraction} className="border-t border-border">
                    <td className="px-2 py-1 font-medium">{row.fraction}</td>
                    <td className="px-1.5 py-1 text-right font-mono">{row.weightMin ?? "—"}</td>
                    <td className="px-1.5 py-1 text-right font-mono">{row.weightMoy ?? "—"}</td>
                    <td className="px-1.5 py-1 text-right font-mono">{row.weightMax ?? "—"}</td>
                    <td className="px-1.5 py-1 text-right font-mono">{row.BPLMin ?? "—"}</td>
                    <td className="px-1.5 py-1 text-right font-mono">{row.MgOMax ?? "—"}</td>
                    <td className="px-1.5 py-1 text-right font-mono">{row.SiO2Max ?? "—"}</td>
                    <td className="px-1.5 py-1 text-right font-mono">{row.CdMax ?? "—"}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-primary/30 bg-primary/5 font-semibold">
                  <td className="px-2 py-1" colSpan={4}>Profil demandé</td>
                  <td className="px-1.5 py-1 text-right font-mono">{matrix.profileDemande.BPL ?? "—"}</td>
                  <td className="px-1.5 py-1 text-right font-mono">{matrix.profileDemande.MgO ?? "—"}</td>
                  <td className="px-1.5 py-1 text-right font-mono">{matrix.profileDemande.SiO2 ?? "—"}</td>
                  <td className="px-1.5 py-1 text-right font-mono">{matrix.profileDemande.Cd ?? "—"}</td>
                </tr>
                <tr className="border-t border-primary/20 bg-primary/5">
                  <td className="px-2 py-1 font-semibold" colSpan={4}>Produit fini</td>
                  <td className="px-1.5 py-1 text-right font-mono text-[8px]">{matrix.produitFini.BPL}</td>
                  <td className="px-1.5 py-1 text-right font-mono text-[8px]">{matrix.produitFini.MgO}</td>
                  <td className="px-1.5 py-1 text-right font-mono text-[8px]">{matrix.produitFini.SiO2}</td>
                  <td className="px-1.5 py-1 text-right font-mono text-[8px]">{matrix.produitFini.Cd}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>

    {/* Stock totals */}
    <div className="mt-4 border border-border rounded-md overflow-hidden">
      <div className="bg-muted px-3 py-1.5">
        <span className="text-xs font-semibold text-foreground">Totaux des parcs de stockage</span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="bg-card p-2">
          <div className="text-[9px] text-muted-foreground mb-1">Brut</div>
          <div className="space-y-0.5 text-[10px]">
            <div className="flex justify-between"><span>MPII</span><span className="font-mono font-semibold">{stockTotals.raw.MPII.toLocaleString()} THC</span></div>
            <div className="flex justify-between"><span>BG10</span><span className="font-mono font-semibold">{stockTotals.raw.BG10.toLocaleString()} THC</span></div>
          </div>
        </div>
        <div className="bg-card p-2">
          <div className="text-[9px] text-muted-foreground mb-1">Lavé-Flotté</div>
          <div className="space-y-0.5 text-[10px]">
            <div className="flex justify-between"><span>MPII</span><span className="font-mono font-semibold">{stockTotals.washed.MPII.toLocaleString()} TSM</span></div>
            <div className="flex justify-between"><span>BG10</span><span className="font-mono font-semibold">{stockTotals.washed.BG10.toLocaleString()} TSM</span></div>
            <div className="flex justify-between"><span>TBT corrigé</span><span className="font-mono font-semibold">{stockTotals.washed.TBT.toLocaleString()} TSM</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default TargetMatrixCard;
