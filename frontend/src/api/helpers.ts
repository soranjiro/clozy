export const getResponseData = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    const text = await response.text();
    throw new Error(text);
  }
};

// JWTトークンを保存するためのローカルストレージキー
export const TOKEN_STORAGE_KEY = "auth_token";
export const CSRF_TOKEN_STORAGE_KEY = "csrf_token";

// トークンをローカルストレージに保存する
export const saveToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

// CSRFトークンを保存する
export const saveCSRFToken = (token: string) => {
  try {
    localStorage.setItem(CSRF_TOKEN_STORAGE_KEY, token);
    console.log("CSRF token saved successfully:", token.slice(0, 10) + "...");
  } catch (error) {
    console.error("Failed to save CSRF token:", error);
  }
};

// トークンをローカルストレージから取得する
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

// CSRFトークンを取得する
export const getCSRFToken = (): string | null => {
  return localStorage.getItem(CSRF_TOKEN_STORAGE_KEY);
};

// トークンをローカルストレージから削除する
export const removeToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
};

// getAuthHeaders.ts の修正例
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // CSRFトークンがあれば追加
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
    // デバッグ用
    console.log("CSRF token added to request headers");
  } else {
    console.warn("No CSRF token found in localStorage");
  }

  return headers;
}

// クロスドメインでもAPIリクエストできるようhelper関数を追加
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
}
