"use client";

import { resizeImage } from "./imageUtils";
import { ERRORS } from "@/errors/errors";

export const formValid = async (
  name: string,
  category: string,
  size: string,
  color: string,
  brand: string,
  useImageURL: boolean,
  imageURL: string,
  imageFile: File | null,
  handleFileUpdate: (file: File) => void
) => {
  if (!name) {
    return ERRORS.NAME_NOT_REGISTERED
  }
  if (!category) {
    return ERRORS.CATEGORY_NOT_REGISTERED;
  }
  if (!size) {
    return ERRORS.SIZE_NOT_REGISTERED;
  }
  if (!color) {
    return ERRORS.COLOR_NOT_REGISTERED;
  }
  if (!brand) {
    return ERRORS.BRAND_NOT_REGISTERED;
  }
  if ((useImageURL && !imageURL) || (!useImageURL && !imageFile)) {
    return ERRORS.NO_IMAGE_SELECTED;
  }
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (imageFile && imageFile.size > maxSize) {
    const shouldResize = confirm(
      "The image size is too large.\nDo you want to compress the image?"
    );
    if (shouldResize) {
      const resizedImage = await resizeImage(imageFile, maxSize);
      if (resizedImage && resizedImage.size <= maxSize) {
        handleFileUpdate(resizedImage);
        return ERRORS.IMAGE_COMPRESSED;
      } else {
        return ERRORS.FAILED_TO_COMPRESS_IMAGE;
      }
    } else {
      return ERRORS.IMAGE_SIZE_TOO_LARGE;
    }
  }
  return null;
};
