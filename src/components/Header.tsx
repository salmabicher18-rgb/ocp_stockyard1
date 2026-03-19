import OCPLogo from "./OCPLogo";
import { Bell, User } from "lucide-react";

const Header = () => (
  <header className="h-14 industrial-gradient flex items-center justify-between px-5 shadow-elevated z-50">
    <div className="flex items-center gap-4">
      <OCPLogo className="h-8 w-auto" />
      <div className="h-6 w-px bg-header-foreground/20" />
      <h1 className="text-header-foreground font-semibold text-sm tracking-wide">
        OCP Stockyard Management System
      </h1>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-header-foreground/60 text-xs font-mono">
        {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
      </span>
      <button className="p-1.5 rounded-md hover:bg-header-foreground/10 transition-colors">
        <Bell className="w-4 h-4 text-header-foreground/70" />
      </button>
      <button className="p-1.5 rounded-md hover:bg-header-foreground/10 transition-colors">
        <User className="w-4 h-4 text-header-foreground/70" />
      </button>
    </div>
  </header>
);

export default Header;
