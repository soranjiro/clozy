import dotenv from "dotenv";
import {
  getResponseData,
  saveToken,
  removeToken,
  getAuthHeaders,
  saveCSRFToken,
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
    credentials: "include", // Cookieを含める
  });
  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  if (responseData.token) {
    saveToken(responseData.token);
  }

  // CSRFトークンを保存
  const csrfToken = response.headers.get("X-CSRF-Token");
  if (csrfToken) {
    saveCSRFToken(csrfToken);
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

// ログインリクエストをPOSTに戻す
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_DOMAIN}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include", // Cookieを含める
    });

    // CSRFトークンをレスポンスヘッダーから取得して明示的にログ出力
    const csrfToken = response.headers.get("X-CSRF-Token");
    console.log("CSRF Token from response:", csrfToken);

    const responseData = await getResponseData(response);
    if (!response.ok) {
      throw new Error(responseData?.message ?? responseData);
    }

    // レスポンスからトークンを保存する
    if (responseData.token) {
      saveToken(responseData.token);
      console.log("Auth token saved:", responseData.token);
    }

    // CSRFトークンを保存 - ヘッダーから直接取得
    if (csrfToken) {
      saveCSRFToken(csrfToken);
      console.log("CSRF token saved to localStorage");
    } else {
      console.warn("No CSRF token found in response headers");

      // バックアップ: CSRFトークンがレスポンスボディに含まれている場合の対応
      if (responseData.csrfToken) {
        saveCSRFToken(responseData.csrfToken);
        console.log("CSRF token from response body saved");
      }
    }

    return responseData;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const logout = async () => {
  // const response = await fetch(`${API_DOMAIN}/api/logout`, {
  //   method: "POST",
  //   headers: getAuthHeaders(),
  // });
  // const responseData = await getResponseData(response);
  // if (!response.ok) {
  //   throw new Error(responseData?.message ?? responseData);
  // }
  removeToken();
  // return responseData;
  return true;
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
