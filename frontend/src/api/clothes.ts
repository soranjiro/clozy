import dotenv from "dotenv";

dotenv.config();

const API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN;

export const fetchClothes = async (userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/clothes?userID=${userID}`);
  if (!response.ok) {
    throw new Error("Failed to fetch clothes");
  }
  return response.json();
};

export const fetchClothesById = async (id: string, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/clothes/${id}?userID=${userID}`);
  if (!response.ok) {
    throw new Error("Failed to fetch clothes by ID");
  }
  return response.json();
};

export const fetchCategories = async () => {
  const response = await fetch(`${API_DOMAIN}/api/categories`);
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
};

export const addClothes = async (formData: FormData, userID: string) => {
  formData.append("userID", userID);
  const response = await fetch(`${API_DOMAIN}/api/clothes`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Failed to add clothes");
  }
  return response; // c.text('Clothes added');
};

export const updateClothes = async (id: string, formData: FormData, userID: string) => {
  formData.append("userID", userID);
  const response = await fetch(`${API_DOMAIN}/api/clothes/${id}`, {
    method: "PUT",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Failed to update clothes");
  }
  return response; // c.text('Clothes updated');
};

export const deleteClothes = async (id: string, userID: string) => {
  const response = await fetch(`${API_DOMAIN}/api/clothes/${id}?userID=${userID}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete clothes");
  }
  return response; // c.text('Clothes deleted');
};
