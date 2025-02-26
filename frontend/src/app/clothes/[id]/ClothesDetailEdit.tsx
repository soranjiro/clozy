"use client";

import React from "react";
import Image from "next/image";
import type { ClothType } from "@/types/clothes";
import { Button } from "@/components/ui/button";

interface ClothesDetailEditProps {
  formData: {
    name: string;
    category: string;
    size: string;
    color: string;
    brand: string;
    imageURL: string;
    imageFile: File | null;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      name: string;
      category: string;
      size: string;
      color: string;
      brand: string;
      imageURL: string;
      imageFile: File | null;
    }>
  >;
  useImageURL: boolean;
  setUseImageURL: React.Dispatch<React.SetStateAction<boolean>>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleImageOptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEdit: () => void;
  handleEditCancel: () => void;
  isSaving: boolean;
  getImageSrc: (cloth: ClothType) => string | null;
  selectedCloth: ClothType;
  categories: string[];
}

const ClothesDetailEdit: React.FC<ClothesDetailEditProps> = ({
  formData,
  useImageURL,
  handleInputChange,
  handleImageOptionChange,
  handleFileChange,
  handleEdit,
  handleEditCancel,
  isSaving,
  getImageSrc,
  selectedCloth,
  categories,
}) => {

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <div className="mb-4">
        <label htmlFor="name" className="block text-brown font-bold mb-2">
          Name
        </label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="border border-brown rounded px-4 py-2 w-full"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="category" className="block text-brown font-bold mb-2">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="border border-brown rounded px-4 py-2 w-full"
        >
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
          name="size"
          value={formData.size}
          onChange={handleInputChange}
          className="border border-brown rounded px-4 py-2 w-full"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="color" className="block text-brown font-bold mb-2">
          Color
        </label>
        <input
          id="color"
          type="text"
          name="color"
          value={formData.color}
          onChange={handleInputChange}
          className="border border-brown rounded px-4 py-2 w-full"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="brand" className="block text-brown font-bold mb-2">
          Brand
        </label>
        <input
          id="brand"
          type="text"
          name="brand"
          value={formData.brand}
          onChange={handleInputChange}
          className="border border-brown rounded px-4 py-2 w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block text-brown font-bold mb-2">Image Option</label>
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
          className={useImageURL ? "block text-brown font-bold mb-2" : "hidden"}
        >
          Image URL
        </label>
        <input
          id="imageURL"
          type="text"
          name="imageURL"
          value={formData.imageURL}
          onChange={handleInputChange}
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
          className={useImageURL ? "hidden" : "block text-brown font-bold mb-2"}
        >
          Image File
        </label>
        <input
          id="image"
          type="file"
          onChange={handleFileChange}
          className={
            useImageURL
              ? "hidden"
              : "border border-brown rounded px-4 py-2 w-full"
          }
        />
      </div>
      <div className="mb-4">
        <label className="block text-brown font-bold mb-2">Current Image</label>
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
      </div>
      <Button
        type="button"
        onClick={handleEdit}
        className="bg-blue-500 text-cream px-4 py-2 rounded hover:bg-blue-700 mr-2"
        isLoading={isSaving}
      >
        Save
      </Button>
      <Button
        type="button"
        onClick={handleEditCancel}
        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
      >
        Cancel
      </Button>
    </div>
  );
};

export default ClothesDetailEdit;
