/**
 * Food Tour SG - Google Apps Script Web App
 *
 * Setup:
 * 1. Open Google Sheets with your imported data
 * 2. Extensions → Apps Script
 * 3. Paste this entire file
 * 4. Deploy → New Deployment → Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone (or Anyone with link)
 * 5. Copy the deployment URL → set it as GOOGLE_SHEET_API_URL in frontend
 *
 * Sheet format (first row = headers):
 * STT | Tên quán | Tên món | Phân loại món | Tên đường | Quận | Giờ mở cửa | Khoảng giá | Note
 */

const SHEET_NAME = "HCM";

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getColumnIndices_(headers) {
  return {
    stt: headers.indexOf("STT"),
    tenQuan: headers.indexOf("Tên quán"),
    tenMon: headers.indexOf("Tên món"),
    phanLoai: headers.indexOf("Phân loại món"),
    tenDuong: headers.indexOf("Tên đường"),
    quan: headers.indexOf("Quận"),
    gioMoCua: headers.indexOf("Giờ mở cửa"),
    khoangGia: headers.indexOf("Khoảng giá"),
    note: headers.indexOf("Note"),
  };
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = e.parameter.action;
  const sheet = getSheet_();

  if (!sheet) {
    return response_(null, "Sheet not found: " + SHEET_NAME, 404);
  }

  try {
    switch (action) {
      case "list":
        return getPlaces_(sheet);
      case "add":
        return addPlace_(sheet, e);
      case "update":
        return updatePlace_(sheet, e);
      case "delete":
        return deletePlace_(sheet, e);
      default:
        return response_(null, "Unknown action: " + action, 400);
    }
  } catch (err) {
    return response_(null, err.message, 500);
  }
}

function getPlaces_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return response_([], "ok");

  const headers = data[0];
  const cols = getColumnIndices_(headers);

  const places = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[cols.stt]) continue;
    places.push({
      stt: row[cols.stt],
      tenQuan: row[cols.tenQuan] || "",
      tenMon: row[cols.tenMon] || "",
      phanLoai: row[cols.phanLoai] || "",
      tenDuong: row[cols.tenDuong] || "",
      quan: row[cols.quan] || "",
      gioMoCua: row[cols.gioMoCua] || "",
      khoangGia: row[cols.khoangGia] || "",
      note: row[cols.note] || "",
    });
  }

  return response_(places);
}

function addPlace_(sheet, e) {
  const place = JSON.parse(e.parameter.data);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const cols = getColumnIndices_(headers);

  // Auto-increment STT
  let maxStt = 0;
  for (let i = 1; i < data.length; i++) {
    const stt = Number(data[i][cols.stt]);
    if (stt > maxStt) maxStt = stt;
  }
  const newStt = maxStt + 1;

  const newRow = new Array(headers.length).fill("");
  newRow[cols.stt] = newStt;
  newRow[cols.tenQuan] = place.tenQuan || "";
  newRow[cols.tenMon] = place.tenMon || "";
  newRow[cols.phanLoai] = place.phanLoai || "";
  newRow[cols.tenDuong] = place.tenDuong || "";
  newRow[cols.quan] = place.quan || "";
  newRow[cols.gioMoCua] = place.gioMoCua || "";
  newRow[cols.khoangGia] = place.khoangGia || "";
  newRow[cols.note] = place.note || "";

  sheet.appendRow(newRow);
  return response_({ stt: newStt }, "Place added", 201);
}

function updatePlace_(sheet, e) {
  const place = JSON.parse(e.parameter.data);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const cols = getColumnIndices_(headers);

  const sttCol = cols.stt + 1; // 1-indexed
  const textFinder = sheet
    .getRange(1, sttCol, sheet.getLastRow(), 1)
    .createTextFinder(String(place.stt))
    .matchEntireCell(true);

  const match = textFinder.findNext();
  if (!match) {
    return response_(null, "Place not found: STT=" + place.stt, 404);
  }

  const rowIdx = match.getRow();
  sheet.getRange(rowIdx, cols.tenQuan + 1).setValue(place.tenQuan || "");
  sheet.getRange(rowIdx, cols.tenMon + 1).setValue(place.tenMon || "");
  sheet.getRange(rowIdx, cols.phanLoai + 1).setValue(place.phanLoai || "");
  sheet.getRange(rowIdx, cols.tenDuong + 1).setValue(place.tenDuong || "");
  sheet.getRange(rowIdx, cols.quan + 1).setValue(place.quan || "");
  sheet.getRange(rowIdx, cols.gioMoCua + 1).setValue(place.gioMoCua || "");
  sheet.getRange(rowIdx, cols.khoangGia + 1).setValue(place.khoangGia || "");
  sheet.getRange(rowIdx, cols.note + 1).setValue(place.note || "");

  return response_(place, "Place updated");
}

function deletePlace_(sheet, e) {
  const stt = Number(e.parameter.stt);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const cols = getColumnIndices_(headers);

  const sttCol = cols.stt + 1;
  const textFinder = sheet
    .getRange(1, sttCol, sheet.getLastRow(), 1)
    .createTextFinder(String(stt))
    .matchEntireCell(true);

  const match = textFinder.findNext();
  if (!match) {
    return response_(null, "Place not found: STT=" + stt, 404);
  }

  sheet.deleteRow(match.getRow());
  return response_({ stt }, "Place deleted");
}

function response_(data, message = "ok", status = 200) {
  const result = {
    success: status >= 200 && status < 300,
    message: message,
    data: data || [],
  };
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}