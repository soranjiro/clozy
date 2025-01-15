"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fetchClothes, addClothes, fetchCategories } from "@/api/clothes";
import { UserContext } from "@/context/UserContext";
import { ClothContext } from "@/context/ClothContext";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";

const AddClothes = () => {
  const { user } = useContext(UserContext);
  const { setClothes } = useContext(ClothContext);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageURL, setImageURL] = useState("");
  const [useImageURL, setUseImageURL] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (user === undefined) return; // ユーザー情報がまだ読み込まれていない場合は何もしない
      if (!user) {
        router.push("/login");
      } else {
        const categories = await fetchCategories();
        setCategories(categories);
      }
    };
    fetchData();
  }, [user, router]);

  const handleImageOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseImageURL(e.target.value === "url");
  };

  const handleAddClothes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    if (!user) {
      console.error("User is not logged in");
      setIsAdding(false);
      return;
    }
    if (!name) {
      alert("Nameが登録されていません");
      setIsAdding(false);
      return;
    }
    if (!category) {
      alert("Categoryが登録されていません");
      setIsAdding(false);
      return;
    }
    if (!size) {
      alert("Sizeが登録されていません");
      setIsAdding(false);
      return;
    }
    if (!color) {
      alert("Colorが登録されていません");
      setIsAdding(false);
      return;
    }
    if (!brand) {
      alert("Brandが登録されていません");
      setIsAdding(false);
      return;
    }
    if ((useImageURL && !imageURL) || (!useImageURL && !imageFile)) {
      alert("画像が選択されていません");
      setIsAdding(false);
      return;
    }
    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      // 2MB
      alert("画像サイズが大きすぎます");
      setIsAdding(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("size", size);
      formData.append("color", color);
      formData.append("brand", brand);
      if (imageFile) {
        formData.append("image", imageFile);
      } else {
        formData.append("imageURL", imageURL);
      }
      formData.append("userID", user.email);

      await addClothes(formData, user.email);
      const newClothes = await fetchClothes(user.email);
      setClothes(newClothes);
      router.push("/clothes");
    } catch (error) {
      console.error("Error adding clothes:", error);
    }
    setIsAdding(false);
  };

  const getImageSrc = () => {
    if (useImageURL) {
      return imageURL;
    } else if (imageFile) {
      return URL.createObjectURL(imageFile);
    } else {
      return null; // デフォルトの画像URLがあればここに設定
    }
  };

  return (
    <>
      <Header title="Add Clothes" />
      <div className="bg-wood min-h-screen">
        <div className="container mx-auto p-4">
          {/* <h1 className="text-4xl font-bold text-brown text-center mb-8">
            Add Clothes
          </h1> */}
          <form
            onSubmit={handleAddClothes}
            className="bg-white p-6 rounded shadow-md"
          >
            <div className="mb-4">
              <label htmlFor="name" className="block text-brown font-bold mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-brown rounded px-4 py-2 w-full"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="category"
                className="block text-brown font-bold mb-2"
              >
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-brown rounded px-4 py-2 w-full"
              >
                <option value="">Select a category</option>
                {categories &&
                  categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="size" className="block text-brown font-bold mb-2">
                Size
              </label>
              <input
                id="size"
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="border border-brown rounded px-4 py-2 w-full"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="color"
                className="block text-brown font-bold mb-2"
              >
                Color
              </label>
              <input
                id="color"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="border border-brown rounded px-4 py-2 w-full"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="brand"
                className="block text-brown font-bold mb-2"
              >
                Brand
              </label>
              <input
                id="brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="border border-brown rounded px-4 py-2 w-full"
              />
            </div>
            <div className="mb-4">
              <label className="block text-brown font-bold mb-2">
                Image Option
              </label>
              <div className="flex items-center">
                <input
                  title="URL"
                  type="radio"
                  name="imageOption"
                  value="url"
                  checked={useImageURL}
                  onChange={handleImageOptionChange}
                  className="mr-2"
                />
                <label className="mr-4">URL</label>
                <input
                  title="File"
                  type="radio"
                  name="imageOption"
                  value="file"
                  checked={!useImageURL}
                  onChange={handleImageOptionChange}
                  className="mr-2"
                />
                <label>File</label>
              </div>
            </div>
            <div className="mb-4">
              <label
                htmlFor="imageURL"
                className={
                  useImageURL ? "block text-brown font-bold mb-2" : "hidden"
                }
              >
                Image URL
              </label>
              <input
                id="imageURL"
                type="text"
                value={imageURL}
                onChange={(e) => setImageURL(e.target.value)}
                className={
                  useImageURL
                    ? "border border-brown rounded px-4 py-2 w-full"
                    : "hidden"
                }
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="image"
                className={
                  useImageURL ? "hidden" : "block text-brown font-bold mb-2"
                }
              >
                Image File
              </label>
              <input
                id="image"
                type="file"
                onChange={(e) =>
                  setImageFile(e.target.files ? e.target.files[0] : null)
                }
                className={
                  useImageURL
                    ? "hidden"
                    : "border border-brown rounded px-4 py-2 w-full"
                }
              />
            </div>
            <div className="mb-4">
              <label className="block text-brown font-bold mb-2">
                Current Image
              </label>
              {getImageSrc() ? (
                <Image
                  src={getImageSrc() as string}
                  alt="Current Image"
                  className="w-full h-auto rounded"
                  width={200}
                  height={200}
                />
              ) : null}
            </div>
            <Button
              type="submit"
              className="bg-brown text-cream px-4 py-2 rounded hover:bg-brown-dark"
              isLoading={isAdding}
            >
              Add Clothes
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddClothes;
