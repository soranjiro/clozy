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
}

export const ClothContext = createContext<ClothContextProps>({
  clothes: [],
  setClothes: () => {},
  categories: [],
  setCategories: () => {},
});

export const ClotheProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(UserContext);
  const [clothes, setClothes] = useState<ClothesType>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchUserClothes = async () => {
      if (user) {
        const clothesData = await fetchClothes(user.email);
        setClothes(clothesData);
      }
    };
    const fetchCategoriesData = async () => {
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);
    }
    fetchUserClothes();
    fetchCategoriesData();
  }, [user]);

  return (
    <ClothContext.Provider value={{ clothes, setClothes, categories, setCategories }}>
      <div>{children}</div>
    </ClothContext.Provider>
  );
};
