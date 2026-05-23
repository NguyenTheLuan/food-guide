import { ApiClient } from "./api";
import { SearchEngine } from "./search";
import {
  NotificationManager,
  LoadingIndicator,
  TableRenderer,
  PaginationRenderer,
  FilterRenderer,
  ModalManager,
} from "./render";
import type { Place, PlaceFormData, Filters } from "./types";

export class FoodTourApp {
  private readonly _api: ApiClient;
  private readonly _search: SearchEngine;
  private readonly _notifier: NotificationManager;
  private readonly _loading: LoadingIndicator;
  private readonly _table: TableRenderer;
  private readonly _pagination: PaginationRenderer;
  private readonly _filterRenderer: FilterRenderer;
  private readonly _modal: ModalManager;

  private _places: Place[] = [];
  private _page = 1;
  private _filters: Filters = { search: "", quan: "", phanLoai: "" };

  constructor() {
    this._api = new ApiClient();
    this._search = new SearchEngine();
    this._notifier = new NotificationManager();
    this._loading = new LoadingIndicator();
    this._table = new TableRenderer();
    this._pagination = new PaginationRenderer();
    this._filterRenderer = new FilterRenderer();
    this._modal = new ModalManager();
  }

  init(): void {
    document.getElementById("btn-add")!.addEventListener("click", () => this._handleAdd());
    document.getElementById("btn-close-modal")!.addEventListener("click", () => this._modal.close());
    document.getElementById("modal-overlay")!.addEventListener("click", () => this._modal.close());
    this._loadData();
  }

  private _refreshView(): void {
    const filtered = this._search.filterPlaces(this._places, this._filters);
    const totalPages = Math.ceil(filtered.length / 50) || 1;
    if (this._page > totalPages) this._page = totalPages;
    this._table.render(filtered, this._page, (p) => this._handleEdit(p), (s) => this._handleDelete(s));
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
    const res = await this._api.fetchPlaces();
    this._loading.show(false);

    if (res.success) {
      this._places = res.data;
      this._setupFilters();
      this._refreshView();
      this._notifier.show(`Loaded ${this._places.length} places`);
    } else {
      this._notifier.show("Failed to load data: " + res.message, "error");
    }
  }

  private async _handleAdd(): Promise<void> {
    this._modal.show("Add New Place", null, async (data: PlaceFormData) => {
      if (!data.tenQuan) {
        this._notifier.show("Tên quán is required", "error");
        return;
      }
      this._loading.show(true);
      const res = await this._api.addPlace(data);
      this._loading.show(false);
      if (res.success) {
        this._notifier.show("Place added!");
        await this._loadData();
      } else {
        this._notifier.show("Failed to add: " + res.message, "error");
      }
    });
  }

  private async _handleEdit(place: Place): Promise<void> {
    this._modal.show("Edit Place", place, async (data: PlaceFormData) => {
      this._loading.show(true);
      const res = await this._api.updatePlace({ ...data, stt: place.stt });
      this._loading.show(false);
      if (res.success) {
        this._notifier.show("Place updated!");
        await this._loadData();
      } else {
        this._notifier.show("Failed to update: " + res.message, "error");
      }
    });
  }

  private async _handleDelete(stt: number): Promise<void> {
    this._loading.show(true);
    const res = await this._api.deletePlace(stt);
    this._loading.show(false);
    if (res.success) {
      this._notifier.show("Place deleted!");
      await this._loadData();
    } else {
      this._notifier.show("Failed to delete: " + res.message, "error");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new FoodTourApp();
  app.init();
});