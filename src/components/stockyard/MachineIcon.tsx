import type { Machine, Stockpile } from "@/data/mockData";

interface MachineIconProps {
  machine: Machine;
  maxMeters?: number;
  stockpiles?: Stockpile[];
}

const MachineIcon = ({ machine, maxMeters = 500, stockpiles = [] }: MachineIconProps) => {
  // Find associated stockpile to position the machine on it
  const associatedSp = machine.associatedStockpile
    ? stockpiles.find(sp => sp.name === machine.associatedStockpile)
    : null;

  // Position: if associated to a stockpile, stacker goes to the stacking end, reclaimer to the middle
  let positionMeters = machine.position;
  if (associatedSp) {
    if (machine.type === "stacker") {
      // Stacker deposits at the active end (startPosition = higher meter value typically)
      positionMeters = Math.max(associatedSp.startPosition, associatedSp.endPosition);
    } else {
      // Reclaimer works from the side, position at the middle
      positionMeters = (associatedSp.startPosition + associatedSp.endPosition) / 2;
    }
  }

  const leftPercent = ((maxMeters - positionMeters) / maxMeters) * 100;
  const isStacker = machine.type === "stacker";

  return (
    <div
      className="absolute -translate-x-1/2 z-10 group pointer-events-none"
      style={{ left: `${leftPercent}%`, bottom: "0px" }}
    >
      <div className="relative flex flex-col items-center">
        <svg
          viewBox="0 0 160 116"
          className={`w-32 h-[100px] ${machine.active ? "" : "opacity-40 grayscale"}`}
        >
          {isStacker ? <StackerSVG id={machine.id} /> : <ReclaimerSVG id={machine.id} />}
        </svg>
        {/* Label */}
        <div className="-mt-1 px-2 py-0.5 rounded bg-card shadow-card text-[8px] font-mono font-semibold text-foreground whitespace-nowrap border border-border">
          {machine.name} • {positionMeters}m
          {machine.associatedStockpile && (
            <span className="ml-1 text-primary">• {machine.associatedStockpile}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/** Stacker SVG — industrial conveyor stacker depositing material */
const StackerSVG = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`st-body-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(48, 85%, 62%)" />
        <stop offset="100%" stopColor="hsl(48, 65%, 38%)" />
      </linearGradient>
      <linearGradient id={`st-boom-${id}`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="hsl(48, 70%, 50%)" />
        <stop offset="100%" stopColor="hsl(48, 80%, 58%)" />
      </linearGradient>
      <linearGradient id={`st-track-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(0, 0%, 40%)" />
        <stop offset="100%" stopColor="hsl(0, 0%, 20%)" />
      </linearGradient>
    </defs>

    {/* === TRACKS === */}
    <rect x="30" y="104" width="100" height="12" rx="6" fill={`url(#st-track-${id})`} />
    <rect x="34" y="106" width="92" height="8" rx="4" fill="hsl(0, 0%, 32%)" />
    {[40, 50, 60, 70, 80, 90, 100, 110].map(x => (
      <rect key={x} x={x} y="106.5" width="2.5" height="7" rx="0.5" fill="hsl(0, 0%, 24%)" />
    ))}
    {[42, 52, 62, 72, 82, 92, 102, 112, 120].map(x => (
      <g key={x}>
        <circle cx={x} cy="110" r="3.5" fill="hsl(0, 0%, 18%)" />
        <circle cx={x} cy="110" r="2.2" fill="hsl(0, 0%, 28%)" />
        <circle cx={x} cy="110" r="0.8" fill="hsl(0, 0%, 42%)" />
      </g>
    ))}

    {/* === MAIN BODY / CABIN === */}
    <rect x="42" y="72" width="76" height="32" rx="3" fill={`url(#st-body-${id})`} stroke="hsl(48, 55%, 28%)" strokeWidth="1.2" />
    {/* Rivets */}
    {[48, 58, 68, 78, 88, 98, 108].map(x => (
      <circle key={x} cx={x} cy="75" r="1.2" fill="hsl(48, 45%, 32%)" />
    ))}
    {/* Cabin window */}
    <rect x="48" y="78" width="20" height="12" rx="2" fill="hsl(200, 70%, 78%)" stroke="hsl(200, 45%, 42%)" strokeWidth="0.8" />
    <line x1="58" y1="78" x2="58" y2="90" stroke="hsl(200, 45%, 52%)" strokeWidth="0.5" />
    {/* Engine vents */}
    {[76, 81, 86, 91, 96, 101].map(x => (
      <rect key={x} x={x} y="80" width="2" height="10" rx="0.5" fill="hsl(48, 45%, 30%)" />
    ))}
    {/* Horizontal body lines */}
    <line x1="44" y1="92" x2="116" y2="92" stroke="hsl(48, 45%, 30%)" strokeWidth="0.8" />
    <line x1="44" y1="98" x2="116" y2="98" stroke="hsl(48, 45%, 30%)" strokeWidth="0.5" />

    {/* === TOWER === */}
    <rect x="68" y="38" width="24" height="34" fill="hsl(48, 55%, 44%)" stroke="hsl(48, 50%, 28%)" strokeWidth="0.8" />
    {/* Cross bracing */}
    <line x1="68" y1="38" x2="92" y2="72" stroke="hsl(48, 45%, 50%)" strokeWidth="0.6" />
    <line x1="92" y1="38" x2="68" y2="72" stroke="hsl(48, 45%, 50%)" strokeWidth="0.6" />
    <line x1="68" y1="50" x2="92" y2="50" stroke="hsl(48, 45%, 38%)" strokeWidth="0.5" />
    <line x1="68" y1="60" x2="92" y2="60" stroke="hsl(48, 45%, 38%)" strokeWidth="0.5" />

    {/* === BOOM CONVEYOR (angled up-right, discharging down) === */}
    <line x1="80" y1="40" x2="148" y2="10" stroke="hsl(48, 50%, 28%)" strokeWidth="6" />
    <line x1="80" y1="40" x2="148" y2="10" stroke={`url(#st-boom-${id})`} strokeWidth="4" />
    {/* Boom side rails */}
    <line x1="80" y1="38.5" x2="148" y2="8.5" stroke="hsl(48, 40%, 32%)" strokeWidth="0.6" />
    <line x1="80" y1="41.5" x2="148" y2="11.5" stroke="hsl(48, 40%, 32%)" strokeWidth="0.6" />
    {/* Boom truss verticals */}
    {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map(t => {
      const x = 80 + (148 - 80) * t;
      const y = 40 + (10 - 40) * t;
      return <line key={t} x1={x} y1={y - 3} x2={x} y2={y + 3} stroke="hsl(48, 45%, 35%)" strokeWidth="0.5" />;
    })}

    {/* === DISCHARGE CHUTE (material falling down) === */}
    <polygon points="146,10 154,6 154,14" fill="hsl(48, 85%, 55%)" stroke="hsl(48, 55%, 28%)" strokeWidth="0.8" />
    <rect x="150" y="8" width="4" height="5" fill="hsl(48, 65%, 42%)" />
    {/* Falling material streams */}
    <line x1="152" y1="13" x2="154" y2="30" stroke="hsl(30, 55%, 48%)" strokeWidth="2" strokeDasharray="2 3" opacity="0.7" />
    <line x1="151" y1="12" x2="150" y2="26" stroke="hsl(30, 50%, 52%)" strokeWidth="1.2" strokeDasharray="1.5 2.5" opacity="0.5" />
    <line x1="153" y1="14" x2="156" y2="28" stroke="hsl(30, 45%, 45%)" strokeWidth="1" strokeDasharray="1 2" opacity="0.4" />

    {/* === COUNTER BOOM === */}
    <line x1="80" y1="40" x2="28" y2="54" stroke="hsl(48, 50%, 28%)" strokeWidth="4" />
    <line x1="80" y1="40" x2="28" y2="54" stroke="hsl(48, 60%, 44%)" strokeWidth="2.5" />
    {/* Counterweight */}
    <rect x="18" y="52" width="16" height="10" rx="1.5" fill="hsl(0, 0%, 30%)" stroke="hsl(0, 0%, 20%)" strokeWidth="0.8" />
    {[22, 26, 30].map(x => (
      <line key={x} x1={x} y1="54" x2={x} y2="60" stroke="hsl(0, 0%, 38%)" strokeWidth="0.5" />
    ))}

    {/* === CABLE STAYS === */}
    <line x1="80" y1="30" x2="148" y2="6" stroke="hsl(0, 0%, 40%)" strokeWidth="0.7" />
    <line x1="80" y1="30" x2="28" y2="48" stroke="hsl(0, 0%, 40%)" strokeWidth="0.7" />

    {/* === MAST === */}
    <line x1="80" y1="20" x2="80" y2="38" stroke="hsl(48, 50%, 28%)" strokeWidth="3" />
    <line x1="78" y1="24" x2="82" y2="32" stroke="hsl(48, 45%, 38%)" strokeWidth="0.4" />
    <line x1="82" y1="24" x2="78" y2="32" stroke="hsl(48, 45%, 38%)" strokeWidth="0.4" />

    {/* Warning light */}
    <circle cx="80" cy="18" r="2.5" fill="hsl(0, 75%, 50%)" />
    <circle cx="80" cy="18" r="1.5" fill="hsl(0, 85%, 62%)" opacity="0.8" />

    {/* Exhaust */}
    <rect x="106" y="68" width="4" height="6" rx="1" fill="hsl(0, 0%, 32%)" />
    <ellipse cx="108" cy="67" rx="2.5" ry="1" fill="hsl(0, 0%, 55%)" opacity="0.35" />

    {/* Conveyor belt on body (incoming material) */}
    <rect x="42" y="70" width="38" height="3" rx="1" fill="hsl(0, 0%, 28%)" />
    <line x1="42" y1="71.5" x2="80" y2="71.5" stroke="hsl(0, 0%, 38%)" strokeWidth="0.5" strokeDasharray="3 2" />
  </>
);

/** Reclaimer SVG — bucket wheel excavator reclaiming from stockpile */
const ReclaimerSVG = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`rp-body-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(210, 50%, 65%)" />
        <stop offset="100%" stopColor="hsl(210, 45%, 40%)" />
      </linearGradient>
      <linearGradient id={`rp-track-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(0, 0%, 40%)" />
        <stop offset="100%" stopColor="hsl(0, 0%, 20%)" />
      </linearGradient>
    </defs>

    {/* === TRACKS === */}
    <rect x="40" y="104" width="80" height="12" rx="6" fill={`url(#rp-track-${id})`} />
    <rect x="44" y="106" width="72" height="8" rx="4" fill="hsl(0, 0%, 32%)" />
    {[48, 56, 64, 72, 80, 88, 96, 104].map(x => (
      <rect key={x} x={x} y="106.5" width="2.5" height="7" rx="0.5" fill="hsl(0, 0%, 24%)" />
    ))}
    {[50, 58, 66, 74, 82, 90, 98, 106, 112].map(x => (
      <g key={x}>
        <circle cx={x} cy="110" r="3.5" fill="hsl(0, 0%, 18%)" />
        <circle cx={x} cy="110" r="2.2" fill="hsl(0, 0%, 28%)" />
        <circle cx={x} cy="110" r="0.8" fill="hsl(0, 0%, 42%)" />
      </g>
    ))}

    {/* === MAIN BODY / CABIN === */}
    <rect x="50" y="74" width="60" height="30" rx="3" fill={`url(#rp-body-${id})`} stroke="hsl(210, 38%, 28%)" strokeWidth="1.2" />
    {[56, 64, 72, 80, 88, 96, 104].map(x => (
      <circle key={x} cx={x} cy="77" r="1.2" fill="hsl(210, 32%, 32%)" />
    ))}
    {/* Cabin */}
    <rect x="56" y="80" width="18" height="10" rx="2" fill="hsl(200, 70%, 78%)" stroke="hsl(200, 45%, 42%)" strokeWidth="0.8" />
    <line x1="65" y1="80" x2="65" y2="90" stroke="hsl(200, 45%, 52%)" strokeWidth="0.5" />
    {/* Vents */}
    {[80, 85, 90, 95, 100].map(x => (
      <rect key={x} x={x} y="82" width="2" height="8" rx="0.5" fill="hsl(210, 32%, 28%)" />
    ))}
    <line x1="52" y1="94" x2="108" y2="94" stroke="hsl(210, 32%, 28%)" strokeWidth="0.8" />

    {/* === TOWER === */}
    <rect x="68" y="42" width="24" height="32" fill="hsl(210, 38%, 46%)" stroke="hsl(210, 32%, 28%)" strokeWidth="0.8" />
    <line x1="68" y1="42" x2="92" y2="74" stroke="hsl(210, 32%, 50%)" strokeWidth="0.5" />
    <line x1="92" y1="42" x2="68" y2="74" stroke="hsl(210, 32%, 50%)" strokeWidth="0.5" />
    <line x1="68" y1="54" x2="92" y2="54" stroke="hsl(210, 32%, 38%)" strokeWidth="0.5" />

    {/* === BOOM ARM (angled down-left to bucket wheel) === */}
    <line x1="80" y1="44" x2="24" y2="80" stroke="hsl(210, 38%, 28%)" strokeWidth="6" />
    <line x1="80" y1="44" x2="24" y2="80" stroke="hsl(210, 42%, 46%)" strokeWidth="4" />
    {/* Side rails */}
    <line x1="80" y1="42.5" x2="24" y2="78.5" stroke="hsl(210, 32%, 32%)" strokeWidth="0.6" />
    <line x1="80" y1="45.5" x2="24" y2="81.5" stroke="hsl(210, 32%, 32%)" strokeWidth="0.6" />
    {/* Truss */}
    {[0.2, 0.4, 0.6, 0.8].map(t => {
      const x = 80 + (24 - 80) * t;
      const y = 44 + (80 - 44) * t;
      return <line key={t} x1={x} y1={y - 3.5} x2={x} y2={y + 3.5} stroke="hsl(210, 32%, 35%)" strokeWidth="0.5" />;
    })}

    {/* === BUCKET WHEEL (fully visible) === */}
    <circle cx="24" cy="82" r="16" fill="none" stroke="hsl(210, 48%, 50%)" strokeWidth="3.5" />
    <circle cx="24" cy="82" r="6" fill="hsl(210, 48%, 55%)" stroke="hsl(210, 38%, 30%)" strokeWidth="1.2" />
    <circle cx="24" cy="82" r="2.8" fill="hsl(210, 42%, 42%)" />
    <circle cx="24" cy="82" r="1" fill="hsl(0, 0%, 48%)" />
    {/* Spokes and buckets */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
      const rad = (angle * Math.PI) / 180;
      const innerR = 6;
      const outerR = 14.5;
      const bx = 24 + (outerR - 1) * Math.cos(rad);
      const by = 82 + (outerR - 1) * Math.sin(rad);
      return (
        <g key={angle}>
          <line
            x1={24 + innerR * Math.cos(rad)} y1={82 + innerR * Math.sin(rad)}
            x2={24 + outerR * Math.cos(rad)} y2={82 + outerR * Math.sin(rad)}
            stroke="hsl(210, 38%, 35%)" strokeWidth="1.2"
          />
          <rect
            x={bx - 2} y={by - 1.5}
            width="4" height="3" rx="0.5"
            fill="hsl(210, 42%, 45%)"
            stroke="hsl(210, 38%, 30%)" strokeWidth="0.4"
            transform={`rotate(${angle}, ${bx}, ${by})`}
          />
        </g>
      );
    })}

    {/* === COUNTER BOOM === */}
    <line x1="80" y1="44" x2="148" y2="56" stroke="hsl(210, 38%, 28%)" strokeWidth="4.5" />
    <line x1="80" y1="44" x2="148" y2="56" stroke="hsl(210, 42%, 44%)" strokeWidth="2.8" />
    {/* Counterweight */}
    <rect x="140" y="52" width="18" height="12" rx="1.5" fill="hsl(0, 0%, 28%)" stroke="hsl(0, 0%, 20%)" strokeWidth="0.8" />
    {[144, 149, 154].map(x => (
      <line key={x} x1={x} y1="54" x2={x} y2="62" stroke="hsl(0, 0%, 36%)" strokeWidth="0.5" />
    ))}

    {/* === CABLE STAYS === */}
    <line x1="80" y1="32" x2="24" y2="76" stroke="hsl(0, 0%, 42%)" strokeWidth="0.7" />
    <line x1="80" y1="32" x2="148" y2="50" stroke="hsl(0, 0%, 42%)" strokeWidth="0.7" />

    {/* === MAST === */}
    <line x1="80" y1="22" x2="80" y2="42" stroke="hsl(210, 38%, 28%)" strokeWidth="3" />
    <line x1="78" y1="26" x2="82" y2="34" stroke="hsl(210, 32%, 38%)" strokeWidth="0.4" />
    <line x1="82" y1="26" x2="78" y2="34" stroke="hsl(210, 32%, 38%)" strokeWidth="0.4" />

    {/* Warning light */}
    <circle cx="80" cy="20" r="2.5" fill="hsl(0, 75%, 50%)" />
    <circle cx="80" cy="20" r="1.5" fill="hsl(0, 85%, 62%)" opacity="0.8" />

    {/* Exhaust */}
    <rect x="98" y="70" width="4" height="6" rx="1" fill="hsl(0, 0%, 32%)" />

    {/* Conveyor on body (outgoing material) */}
    <rect x="50" y="72" width="30" height="3" rx="1" fill="hsl(0, 0%, 28%)" />
    <line x1="50" y1="73.5" x2="80" y2="73.5" stroke="hsl(0, 0%, 38%)" strokeWidth="0.5" strokeDasharray="3 2" />
  </>
);

export default MachineIcon;
