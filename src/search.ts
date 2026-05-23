import type { Place, Filters } from "./types";

export class SearchEngine {
  extractDistricts(places: Place[]): string[] {
    const set = new Set<string>();
    for (const p of places) {
      if (p.quan) set.add(p.quan);
    }
    return [...set].sort((a, b) => {
      const dA = this._extractDistrictNumber(a);
      const dB = this._extractDistrictNumber(b);
      if (dA !== dB) return dA - dB;
      return a.localeCompare(b, "vi");
    });
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

    return this._sortByDistrict(result);
  }

  private _sortByDistrict(places: Place[]): Place[] {
    return [...places].sort((a, b) => {
      const dA = this._extractDistrictNumber(a.quan ?? "");
      const dB = this._extractDistrictNumber(b.quan ?? "");
      if (dA !== dB) return dA - dB;
      return a.quan.localeCompare(b.quan, "vi");
    });
  }

  private _extractDistrictNumber(quan: string): number {
    const m = quan.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 999;
  }

  private _normalize(s: string): string {
    return s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }
}