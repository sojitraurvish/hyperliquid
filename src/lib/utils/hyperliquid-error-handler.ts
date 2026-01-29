import { errorHandler } from "@/store/errorHandler";

/**
 * Wraps hyperliquid client calls with error handling
 * This ensures all errors are properly caught and shown to users via toast
 */
export async function withErrorHandling<T>(
  promise: Promise<T>,
  errorTitle?: string
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    // Check if it's an HTTP error (429, 500, etc.)
    const httpError = error as {
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

    // Handle specific HTTP status codes
    if (httpError.response?.status === 429) {
      errorHandler(error, errorTitle || "Too Many Requests");
    } else if (httpError.response?.status && httpError.response.status >= 400) {
      errorHandler(error, errorTitle || "Request Failed");
    } else {
      // For other errors, use the default error handler
      errorHandler(error, errorTitle);
    }

    // Re-throw to allow calling code to handle if needed
    throw error;
  }
}





