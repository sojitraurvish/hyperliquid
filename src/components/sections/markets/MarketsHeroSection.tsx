export const MarketsHeroSection = () => {
  const generateCandlesticks = () => {
    const positions = Array.from({ length: 50 }, (_, i) => ({
      x: (i * 2) + 10,
      height: 40 + Math.random() * 60,
      y: 30 + Math.random() * 40,
      width: 1.5,
    }));
    return positions;
  };

  const candlesticks = generateCandlesticks();

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
    <section className="relative w-full min-h-[280px] sm:min-h-[340px] md:min-h-[420px] lg:min-h-[480px] flex items-center justify-center overflow-hidden bg-gray-950">
      {/* Chart Background Pattern */}
      <div className="absolute inset-0 opacity-25 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
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

          {[20, 40, 60, 80].map((y) => (
            <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#1f2937" strokeWidth="0.1" />
          ))}
          {[10, 30, 50, 70, 90].map((x) => (
            <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#1f2937" strokeWidth="0.1" />
          ))}

          <polyline
            points={linePoints.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="url(#marketsLineGradient)"
            strokeWidth="0.3"
            filter="url(#marketsGlow)"
            className="animate-pulse"
          />
          {linePoints.filter((_, i) => i % 10 === 0).map((point, i) => (
            <circle key={`marker-${i}`} cx={point.x} cy={point.y} r="0.4" fill="#10b981" opacity="0.8" filter="url(#marketsGlow)" />
          ))}

          {candlesticks.map((candle, i) => (
            <g key={`candle-${i}`}>
              <rect x={candle.x - candle.width / 2} y={candle.y} width={candle.width} height={candle.height} fill="url(#marketsCandleGradient)" filter="url(#marketsGlow)" opacity="0.7" />
              <line x1={candle.x} y1={candle.y} x2={candle.x} y2={candle.y - 2} stroke="#10b981" strokeWidth="0.2" opacity="0.6" />
              <line x1={candle.x} y1={candle.y + candle.height} x2={candle.x} y2={candle.y + candle.height + 2} stroke="#10b981" strokeWidth="0.2" opacity="0.6" />
            </g>
          ))}
        </svg>
      </div>

      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-green-500/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Radial overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,7,18,0.6)_60%,rgba(3,7,18,0.95)_100%)]" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block text-sm font-semibold text-green-400 tracking-widest uppercase mb-4 px-4 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
          Markets
        </span>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
          Trade 100+{' '}
          <span className="bg-linear-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">Markets</span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Access perpetual futures on all major cryptocurrencies with deep liquidity and tight spreads.
        </p>
      </div>
    </section>
  );
};
