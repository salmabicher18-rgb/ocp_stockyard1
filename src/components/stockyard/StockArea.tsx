import type { Stockpile, Machine } from "@/data/mockData";
import StockScale from "./StockScale";
import ChevronStockpile from "./ChevronStockpile";
import ConeStockpile from "./ConeStockpile";
import MachineIcon from "./MachineIcon";

interface StockAreaProps {
  title: string;
  type: "raw" | "washed";
  stockpiles: Stockpile[];
  machines: Machine[];
  onStockpileClick: (stockpile: Stockpile) => void;
}

const StockArea = ({ title, type, stockpiles, machines, onStockpileClick }: StockAreaProps) => {
  const lineMachines = machines.filter((m) => m.line === type);

  return (
    <div className="bg-card rounded-lg shadow-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-sm ${type === "raw" ? "stock-raw-gradient" : "stock-washed-gradient"}`} />
          <h3 className="font-semibold text-sm text-card-foreground">{title}</h3>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            500m
          </span>
        </div>
      </div>

      <StockScale />

      <div className="relative w-full bg-muted/50 rounded border border-border overflow-visible" style={{ height: "160px" }}>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-scale-line" />

        {stockpiles.map((sp) => {
          if (type === "raw") {
            const mode = sp.storageMode || "chevron";
            return mode === "chevron" ? (
              <ChevronStockpile key={sp.id} stockpile={sp} onClick={onStockpileClick} />
            ) : (
              <ConeStockpile key={sp.id} stockpile={sp} onClick={onStockpileClick} />
            );
          }
          return <ConeStockpile key={sp.id} stockpile={sp} onClick={onStockpileClick} />;
        })}

        {lineMachines.map((m) => (
          <MachineIcon key={m.id} machine={m} stockpiles={stockpiles} />
        ))}
      </div>

      <div className="flex items-center gap-4 mt-2 text-[9px] text-muted-foreground">
        {type === "raw" && (
          <>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-[hsl(142,50%,45%)]" style={{ clipPath: "polygon(5% 100%, 25% 5%, 75% 5%, 95% 100%)" }} />
              <span>Chevron (Trapèze)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[hsl(30,85%,55%)]" />
              <span>Cône</span>
            </div>
          </>
        )}
        <span className="ml-auto font-mono">0m → 500m (droite à gauche)</span>
      </div>
    </div>
  );
};

export default StockArea;
