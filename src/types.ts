export interface Place {
  stt: number;
  tenQuan: string;
  tenMon: string;
  phanLoai: string;
  tenDuong: string;
  quan: string;
  gioMoCua: string;
  khoangGia: string;
  note: string;
}

export type PlaceFormData = Omit<Place, "stt">;

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Filters {
  search: string;
  quan: string;
  phanLoai: string;
}