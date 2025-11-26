import React, { useState, useEffect, ReactNode } from 'react';

interface HydrationGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * HydrationGuard prevents hydration mismatches by ensuring components
 * only render on the client side after hydration is complete.
 * 
 * Use this component to wrap any component that:
 * - Reads from localStorage, sessionStorage, or cookies
 * - Uses window object or other browser-only APIs
 * - Has different server vs client rendering behavior
 * 
 * @param children - The component(s) to render after hydration
 * @param fallback - Optional fallback to show during SSR (defaults to null)
 * @param className - Optional className for the wrapper div
 */
const HydrationGuard: React.FC<HydrationGuardProps> = ({ 
  children, 
  fallback = null,
  className 
}) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This only runs on the client after hydration
    setIsHydrated(true);
  }, []);

  // During SSR and before hydration, show fallback or nothing
  if (!isHydrated) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  // After hydration, render the actual content
  return <div className={className}>{children}</div>;
};

export default HydrationGuard;
