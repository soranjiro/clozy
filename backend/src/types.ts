// types.ts

export type User = {
  email: string;
  password: string;
  username: string;
};

export type Query = {
  email: string;
  password: string;
};

export type Product = {
  name: string;
  category: string;
  size: string;
  color: string;
  brand: string;
  imageKey?: string | null;  // R2のキー
  imageURL?: string | null;  // 画像のglobal URL
  imageFile?: string | null;   // エンコードされた画像
  userID: string;
};

export type ProductQuery = {
  id: number;
};

export type WearHistory = {
  id: number;
  email: string;
  clothesID: number;
  date: string;
};
