import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import DashboardSection from "./sections/DashboardSection";
import RawStockSection from "./sections/RawStockSection";
import WashedStockSection from "./sections/WashedStockSection";
import DatabaseSection from "./sections/DatabaseSection";
import MachinesSection from "./sections/MachinesSection";
import TargetMatrixSection from "./sections/TargetMatrixSection";
import ImportSection from "./sections/ImportSection";
import HistorySection from "./sections/HistorySection";
import { useState } from "react";
import { useApiData } from "@/hooks/useApiData";
import { targetMatrices as initialMatrices, type TargetMatrix } from "@/data/mockData";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [matrices, setMatrices] = useState<TargetMatrix[]>(initialMatrices);

  const {
    rawStockpiles, washedStockpiles, machines, loading, reload,
    addRawStockpile, deleteRawStockpile, updateRawStockpile,
    addWashedStockpile, deleteWashedStockpile, updateWashedStockpile,
    addLayer, deleteLayer, editLayer,
    deleteMachine, updateMachine,
  } = useApiData();

  const handleAddMatrix = (matrix: TargetMatrix) => setMatrices(prev => [...prev, matrix]);
  const handleDeleteMatrix = (name: string) => setMatrices(prev => prev.filter(m => m.name !== name));
  const handleUpdateMatrix = (name: string, matrix: TargetMatrix) => {
    setMatrices(prev => prev.map(m => m.name === name ? matrix : m));
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Chargement des données...</span>
            </div>
          ) : (
            <>
              {activeSection === "dashboard" && (
                <DashboardSection rawStockpiles={rawStockpiles} washedStockpiles={washedStockpiles} machines={machines} matrices={matrices} />
              )}
              {activeSection === "raw" && (
                <RawStockSection
                  stockpiles={rawStockpiles} machines={machines} matrices={matrices}
                  onAddStockpile={addRawStockpile} onDeleteStockpile={deleteRawStockpile}
                  onUpdateStockpile={updateRawStockpile}
                />
              )}
              {activeSection === "washed" && (
                <WashedStockSection
                  stockpiles={washedStockpiles} rawStockpiles={rawStockpiles} machines={machines} matrices={matrices}
                  onAddStockpile={addWashedStockpile} onDeleteStockpile={deleteWashedStockpile}
                  onUpdateStockpile={updateWashedStockpile}
                />
              )}
              {activeSection === "database" && (
                <DatabaseSection
                  rawStockpiles={rawStockpiles} washedStockpiles={washedStockpiles}
                  onAddLayer={addLayer} onDeleteLayer={deleteLayer} onEditLayer={editLayer}
                />
              )}
              {activeSection === "machines" && (
                <MachinesSection machines={machines} rawStockpiles={rawStockpiles} washedStockpiles={washedStockpiles} onUpdateMachine={updateMachine} />
              )}
              {activeSection === "target" && (
                <TargetMatrixSection matrices={matrices} onAddMatrix={handleAddMatrix} onDeleteMatrix={handleDeleteMatrix} onUpdateMatrix={handleUpdateMatrix} />
              )}
              {activeSection === "import" && <ImportSection onImportComplete={reload} />}
              {activeSection === "history" && (
                <HistorySection rawStockpiles={rawStockpiles} washedStockpiles={washedStockpiles} machines={machines} matrices={matrices} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
