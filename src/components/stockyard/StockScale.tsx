interface StockScaleProps {
  maxMeters?: number;
}

const StockScale = ({ maxMeters = 500 }: StockScaleProps) => {
  const ticks = [];
  const step = 50;
  for (let i = 0; i <= maxMeters; i += step) {
    ticks.push(i);
  }

  return (
    <div className="relative w-full h-6 mb-1">
      {/* Scale line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-scale-line" />
      {/* Ticks - 0 on RIGHT, 500 on LEFT */}
      {ticks.map((m) => {
        const leftPercent = ((maxMeters - m) / maxMeters) * 100;
        return (
          <div key={m} className="absolute bottom-0" style={{ left: `${leftPercent}%` }}>
            <div className="w-px h-2.5 bg-scale-line mx-auto" />
            <span className="absolute -top-0.5 -translate-x-1/2 text-[9px] font-mono text-scale-text select-none">
              {m}m
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default StockScale;
