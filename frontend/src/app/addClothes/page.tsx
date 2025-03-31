"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { fetchClothes, addClothes, fetchCategories } from "@/api/clothes";
import { formValid, PostMethod } from "@/utils/formValid";
import ClothForm from "@/components/clothForm";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { UserContext } from "@/context/UserContext";
import { ClothContext } from "@/context/ClothContext";

const AddClothes = () => {
  const { user, userLogout } = useContext(UserContext);
  const { setClothes } = useContext(ClothContext);
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
  const [categories, setCategories] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (user === undefined) return; // ユーザー情報がまだ読み込まれていない場合は何もしない
      if (!user) {
        userLogout();
      } else {
        const categories = await fetchCategories(user.email);
        setCategories(categories);
      }
    };
    fetchData();
  }, [user, router, userLogout]);

  const handleImageOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseImageURL(e.target.value === "url");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        imageFile: e.target.files[0],
      });
    }
  };

  // change image file when file is resized
  const handleFileUpdate = (file: File) => {
    setFormData({
      ...formData,
      imageFile: file,
    });
  };

  const handleAddCloth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    if (!user) {
      setIsAdding(false);
      return;
    }
    const error = await formValid(
      PostMethod,
      formData.name,
      formData.category,
      formData.size,
      formData.color,
      formData.brand,
      useImageURL,
      formData.imageURL,
      formData.imageFile,
      handleFileUpdate
    );
    if (error) {
      alert(error);
      setIsAdding(false);
      return;
    }
    try {
      const reqForm = new FormData();
      reqForm.append("name", formData.name);
      reqForm.append("category", formData.category);
      reqForm.append("size", formData.size);
      reqForm.append("color", formData.color);
      reqForm.append("brand", formData.brand);
      if (formData.imageFile) {
        reqForm.append("image", formData.imageFile);
      } else {
        reqForm.append("imageURL", formData.imageURL);
      }
      reqForm.append("userID", user.email);

      await addClothes(reqForm, user.email);
      const newClothes = await fetchClothes(user.email);
      setClothes(newClothes);
      router.push("/clothes");
    } catch (error) {
      alert("Error adding clothes:" + error);
    }
    setIsAdding(false);
  };

  const getImageSrc = () => {
    if (useImageURL) {
      return formData.imageURL;
    } else if (formData.imageFile) {
      return URL.createObjectURL(formData.imageFile);
    } else {
      return null; // デフォルトの画像URLがあればここに設定
    }
  };

  return (
    <>
      <Header title="Add Clothes" />
      <div className="bg-wood min-h-screen">
        <div className="container mx-auto p-4">
          <ClothForm
            formData={formData}
            setFormData={setFormData}
            useImageURL={useImageURL}
            setUseImageURL={setUseImageURL}
            handleInputChange={handleInputChange}
            handleImageOptionChange={handleImageOptionChange}
            handleFileChange={handleFileChange}
            getImageSrc={getImageSrc}
            selectedCloth={null}
            categories={categories}
          />
          <div className="bg-white p-6 rounded shadow-md">
            <Button
              type="submit"
              className="bg-brown text-cream px-4 py-2 rounded hover:bg-brown-dark"
              onClick={handleAddCloth}
              isLoading={isAdding}
            >
              Add Clothes
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddClothes;
