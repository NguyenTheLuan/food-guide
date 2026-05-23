import type { Place, Filters } from "./types";

export class SearchEngine {
  extractDistricts(places: Place[]): string[] {
    const set = new Set<string>();
    for (const p of places) {
      if (p.quan) set.add(p.quan);
    }
    return [...set].sort();
  }

  extractCategories(places: Place[]): string[] {
    const set = new Set<string>();
    for (const p of places) {
      if (p.phanLoai) set.add(p.phanLoai);
    }
    return [...set].sort();
  }

  filterPlaces(places: Place[], filters: Filters): Place[] {
    let result = places;

    if (filters.search) {
      const q = this._normalize(filters.search);
      result = result.filter(
        (p) =>
          this._normalize(p.tenQuan).includes(q) ||
          this._normalize(p.tenMon).includes(q) ||
          this._normalize(p.tenDuong).includes(q) ||
          this._normalize(p.quan).includes(q) ||
          this._normalize(p.phanLoai).includes(q) ||
          this._normalize(p.note).includes(q) ||
          String(p.stt).includes(q)
      );
    }

    if (filters.quan) {
      result = result.filter((p) => p.quan === filters.quan);
    }

    if (filters.phanLoai) {
      result = result.filter((p) => p.phanLoai === filters.phanLoai);
    }

    return result;
  }

  private _normalize(s: string): string {
    return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }
}