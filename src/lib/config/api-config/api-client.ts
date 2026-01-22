import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/lib/config';
import { API_ROUTES } from '@/lib/api-routes';
import { getCookie, setCookie } from '@/lib/sessions/cookie';
import { COOKIE_NAMES } from '@/lib/sessions/cookie';
import { COOKIE_PREFIX } from '@/lib/constants';
import { errorHandler } from '@/store/errorHandler';

// Client-side context simulation
type ClientContext = object;

// Enhanced token cache per "context" (singleton for client)
const promiseCache = new WeakMap<ClientContext, {
  guestPromise?: Promise<void>;       // For initial token generation
  refreshPromise?: Promise<void>;     // For token refresh
}>();

// Singleton context for client
const CLIENT_CONTEXT: ClientContext = {};

// Initialize promise cache for client context
if (!promiseCache.has(CLIENT_CONTEXT)) {
  promiseCache.set(CLIENT_CONTEXT, {});
}

// Initialize token cache for client context
// if (!tokenCache.has(CLIENT_CONTEXT)) {
//   tokenCache.set(CLIENT_CONTEXT, {
//     accessToken: getCookie({ name: COOKIE_NAMES.ACCESS_TOKEN }) || '',
//     refreshToken: getCookie({ name: COOKIE_NAMES.REFRESH_TOKEN }) || '',
//   });
// }

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor - optimized for parallel requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const cache = promiseCache.get(CLIENT_CONTEXT)!;

    const accessToken = getCookie({ name: COOKIE_NAMES.ACCESS_TOKEN }) || '';
    const refreshToken = getCookie({ name: COOKIE_NAMES.REFRESH_TOKEN }) || '';
    console.log("accessToken" , (accessToken === "undefined"));
    console.log("refreshToken", refreshToken);

   

    // If tokens are missing, generate them (with promise sharing)
    if ((!accessToken || !refreshToken) || (accessToken === "undefined" || refreshToken === "undefined" )) {
      console.log("guestAuth" , accessToken);
      if (!cache.guestPromise) {
        console.log("cache.guestPromise" , cache.guestPromise);
        cache.guestPromise = (async () => {  
          try {
            await generateGuestTokens();
          } finally {
            cache.guestPromise = undefined;
          }
        })();
      }
      await cache.guestPromise;
    }
    
    const newAccessToken = getCookie({ name: COOKIE_NAMES.ACCESS_TOKEN }) || '';
    const newRefreshToken = getCookie({ name: COOKIE_NAMES.REFRESH_TOKEN }) || '';
    // Set headers with current tokens
    config.headers.Authorization = newAccessToken;
    config.headers.refreshtoken = newRefreshToken;
    
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - handles token refresh and global error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const cache = promiseCache.get(CLIENT_CONTEXT)!;
    
    // Handle 401 errors for token refresh (only for token expired messages)
    if (
      originalRequest && 
      error.response?.status === 401 && 
      (error.response.data as { message?: string })?.message?.startsWith("Token expired")
    ) {
      // Skip retry for guest auth and refresh token endpoints
      if (
        originalRequest.url?.includes("guestAuth") ||
        originalRequest.url?.includes("refreshToken")
      ) {
        // Don't show toast for auth errors, they're handled internally
        return Promise.reject(error);
      }

      // Handle token refresh with single execution
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Ensure only one refresh operation per context
          if (!cache?.refreshPromise) {
            cache.refreshPromise = (async () => {
              try {
                await refreshTokens();
              } finally {
                cache.refreshPromise = undefined;
              }
            })();
          }
          
          await cache?.refreshPromise;
          
          // Retry with new tokens
          const accessToken = getCookie({ name: COOKIE_NAMES.ACCESS_TOKEN }) || '';
          const refreshToken = getCookie({ name: COOKIE_NAMES.REFRESH_TOKEN }) || '';
          originalRequest.headers.Authorization = accessToken;
          originalRequest.headers.refreshtoken = refreshToken;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Don't show toast for refresh errors, they're handled internally
          return Promise.reject(refreshError);
        }
      }
    }
    
    // Handle all other errors with toast notification
    // Skip showing toast for auth-related endpoints to avoid spam
    if (
      !originalRequest?.url?.includes("guestAuth") &&
      !originalRequest?.url?.includes("refreshToken")
    ) {
      errorHandler(error);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions adapted for client
async function generateGuestTokens() {
  
  try {
    const response = await axios.post(
      API_BASE_URL + API_ROUTES.GUEST_AUTH,
      {},
      { headers: { "Content-Type": "application/json" }, withCredentials: true }
    );

    if (response.data.success) {
      const accessToken = COOKIE_PREFIX + response.data.accessToken;
      const refreshToken = response.data.refreshToken;
      
      setCookie({
        name: COOKIE_NAMES.ACCESS_TOKEN,
        value: accessToken,
      });
      setCookie({
        name: COOKIE_NAMES.REFRESH_TOKEN,
        value: refreshToken,
      });
      setCookie({
        name: COOKIE_NAMES.IS_AUTHENTICATED,
        value: "false",
      });
    }
    return response.data;
  } catch (error) {
    console.error("Guest token generation failed:", error);
    throw error;
  }
}


async function refreshTokens() {
  const accessToken = getCookie({ name: COOKIE_NAMES.ACCESS_TOKEN }) || '';
  const refreshToken = getCookie({ name: COOKIE_NAMES.REFRESH_TOKEN }) || '';
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/auth/refreshToken`,
      {},
      { 
        headers: { 
          "Content-Type": "application/json",
          refreshtoken: refreshToken,  // Only refresh token is needed
          authorization: accessToken
        },
        withCredentials: true,
        validateStatus: () => true  // Never throw for this request
      }
    );

    // Handle successful refresh
    if (response.status === 200 && response.data.success) {
      const accessToken = COOKIE_PREFIX + response.data.accessToken;
      const refreshToken = response.data.refreshToken;
      
      setCookie({ name: COOKIE_NAMES.ACCESS_TOKEN, value: accessToken });
      setCookie({ name: COOKIE_NAMES.REFRESH_TOKEN, value: refreshToken });
      return;
    }
    
    // Handle failed refresh
    console.warn("Token refresh failed, status:", response.status);
    // tokens.accessToken = '';
    // tokens.refreshToken = '';
    
    // Fallback to guest auth
    // tokens.accessToken = COOKIE_PREFIX + guestResponse.accessToken;
    // tokens.refreshToken = guestResponse.refreshToken;
    await generateGuestTokens();
    
  } catch (error) {
    console.error("Complete auth failure:", error);
    throw error;
  }
}


export default apiClient;