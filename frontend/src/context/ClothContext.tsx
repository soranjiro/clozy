"use client";

import {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useContext,
} from "react";
import { fetchCategories, fetchClothes } from "@/api/clothes";
import { UserContext } from "./UserContext";
import { ClothesType } from "@/types/clothes";

interface ClothContextProps {
  clothes: ClothesType;
  setClothes: (clothes: ClothesType) => void;
  categories: string[];
  setCategories: (categories: string[]) => void;
  isFetchingClothes: boolean;
  fetchError: string | null;
  refetchClothes: () => Promise<void>;
}

export const ClothContext = createContext<ClothContextProps>({
  clothes: [],
  setClothes: () => {},
  categories: [],
  setCategories: () => {},
  isFetchingClothes: false,
  fetchError: null,
  refetchClothes: async () => {},
});

export const ClotheProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(UserContext);
  const [clothes, setClothes] = useState<ClothesType>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isFetchingClothes, setIsFetchingClothes] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchUserData = async () => {
    if (!user) return;

    setIsFetchingClothes(true);
    setFetchError(null);

    try {
      const clothesData = await fetchClothes(user.email);
      setClothes(clothesData);

      const categoriesData = await fetchCategories(user.email);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to fetch clothes data:", error);
      setFetchError(
        error instanceof Error ? error.message : "データの取得に失敗しました。"
      );
    } finally {
      setIsFetchingClothes(false);
    }
  };

  const refetchClothes = async () => {
    await fetchUserData();
  };

  useEffect(() => {
    if (!user) return;
    fetchUserData();
  }, [user]);

  return (
    <ClothContext.Provider
      value={{
        clothes,
        setClothes,
        categories,
        setCategories,
        isFetchingClothes,
        fetchError,
        refetchClothes,
      }}
    >
      <div>{children}</div>
    </ClothContext.Provider>
  );
};
