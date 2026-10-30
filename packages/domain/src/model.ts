export const CATEGORIES = ['トップス', 'ボトムス', 'アウター', 'ワンピース', 'シューズ', 'バッグ', 'アクセサリー', 'その他'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Clothing {
  id: string;
  name: string;
  category: Category;
  brand: string;
  color: string;
  size: string;
  notes: string;
  favorite: boolean;
  imageId?: string;
  createdAt: string;
  updatedAt: string;
}
export interface WearEntry {
  id: string;
  clothingId: string;
  date: string;
  createdAt: string;
}
export type ClothingInput = Pick<Clothing, 'name' | 'category' | 'brand' | 'color' | 'size' | 'notes' | 'favorite'>;

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
