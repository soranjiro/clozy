"use client";

import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserContext } from "@/context/UserContext";
import { ClothContext } from "@/context/ClothContext";
import Header from "@/components/header";
import LoadingScreen from "@/components/ui/loading";
import type { ClothType } from "@/types/clothes";
import { fetchClothesByDateRange } from "@/api/wearHistory";

export default function StaticsPage() {
  const { user } = useContext(UserContext);
  const { clothes, isFetchingClothes } = useContext(ClothContext);
  const [stats, setStats] = useState<
    { id: string; name: string; count: number }[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    fetchClothesByDateRange(firstDay, lastDay, user.email)
      .then((data: string[]) => {
        if (data.length === 0) return;
        const idCountMap: Record<string, number> = {};
        data.forEach((id) => {
          if (!idCountMap[id]) idCountMap[id] = 0;
          idCountMap[id]++;
        });
        const newStats = Object.entries(idCountMap).map(([id, count]) => {
          const cloth = clothes.find((c) => String(c.id) === id);
          return {
            id: cloth?.id || "Unknown",
            name: cloth?.name || "Unknown",
            count,
          };
        });
        // 0回数補完
        const allStats = clothes.map((cloth) => {
          const found = newStats.find((s) => s.id === cloth.id);
          return found ? found : { id: cloth.id, name: cloth.name, count: 0 };
        });
        setStats(
          allStats.sort((a, b) => b.count - a.count)
        );
      })
      .catch((err) => console.error(err));
  }, [user, clothes]);

  const handleImageClick = (id: string) => {
    router.push(`/clothes/${id}`);
  };

  const showCloth = (id: string) => {
    const cloth = clothes.find((c) => c.id === id);
    if (!cloth) return null;

    const imageSrc = getImageSrc(cloth);
    if (imageSrc == null) {
      return null;
    }
    return imageSrc;
  };
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
      <Header title="Statics" />
      <div className="bg-wood min-h-screen text-white">
        <div className="container mx-auto p-4">
          <h1 className="text-4xl font-bold text-white text-center mb-4">
            times worn
          </h1>
          {isFetchingClothes && <LoadingScreen />}
        </div>
        {(() => {
          const uniqueCounts = Array.from(new Set(stats.map((s) => s.count))).sort((a, b) => b - a);
          return uniqueCounts.map((count) => {
            const items = stats.filter((s) => s.count === count);
            if (items.length === 0) return null;
            return (
              <div key={count}>
                <div className="mt-8 mb-8 flex justify-center">{count} times</div>
                <div className="grid grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="cursor-pointer"
                      onClick={() => handleImageClick(item.id)}
                    >
                      {showCloth(item.id) !== null && (
                        <Image
                          src={showCloth(item.id) as string}
                          alt="Current Image"
                          width={200}
                          height={200}
                          className="w-full h-auto rounded justify-center items-center"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </>
  );
}
