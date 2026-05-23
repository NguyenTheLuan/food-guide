import { SearchEngine } from "./search";
import {
  NotificationManager,
  LoadingIndicator,
  TableRenderer,
  PaginationRenderer,
  FilterRenderer,
} from "./render";
import type { Place, Filters } from "./types";
import * as XLSX from "xlsx";

class DevApp {
  private readonly _search: SearchEngine;
  private readonly _notifier: NotificationManager;
  private readonly _loading: LoadingIndicator;
  private readonly _table: TableRenderer;
  private readonly _pagination: PaginationRenderer;
  private readonly _filterRenderer: FilterRenderer;

  private _places: Place[] = [];
  private _page = 1;
  private _filters: Filters = { search: "", quan: "", phanLoai: "" };

  constructor() {
    this._search = new SearchEngine();
    this._notifier = new NotificationManager();
    this._loading = new LoadingIndicator();
    this._table = new TableRenderer();
    this._pagination = new PaginationRenderer();
    this._filterRenderer = new FilterRenderer();
  }

  init(): void {
    this._loadData();
  }

  private _refreshView(): void {
    const filtered = this._search.filterPlaces(this._places, this._filters);
    const totalPages = Math.ceil(filtered.length / 50) || 1;
    if (this._page > totalPages) this._page = totalPages;

    // Read-only — no edit callback
    this._table.render(filtered, this._page, () => {});
    this._pagination.render(filtered.length, this._page, (p) => {
      this._page = p;
      this._refreshView();
    });
  }

  private _setupFilters(): void {
    const districts = this._search.extractDistricts(this._places);
    const categories = this._search.extractCategories(this._places);
    this._filterRenderer.render(districts, categories, (key, value) => {
      this._filters[key] = value;
      this._page = 1;
      this._refreshView();
    });
  }

  private async _loadData(): Promise<void> {
    this._loading.show(true);

    try {
      const url = new URL("/Food tour SG.xlsx", window.location.origin);
      const resp = await fetch(url.toString());
      if (!resp.ok) {
        throw new Error(`Failed to fetch xlsx: ${resp.status}`);
      }
      const buf = await resp.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      const firstSheet = wb.SheetNames[0];
      const sheet = wb.Sheets[firstSheet];
      const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // first row = header, skip it
      this._places = rows.slice(1).map((row, i): Place => {
        const r = row as string[];
        return {
          stt: i + 1,
          tenQuan: String(r[0] ?? "").trim(),
          tenMon: String(r[1] ?? "").trim(),
          phanLoai: String(r[2] ?? "").trim(),
          tenDuong: String(r[3] ?? "").trim(),
          quan: String(r[4] ?? "").trim(),
          gioMoCua: String(r[5] ?? "").trim(),
          khoangGia: String(r[6] ?? "").trim(),
          note: String(r[7] ?? "").trim(),
        };
      });

      this._notifier.show(`Loaded ${this._places.length} places from xlsx`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      this._notifier.show("Failed to load xlsx: " + msg, "error");
    } finally {
      this._loading.show(false);
    }

    this._setupFilters();
    this._refreshView();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new DevApp();
  app.init();

  // ── Theme switcher (same as main) ──
  const themeBtns = document.querySelectorAll<HTMLButtonElement>(".theme-btn");
  const htmlEl = document.documentElement;

  const savedTheme = localStorage.getItem("foodtour-theme");
  if (savedTheme) {
    htmlEl.setAttribute("data-theme", savedTheme);
    themeBtns.forEach((b) => b.classList.toggle("active", b.dataset.theme === savedTheme));
  }

  themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      if (!theme) return;
      htmlEl.setAttribute("data-theme", theme);
      localStorage.setItem("foodtour-theme", theme);
      themeBtns.forEach((b) => b.classList.toggle("active", b === btn));
    });
  });
});