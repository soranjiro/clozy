export type ClothesType = ClothType[];

export interface ClothType {
  id: string;
  name: string;
  imageURL?: string | ""; // global URL
  imageLocalURL?: string; // local URL
  imageFile?: File | null;
  category: string;
  size: string;
  color: string;
  brand: string;
}
