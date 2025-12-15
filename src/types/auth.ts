export type User = {
    _id: string;
    name: string;
    email: string;
    password: string;
    provider: string;
    avatar: string;
    isGuest: boolean;
    refreshToken: string;
    refreshTokenExpire: string;
    createdAt: string;
    updatedAt: string;
  };