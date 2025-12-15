import { COOKIE_NAMES, getCookie } from "@/lib/sessions/cookie";
import { User } from "@/types/auth";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

type AuthStore = {
    isLoading: boolean;
    isError: string | null;
    user: User | null;

    isAuthenticated: () => boolean;

};

export const useAuthStore = create<AuthStore>()(
  devtools(persist((set,get) => ({
    isLoading: false,
    isError: null,
    user: null,
    isAuthenticated: () => {
      return getCookie({ name: COOKIE_NAMES.IS_AUTHENTICATED }) === "true";
    },  
   
    // guestAuth: async () => {
    //   try {
    //     set({ isLoading: true, isError: null });
    //     const {data} = await apiClient.post('/api/v1/auth/guestAuth');
    //     console.log("guestAuth data",data.data);
    //     if(data.success){
    //       // setCookie({ name: "accessToken", value: data.accessToken });
    //       // setCookie({ name: "refreshToken", value: data.refreshToken });
    //       // setCookie({ name: "isAuthenticated", value: true });
    //       set({ user: data.data });
    //       appToast.success({ message: 'Guest authentication successful!' });
    //     }
    //   } catch (error) {
    //     set({ isError: errorHandler(error), isLoading: false });
    //   } finally {
    //     set({ isLoading: false });
    //   }
    // },

   

    // login: (user: User) => {
    //   set({user, isAuthenticated: true});
    // },
    
  }),{
    name: "auth-store",
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ user: state.user }),
  })
  )
);