import { appToast } from "@/components/ui/toast";

/**
 * General error handling method that returns an error message
 */
export const errorHandler = (error: unknown) => {
  const errorObj = error as { 
    response?: { 
      data?: { 
        message?: string 
      } 
    }; 
    message?: string 
  };
  
  appToast.error({
    title: "Error from errorHandler",
    message: errorObj.response?.data?.message || errorObj.message || "An error occurred",
  });
  
  return errorObj.response?.data?.message || errorObj.message || "An error occurred";
};
  