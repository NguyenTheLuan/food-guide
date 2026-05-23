import { PAGE_SIZE } from "./config";
import type { Place, PlaceFormData, Filters } from "./types";

export class NotificationManager {
  show(message: string, type: "success" | "error" = "success"): void {
    const el = document.getElementById("notification")!;
    el.textContent = message;
    el.className = `notification ${type}`;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 3000);
  }
}

export class LoadingIndicator {
  show(visible: boolean): void {
    const el = document.getElementById("loading")!;
    el.classList.toggle("hidden", !visible);
  }
}

export class ConfirmDialog {
  private _resolve: ((ok: boolean) => void) | null = null;

  show(message: string): Promise<boolean> {
    const el = document.getElementById("confirm-dialog")!;
    document.getElementById("confirm-message")!.textContent = message;
    el.classList.remove("hidden");

    return new Promise((resolve) => {
      this._resolve = resolve;

      document.getElementById("btn-confirm-ok")!.onclick = () => {
        this._close(true);
      };
      document.getElementById("btn-confirm-cancel")!.onclick = () => {
        this._close(false);
      };
      el.querySelector(".confirm-overlay")!.addEventListener("click", () => {
        this._close(false);
      });
    });
  }

  private _close(result: boolean): void {
    document.getElementById("confirm-dialog")!.classList.add("hidden");
    if (this._resolve) {
      this._resolve(result);
      this._resolve = null;
    }
  }
}

export class TableRenderer {
  render(
    places: Place[],
    page: number,
    onEdit: (place: Place) => void
  ): void {
    const tbody = document.getElementById("table-body")!;
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = places.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty-msg">No places found. Double-click a row to edit.</td></tr>`;
    } else {
      tbody.innerHTML = pageItems
        .map(
          (p, i) => `
      <tr data-stt="${p.stt}" class="place-row">
        <td data-label="#" class="col-num">${start + i + 1}</td>
        <td data-label="Tên quán" class="col-name">${this._esc(p.tenQuan)}</td>
        <td data-label="Tên món" class="col-dish">${this._esc(p.tenMon)}</td>
        <td data-label="Phân loại" class="col-cat"><span class="tag">${this._esc(p.phanLoai)}</span></td>
        <td data-label="Đường" class="col-address">${this._renderAddress(p.tenDuong)}</td>
        <td data-label="Quận" class="col-district">${this._esc(p.quan)}</td>
        <td data-label="Giờ mở cửa" class="col-time">${this._renderMultiline(p.gioMoCua)}</td>
        <td data-label="Giá" class="col-price">${this._renderMultiline(p.khoangGia)}</td>
        <td data-label="Note" class="col-note">${this._renderMultiline(p.note)}</td>
      </tr>`
        )
        .join("");
    }

    tbody.querySelectorAll(".place-row").forEach((row) => {
      const tr = row as HTMLTableRowElement;
      const stt = Number(tr.dataset.stt);

      // Double-click opens edit modal
      tr.addEventListener("dblclick", () => {
        const place = places.find((p) => p.stt === stt);
        if (place) onEdit(place);
      });
    });
  }

  private _renderMultiline(text: string): string {
    if (!text) return "";
    return this._esc(text).replace(/\n/g, "<br>");
  }

  private _renderAddress(address: string): string {
    if (!address) return this._esc("");

    // Split on ▪️ separators first
    const parts = address.split(/\s*▪️\s*/);
    if (parts.length > 1) {
      return parts
        .map((p, i) => {
          const rendered = this._renderAddress(p.trim());
          // Skip empty parts and the recursive call's own markers
          if (!rendered) return "";
          return `<span class="branch-line">📍 ${rendered}</span>`;
        })
        .filter(Boolean)
        .join("");
    }

    // Support multi-branch: split on numbered branch markers
    const branches = address.split(/(?=(?:Chi\s*[Nn]hánh|C[Nn]\s*|Co\s*[Ss]ở|CN)\s*\d+\s*[:：-])/g);
    if (branches.length > 1) {
      return branches.map((b) => this._renderOneAddress(b.trim())).join("<br>");
    }
    return this._renderOneAddress(address.trim());
  }

  private _renderOneAddress(raw: string): string {
    const address = raw.replace(/^(?:Chi\s*[Nn]hánh|C[Nn]\s*|Co\s*[Ss]ở|CN)\s*\d+\s*[:：-]\s*/, "").trim();
    if (!address) return "";

    const safeLabel = this._esc(raw);
    let url: string;

    if (/^https?:\/\//i.test(address)) {
      // Already a URL — link directly
      url = address;
    } else {
      const encoded = encodeURIComponent(address);
      url = `https://www.google.com/maps/search/${encoded}`;
    }

    return `<a href="${url}" target="_blank" rel="noopener" class="address-link" title="Open in Google Maps">${safeLabel}</a>`;
  }

  public _esc(text: string): string {
    const el = document.createElement("span");
    el.textContent = text;
    return el.innerHTML;
  }
}

