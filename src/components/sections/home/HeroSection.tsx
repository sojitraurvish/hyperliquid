import Link from 'next/link';
import AppButton from '@/components/ui/button';
import { VARIANT_TYPES } from '@/lib/constants';
import { ROUTES } from '@/lib/config';

export const HeroSection = () => {
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
    <section className="relative w-full min-h-[600px] sm:min-h-[700px] md:min-h-[800px] flex items-center justify-center overflow-hidden bg-gray-950">
      {/* Chart Background Pattern */}
      <div className="absolute inset-0 opacity-30 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <linearGradient id="candleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#22c55e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow">
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
            stroke="url(#lineGradient)"
            strokeWidth="0.3"
            filter="url(#glow)"
            className="animate-pulse"
          />

          {/* Line graph markers */}
          {linePoints.filter((_, i) => i % 10 === 0).map((point, i) => (
            <circle
              key={`marker-${i}`}
              cx={point.x}
              cy={point.y}
              r="0.4"
              fill="#22c55e"
              opacity="0.8"
              filter="url(#glow)"
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
                fill="url(#candleGradient)"
                filter="url(#glow)"
                opacity="0.7"
              />
              {/* Top wick */}
              <line
                x1={candle.x}
                y1={candle.y}
                x2={candle.x}
                y2={candle.y - 2}
                stroke="#22c55e"
                strokeWidth="0.2"
                opacity="0.6"
              />
              {/* Bottom wick */}
              <line
                x1={candle.x}
                y1={candle.y + candle.height}
                x2={candle.x}
                y2={candle.y + candle.height + 2}
                stroke="#22c55e"
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
        {/* Badge */}
        <div className="inline-flex items-center px-4 py-2 mb-6 bg-green-500/10 border border-green-500/20 rounded-full">
          <span className="text-sm sm:text-base text-green-400 font-medium">
            Trade with up to 50x leverage
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          The Most Advanced{' '}
          <span className="text-green-400">Decentralized</span> Perpetual Exchange
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
          Trade any asset with deep liquidity, low fees, and lightning-fast execution. Built for professional traders, accessible to everyone.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={ROUTES.TRADE}>
            <AppButton
              variant={VARIANT_TYPES.NOT_SELECTED}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-base sm:text-lg font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Start Trading →
            </AppButton>
          </Link>
          <AppButton
            variant={VARIANT_TYPES.NOT_SELECTED}
            className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-base sm:text-lg font-semibold rounded-lg transition-all duration-200"
          >
            Learn More
          </AppButton>
        </div>
      </div>
    </section>
  );
};

