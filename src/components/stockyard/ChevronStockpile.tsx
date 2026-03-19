import type { Stockpile } from "@/data/mockData";

interface ChevronStockpileProps {
  stockpile: Stockpile;
  maxMeters?: number;
  onClick: (stockpile: Stockpile) => void;
}

const ChevronStockpile = ({ stockpile, maxMeters = 500, onClick }: ChevronStockpileProps) => {
  const start = Math.min(stockpile.startPosition, stockpile.endPosition);
  const end = Math.max(stockpile.startPosition, stockpile.endPosition);
  const length = end - start;

  const leftPercent = ((maxMeters - end) / maxMeters) * 100;
  const widthPercent = (length / maxMeters) * 100;

  const height = 70;

  return (
    <div
      className="absolute bottom-0 cursor-pointer group transition-transform hover:scale-[1.02]"
      style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, height: `${height}px` }}
      onClick={() => onClick(stockpile)}
    >
      <svg
        viewBox={`0 0 120 ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full drop-shadow-lg"
      >
        <defs>
          {/* Front face gradient */}
          <linearGradient id={`trap-front-${stockpile.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(142, 55%, 58%)" />
            <stop offset="50%" stopColor="hsl(142, 50%, 45%)" />
            <stop offset="100%" stopColor="hsl(142, 55%, 32%)" />
          </linearGradient>
          {/* Top face gradient */}
          <linearGradient id={`trap-top-${stockpile.id}`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="hsl(142, 45%, 65%)" />
            <stop offset="100%" stopColor="hsl(142, 50%, 52%)" />
          </linearGradient>
          {/* Right side face gradient (darker) */}
          <linearGradient id={`trap-side-${stockpile.id}`} x1="0" y1="0" x2="1" y2="0.5">
            <stop offset="0%" stopColor="hsl(142, 50%, 40%)" />
            <stop offset="100%" stopColor="hsl(142, 55%, 28%)" />
          </linearGradient>
        </defs>

        {/* 3D Isosceles Trapezoid */}
        {/* Front face */}
        <polygon
          points={`4,${height} 22,8 88,8 106,${height}`}
          fill={`url(#trap-front-${stockpile.id})`}
          stroke="hsl(142, 55%, 22%)"
          strokeWidth="0.5"
          className="group-hover:brightness-110 transition-all"
        />
        {/* Top face (3D depth) */}
        <polygon
          points={`22,8 30,2 96,2 88,8`}
          fill={`url(#trap-top-${stockpile.id})`}
          stroke="hsl(142, 55%, 22%)"
          strokeWidth="0.4"
          className="group-hover:brightness-110 transition-all"
        />
        {/* Right side face (3D depth) */}
        <polygon
          points={`88,8 96,2 114,${height - 6} 106,${height}`}
          fill={`url(#trap-side-${stockpile.id})`}
          stroke="hsl(142, 55%, 22%)"
          strokeWidth="0.4"
          className="group-hover:brightness-110 transition-all"
        />

        {/* Layer lines on front face */}
        {stockpile.layers.slice(0, 4).map((_, i) => {
          const y = height - ((i + 1) * (height - 8) / (stockpile.layers.length + 1));
          const ratio = (y - 8) / (height - 8);
          const x1 = 22 - (22 - 4) * ratio;
          const x2 = 88 + (106 - 88) * ratio;
          return (
            <line key={i} x1={x1} y1={y} x2={x2} y2={y}
              stroke="hsl(142, 40%, 55%)" strokeWidth="0.3" strokeDasharray="3 2" opacity="0.5" />
          );
        })}

        {/* Subtle edge highlights */}
        <line x1="22" y1="8" x2="88" y2="8" stroke="hsl(142, 50%, 65%)" strokeWidth="0.3" opacity="0.6" />
        <line x1="4" y1={height} x2="22" y2="8" stroke="hsl(142, 50%, 60%)" strokeWidth="0.2" opacity="0.4" />
      </svg>
      {/* Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[9px] font-semibold text-primary-foreground drop-shadow-md leading-none truncate max-w-full px-1">
          {stockpile.name}
        </span>
        <span className="text-[7px] font-mono text-primary-foreground/80 drop-shadow-sm">
          {stockpile.totalTonnage.toLocaleString()} {stockpile.unit}
        </span>
      </div>
    </div>
  );
};

export default ChevronStockpile;
