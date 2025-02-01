import React from "react";
import Modal from "react-modal";
import Image from "next/image";
import { ClothType, ClothesType } from "@/types/clothes";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";

// ここでアプリのルート要素を設定します
if (typeof document !== "undefined") {
  Modal.setAppElement(document.body);
}

interface ClothesModalProps {
  categories: string[];
  clothes: ClothesType;
  clothesByDate: ClothesType;
  getImageSrc: (item: ClothType) => string | null;
  handleClothSelect: (cloth: ClothType) => void;
  handleConfirmSelection: () => void;
  isFetchingClothes: boolean;
  isRegisteringCloth: boolean;
  isOpen: boolean;
  onRequestClose: () => void;
  selectedClothes: ClothesType;
}

const ClothesModal: React.FC<ClothesModalProps> = ({
  categories,
  clothes,
  clothesByDate,
  getImageSrc,
  handleClothSelect,
  handleConfirmSelection,
  isFetchingClothes,
  isRegisteringCloth,
  isOpen,
  onRequestClose,
  selectedClothes,
}) => {
  const groupClothesByCategory = (clothes: ClothesType) => {
    return clothes.reduce((acc, item) => {
      const category = item.category || "その他";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, ClothesType>);
  };

  return (
    <>
      {/* <Header title="Clothes Modal" /> */}
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        className="bg-wood-noblack p-4 rounded-lg shadow-md max-w-3xl w-full mx-auto max-h-[90vh] overflow-y-auto relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <div className="relative flex flex-col justify-center items-center">
          <button
            type="button"
            className="fixed top-3 right-3 text-black hover:bg-gray-300 font-bold bg-white rounded-full w-8 h-8 flex items-center justify-center"
            onClick={onRequestClose}
          >
            ×
          </button>
          <div className="p-4 w-full">
            {isFetchingClothes ? (
              <Loading />
            ) : (
              categories.map((category: string) => (
                <div key={category} className="mb-10">
                  {Object.entries(
                    groupClothesByCategory(
                      clothes.filter(
                        (item) =>
                          !clothesByDate.some((c) => c.id === item.id) &&
                          item.category === category
                      )
                    )
                  ).map(([category, items]) => (
                    <div key={category}>
                      <h2 className="text-xl font-semibold text-white text-center mt-5 mb-5">
                        {category}
                      </h2>
                      <div className="grid grid-cols-4 gap-4">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-2 border rounded ${
                              selectedClothes.some((c) => c.id === item.id)
                                ? "border-blue-500 bg-blue-100"
                                : "border-gray-300"
                            }`}
                            onClick={() => handleClothSelect(item)}
                          >
                            {getImageSrc(item) !== null && (
                              <Image
                                src={getImageSrc(item) as string}
                                alt="Current Image"
                                className="w-full h-auto rounded"
                                width={200}
                                height={200}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
          <Button
            type="button"
            className="bg-white text-brown py-2 px-4 rounded hover:bg-brown-dark mt-4 fixed bottom-4"
            onClick={handleConfirmSelection}
            isLoading={isRegisteringCloth}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default ClothesModal;
