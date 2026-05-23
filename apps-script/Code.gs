/**
 * Food Tour SG - Google Apps Script Web App
 *
 * Setup:
 * 1. Open Google Sheets with your imported data
 * 2. Extensions → Apps Script
 * 3. Paste this entire file
 * 4. Deploy → New Deployment → Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the deployment URL → set it as GOOGLE_SCRIPT_URL in frontend
 */

const SHEET_NAME = "HCM";

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

/**
 * Auto-detect column indices by trying multiple header names.
 * Your sheet: # | Tên quán | Tên món | Phân loại | Đường | Quận | Giờ mở cửa | Giá | Note
 */
function getColumnIndices_(headers) {
  return {
    stt:        findCol_(headers, "#", "STT"),
    tenQuan:    findCol_(headers, "Tên quán"),
    tenMon:     findCol_(headers, "Tên món"),
    phanLoai:   findCol_(headers, "Phân loại", "Phân loại món"),
    tenDuong:   findCol_(headers, "Đường", "Tên đường"),
    quan:       findCol_(headers, "Quận"),
    gioMoCua:   findCol_(headers, "Giờ mở cửa"),
    khoangGia:  findCol_(headers, "Giá", "Khoảng giá"),
    note:       findCol_(headers, "Note"),
  };
}

function findCol_(headers, name1, name2) {
  var idx = headers.indexOf(name1);
  if (idx !== -1) return idx;
  if (name2 !== undefined) return headers.indexOf(name2);
  return -1;
}

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";
  var sheet = getSheet_();

  if (!sheet) {
    return response_(null, "Sheet not found: " + SHEET_NAME, 404);
  }

  try {
    switch (action) {
      case "list":   return getPlaces_(sheet);
      case "add":    return addPlace_(sheet, e);
      case "update": return updatePlace_(sheet, e);
      case "delete": return deletePlace_(sheet, e);
      default:       return response_(null, "Unknown action: " + action, 400);
    }
  } catch (err) {
    return response_(null, err.message, 500);
  }
}

function getPlaces_(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return response_([], "ok");

  var headers = data[0];
  var cols = getColumnIndices_(headers);

  var places = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var stt = row[cols.stt];
    if (stt === "" || stt === null || stt === undefined) continue;
    places.push({
      stt:        stt,
      tenQuan:    row[cols.tenQuan]    || "",
      tenMon:     row[cols.tenMon]     || "",
      phanLoai:   row[cols.phanLoai]   || "",
      tenDuong:   row[cols.tenDuong]   || "",
      quan:       row[cols.quan]       || "",
      gioMoCua:   row[cols.gioMoCua]   || "",
      khoangGia:  row[cols.khoangGia]  || "",
      note:       row[cols.note]       || "",
    });
  }
  return response_(places);
}

function addPlace_(sheet, e) {
  var place = JSON.parse(e.parameter.data);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var cols = getColumnIndices_(headers);

  var maxStt = 0;
  for (var i = 1; i < data.length; i++) {
    var stt = Number(data[i][cols.stt]);
    if (stt > maxStt) maxStt = stt;
  }
  var newStt = maxStt + 1;

  var newRow = new Array(headers.length).fill("");
  newRow[cols.stt]        = newStt;
  newRow[cols.tenQuan]    = place.tenQuan    || "";
  newRow[cols.tenMon]     = place.tenMon     || "";
  newRow[cols.phanLoai]   = place.phanLoai   || "";
  newRow[cols.tenDuong]   = place.tenDuong   || "";
  newRow[cols.quan]       = place.quan       || "";
  newRow[cols.gioMoCua]   = place.gioMoCua   || "";
  newRow[cols.khoangGia]  = place.khoangGia  || "";
  newRow[cols.note]       = place.note       || "";

  sheet.appendRow(newRow);
  return response_({ stt: newStt }, "Place added", 201);
}

function updatePlace_(sheet, e) {
  var place = JSON.parse(e.parameter.data);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var cols = getColumnIndices_(headers);

  var sttCol = cols.stt + 1; // 1-indexed for Range
  var textFinder = sheet
    .getRange(1, sttCol, sheet.getLastRow(), 1)
    .createTextFinder(String(place.stt))
    .matchEntireCell(true);

  var match = textFinder.findNext();
  if (!match) {
    return response_(null, "Place not found: STT=" + place.stt, 404);
  }

  var rowIdx = match.getRow();
  sheet.getRange(rowIdx, cols.tenQuan   + 1).setValue(place.tenQuan   || "");
  sheet.getRange(rowIdx, cols.tenMon    + 1).setValue(place.tenMon    || "");
  sheet.getRange(rowIdx, cols.phanLoai  + 1).setValue(place.phanLoai  || "");
  sheet.getRange(rowIdx, cols.tenDuong  + 1).setValue(place.tenDuong  || "");
  sheet.getRange(rowIdx, cols.quan      + 1).setValue(place.quan      || "");
  sheet.getRange(rowIdx, cols.gioMoCua  + 1).setValue(place.gioMoCua  || "");
  sheet.getRange(rowIdx, cols.khoangGia + 1).setValue(place.khoangGia || "");
  sheet.getRange(rowIdx, cols.note      + 1).setValue(place.note      || "");
  return response_(place, "Place updated");
}

function deletePlace_(sheet, e) {
  var stt = Number(e.parameter.stt);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var cols = getColumnIndices_(headers);

  var sttCol = cols.stt + 1;
  var textFinder = sheet
    .getRange(1, sttCol, sheet.getLastRow(), 1)
    .createTextFinder(String(stt))
    .matchEntireCell(true);

  var match = textFinder.findNext();
  if (!match) {
    return response_(null, "Place not found: STT=" + stt, 404);
  }
  sheet.deleteRow(match.getRow());
  return response_({ stt: stt }, "Place deleted");
}

function response_(data, message, status) {
  if (message === undefined) message = "ok";
  if (status === undefined) status = 200;
  var result = {
    success: status >= 200 && status < 300,
    message: message,
    data:    data || [],
  };
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}