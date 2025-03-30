import dotenv from "dotenv";
import {
  getResponseData,
  saveToken,
  removeToken,
  getAuthHeaders,
} from "./helpers";

dotenv.config();

const API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN;

export const signup = async (
  email: string,
  password: string,
  username: string
) => {
  const response = await fetch(`${API_DOMAIN}/api/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, username }),
  });
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  if (responseData.token) {
    saveToken(responseData.token);
  }
  return responseData;
};

export const signOut = async (email: string) => {
  const response = await fetch(`${API_DOMAIN}/api/signout`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ email }),
  });
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  removeToken();
  return responseData;
};

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_DOMAIN}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  // レスポンスからトークンを取得して保存する
  if (responseData.token) {
    saveToken(responseData.token);
  }
  return responseData;
};

export const logout = async () => {
  const response = await fetch(`${API_DOMAIN}/api/logout`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  removeToken();
  return responseData;
};

export const changePassword = async (
  email: string,
  password: string,
  newPassword: string
) => {
  try {
    const response = await fetch(`${API_DOMAIN}/api/changePassword`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password, newPassword }),
    });
    const responseData = await getResponseData(response);
    if (!response.ok) {
      throw new Error(responseData?.message ?? responseData);
    }
    return responseData;
  } catch (error) {
    throw error;
  }
};
