import { useNavigate } from "react-router-dom";
import { Layers, Database, Upload, History, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ocpLogo from "@/assets/ocp-logo.png";
import heroImage from "@/assets/stockyard-hero.jpg";

const features = [
  {
    icon: Layers,
    title: "Pile Management",
    description: "Create, monitor, and manage raw and washed stockpiles with real-time conformity tracking and quality analysis.",
  },
  {
    icon: Database,
    title: "Layer Tracking",
    description: "Track individual layers within each pile, including chemical composition (BPL, SiO₂, MgO, CO₂, Cd) and tonnage data.",
  },
  {
    icon: Upload,
    title: "Excel Data Import",
    description: "Bulk import operational data from Excel spreadsheets with automatic validation and error reporting.",
  },
  {
    icon: History,
    title: "Historical Monitoring",
    description: "Access complete historical records of all stockyard operations, archived piles, and performance trends.",
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ocpLogo} alt="OCP" className="h-10 w-auto" />
            <div className="h-6 w-px bg-border" />
            <span className="text-sm font-semibold text-foreground tracking-wide">Stockyard Management</span>
          </div>
          <Button
            onClick={() => navigate("/app")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 min-h-screen flex items-center">
        <div className="absolute inset-0 pt-16">
          <img src={heroImage} alt="Industrial stockyard" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/30" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary-foreground/90" style={{ color: "hsl(152, 80%, 65%)" }}>
                Industrial Platform
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight text-primary-foreground">
              Stockyard
              <br />
              Management
              <br />
              <span style={{ color: "hsl(152, 80%, 50%)" }}>System</span>
            </h1>
            <p className="text-lg text-primary-foreground/70 max-w-lg leading-relaxed">
              A comprehensive platform for managing phosphate stockyard operations — 
              from pile tracking and chemical analysis to machine monitoring and data-driven decisions.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <Button
                onClick={() => navigate("/app")}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 h-14 text-base font-semibold shadow-lg"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 h-14 text-base border-primary-foreground/20 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground bg-transparent"
                onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <ChevronDown className="w-6 h-6 text-primary-foreground/50" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-sm font-semibold uppercase tracking-widest text-primary">About the System</span>
              <h2 className="text-4xl md:text-5xl font-bold text-card-foreground leading-tight">
                Built for industrial
                <br />
                <span className="text-primary">excellence</span>
              </h2>
              <div className="w-16 h-1 bg-primary rounded-full" />
              <p className="text-muted-foreground text-lg leading-relaxed">
                The Stockyard Management System is an advanced platform designed to manage 
                phosphate stockyard piles, track layers, and centralize all operational data. 
                It provides real-time visibility into raw and washed stock conformity, 
                chemical composition analysis, and machine operations.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                With intelligent monitoring tools and Excel-based import capabilities, 
                the system streamlines decision-making for quality control engineers 
                and stockyard operators.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center p-12">
                <img src={ocpLogo} alt="OCP Group" className="w-48 h-auto opacity-80" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-2xl bg-primary/10 border border-primary/20 -z-10" />
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-2xl bg-accent/10 border border-accent/20 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Main Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to manage stockyard operations efficiently and accurately.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-elevated"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground">
            Ready to optimize your stockyard?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Access the full management dashboard to monitor piles, track quality, and make data-driven decisions.
          </p>
          <Button
            onClick={() => navigate("/app")}
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full px-10 h-14 text-base font-semibold"
          >
            Launch Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={ocpLogo} alt="OCP" className="h-8 w-auto" />
              <span className="text-sm font-medium text-muted-foreground">Stockyard Management System</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Stockyard Management System – Engineering Project – 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
