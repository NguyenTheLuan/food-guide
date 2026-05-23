import { GOOGLE_SHEET_API_URL } from "./config";
import type { ApiResponse, Place, PlaceFormData } from "./types";

export class ApiClient {
  private _buildUrl(action: string, params: Record<string, string> = {}): string {
    const url = new URL(GOOGLE_SHEET_API_URL);
    url.searchParams.set("action", action);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private async _apiCall<T>(
    method: "GET" | "POST",
    action: string,
    params: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    try {
      if (method === "GET") {
        const res = await fetch(this._buildUrl(action, params));
        return await res.json();
      }
      const body = new URLSearchParams();
      body.set("action", action);
      for (const [key, value] of Object.entries(params)) {
        body.set(key, value);
      }
      const res = await fetch(GOOGLE_SHEET_API_URL, { method: "POST", body });
      return await res.json();
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Network error",
        data: [] as unknown as T,
      };
    }
  }

  async fetchPlaces(): Promise<ApiResponse<Place[]>> {
    return this._apiCall<Place[]>("GET", "list");
  }

  async addPlace(data: PlaceFormData): Promise<ApiResponse<{ stt: number }>> {
    return this._apiCall<{ stt: number }>("POST", "add", { data: JSON.stringify(data) });
  }

  async updatePlace(place: Place): Promise<ApiResponse<Place>> {
    return this._apiCall<Place>("POST", "update", { data: JSON.stringify(place) });
  }

  async deletePlace(stt: number): Promise<ApiResponse<{ stt: number }>> {
    return this._apiCall<{ stt: number }>("POST", "delete", { stt: String(stt) });
  }
}