"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Calendar, { CalendarProps } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { UserContext } from "@/context/UserContext";
import { ClothContext } from "@/context/ClothContext";
import { ClothType, ClothesType } from "@/types/clothes";
import {
  fetchClothesByDate,
  addWearHistory,
  removeWearHistory,
} from "@/api/wearHistory";
import ClothesModal from "@/app/calendar/ClothesModal";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import LoadingScreen from "@/components/ui/loadingScreen";

const CalendarPage = () => {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const { clothes, categories, isFetchingClothes } = useContext(ClothContext);
  const [date, setDate] = useState(new Date());
  const [showClothesList, setShowClothesList] = useState(false);
  const [clothesByDate, setClothesByDate] = useState<ClothesType>([]);
  const [message, setMessage] = useState("");
  const [selectedClothes, setSelectedClothes] = useState<ClothesType>([]);
  const [isClient, setIsClient] = useState(false);
  const [isFetchingClothesByDate, setIsFetchingClothesByDate] = useState(false);
  const [isRegisteringCloth, setIsRegisteringCloth] = useState(false);
  const [isRemovingCloth, setIsRemovingCloth] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const today = new Date();
    setDate(today);
    fetchUserClothesByDate(today);
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const fetchUserClothesByDate = async (selectedDate: Date) => {
    console.log(selectedDate);
    if (!user) {
      console.error("User is not logged in");
      return;
    }

    setIsFetchingClothesByDate(true);
    console.log("fetching clothes by date...", isFetchingClothesByDate);
    const filteredClothesIDs: string[] = await fetchClothesByDate(
      selectedDate,
      user.email
    );
    if (filteredClothesIDs.length === 0) {
      setMessage("No clothes registered for this date");
      setClothesByDate([]);
    } else {
      setMessage("");
      setClothesByDate(
        clothes
          .filter((item) => filteredClothesIDs.some((id) => id === item.id))
          .sort((a, b) => a.category.localeCompare(b.category)) // カテゴリー順に並び替え
      );
    }
    setIsFetchingClothesByDate(false);
  };

  const onDateChange: CalendarProps["onChange"] = (value) => {
    if (value instanceof Date) {
      setDate(value);
      fetchUserClothesByDate(value);
    } else if (
      Array.isArray(value) &&
      value.length > 0 &&
      value[0] instanceof Date
    ) {
      setDate(value[0]);
      fetchUserClothesByDate(value[0]);
    }
  };

  const handleAddClothes = () => {
    setShowClothesList(!showClothesList);
  };

  const handleClothSelect = (cloth: ClothType) => {
    setSelectedClothes((prevSelected) => {
      if (prevSelected.some((item) => item.id === cloth.id)) {
        return prevSelected.filter((item) => item.id !== cloth.id);
      } else {
        return [...prevSelected, cloth];
      }
    });
  };

  const handleConfirmSelection = async () => {
    if (!user) {
      console.error("User is not logged in");
      return;
    }
    setIsRegisteringCloth(true);

    try {
      await addWearHistory(
        selectedClothes.map((c) => c.id),
        date,
        user.email
      );
      setShowClothesList(false);
      setSelectedClothes([]);
      fetchUserClothesByDate(date); // 更新されたデータを再取得
    } catch (error) {
      console.error("Error adding wear history:", error);
    } finally {
      setShowClothesList(false); // モーダルを閉じる
    }
    setIsRegisteringCloth(false);
  };

  const handleRemoveCloth = async (clothesID: string) => {
    if (!user) {
      console.error("User is not logged in");
      return;
    }
    setIsRemovingCloth(true);

    await removeWearHistory(clothesID, date, user.email);
    fetchUserClothesByDate(date);
    setIsRemovingCloth(false);
  };

  const handleImageClick = (id: string) => {
    router.push(`/clothes/${id}`);
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
      <Header title="Calendar" />
      <div className="p-4 bg-wood min-h-screen flex flex-col justify-center items-center">
        <div className="w-full mx-auto">
          {/* <h1 className="text-3xl font-bold text-brown mb-4">カレンダー</h1> */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-center">
            {isClient && (
              <Calendar onChange={onDateChange} value={date} locale="en-US" />
            )}
          </div>
          <Button type="button" className="" onClick={handleAddClothes}>
            {showClothesList ? "Close" : "Register Clothes"}
          </Button>
          {showClothesList && (
            <ClothesModal
              categories={categories}
              clothes={clothes}
              clothesByDate={clothesByDate}
              getImageSrc={getImageSrc}
              handleClothSelect={handleClothSelect}
              handleConfirmSelection={handleConfirmSelection}
              isFetchingClothes={isFetchingClothes}
              isRegisteringCloth={isRegisteringCloth}
              isOpen={showClothesList}
              onRequestClose={() => setShowClothesList(false)}
              selectedClothes={selectedClothes}
            />
          )}
          <div className="mt-4">
            {message ? (
              <p className="text-center text-white font-bold">{message}</p>
            ) : isFetchingClothes ? (
              <LoadingScreen />
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {clothesByDate
                  .sort(
                    (a, b) =>
                      categories.indexOf(a.category) -
                      categories.indexOf(b.category)
                  )
                  .map((item) => (
                    <div key={item.id} className="relative">
                      <button
                        type="button"
                        className="absolute top-0 right-0 text-black border-black hover:bg-gray-300 font-bold bg-white rounded-full flex items-center justify-center border !w-5 !h-5 "
                        onClick={() => handleRemoveCloth(item.id)}
                      >
                        ×
                      </button>
                      {getImageSrc(item) !== null && (
                        <Image
                          src={getImageSrc(item) as string}
                          alt="Current Image"
                          className="w-full h-auto rounded"
                          onClick={() => handleImageClick(item.id)}
                          width={200}
                          height={200}
                        />
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        {(isRemovingCloth || isFetchingClothesByDate) && (
          <LoadingScreen />
        )}
      </div>
    </>
  );
};

export default CalendarPage;
