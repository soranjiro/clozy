"use client";

import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserContext } from "@/context/UserContext";
import { ClothContext } from "@/context/ClothContext";
import Header from "@/components/header";
import LoadingScreen from "@/components/ui/loadingScreen";
import ErrorRetry from "@/components/ui/ErrorRetry";
import type { ClothType } from "@/types/clothes";
import { fetchClothesByDateRange } from "@/api/wearHistory";

type DateRange = {
  startDate: Date;
  endDate: Date;
  label: string;
};

export default function StaticsPage() {
  const { user } = useContext(UserContext);
  const { clothes, isFetchingClothes, fetchError, refetchClothes } =
    useContext(ClothContext);
  const [stats, setStats] = useState<
    { id: string; name: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      startDate: firstDay,
      endDate: lastDay,
      label: "今月",
    };
  });
  const [customDateRange, setCustomDateRange] = useState({
    start: formatDateForInput(dateRange.startDate),
    end: formatDateForInput(dateRange.endDate),
  });
  const router = useRouter();

  function formatDateForInput(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  function formatDateForDisplay(date: Date): string {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const fetchStatsForRange = async (start: Date, end: Date) => {
    if (!user) return;
    setLoading(true);
    setStatsError(null);

    try {
      const data = await fetchClothesByDateRange(start, end, user.email);

      if (data.length === 0) {
        setStats([]);
        return;
      }

      const idCountMap: Record<string, number> = {};
      data.forEach((id: string) => {
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

      setStats(allStats.sort((a, b) => b.count - a.count));
    } catch (err) {
      setStatsError(
        err instanceof Error ? err.message : "データの取得に失敗しました。"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsForRange(dateRange.startDate, dateRange.endDate);
  }, [user, clothes, dateRange, fetchStatsForRange]);

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const today = new Date();
    let start, end, label;

    switch (value) {
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        label = "今月";
        break;
      case "lastMonth":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        label = "先月";
        break;
      case "lastThreeMonths":
        start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        label = "過去3ヶ月";
        break;
      case "thisYear":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        label = "今年";
        break;
      case "custom":
        return; // カスタム選択時は何もしない（別の入力欄から設定する）
      default:
        return;
    }

    setDateRange({ startDate: start, endDate: end, label });
    setCustomDateRange({
      start: formatDateForInput(start),
      end: formatDateForInput(end),
    });
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const applyCustomDateRange = () => {
    const start = new Date(customDateRange.start);
    const end = new Date(customDateRange.end);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert("有効な日付を入力してください");
      return;
    }

    if (start > end) {
      alert("開始日は終了日より前の日付を選択してください");
      return;
    }

    setDateRange({
      startDate: start,
      endDate: end,
      label: "カスタム期間",
    });
  };

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

          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <div className="mb-3">
              <label
                htmlFor="dateRangeSelect"
                className="block text-sm font-medium mb-1"
              >
                期間を選択
              </label>
              <select
                id="dateRangeSelect"
                className="bg-black/50 text-white p-2 rounded w-full"
                onChange={handleDateRangeChange}
                defaultValue="thisMonth"
              >
                <option value="thisMonth">今月</option>
                <option value="lastMonth">先月</option>
                <option value="lastThreeMonths">過去3ヶ月</option>
                <option value="thisYear">今年</option>
                <option value="custom">カスタム期間を指定</option>
              </select>
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-2">
              <div className="flex-1">
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium mb-1"
                >
                  開始日
                </label>
                <input
                  id="startDate"
                  type="date"
                  name="start"
                  value={customDateRange.start}
                  onChange={handleCustomDateChange}
                  className="bg-black/50 text-white p-2 rounded w-full"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium mb-1"
                >
                  終了日
                </label>
                <input
                  id="endDate"
                  type="date"
                  name="end"
                  value={customDateRange.end}
                  onChange={handleCustomDateChange}
                  className="bg-black/50 text-white p-2 rounded w-full"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={applyCustomDateRange}
                  className="bg-amber-800 hover:bg-amber-700 text-white px-4 py-2 rounded transition"
                >
                  適用
                </button>
              </div>
            </div>

            <div className="text-center text-sm mt-2">
              表示期間: {formatDateForDisplay(dateRange.startDate)} 〜{" "}
              {formatDateForDisplay(dateRange.endDate)}
            </div>
          </div>

          {(isFetchingClothes || loading) && <LoadingScreen />}

          {fetchError && (
            <ErrorRetry errorMessage={fetchError} onRetry={refetchClothes} />
          )}

          {statsError && (
            <ErrorRetry
              errorMessage={statsError}
              onRetry={() =>
                fetchStatsForRange(dateRange.startDate, dateRange.endDate)
              }
            />
          )}
        </div>

        {stats.length === 0 && !loading ? (
          <div className="text-center py-10">
            <p className="text-xl">この期間に着用した服はありません</p>
          </div>
        ) : (
          (() => {
            const uniqueCounts = Array.from(
              new Set(stats.map((s) => s.count))
            ).sort((a, b) => b - a);
            return uniqueCounts.map((count) => {
              const items = stats.filter((s) => s.count === count);
              if (items.length === 0) return null;
              return (
                <div key={count}>
                  <div className="mt-8 mb-8 flex justify-center">
                    {count} times
                  </div>
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
          })()
        )}
      </div>
    </>
  );
}
