import dotenv from "dotenv";

dotenv.config();

const API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN;

export const signup = async (email: string, password: string, username: string) => {
  const response = await fetch(`${API_DOMAIN}/api/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, username }),
    credentials: "include",
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
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

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};

export const changePassword = async (email: string, password: string, newPassword: string) => {
  try {
    const response = await fetch(`${API_DOMAIN}/api/changePassword`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, newPassword }),
      credentials: "include",
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message);
    }
    return responseData;
  } catch (error) {
    throw error;
  }
};

export const signOut = async (email: string) => {
  const response = await fetch(`${API_DOMAIN}/api/signout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    credentials: "include",
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message);
  }
  return responseData;
};
