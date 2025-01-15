"use client";

import { useEffect, useState, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { fetchClothes, updateClothes, deleteClothes } from "@/api/clothes";
import { UserContext } from "@/context/UserContext";
import type { ClothType } from "@/types/clothes";
import { ClothContext } from "@/context/ClothContext";
import Header from "@/components/header";
import ClothesDetailEdit from "./ClothesDetailEdit";
import { Button } from "@/components/ui/button";

const ClothesDetail = () => {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split("/")[2];
  const [selectedCloth, setSelectedCloth] = useState<ClothType>({
    id: "",
    name: "",
    category: "",
    size: "",
    color: "",
    brand: "",
    imageURL: "",
    imageFile: null as File | null,
  });
  const { clothes, setClothes, categories } = useContext(ClothContext);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    size: "",
    color: "",
    brand: "",
    imageURL: "",
    imageFile: null as File | null,
  });
  const [useImageURL, setUseImageURL] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        router.push("/login");
      } else {
        const cloth = clothes.find((c) => String(c.id) === id);
        if (!cloth) {
          router.push("/clothes");
          return;
        }
        setSelectedCloth(cloth);
      }
    };
    fetchData();
  }, [user, router, clothes, id]);

  useEffect(() => {
    if (selectedCloth) {
      setFormData({
        name: selectedCloth.name,
        category: selectedCloth.category,
        size: selectedCloth.size,
        color: selectedCloth.color,
        brand: selectedCloth.brand,
        imageURL: selectedCloth.imageURL || "",
        imageFile: null,
      });
    }
  }, [selectedCloth]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseImageURL(e.target.value === "url");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        imageFile: e.target.files[0],
      });
    }
  };

  const handleEdit = async () => {
    setIsEditing(true);
    const form = new FormData();
    form.append("name", formData.name);
    form.append("category", formData.category);
    form.append("size", formData.size);
    form.append("color", formData.color);
    form.append("brand", formData.brand);
    if (user) {
      form.append("userID", user.email);
    }
    if (useImageURL) {
      form.append("imageURL", formData.imageURL);
    } else if (formData.imageFile) {
      form.append("imageFile", formData.imageFile);
    }

    try {
      if (!user || !id) return;
      await updateClothes(id, form, user.email);
      const newClothes = await fetchClothes(user.email);
      setClothes(newClothes);
      setIsEditing(false);
      // router.push("/clothes");
    } catch (error) {
      console.error("Error updating clothes:", error);
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("本当に消去しますか？");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      if (!user || !id) return;
      await deleteClothes(id, user.email);
      const newClothes = await fetchClothes(user.email);
      setClothes(newClothes);
      router.push("/clothes");
      setIsDeleting(false);
    } catch (error) {
      console.error("Error deleting clothes:", error);
      setIsDeleting(false);
    }
  };

  const getImageSrc = (item: ClothType) => {
    if (isEditing && useImageURL) {
      return formData.imageURL;
    } else if (formData.imageFile) {
      return URL.createObjectURL(formData.imageFile);
    } else if (item.imageURL) {
      return item.imageURL;
    } else if (item.imageLocalURL) {
      return item.imageLocalURL;
    } else if (item.imageFile) {
      return `data:image/jpeg;base64,${item.imageFile}`;
    } else {
      return null; // デフォルトの画像URLがあればここに設定
    }
  };

  if (!selectedCloth) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header title="Clothes Detail" />
      <div className="bg-wood min-h-screen">
        <div className="container mx-auto p-4">
          {selectedCloth ? (
            isEditing ? (
              <ClothesDetailEdit
                formData={formData}
                setFormData={setFormData}
                useImageURL={useImageURL}
                setUseImageURL={setUseImageURL}
                handleInputChange={handleInputChange}
                handleImageOptionChange={handleImageOptionChange}
                handleFileChange={handleFileChange}
                handleEdit={handleEdit}
                setIsEditing={setIsEditing}
                getImageSrc={getImageSrc}
                selectedCloth={selectedCloth}
                categories={categories}
              />
            ) : (
              <>
                <h1 className="text-4xl font-bold text-white text-center mb-4">
                  {selectedCloth.name}
                </h1>
                {getImageSrc(selectedCloth) ? (
                  <Image
                    src={getImageSrc(selectedCloth) as string}
                    alt="Current Image"
                    className="w-full h-auto rounded"
                    width={200}
                    height={200}
                  />
                ) : (
                  <div>No Image</div>
                )}
                <div className="bg-white p-4 rounded shadow-md mb-4">
                  <p className="text-brown mb-2">
                    Category: {selectedCloth.category}
                  </p>
                  <p className="text-brown mb-2">Size: {selectedCloth.size}</p>
                  <p className="text-brown mb-2">
                    Color: {selectedCloth.color}
                  </p>
                  <p className="text-brown mb-2">
                    Brand: {selectedCloth.brand}
                  </p>
                </div>
                <div className="flex justify-between">
                  <Button
                    type="button"
                    className="bg-brown text-cream px-4 py-3 rounded hover:bg-brown-dark"
                    onClick={() => setIsEditing(true)}
                    isLoading={isEditing}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    className="btn-danger px-4 py-3"
                    onClick={handleDelete}
                    isLoading={isDeleting}
                  >
                    Delete
                  </Button>
                </div>
                <Button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 mt-4"
                  onClick={() => router.back()}
                >
                  Back to List
                </Button>
              </>
            )
          ) : (
            <div>Loading...</div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClothesDetail;
