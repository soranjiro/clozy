import dotenv from "dotenv";
import { getResponseData, getAuthHeaders } from "./helpers";

dotenv.config();

const API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN;

const convertDate = (date: Date): string => {
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jstDate.toISOString().split("T")[0];
};

export const fetchClothesByDate = async (date: Date, userID: string) => {
  const response = await fetch(
    `${API_DOMAIN}/api/wearHistory/clothesByDate?date=${convertDate(
      date
    )}&email=${userID}`,
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

export const fetchClothesByDateRange = async (
  startDate: Date,
  endDate: Date,
  userID: string
) => {
  const response = await fetch(
    `${API_DOMAIN}/api/wearHistory/clothesByDateRange?startDate=${convertDate(
      startDate
    )}&endDate=${convertDate(endDate)}&email=${userID}`,
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

export const addWearHistory = async (
  clothesIDs: string[],
  date: Date,
  userID: string
) => {
  const response = await fetch(`${API_DOMAIN}/api/wearHistory`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      clothesIDs,
      date: convertDate(date),
      email: userID,
    }),
    credentials: "include", // Cookieを送信するために追加
  });

  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  return responseData;
};

export const removeWearHistory = async (
  clothesID: string,
  date: Date,
  userID: string
) => {
  const response = await fetch(`${API_DOMAIN}/api/wearHistory`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ clothesID, date: convertDate(date), email: userID }),
    credentials: "include", // Cookieを送信するために追加
  });

  const responseData = await getResponseData(response);
  if (!response.ok) {
    throw new Error(responseData?.message ?? responseData);
  }
  return responseData;
};
