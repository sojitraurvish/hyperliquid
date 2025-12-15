import { cn } from '@/lib/tailwind/cn';
import React from 'react';

type Props = {
  className?: string;
};

export const ProgressShimmer: React.FC<Props> = ({ className = "" }) => {
  return (
    <div className={cn("w-full h-1 bg-gray-700 rounded-full overflow-hidden relative", className)}>
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent w-full"
        style={{
          animation: 'shimmer 2s ease-in-out infinite',
          transform: 'translateX(-100%)'
        }}
      ></div>
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-3/4"
        style={{
          animation: 'shimmer 2.5s ease-in-out infinite 0.5s',
          transform: 'translateX(-100%)'
        }}
      ></div>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(300%);
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressShimmer;