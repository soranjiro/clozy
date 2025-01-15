import dotenv from "dotenv";

dotenv.config();

const API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN;

export const fetchClothesByDate = async (date: Date, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/clothesByDate?date=${date.toISOString().split("T")[0]}&email=${userID}`);
  if (!response.ok) {
    throw new Error("Failed to fetch clothes by date");
  }
  return response.json();
};

export const addWearHistory = async (clothesIDs: string[], date: Date, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/wearHistory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clothesIDs, date: date.toISOString().split("T")[0], "email": userID }),
  });
  if (!response.ok) {
    throw new Error(`Failed to add wear history: ${response.text()}`);
  }
  return response; // c.text('Wear history added');
};

export const removeWearHistory = async (clothesID: string, date: Date, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/wearHistory`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clothesID, date: date.toISOString().split("T")[0], "email": userID }),
  });
  if (!response.ok) {
    throw new Error(`Failed to remove wear history: ${response.text()}`);
  }
  return response; // c.text('Wear history deleted');
};