export class PaginationRenderer {
  render(total: number, page: number, onChange: (page: number) => void): void {
    const el = document.getElementById("pagination")!;
    const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

    let html = "";
    html += `<button class="btn-page" ${page === 1 ? "disabled" : ""} data-page="${page - 1}">← Prev</button>`;
    html += `<span class="page-info">Page ${page} / ${totalPages} (${total} places)</span>`;
    html += `<button class="btn-page" ${page === totalPages ? "disabled" : ""} data-page="${page + 1}">Next →</button>`;

    el.innerHTML = html;

    el.querySelectorAll(".btn-page").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = Number((btn as HTMLElement).dataset.page);
        if (p >= 1 && p <= totalPages) onChange(p);
      });
    });
  }
}

export class FilterRenderer {
  render(
    districts: string[],
    categories: string[],
    onFilterChange: (key: keyof Filters, value: string) => void
  ): void {
    const searchInput = document.getElementById("search-input") as HTMLInputElement;
    const quanSelect = document.getElementById("filter-quan") as HTMLSelectElement;
    const phanLoaiSelect = document.getElementById("filter-phanloai") as HTMLSelectElement;

    searchInput.addEventListener("input", () => {
      onFilterChange("search", searchInput.value);
    });

    quanSelect.innerHTML =
      `<option value="">All Districts</option>` +
      districts.map((d) => `<option value="${this._esc(d)}">${this._esc(d)}</option>`).join("");
    quanSelect.addEventListener("change", () => {
      onFilterChange("quan", quanSelect.value);
    });

    phanLoaiSelect.innerHTML =
      `<option value="">All Categories</option>` +
      categories.map((c) => `<option value="${this._esc(c)}">${this._esc(c)}</option>`).join("");
    phanLoaiSelect.addEventListener("change", () => {
      onFilterChange("phanLoai", phanLoaiSelect.value);
    });
  }

  private _esc(text: string): string {
    const el = document.createElement("span");
    el.textContent = text;
    return el.innerHTML;
  }
}

export class ModalManager {
  private _categories: string[] = [];

  setCategories(categories: string[]): void {
    this._categories = [...categories].sort();
  }

