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
  });

  if (!response.ok) {
    throw new Error("Signup failed");
  }

  return response.json();
};

export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_DOMAIN}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 401) {
    throw new Error("The email address or password is incorrect");
  }

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
};

export const changePassword = async (email: string, password: string, newPassword: string) => {
  try {
    const response = await fetch(`${API_DOMAIN}/api/changePassword`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, newPassword }),
    });

    if (response.status === 401) {
      throw new Error("パスワードが違います");
    }

    const responseData = await response.json();
    if (
      response.status === 400 &&
      responseData.error === "New password must be different"
    ) {
      throw new Error("新しいパスワードは現在のパスワードと異なる必要があります");
    }

    if (!response.ok) {
      throw new Error(responseData.error || "パスワードの変更に失敗しました");
    }

    return response; // c.text('Password changed');
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
  });

  if (!response.ok) {
    throw new Error("Failed to sign out");
  }

  return response.json();
};
