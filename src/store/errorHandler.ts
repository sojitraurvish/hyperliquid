import { appToast } from "@/components/ui/toast";

/**
 * General error handling method that shows toast and returns error message
 */
export const errorHandler = (error: unknown, customTitle?: string) => {
  // Handle Axios/HTTP errors
  const axiosError = error as {
    response?: {
      status?: number;
      statusText?: string;
      data?: {
        message?: string;
        error?: string;
      };
    };
    message?: string;
    code?: string;
  };

  // Handle regular Error objects
  const regularError = error as {
    message?: string;
    name?: string;
  };

  const status = axiosError.response?.status;
  const statusText = axiosError.response?.statusText;
  const errorMessage = 
    axiosError.response?.data?.message || 
    axiosError.response?.data?.error ||
    axiosError.message ||
    regularError.message ||
    "An unknown error occurred";

  // Handle specific HTTP status codes
  let title = customTitle || "Error";
  let message = errorMessage;

  if (status === 429) {
    title = "Too Many Requests";
    message = "You've made too many requests. Please wait a moment and try again.";
  } else if (status === 401) {
    title = "Unauthorized";
    message = "Your session has expired. Please refresh the page.";
  } else if (status === 403) {
    title = "Forbidden";
    message = "You don't have permission to perform this action.";
  } else if (status === 404) {
    title = "Not Found";
    message = "The requested resource was not found.";
  } else if (status === 500) {
    title = "Server Error";
    message = "An internal server error occurred. Please try again later.";
  } else if (status === 503) {
    title = "Service Unavailable";
    message = "The service is temporarily unavailable. Please try again later.";
  } else if (status && status >= 400) {
    title = `Error ${status}`;
    message = statusText || errorMessage;
  } else if (axiosError.code === "ECONNABORTED" || errorMessage.includes("timeout")) {
    title = "Request Timeout";
    message = "The request took too long. Please check your connection and try again.";
  } else if (axiosError.code === "ERR_NETWORK" || errorMessage.includes("Network")) {
    title = "Network Error";
    message = "Unable to connect to the server. Please check your internet connection.";
  }

  // Show toast notification
  appToast.error({
    title,
    message,
  });

  // Return error message for further handling if needed
  return message;
};
  