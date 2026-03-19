import type { Stockpile } from "@/data/mockData";

interface ConeStockpileProps {
  stockpile: Stockpile;
  maxMeters?: number;
  onClick: (stockpile: Stockpile) => void;
}

const ConeStockpile = ({ stockpile, maxMeters = 500, onClick }: ConeStockpileProps) => {
  const start = Math.min(stockpile.startPosition, stockpile.endPosition);
  const end = Math.max(stockpile.startPosition, stockpile.endPosition);
  const length = end - start;

  const leftPercent = ((maxMeters - end) / maxMeters) * 100;
  const widthPercent = (length / maxMeters) * 100;

  const numCones = Math.max(2, Math.min(5, Math.floor(length / 15)));
  const height = 75;

  return (
    <div
      className="absolute bottom-0 cursor-pointer group transition-transform hover:scale-[1.02]"
      style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, height: `${height}px` }}
      onClick={() => onClick(stockpile)}
    >
      <svg viewBox={`0 0 120 ${height}`} preserveAspectRatio="none" className="w-full h-full drop-shadow-lg">
        <defs>
          {/* Lit (sunny) side gradient */}
          <linearGradient id={`cone-lit-${stockpile.id}`} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="hsl(30, 85%, 68%)" />
            <stop offset="40%" stopColor="hsl(30, 80%, 58%)" />
            <stop offset="100%" stopColor="hsl(30, 85%, 42%)" />
          </linearGradient>
          {/* Shadow side gradient */}
          <linearGradient id={`cone-shd-${stockpile.id}`} x1="0.8" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="hsl(30, 70%, 52%)" />
            <stop offset="60%" stopColor="hsl(30, 75%, 38%)" />
            <stop offset="100%" stopColor="hsl(30, 80%, 28%)" />
          </linearGradient>
          {/* Base ellipse gradient */}
          <radialGradient id={`cone-base-${stockpile.id}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="hsl(30, 70%, 45%)" />
            <stop offset="100%" stopColor="hsl(30, 80%, 32%)" />
          </radialGradient>
        </defs>

        {Array.from({ length: numCones }).map((_, i) => {
          const coneWidth = 120 / numCones;
          const cx = coneWidth * i + coneWidth / 2;
          const baseHalf = coneWidth * 0.48;
          const coneH = height * (0.75 + (i % 2) * 0.12);
          const topY = height - coneH;
          const depthOffset = 6; // 3D depth offset

          return (
            <g key={i} className="group-hover:brightness-110 transition-all">
              {/* Base ellipse for 3D effect */}
              <ellipse
                cx={cx}
                cy={height - 2}
                rx={baseHalf}
                ry={5}
                fill={`url(#cone-base-${stockpile.id})`}
                opacity="0.7"
              />

              {/* Back/shadow side of cone (right half, darker) */}
              <polygon
                points={`${cx},${height - 1} ${cx},${topY} ${cx + baseHalf},${height - 1}`}
                fill={`url(#cone-shd-${stockpile.id})`}
              />

              {/* Front/lit side of cone (left half, lighter) */}
              <polygon
                points={`${cx - baseHalf},${height - 1} ${cx},${topY} ${cx},${height - 1}`}
                fill={`url(#cone-lit-${stockpile.id})`}
              />

              {/* Depth edge on right (3D illusion) */}
              <polygon
                points={`${cx + baseHalf},${height - 1} ${cx},${topY} ${cx + depthOffset},${topY - 2} ${cx + baseHalf + depthOffset},${height - 3}`}
                fill="hsl(30, 75%, 30%)"
                opacity="0.35"
              />

              {/* Outline */}
              <polygon
                points={`${cx - baseHalf},${height - 1} ${cx},${topY} ${cx + baseHalf},${height - 1}`}
                fill="none"
                stroke="hsl(30, 80%, 25%)"
                strokeWidth="0.4"
              />

              {/* Peak highlight */}
              <circle cx={cx} cy={topY + 1} r="1.2" fill="hsl(30, 90%, 75%)" opacity="0.6" />

              {/* Horizontal contour lines for 3D texture */}
              {[0.3, 0.55, 0.78].map((ratio, li) => {
                const ly = topY + (height - 1 - topY) * ratio;
                const lx1 = cx - baseHalf * ratio;
                const lx2 = cx + baseHalf * ratio;
                return (
                  <line key={li} x1={lx1} y1={ly} x2={lx2} y2={ly}
                    stroke="hsl(30, 60%, 55%)" strokeWidth="0.25" strokeDasharray="2 1.5" opacity="0.4" />
                );
              })}
            </g>
          );
        })}
      </svg>
      {/* Label */}
      <div className="absolute inset-x-0 -bottom-5 flex flex-col items-center pointer-events-none">
        <span className="text-[9px] font-semibold text-foreground leading-none truncate max-w-full px-1">
          {stockpile.name}
        </span>
        <span className="text-[7px] font-mono text-muted-foreground">
          {stockpile.totalTonnage.toLocaleString()} {stockpile.unit}
        </span>
      </div>
    </div>
  );
};

export default ConeStockpile;
