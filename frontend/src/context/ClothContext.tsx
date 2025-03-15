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
}

export const ClothContext = createContext<ClothContextProps>({
  clothes: [],
  setClothes: () => {},
  categories: [],
  setCategories: () => {},
  isFetchingClothes: false,
});

export const ClotheProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(UserContext);
  const [clothes, setClothes] = useState<ClothesType>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isFetchingClothes, setIsFetchingClothes] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchUserClothes = async () => {
      setIsFetchingClothes(true);
      if (user) {
        const clothesData = await fetchClothes(user.email);
        setClothes(clothesData);
      }
      setIsFetchingClothes(false);
    };
    const fetchCategoriesData = async () => {
      const categoriesData = await fetchCategories(user.email);
      setCategories(categoriesData);
    }
    fetchUserClothes();
    fetchCategoriesData();
  }, [user]);

  return (
    <ClothContext.Provider value={{ clothes, setClothes, categories, setCategories, isFetchingClothes }}>
      <div>{children}</div>
    </ClothContext.Provider>
  );
};
