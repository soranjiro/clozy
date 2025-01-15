"use client";

import Resizer from "react-image-file-resizer";

export const createImageLocalURL = (imageFile: string): string | null => {
  try {
    // base64データをバイナリデータに変換
    const byteCharacters = atob(imageFile);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    // Blobを生成
    const blob = new Blob([byteArray], { type: "image/jpeg" });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Failed to decode base64 data:", error);
    return null;
  }
};


export const resizeImage = async (imageFile: File, maxSize: number) => {
  try {
    let resizedImage = imageFile;

    let loopCount = 0;
    while (resizedImage.size > maxSize) {
      resizedImage = await new Promise<File>((resolve, reject) => {
        Resizer.imageFileResizer(
          resizedImage,
          800, // max width
          800, // max height
          "JPEG",
          80, // quality
          0, // rotation
          (uri) => {
            if (typeof uri === "string") {
              fetch(uri)
                .then((res) => res.blob())
                .then((blob) => {
                  const file = new File([blob], imageFile.name, {
                    type: "image/jpeg",
                  });
                  resolve(file);
                })
                .catch(reject);
            } else {
              reject(new Error("画像の圧縮に失敗しました"));
            }
          },
          "base64"
        );
      });
      loopCount++;
      if (loopCount > 3) {
        return null;
      }
    }
    return resizedImage;
  } catch (error) {
    alert("画像の圧縮に失敗しました\n" + error);
    return null;
  }
};
