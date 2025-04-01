import dotenv from "dotenv";
import { getResponseData, getAuthHeaders } from "./helpers";

dotenv.config();

const API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN;

export const fetchClothes = async (userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/clothes?userID=${userID}`, {
    headers: getAuthHeaders(),
  });

  // CSRFトークンをレスポンスヘッダーから取得して保存
  const csrfToken = response.headers.get("X-CSRF-Token");
  if (csrfToken) {
    localStorage.setItem("csrf_token", csrfToken);
    console.log("新しいCSRFトークンを保存しました");
  }

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
      headers: getAuthHeaders(),
    }
  );

  // CSRFトークンをレスポンスヘッダーから取得して保存
  const csrfToken = response.headers.get("X-CSRF-Token");
  if (csrfToken) {
    localStorage.setItem("csrf_token", csrfToken);
    console.log("新しいCSRFトークンを保存しました");
  }

  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  return responseData;
};

// 修正: addClothes関数でCSRFトークンを含める
export const addClothes = async (formData: FormData, userID: string) => {
  formData.append("userID", userID);

  // 完全なAuthヘッダーを取得
  const headers = getAuthHeaders();

  // FormDataを使う場合はContent-Typeヘッダーを削除（ブラウザが自動設定）
  delete headers["Content-Type"];

  const response = await fetch(`${API_DOMAIN}/api/clothes`, {
    method: "POST",
    headers: headers,
    body: formData,
    credentials: "include",
  });

  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  return responseData;
};

// 修正: updateClothes関数でCSRFトークンを含める
export const updateClothes = async (
  id: string,
  formData: FormData,
  userID: string
) => {
  formData.append("userID", userID);

  // 完全なAuthヘッダーを取得
  const headers = getAuthHeaders();

  // FormDataを使う場合はContent-Typeヘッダーを削除
  delete headers["Content-Type"];

  const response = await fetch(`${API_DOMAIN}/api/clothes/${id}`, {
    method: "PUT",
    headers: headers,
    body: formData,
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
      headers: getAuthHeaders(),
    }
  );
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
      headers: getAuthHeaders(),
      credentials: "include",
    }
  );
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  return responseData;
};
