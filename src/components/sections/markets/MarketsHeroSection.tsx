export const MarketsHeroSection = () => {
  // Generate candlestick data for background
  const generateCandlesticks = () => {
    const candlesticks = [];
    const baseHeight = 40;
    const positions = Array.from({ length: 50 }, (_, i) => ({
      x: (i * 2) + 10,
      height: baseHeight + Math.random() * 60,
      y: 30 + Math.random() * 40,
      width: 1.5,
    }));
    return positions;
  };

  const candlesticks = generateCandlesticks();

  // Generate line graph points
  const generateLinePoints = () => {
    const points = [];
    let y = 50;
    for (let i = 0; i < 100; i++) {
      y += (Math.random() - 0.5) * 3;
      y = Math.max(20, Math.min(80, y));
      points.push({ x: i, y });
    }
    return points;
  };

  const linePoints = generateLinePoints();

  return (
    <section className="relative w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden bg-gray-950">
      {/* Chart Background Pattern */}
      <div className="absolute inset-0 opacity-30 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <linearGradient id="marketsCandleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="marketsLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
            <filter id="marketsGlow">
              <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal grid lines */}
          {[20, 40, 60, 80].map((y) => (
            <line
              key={`h-${y}`}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#1f2937"
              strokeWidth="0.1"
            />
          ))}

          {/* Vertical grid lines */}
          {[10, 30, 50, 70, 90].map((x) => (
            <line
              key={`v-${x}`}
              x1={x}
              y1="0"
              x2={x}
              y2="100"
              stroke="#1f2937"
              strokeWidth="0.1"
            />
          ))}

          {/* Line graph */}
          <polyline
            points={linePoints.map((p, i) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="url(#marketsLineGradient)"
            strokeWidth="0.3"
            filter="url(#marketsGlow)"
            className="animate-pulse"
          />

          {/* Line graph markers */}
          {linePoints.filter((_, i) => i % 10 === 0).map((point, i) => (
            <circle
              key={`marker-${i}`}
              cx={point.x}
              cy={point.y}
              r="0.4"
              fill="#10b981"
              opacity="0.8"
              filter="url(#marketsGlow)"
            />
          ))}

          {/* Candlesticks */}
          {candlesticks.map((candle, i) => (
            <g key={`candle-${i}`}>
              {/* Candle body */}
              <rect
                x={candle.x - candle.width / 2}
                y={candle.y}
                width={candle.width}
                height={candle.height}
                fill="url(#marketsCandleGradient)"
                filter="url(#marketsGlow)"
                opacity="0.7"
              />
              {/* Top wick */}
              <line
                x1={candle.x}
                y1={candle.y}
                x2={candle.x}
                y2={candle.y - 2}
                stroke="#10b981"
                strokeWidth="0.2"
                opacity="0.6"
              />
              {/* Bottom wick */}
              <line
                x1={candle.x}
                y1={candle.y + candle.height}
                x2={candle.x}
                y2={candle.y + candle.height + 2}
                stroke="#10b981"
                strokeWidth="0.2"
                opacity="0.6"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Additional animated vertical lines for depth */}
      <div className="absolute inset-0 opacity-10 overflow-hidden">
        <div className="absolute inset-0">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-full bg-gradient-to-b from-transparent via-green-400 to-transparent"
              style={{
                left: `${(i * 6.5) + 5}%`,
                animation: `chartPulse 4s ease-in-out infinite ${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Markets Label */}
        <div className="mb-4">
          <span className="text-sm sm:text-base text-gray-400 font-medium">Markets</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Trade 100+ Markets
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Access perpetual futures on all major cryptocurrencies with deep liquidity and tight spreads.
        </p>
      </div>
    </section>
  );
};





