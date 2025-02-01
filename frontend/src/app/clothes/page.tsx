"use client";

import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import LoadingScreen from "@/components/ui/loadingScreen";
import { UserContext } from "@/context/UserContext";
import { ClothContext } from "@/context/ClothContext";
import type { ClothType } from "@/types/clothes";

const Clothes = () => {
  const { user } = useContext(UserContext);
  const { clothes, categories, isFetchingClothes } = useContext(ClothContext);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handleImageClick = (item: ClothType) => {
    router.push(`/clothes/${item.id}`);
  };

  const handleAddClothesClick = () => {
    setIsLoading(true);
    router.push("/addClothes");
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredClothes = clothes.filter((item: ClothType) => {
    const searchTerms =
      searchTerm
        .toLowerCase()
        .match(/"[^"]*"|[^"\s\u3000]+/g)
        ?.map((term) => term.replace(/"/g, "")) || [];
    return searchTerms.every(
      (term) =>
        item.name.toLowerCase().includes(term) ||
        item.color.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.size.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term)
    );
  });

  const getImageSrc = (item: ClothType) => {
    if (item.imageURL) {
      return item.imageURL;
    } else if (item.imageLocalURL) {
      return item.imageLocalURL;
    } else if (item.imageFile) {
      return `data:image/jpeg;base64,${item.imageFile}`;
    } else {
      return null; // デフォルトの画像URLがあればここに設定
    }
  };

  return (
    <>
      <Header title="Clothes List" />
      <div className="bg-wood min-h-screen">
        {/* <h1 className="text-4xl font-bold text-brown text-center my-8">
          Clothes
        </h1> */}
        <div className="flex justify-center mb-4">
          <input
            type="text"
            placeholder="検索 (例: 黒 ニット)"
            value={searchTerm}
            onChange={handleSearchChange}
            className="border border-brown rounded px-4 py-2 w-1/2 mt-4"
          />
        </div>
        <div className="flex justify-center mb-10">
          <Button
            type="button"
            className=""
            onClick={handleAddClothesClick}
            isLoading={isLoading}
          >
            Add Clothes
          </Button>
        </div>
        {isFetchingClothes ? (
          <LoadingScreen />
        ) : (
          categories.map((category) => (
            <div key={category} className="mb-10">
              {filteredClothes.filter((item) => item.category === category)
                .length > 0 && (
                <>
                  <h2 className="text-2xl font-semibold text-white text-center mb-4">
                    {category}
                  </h2>
                  <div className="grid grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredClothes
                      .filter((item) => item.category === category)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="cursor-pointer"
                          onClick={() => handleImageClick(item)}
                        >
                          {getImageSrc(item) !== null && (
                            <Image
                              src={getImageSrc(item) as string}
                              alt="Current Image"
                              width={200}
                              height={200}
                              className="w-full h-auto rounded justify-center items-center"
                            />
                          )}
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          ))
        )}
        {filteredClothes.length > 0 && (
          <div className="flex justify-center">
            <Button
              type="button"
              className=""
              onClick={handleAddClothesClick}
              isLoading={isLoading}
            >
              Add Clothes
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default Clothes;
