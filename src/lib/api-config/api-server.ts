import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosInstance } from 'axios';
import { API_BASE_URL } from '@/lib/config';
import { API_ROUTES } from '@/lib/api-routes';
import { GetServerSidePropsContext } from 'next';
import { COOKIE_NAMES, getCookie, setCookie } from '@/lib/sessions/cookie';
import { COOKIE_PREFIX } from '@/lib/constants';

// Enhanced token cache per request context
const tokenCache = new WeakMap<GetServerSidePropsContext, {
  accessToken: string;
  refreshToken: string;
  guestPromise?: Promise<void>;       // For initial token generation
  refreshPromise?: Promise<void>;     // For token refresh
}>();

export const createServerApiClient = (context: GetServerSidePropsContext): AxiosInstance => {
  const apiClient = axios.create({ baseURL: API_BASE_URL });

  // Initialize token cache for this request context
  if (!tokenCache.has(context)) {
    tokenCache.set(context, {
      accessToken: getCookie({ name: COOKIE_NAMES.ACCESS_TOKEN, context }) || '',
      refreshToken: getCookie({ name: COOKIE_NAMES.REFRESH_TOKEN, context }) || '',
    });
  }

  // Request interceptor - optimized for parallel requests
  apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const tokens = tokenCache.get(context)!;
      
      // If tokens are missing, generate them (with promise sharing)
      if (!tokens.accessToken && !tokens.refreshToken) {
        if (!tokens.guestPromise) {
          tokens.guestPromise = (async () => {
            try {
              await generateGuestTokens(context);
            } finally {
              tokens.guestPromise = undefined;
            }
          })();
        }
        await tokens.guestPromise;
      }
      
      // Set headers with current tokens
      config.headers.Authorization = tokens.accessToken;
      config.headers.refreshtoken = tokens.refreshToken;
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response interceptor - handles token refresh
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      const tokens = tokenCache.get(context)!;
      
      if (!originalRequest || error.response?.status !== 401 ) {
        return Promise.reject(error);
      }

      // Handle token refresh with single execution
      if (!originalRequest._retry) { // this for one by one request
        originalRequest._retry = true;
        
        try {
          // Ensure only one refresh operation per context
          if (!tokens.refreshPromise) { // this for parallel request like promise.all[p1,p2,p3] so for the p1 only goes inside 
            tokens.refreshPromise = (async () => {
              try {
                await refreshTokens(context);
              } finally {
                tokens.refreshPromise = undefined;
              }
            })();
          }
          
          await tokens.refreshPromise; // All others wait here for the p1 to finish
          
          // Retry with new tokens
          originalRequest.headers.Authorization = tokens.accessToken;
          originalRequest.headers.refreshtoken = tokens.refreshToken;
          return apiClient(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );

  return apiClient;
};

// Helper functions
async function generateGuestTokens(context: GetServerSidePropsContext) {
  const tokens = tokenCache.get(context)!;
  
  try {
    const response = await axios.post(
      API_BASE_URL + API_ROUTES.GUEST_AUTH,
      {},
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.data.success) {
      tokens.accessToken = COOKIE_PREFIX + response.data.accessToken;
      tokens.refreshToken = response.data.refreshToken;
      
      setCookie({ name: COOKIE_NAMES.ACCESS_TOKEN, value: tokens.accessToken, context });
      setCookie({ name: COOKIE_NAMES.REFRESH_TOKEN, value: tokens.refreshToken, context });
      setCookie({ name: COOKIE_NAMES.IS_AUTHENTICATED, value: false, context });
    }
  } catch (error) {
    
    context.res.writeHead(302, { Location: '/404' });
    context.res.end();
    return Promise.reject(error);
    // console.error("Guest token generation failed:", error);
    // throw error;
  }
}

async function refreshTokens(context: GetServerSidePropsContext) {
  const tokens = tokenCache.get(context)!;
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/auth/refreshToken`,
      {},
      { 
        headers: { 
          "Content-Type": "application/json",
          authorization: tokens.accessToken,
          refreshtoken: tokens.refreshToken
        } 
      }
    );

    if (response.data.success) {
      tokens.accessToken = COOKIE_PREFIX + response.data.accessToken;
      tokens.refreshToken = response.data.refreshToken;
      
      setCookie({ name: COOKIE_NAMES.ACCESS_TOKEN, value: tokens.accessToken, context });
      setCookie({ name: COOKIE_NAMES.REFRESH_TOKEN, value: tokens.refreshToken, context });
      return;
    }
  } catch (refreshError) {
    console.error("Token refresh failed, trying guest auth:", refreshError);
    await generateGuestTokens(context);
  }
}


// import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosInstance } from 'axios';
// import { API_BASE_URL } from '@/lib/config';
// import { API_ROUTES } from '@/lib/api-routes';
// import { GetServerSidePropsContext } from 'next';
// import { COOKIE_NAMES, getCookie, setCookie } from '@/lib/sessions/cookie';
// import { COOKIE_PREFIX } from '@/lib/constants';

// // Cache tokens per request to prevent duplicate refreshes
// const tokenCache = new WeakMap<GetServerSidePropsContext, {
//   accessToken: string;
//   refreshToken: string;
//   refreshPromise?: Promise<void>;
// }>();

// export const createServerApiClient = (context: GetServerSidePropsContext): AxiosInstance => {
//   const apiClient = axios.create({ baseURL: API_BASE_URL });

//   // Initialize token cache for this request context

  
//   if (!tokenCache.has(context)) {
//     tokenCache.set(context, {
//       accessToken: getCookie({ name: COOKIE_NAMES.ACCESS_TOKEN, context }) || '',
//       refreshToken: getCookie({ name: COOKIE_NAMES.REFRESH_TOKEN, context }) || '',
//     });
//   }
  
//   // Request interceptor
//   apiClient.interceptors.request.use(
//     async (config: InternalAxiosRequestConfig) => {
//       console.log("context bro here",context);
   
//       const tokens = tokenCache.get(context)!;
      
//       // Generate initial tokens if missing
//       if (!tokens.accessToken || !tokens.refreshToken) {
//         await generateGuestTokens(context);
//       }
      
//       config.headers.Authorization = tokens.accessToken;
//       config.headers.refreshtoken = tokens.refreshToken;
//       return config;
//     },
//     (error: AxiosError) => Promise.reject(error)
//   );

//   // Response interceptor
//   apiClient.interceptors.response.use(
//     (response: AxiosResponse) => response,
//     async (error: AxiosError) => {
//       const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
//       const tokens = tokenCache.get(context)!;
//       // await new Promise(resolve => setTimeout(resolve, 400000));
//       console.log("error bro here",error.response?.status);
      
      
//       if (!originalRequest || error.response?.status !== 401 ) {
//         return Promise.reject(error);
//       }

//       // Handle token refresh
//       if (!originalRequest._retry) {
//         originalRequest._retry = true;
        
//         try {
//           // Ensure only one refresh operation per context
//           if (!tokens.refreshPromise) {
//             tokens.refreshPromise = (async () => {
//               try {
//                 await refreshTokens(context);
//               } finally {
//                 tokens.refreshPromise = undefined;
//               }
//             })();
//           }
          
//           await tokens.refreshPromise;
          
//           // Retry with new tokens
//           originalRequest.headers.Authorization = tokens.accessToken;
//           originalRequest.headers.refreshtoken = tokens.refreshToken;
//           return apiClient(originalRequest);
//         } catch (refreshError) {
//           return Promise.reject(refreshError);
//         }
//       }
      
//       return Promise.reject(error);
//     }
//   );

//   return apiClient;
// };

// // Helper functions
// async function generateGuestTokens(context: GetServerSidePropsContext) {
//   const tokens = tokenCache.get(context)!;
  
//   try {
//     const response = await axios.post(
//       API_BASE_URL + API_ROUTES.GUEST_AUTH,
//       {},
//       { headers: { "Content-Type": "application/json" } }
//     );

//     if (response.data.success) {
//       tokens.accessToken = COOKIE_PREFIX + response.data.accessToken;
//       tokens.refreshToken = response.data.refreshToken;
      
//       setCookie({ name: COOKIE_NAMES.ACCESS_TOKEN, value: tokens.accessToken, context });
//       setCookie({ name: COOKIE_NAMES.REFRESH_TOKEN, value: tokens.refreshToken, context });
//       setCookie({ name: COOKIE_NAMES.IS_AUTHENTICATED, value: "false", context });
//     }
//   } catch (error) {
//     console.error("Guest token generation failed:", error);
//     throw error;
//   }
// }

// async function refreshTokens(context: GetServerSidePropsContext) {
//   const tokens = tokenCache.get(context)!;
  
//   try {
//     const response = await axios.post(
//       `${API_BASE_URL}/api/v1/auth/refreshToken`,
//       {},
//       { 
//         headers: { 
//           "Content-Type": "application/json",
//           authorization: tokens.accessToken,
//           refreshtoken: tokens.refreshToken
//         } 
//       }
//     );

//     if (response.data.success) {
//       tokens.accessToken = COOKIE_PREFIX + response.data.accessToken;
//       tokens.refreshToken = response.data.refreshToken;
      
//       setCookie({ name: COOKIE_NAMES.ACCESS_TOKEN, value: tokens.accessToken, context });
//       setCookie({ name: COOKIE_NAMES.REFRESH_TOKEN, value: tokens.refreshToken, context });
//       return;
//     }
//   } catch (refreshError) {
//     console.error("Token refresh failed, trying guest auth:", refreshError);
//     await generateGuestTokens(context);
//   }
// }






// import axios, {
//   AxiosResponse,
//   AxiosError,
//   InternalAxiosRequestConfig,
//   AxiosInstance
// } from 'axios';
// import { API_BASE_URL } from '@/lib/config';
// import { API_ROUTES } from '@/lib/api-routes';
// import { GetServerSidePropsContext } from 'next';
// import { COOKIE_NAMES, getCookie, setCookie } from '@/lib/sessions/cookie';
// import { COOKIE_PREFIX } from '@/lib/constants';

// // Create a server-side API client factory
// export const createServerApiClient = (context: GetServerSidePropsContext): AxiosInstance => {
//   const apiClient = axios.create({
//     baseURL: API_BASE_URL,
//   });

//   // Request interceptor - adds tokens to requests
//   apiClient.interceptors.request.use(
//     async (config: InternalAxiosRequestConfig) => {
//       const accessToken = getCookie({ name: COOKIE_NAMES.ACCESS_TOKEN, context });
//       const refreshToken = getCookie({ name: COOKIE_NAMES.REFRESH_TOKEN, context });
      
//       if(!accessToken && !refreshToken){
//         try {
//           const {data, status, statusText} = await axios.post(API_BASE_URL + API_ROUTES.GUEST_AUTH,{
//             headers: {
//                 "Content-Type": "application/json",
//             },
//           });
    
//           if(data.success && status === 200 && statusText === "OK"){
            
//             setCookie({
//               name: COOKIE_NAMES.ACCESS_TOKEN,
//               value: COOKIE_PREFIX + data.accessToken,
//               context: context
//             });
            
//             setCookie({
//               name: COOKIE_NAMES.REFRESH_TOKEN,
//               value: data.refreshToken,
//               context: context
//             });

//             setCookie({
//               name: COOKIE_NAMES.IS_AUTHENTICATED,
//               value: false,
//               context: context
//             });
            
//             // Update the current request's headers with the new tokens
//             config.headers.Authorization = COOKIE_PREFIX + data.accessToken;
//             config.headers.refreshtoken = data.refreshToken;

//             return config;
//           }
//         } catch (error) {
//           console.log("🔍 apiClient.interceptors.request error: ", error);
//           return Promise.reject(error);
//         }
//       } else {
//         // If tokens exist, set them in the headers
//         config.headers.Authorization = accessToken;
//         config.headers.refreshtoken = refreshToken;
//       }
      
//       return config;
//     },
//     (error: AxiosError) => Promise.reject(error)
//   );

//   // Response interceptor - handles token refresh
//   apiClient.interceptors.response.use(
//     (response: AxiosResponse) => response,
//     async (error: AxiosError) => {
//       const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      
//       if (!originalRequest || originalRequest._retry) {
//         return Promise.reject(error);
//       }
      
//       // Handle 401 errors (Unauthorized)
//       if (error.response?.status === 401) {
//         originalRequest._retry = true;
//         const refreshToken = getCookie({ name: COOKIE_NAMES.REFRESH_TOKEN, context });
//         const accessToken = getCookie({ name: COOKIE_NAMES.ACCESS_TOKEN, context });
//         try {
//           // Attempt token refresh
//           const refreshResponse = await axios.post(
//             `${API_BASE_URL}/api/v1/auth/refreshToken`,
//             {},
//             { headers: { "Content-Type": "application/json", authorization: accessToken, refreshtoken: refreshToken } }
//           );
          
//           if (refreshResponse.data.success) {
//             const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;
            
//             // Update cookies
//             setCookie({ 
//               name: COOKIE_NAMES.ACCESS_TOKEN, 
//               value: COOKIE_PREFIX + newAccessToken, 
//               context 
//             });
//             setCookie({ 
//               name: COOKIE_NAMES.REFRESH_TOKEN, 
//               value: newRefreshToken, 
//               context 
//             });
            
//             // Update original request headers
//             originalRequest.headers.Authorization = COOKIE_PREFIX + newAccessToken;
//             originalRequest.headers.refreshtoken = newRefreshToken;
            
//             return apiClient(originalRequest);
//           }
//         } catch (refreshError) {
//           // Refresh failed - try guest auth
//           try {
//             const {data, status, statusText} = await axios.post(API_BASE_URL + API_ROUTES.GUEST_AUTH,{
//               headers: {
//                   "Content-Type": "application/json",
//               },
//             });
      
//             if(data.success && status === 200 && statusText === "OK"){  
//               const { accessToken: guestAccessToken, refreshToken: guestRefreshToken } = data;
              
//               setCookie({ 
//                 name: COOKIE_NAMES.ACCESS_TOKEN, 
//                 value: COOKIE_PREFIX + guestAccessToken, 
//                 context 
//               });
//               setCookie({ 
//                 name: COOKIE_NAMES.REFRESH_TOKEN, 
//                 value: guestRefreshToken, 
//                 context 
//               });
//               setCookie({ 
//                 name: COOKIE_NAMES.IS_AUTHENTICATED, 
//                 value: false, 
//                 context 
//               });
              
//               // Update request headers
//               originalRequest.headers.Authorization = COOKIE_PREFIX + guestAccessToken;
//               originalRequest.headers.refreshtoken = guestRefreshToken;
              
//               return apiClient(originalRequest);
//             }
//           } catch (guestError) {
//             console.error('Guest auth failed:', guestError);
//             // Redirect to 404 page
//             context.res.writeHead(302, { Location: '/404' });
//             context.res.end();
//             return Promise.reject(guestError);
//           }
//         }
//       }
      
//       return Promise.reject(error);
//     }
//   );

//   return apiClient;
// };