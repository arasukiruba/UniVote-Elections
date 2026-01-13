const GAS_URL = import.meta.env.VITE_GAS_URL;

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string };

export async function gasCall<T>(action: string, payload: any = {}): Promise<T> {
  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, payload }),
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.message || "Request failed");
  }

  return json.data;
}
