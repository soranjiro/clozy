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

// トークンをローカルストレージに保存する
export const saveToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

// トークンをローカルストレージから取得する
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

// トークンをローカルストレージから削除する
export const removeToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

// getAuthHeaders.ts の修正例
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  const token = getToken();
  if (token) {
    headers.Authorization = token;
  }

  return headers;
}
