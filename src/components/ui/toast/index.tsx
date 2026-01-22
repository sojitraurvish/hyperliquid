import { ToastContainer, toast, type ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { cn } from "@/lib/tailwind/cn";
import { VARIANT_TYPES } from "@/lib/constants";

const TOAST_VARIANTS = {
  [VARIANT_TYPES.PRIMARY]: "bg-primary text-primary-foreground",
  [VARIANT_TYPES.SECONDARY]: "bg-background text-foreground border border-border",
  [VARIANT_TYPES.TERTIARY]: "bg-destructive text-destructive-foreground",
  [VARIANT_TYPES.QUATERNARY]: "bg-warning text-warning-foreground",
  [VARIANT_TYPES.QUINARY]: "bg-white text-gray-900 shadow-md", // New white variant
} as const;

type ToastVariant = keyof typeof TOAST_VARIANTS;

type ToastProps = {
  variant?: ToastVariant;
  position?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
  autoClose?: number | false;
  className?: string;
};

export const AppToast = ({
  variant = VARIANT_TYPES.PRIMARY,
  position = "top-right",
  autoClose = 5000,
  className = "",
}: ToastProps) => {
  return (
    <ToastContainer
      position={position}
      autoClose={autoClose}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      style={{ zIndex: 10000 }}
      toastClassName={() =>
        cn(
          "relative flex p-4 min-h-10 rounded-lg justify-between overflow-hidden cursor-pointer",
          TOAST_VARIANTS[variant],
          className
        )
      }
    />
  );
};

type ToastContent = {
  title?: string;
  message?: string;
};

const renderToastContent = ({ title, message }: ToastContent) => (
  <div className="flex flex-col">
    {title && <p className="font-semibold">{title}</p>}
    {message && <p className={title ? "mt-1" : ""}>{message}</p>}
  </div>
);

const renderLoadingToastContent = ({ title, message }: ToastContent) => (
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
    <div className="flex flex-col">
      {title && <p className="font-semibold">{title}</p>}
      {message && <p className={title ? "mt-1" : ""}>{message}</p>}
    </div>
  </div>
);

// Toast functions
export const appToast = {
  success: (content: string | ToastContent, options?: ToastOptions) => {
    const toastContent = typeof content === "string" 
      ? { message: content } 
      : content;
    return toast.success(renderToastContent(toastContent), {
      className: cn(
        TOAST_VARIANTS[VARIANT_TYPES.PRIMARY],
        options?.className
      ),
      ...options,
    });
  },
  error: (content: string | ToastContent, options?: ToastOptions) => {
    const toastContent = typeof content === "string" 
      ? { message: content } 
      : content;
    return toast.error(renderToastContent(toastContent), {
      className: cn(
        TOAST_VARIANTS[VARIANT_TYPES.TERTIARY],
        options?.className
      ),
      ...options,
    });
  },
  info: (content: string | ToastContent, options?: ToastOptions) => {
    const toastContent = typeof content === "string" 
      ? { message: content } 
      : content;
    return toast.info(renderToastContent(toastContent), {
      className: cn(
        TOAST_VARIANTS[VARIANT_TYPES.SECONDARY],
        options?.className
      ),
      ...options,
    });
  },
  warning: (content: string | ToastContent, options?: ToastOptions) => {
    const toastContent = typeof content === "string" 
      ? { message: content } 
      : content;
    return toast.warning(renderToastContent(toastContent), {
      className: cn(
        TOAST_VARIANTS[VARIANT_TYPES.QUATERNARY],
        options?.className
      ),
      ...options,
    });
  },
  // New white variant notification
  notification: (content: string | ToastContent, options?: ToastOptions) => {
    const toastContent = typeof content === "string" 
      ? { message: content } 
      : content;
    return toast(renderToastContent(toastContent), {
      className: cn(
        TOAST_VARIANTS[VARIANT_TYPES.QUINARY],
        options?.className
      ),
      ...options,
    });
  },
  loading: (content: string | ToastContent, options?: ToastOptions) => {
    const toastContent = typeof content === "string" 
      ? { message: content } 
      : content;
    return toast(renderLoadingToastContent(toastContent), {
      type: "default",
      className: cn(
        TOAST_VARIANTS[VARIANT_TYPES.SECONDARY],
        options?.className
      ),
      icon: false,
      ...options,
    });
  },
};