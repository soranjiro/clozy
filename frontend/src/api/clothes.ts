import dotenv from "dotenv";
import { getResponseData } from "./helpers";

dotenv.config();

const API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN;

export const fetchClothes = async (userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/clothes?userID=${userID}`, {
    credentials: "include",
  });
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  return responseData;
};

export const fetchClothesById = async (id: string, userID: string) => {
  const response = await fetch(
    `${API_DOMAIN}/api/clothes/${id}?userID=${userID}`,
    {
      credentials: "include",
    }
  );
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  return responseData;
};

export const fetchCategories = async (userID: string) => {
  const response = await fetch(
    `${API_DOMAIN}/api/categories?userID=${userID}`,
    {
      credentials: "include",
    }
  );
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  return responseData;
};

export const addClothes = async (formData: FormData, userID: string) => {
  formData.append("userID", userID);
  const response = await fetch(`${API_DOMAIN}/api/clothes`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  return responseData;
};

export const updateClothes = async (
  id: string,
  formData: FormData,
  userID: string
) => {
  formData.append("userID", userID);
  const response = await fetch(`${API_DOMAIN}/api/clothes/${id}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  return responseData;
};

export const deleteClothes = async (id: string, userID: string) => {
  const response = await fetch(
    `${API_DOMAIN}/api/clothes/${id}?userID=${userID}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  return responseData;
};
