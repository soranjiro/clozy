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
