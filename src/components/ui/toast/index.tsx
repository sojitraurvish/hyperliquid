import { ToastContainer, toast, type ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { cn } from "@/lib/tailwind/cn";

// ==================== Toast Variants (Dark Theme) ====================

const TOAST_VARIANT = {
  success: "!bg-gray-900 !border !border-green-500/30 !text-green-400 !shadow-lg !shadow-green-500/5 toast--success",
  error: "!bg-gray-900 !border !border-red-500/30 !text-red-400 !shadow-lg !shadow-red-500/5 toast--error",
  info: "!bg-gray-900 !border !border-gray-700 !text-gray-300 !shadow-lg !shadow-black/20 toast--info",
  warning: "!bg-gray-900 !border !border-yellow-500/30 !text-yellow-400 !shadow-lg !shadow-yellow-500/5 toast--warning",
  notification: "!bg-gray-900 !border !border-gray-700 !text-white !shadow-lg !shadow-black/20 toast--info",
  loading: "!bg-gray-900 !border !border-gray-700 !text-gray-300 !shadow-lg !shadow-black/20 toast--info",
} as const;

// ==================== Toast Container ====================

type ToastProps = {
  position?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
  autoClose?: number | false;
};

export const AppToast = ({
  position = "top-right",
  autoClose = 5000,
}: ToastProps = {}) => {
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
      theme="dark"
      style={{ zIndex: 10000 }}
      toastClassName={() =>
        cn(
          "relative flex p-4 min-h-10 rounded-lg justify-between overflow-hidden cursor-pointer",
          TOAST_VARIANT.info
        )
      }
    />
  );
};

// ==================== Toast Content Renderers ====================

type ToastContent = {
  title?: string;
  message?: string;
};

const renderToastContent = ({ title, message }: ToastContent) => (
  <div className="flex flex-col gap-0.5">
    {title && <p className="font-semibold text-sm text-white">{title}</p>}
    {message && <p className="text-sm opacity-90">{message}</p>}
  </div>
);

const renderLoadingToastContent = ({ title, message }: ToastContent) => (
  <div className="flex items-center gap-3">
    <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin shrink-0" />
    <div className="flex flex-col gap-0.5">
      {title && <p className="font-semibold text-sm text-white">{title}</p>}
      {message && <p className="text-sm opacity-90">{message}</p>}
    </div>
  </div>
);

// ==================== Toast Functions ====================

const parseContent = (content: string | ToastContent): ToastContent =>
  typeof content === "string" ? { message: content } : content;

export const appToast = {
  success: (content: string | ToastContent, options?: ToastOptions) => {
    return toast.success(renderToastContent(parseContent(content)), {
      className: TOAST_VARIANT.success,
      icon: () => <ToastIcon type="success" />,
      ...options,
    });
  },

  error: (content: string | ToastContent, options?: ToastOptions) => {
    return toast.error(renderToastContent(parseContent(content)), {
      className: TOAST_VARIANT.error,
      icon: () => <ToastIcon type="error" />,
      ...options,
    });
  },

  info: (content: string | ToastContent, options?: ToastOptions) => {
    return toast.info(renderToastContent(parseContent(content)), {
      className: TOAST_VARIANT.info,
      icon: () => <ToastIcon type="info" />,
      ...options,
    });
  },

  warning: (content: string | ToastContent, options?: ToastOptions) => {
    return toast.warning(renderToastContent(parseContent(content)), {
      className: TOAST_VARIANT.warning,
      icon: () => <ToastIcon type="warning" />,
      ...options,
    });
  },

  notification: (content: string | ToastContent, options?: ToastOptions) => {
    return toast(renderToastContent(parseContent(content)), {
      className: TOAST_VARIANT.notification,
      icon: false,
      ...options,
    });
  },

  loading: (content: string | ToastContent, options?: ToastOptions) => {
    return toast(renderLoadingToastContent(parseContent(content)), {
      className: TOAST_VARIANT.loading,
      icon: false,
      autoClose: false,
      ...options,
    });
  },
};

// ==================== Custom Toast Icons ====================

const ToastIcon = ({ type }: { type: "success" | "error" | "info" | "warning" }) => {
  const icons = {
    success: (
      <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-yellow-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  return icons[type] || null;
};
