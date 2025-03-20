export const getResponseData = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    const text = await response.text();
    throw new Error(text);
  }
};
