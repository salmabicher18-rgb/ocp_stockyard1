import { LayoutDashboard, Layers, Droplets, Database, Target, Wrench, Upload, History, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Layers, label: "Stock Brut", id: "raw" },
  { icon: Droplets, label: "Stock Lavé", id: "washed" },
  { icon: Database, label: "Base de données", id: "database" },
  { icon: Wrench, label: "Machines", id: "machines" },
  { icon: Target, label: "Matrice Cible", id: "target" },
  { icon: Upload, label: "Import Données", id: "import" },
  { icon: History, label: "Historique", id: "history" },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const navigate = useNavigate();

  return (
    <aside className="w-52 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground mb-1 border-b border-sidebar-border pb-3"
        >
          <Home className="w-4 h-4 shrink-0" />
          <span>Accueil</span>
        </button>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150",
              activeSection === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="text-[10px] text-sidebar-foreground/50 text-center">
          OCP Stockyard v1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
