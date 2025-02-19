import dotenv from "dotenv";

dotenv.config();

const API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN;

export const fetchClothes = async (userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/clothes?userID=${userID}`);
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};

export const fetchClothesById = async (id: string, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/clothes/${id}?userID=${userID}`);
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};

export const fetchCategories = async () => {
  const response = await fetch(`${API_DOMAIN}/api/categories`);
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};

export const addClothes = async (formData: FormData, userID: string) => {
  formData.append("userID", userID);
  const response = await fetch(`${API_DOMAIN}/api/clothes`, {
    method: "POST",
    body: formData,
  });
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};

export const updateClothes = async (id: string, formData: FormData, userID: string) => {
  formData.append("userID", userID);
  const response = await fetch(`${API_DOMAIN}/api/clothes/${id}`, {
    method: "PUT",
    body: formData,
  });
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};

export const deleteClothes = async (id: string, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/clothes/${id}?userID=${userID}`, {
    method: "DELETE",
  });
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};
