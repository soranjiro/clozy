import dotenv from "dotenv";

dotenv.config();

const API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN;

const convertDate = (date: Date): string => {
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return jstDate.toISOString().split("T")[0]
}

export const fetchClothesByDate = async (date: Date, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/wearHistory/clothesByDate?date=${convertDate(date)}&email=${userID}`);
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};

export const fetchClothesByDateRange = async (startDate: Date, endDate: Date, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/wearHistory/clothesByDateRange?startDate=${convertDate(startDate)}&endDate=${convertDate(endDate)}&email=${userID}`);
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
    body: JSON.stringify({ clothesIDs, date: convertDate(date), "email": userID }),
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
    body: JSON.stringify({ clothesID, date: convertDate(date), "email": userID }),
  });
  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};
