import dotenv from "dotenv";

dotenv.config();

const API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN;

export const fetchClothesByDate = async (date: Date, userID: string) => {
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const response = await fetch(`${API_DOMAIN}/api/wearHistory/clothesByDate?date=${jstDate.toISOString().split("T")[0]}&email=${userID}`);
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};

export const fetchClothesByDateRange = async (startDate: Date, endDate: Date, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/wearHistory/clothesByDateRange?startDate=${startDate.toISOString().split("T")[0]}&endDate=${endDate.toISOString().split("T")[0]}&email=${userID}`);
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};

export const addWearHistory = async (clothesIDs: string[], date: Date, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/wearHistory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clothesIDs, date: date.toISOString().split("T")[0], "email": userID }),
  });
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};

export const removeWearHistory = async (clothesID: string, date: Date, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/wearHistory`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clothesID, date: date.toISOString().split("T")[0], "email": userID }),
  });
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};
