import { GOOGLE_SCRIPT_URL } from "./config";
import type { ApiResponse, Place, PlaceFormData } from "./types";

export class ApiClient {
  async fetchPlaces(): Promise<ApiResponse<Place[]>> {
    return this._scriptCall<Place[]>("list");
  }

  async addPlace(data: PlaceFormData): Promise<ApiResponse<{ stt: number }>> {
    return this._scriptCall<{ stt: number }>("add", { data: JSON.stringify(data) });
  }

  async updatePlace(place: Place): Promise<ApiResponse<Place>> {
    return this._scriptCall<Place>("update", { data: JSON.stringify(place) });
  }

  async deletePlace(stt: number): Promise<ApiResponse<{ stt: number }>> {
    return this._scriptCall<{ stt: number }>("delete", { stt: String(stt) });
  }

  private async _scriptCall<T>(
    action: string,
    params: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = new URL(GOOGLE_SCRIPT_URL);
      url.searchParams.set("action", action);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
      const res = await fetch(url.toString());
      return await res.json();
    } catch (err) {
      return this._error<T>(err);
    }
  }

  private _error<T>(err: unknown): ApiResponse<T> {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Network error",
      data: [] as unknown as T,
    };
  }
}