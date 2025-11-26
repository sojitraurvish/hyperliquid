import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/tailwind/cn";

type PortalProps = {
  children: React.ReactNode;
  containerId?: string;
  className?: string;
  overlay?: boolean;
  overlayClassName?: string;
  closeOnOutsideClick?: boolean;
  onClose?: () => void;
  zIndex?: number;
};

const Portal: React.FC<PortalProps> = ({
  children,
  containerId = "portal-root",
  className = "",
  overlay = false,
  overlayClassName = "",
  closeOnOutsideClick = false,
  onClose,
  zIndex = 9999,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Create container if it doesn't exist
    let portalContainer = document.getElementById(containerId);
    
    if (!portalContainer) {
      portalContainer = document.createElement("div");
      portalContainer.setAttribute("id", containerId);
      document.body.appendChild(portalContainer);
    }

    setMounted(true);

    return () => {
      // Cleanup only if we created the container
      if (portalContainer && portalContainer.childElementCount === 0) {
        document.body.removeChild(portalContainer);
      }
    };
  }, [containerId]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0",
        overlay && "bg-black/50",
        overlayClassName
      )}
      style={{ zIndex }}
      onClick={handleOverlayClick}
    >
      <div className={cn("relative h-full w-full", className)}>
        {children}
      </div>
    </div>,
    document.getElementById(containerId) as HTMLElement
  );
};

export default Portal;