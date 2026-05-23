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

export class TableRenderer {
  render(
    places: Place[],
    page: number,
    onEdit: (place: Place) => void,
    onDelete: (stt: number) => void
  ): void {
    const tbody = document.getElementById("table-body")!;
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = places.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="empty-msg">No places found.</td></tr>`;
    } else {
      tbody.innerHTML = pageItems
        .map(
          (p, i) => `
      <tr>
        <td data-label="#">${start + i + 1}</td>
        <td data-label="Tên quán" class="col-name">${this._esc(p.tenQuan)}</td>
        <td data-label="Tên món">${this._esc(p.tenMon)}</td>
        <td data-label="Phân loại"><span class="tag">${this._esc(p.phanLoai)}</span></td>
        <td data-label="Đường">${this._esc(p.tenDuong)}</td>
        <td data-label="Quận">${this._esc(p.quan)}</td>
        <td data-label="Giờ mở cửa">${this._esc(p.gioMoCua)}</td>
        <td data-label="Giá">${this._esc(p.khoangGia)}</td>
        <td data-label="Note" class="col-note">${this._esc(p.note)}</td>
        <td data-label="" class="col-actions">
          <button class="btn-icon btn-edit" data-stt="${p.stt}" title="Edit">✏️</button>
          <button class="btn-icon btn-delete" data-stt="${p.stt}" title="Delete">🗑️</button>
        </td>
      </tr>`
        )
        .join("");
    }

    tbody.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const stt = Number((btn as HTMLElement).dataset.stt);
        const place = places.find((p) => p.stt === stt);
        if (place) onEdit(place);
      });
    });

    tbody.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const stt = Number((btn as HTMLElement).dataset.stt);
        if (confirm("Delete this place?")) onDelete(stt);
      });
    });
  }

  private _esc(text: string): string {
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
  show(title: string, place: Place | null, onSave: (data: PlaceFormData) => void): void {
    const modal = document.getElementById("modal")!;
    const form = document.getElementById("modal-form") as HTMLFormElement;
    const titleEl = document.getElementById("modal-title")!;

    titleEl.textContent = title;

    (document.getElementById("input-tenQuan") as HTMLInputElement).value = place?.tenQuan ?? "";
    (document.getElementById("input-tenMon") as HTMLInputElement).value = place?.tenMon ?? "";
    (document.getElementById("input-phanLoai") as HTMLInputElement).value = place?.phanLoai ?? "";
    (document.getElementById("input-tenDuong") as HTMLInputElement).value = place?.tenDuong ?? "";
    (document.getElementById("input-quan") as HTMLInputElement).value = place?.quan ?? "";
    (document.getElementById("input-gioMoCua") as HTMLInputElement).value = place?.gioMoCua ?? "";
    (document.getElementById("input-khoangGia") as HTMLInputElement).value = place?.khoangGia ?? "";
    (document.getElementById("input-note") as HTMLInputElement).value = place?.note ?? "";

    modal.classList.remove("hidden");

    form.onsubmit = (e: Event) => {
      e.preventDefault();
      onSave({
        tenQuan: (document.getElementById("input-tenQuan") as HTMLInputElement).value.trim(),
        tenMon: (document.getElementById("input-tenMon") as HTMLInputElement).value.trim(),
        phanLoai: (document.getElementById("input-phanLoai") as HTMLInputElement).value.trim(),
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
}