  show(
    title: string,
    place: Place | null,
    onSave: (data: PlaceFormData) => void,
    onDelete?: (stt: number) => void
  ): void {
    const modal = document.getElementById("modal")!;
    const form = document.getElementById("modal-form") as HTMLFormElement;
    const titleEl = document.getElementById("modal-title")!;

    titleEl.textContent = title;

    (document.getElementById("input-tenQuan") as HTMLInputElement).value = place?.tenQuan ?? "";
    (document.getElementById("input-tenMon") as HTMLInputElement).value = place?.tenMon ?? "";
    (document.getElementById("input-tenDuong") as HTMLInputElement).value = place?.tenDuong ?? "";
    (document.getElementById("input-quan") as HTMLInputElement).value = place?.quan ?? "";
    (document.getElementById("input-gioMoCua") as HTMLInputElement).value = place?.gioMoCua ?? "";
    (document.getElementById("input-khoangGia") as HTMLInputElement).value = place?.khoangGia ?? "";
    (document.getElementById("input-note") as HTMLInputElement).value = place?.note ?? "";

    // ── Phân loại: select dropdown + "Other" custom input ──
    this._setupPhanLoaiSelect(place?.phanLoai ?? "");

    // Show/hide delete button in footer
    const footer = form.querySelector(".modal-footer")!;
    let deleteBtn = footer.querySelector(".btn-delete-modal") as HTMLButtonElement | null;
    if (place && onDelete) {
      if (!deleteBtn) {
        deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn btn-delete-modal";
        deleteBtn.textContent = "🗑️ Delete";
        footer.insertBefore(deleteBtn, footer.firstChild);
      }
      deleteBtn.onclick = () => {
        onDelete(place.stt);
        this.close();
      };
    } else {
      if (deleteBtn) deleteBtn.remove();
    }

    modal.classList.remove("hidden");

    form.onsubmit = (e: Event) => {
      e.preventDefault();
      onSave({
        tenQuan: (document.getElementById("input-tenQuan") as HTMLInputElement).value.trim(),
        tenMon: (document.getElementById("input-tenMon") as HTMLInputElement).value.trim(),
        phanLoai: this._getPhanLoaiValue(),
        tenDuong: (document.getElementById("input-tenDuong") as HTMLInputElement).value.trim(),
        quan: (document.getElementById("input-quan") as HTMLInputElement).value.trim(),
        gioMoCua: (document.getElementById("input-gioMoCua") as HTMLInputElement).value.trim(),
        khoangGia: (document.getElementById("input-khoangGia") as HTMLInputElement).value.trim(),
        note: (document.getElementById("input-note") as HTMLInputElement).value.trim(),
      });
      this.close();
    };
  }

  close(): void {
    document.getElementById("modal")!.classList.add("hidden");
  }

  private _setupPhanLoaiSelect(currentValue: string): void {
    const select = document.getElementById("select-phanLoai") as HTMLSelectElement;
    const customRow = document.getElementById("custom-phanloai-row")!;
    const customInput = document.getElementById("input-phanLoai-custom") as HTMLInputElement;

    // Build options: existing categories + "Other"
    let options = '<option value="">-- Chọn nhóm món --</option>';
    for (const cat of this._categories) {
      const sel = cat === currentValue ? " selected" : "";
      options += `<option value="${this._escAttr(cat)}"${sel}>${this._escHtml(cat)}</option>`;
    }
    options += '<option value="__other__">Khác (thêm mới)...</option>';
    select.innerHTML = options;

    // Determine initial state
    const isExisting = this._categories.includes(currentValue);
    const isOther = currentValue !== "" && !isExisting;

    if (isOther) {
      select.value = "__other__";
      customInput.value = currentValue;
      customRow.classList.remove("hidden-custom");
    } else {
      customInput.value = "";
      customRow.classList.add("hidden-custom");
    }

    select.onchange = () => {
      if (select.value === "__other__") {
        customRow.classList.remove("hidden-custom");
        customInput.focus();
      } else {
        customRow.classList.add("hidden-custom");
        customInput.value = "";
      }
    };
  }

  private _getPhanLoaiValue(): string {
    const select = document.getElementById("select-phanLoai") as HTMLSelectElement;
    if (select.value === "__other__") {
      return (document.getElementById("input-phanLoai-custom") as HTMLInputElement).value.trim();
    }
    return select.value;
  }

  private _escAttr(text: string): string {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  private _escHtml(text: string): string {
    const el = document.createElement("span");
    el.textContent = text;
    return el.innerHTML;
  }
}
