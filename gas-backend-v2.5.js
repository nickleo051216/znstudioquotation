/**
 * ZN Studio 報價管理系統 - 完整後端腳本 (v2.5 服務產品庫同步版)
 * 
 * 📌 更新日誌：
 *    v2.5: 新增服務產品庫同步功能 (readServices / saveService / deleteService)
 *    v2.4: 新增客戶資料同步功能 (saveCustomer / deleteCustomer)
 *    v2.3: 新增備註模板同步功能 (doGet 讀取 + doPost 寫入/刪除)
 *    v2.2: 加入 trim() 去除前後空白，解決比對失敗問題
 * 
 * 📌 部署方式：
 *    1. 複製此內容取代 Apps Script 編輯器中的所有程式碼
 *    2. 點選「部署」>「管理部署」
 *    3. 點擊編輯圖示 (✏️) > 版本選「建立新版本」
 *    4. 點擊「部署」
 */

const SHEET_NAMES = {
    QUOTES: "報價單",
    ITEMS: "報價項目",
    MILESTONES: "期程里程碑",
    CUSTOMERS: "客戶資料",
    NOTES_TEMPLATES: "備註模板",
    SERVICES: "服務產品庫"
};

// ─── Webhook 處理 (GET: 讀取, POST: 寫入/刪除) ───

function doGet(e) {
    const action = e?.parameter?.action || "read_notes_templates";

    if (action === "read_notes_templates") {
        return readNotesTemplates();
    }

    if (action === "read_services") {
        return readServices();
    }

    return sendResponse({ success: false, error: "Unknown GET action" });
}

function doPost(e) {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
        return sendResponse({ success: false, error: "Server busy, please try again." });
    }

    try {
        if (!e || !e.postData || !e.postData.contents) {
            return sendResponse({ success: false, error: "No data received" });
        }

        const data = JSON.parse(e.postData.contents);

        // 檢查操作類型
        if (data.action === "delete_quote") {
            const result = deleteQuoteAndRelatedData(data.id);
            return sendResponse({ success: true, message: "Deleted successfully", deleted: result, targetId: data.id });
        }

        // 客戶資料操作 (id 以 C 開頭，或有 name + contact)
        if (data.id?.startsWith?.("C") || (data.name && data.contact)) {
            if (data._delete) {
                return deleteCustomer(data);
            }
            return saveCustomer(data);
        }

        // 服務產品庫操作 (id 以 s 開頭，或有 name + unit + price)
        if (data.id?.startsWith?.("s") || (data.name && data.unit && data.price !== undefined)) {
            if (data._delete) {
                return deleteService(data);
            }
            return saveService(data);
        }

        // 備註模板操作
        if (data.action === "save_note_template" || data.label) {
            if (data._delete) {
                return deleteNoteTemplate(data);
            }
            return saveNoteTemplate(data);
        }

        return sendResponse({ success: false, error: "Unknown action" });
    } catch (err) {
        return sendResponse({ success: false, error: err.toString() });
    } finally {
        lock.releaseLock();
    }
}

// ─── 客戶資料相關函數 ───

function saveCustomer(customer) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);

    if (!sheet) {
        return sendResponse({ success: false, error: "客戶資料工作表不存在" });
    }

    const id = String(customer.id || "").trim();
    const name = String(customer.name || "").trim();
    const contact = String(customer.contact || "").trim();
    const phone = String(customer.phone || "").trim();
    const email = String(customer.email || "").trim();
    const address = String(customer.address || "").trim();
    const taxId = String(customer.taxId || "").trim();
    const notes = String(customer.notes || "").trim();
    const createdAt = String(customer.createdAt || "").trim();

    if (!id || !name) {
        return sendResponse({ success: false, error: "Missing id or name" });
    }

    // 檢查是否已存在（用於更新）
    const lastRow = sheet.getLastRow();
    let existingRow = -1;

    if (lastRow >= 3) {
        const ids = sheet.getRange(3, 1, lastRow - 2, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
            if (String(ids[i][0]).trim() === id) {
                existingRow = i + 3;
                break;
            }
        }
    }

    const rowData = [id, name, contact, phone, email, address, taxId, notes, createdAt];

    if (existingRow > 0) {
        // 更新現有資料
        sheet.getRange(existingRow, 1, 1, 9).setValues([rowData]);
        return sendResponse({ success: true, message: "Customer updated", id: id });
    } else {
        // 新增資料
        sheet.appendRow(rowData);
        return sendResponse({ success: true, message: "Customer created", id: id });
    }
}

function deleteCustomer(customer) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.CUSTOMERS);

    if (!sheet) {
        return sendResponse({ success: true, message: "Sheet not found, nothing to delete" });
    }

    const targetId = String(customer.id || "").trim();
    if (!targetId) {
        return sendResponse({ success: false, error: "Missing id" });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 3) {
        return sendResponse({ success: true, message: "No data to delete" });
    }

    const ids = sheet.getRange(3, 1, lastRow - 2, 1).getValues();
    let deleted = 0;

    for (let i = ids.length - 1; i >= 0; i--) {
        if (String(ids[i][0]).trim() === targetId) {
            sheet.deleteRow(i + 3);
            deleted++;
        }
    }

    return sendResponse({ success: true, message: "Customer deleted", deleted: deleted });
}

// ─── 服務產品庫相關函數 ───

function readServices() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.SERVICES);

    if (!sheet) {
        return sendResponse({ success: true, data: [] });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 3) {
        return sendResponse({ success: true, data: [] });
    }

    const data = sheet.getRange(3, 1, lastRow - 2, 5).getValues();
    const services = data
        .filter(row => row[0] && row[1])
        .map(row => ({
            id: String(row[0]).trim(),
            name: String(row[1]).trim(),
            desc: String(row[2]).trim(),
            unit: String(row[3]).trim(),
            price: Number(row[4]) || 0
        }));

    return sendResponse({ success: true, data: services });
}

function saveService(service) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.SERVICES);

    if (!sheet) {
        sheet = createServicesSheet(ss);
    }

    const id = String(service.id || "").trim();
    const name = String(service.name || "").trim();
    const desc = String(service.desc || "").trim();
    const unit = String(service.unit || "式").trim();
    const price = Number(service.price) || 0;

    if (!id || !name) {
        return sendResponse({ success: false, error: "Missing id or name" });
    }

    const lastRow = sheet.getLastRow();
    let existingRow = -1;

    if (lastRow >= 3) {
        const ids = sheet.getRange(3, 1, lastRow - 2, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
            if (String(ids[i][0]).trim() === id) {
                existingRow = i + 3;
                break;
            }
        }
    }

    const rowData = [id, name, desc, unit, price];

    if (existingRow > 0) {
        sheet.getRange(existingRow, 1, 1, 5).setValues([rowData]);
        return sendResponse({ success: true, message: "Service updated", id: id });
    } else {
        sheet.appendRow(rowData);
        return sendResponse({ success: true, message: "Service created", id: id });
    }
}

function deleteService(service) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.SERVICES);

    if (!sheet) {
        return sendResponse({ success: true, message: "Sheet not found, nothing to delete" });
    }

    const targetId = String(service.id || "").trim();
    if (!targetId) {
        return sendResponse({ success: false, error: "Missing id" });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 3) {
        return sendResponse({ success: true, message: "No data to delete" });
    }

    const ids = sheet.getRange(3, 1, lastRow - 2, 1).getValues();
    let deleted = 0;

    for (let i = ids.length - 1; i >= 0; i--) {
        if (String(ids[i][0]).trim() === targetId) {
            sheet.deleteRow(i + 3);
            deleted++;
        }
    }

    return sendResponse({ success: true, message: "Service deleted", deleted: deleted });
}

function createServicesSheet(ss) {
    const ws = ss.insertSheet(SHEET_NAMES.SERVICES);
    ws.setTabColor("#10B981");

    ws.getRange("A1:E1").merge()
        .setValue("📦 服務產品庫 Services Library")
        .setFontSize(14).setFontWeight("bold")
        .setBackground("#D1FAE5")
        .setHorizontalAlignment("center").setVerticalAlignment("middle");
    ws.setRowHeight(1, 40);

    const headers = ["服務ID", "服務名稱", "說明", "單位", "單價"];
    ws.getRange(2, 1, 1, headers.length).setValues([headers])
        .setFontWeight("bold").setFontColor("#FFFFFF")
        .setBackground("#10B981")
        .setBorder(true, true, true, true, true, true, "#D1D5DB", SpreadsheetApp.BorderStyle.SOLID);

    ws.setColumnWidth(1, 100);
    ws.setColumnWidth(2, 200);
    ws.setColumnWidth(3, 300);
    ws.setColumnWidth(4, 80);
    ws.setColumnWidth(5, 100);
    ws.setFrozenRows(2);

    return ws;
}

// ─── 備註模板相關函數 ───

function readNotesTemplates() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.NOTES_TEMPLATES);

    if (!sheet) {
        return sendResponse({ success: true, data: [] });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 3) { // 第1行是標題列，第2行是欄位名稱
        return sendResponse({ success: true, data: [] });
    }

    const data = sheet.getRange(3, 1, lastRow - 2, 3).getValues();
    const templates = data
        .filter(row => row[0] && row[1]) // 過濾空行
        .map(row => ({
            id: String(row[0]).trim(),
            label: String(row[1]).trim(),
            text: String(row[2]).trim()
        }));

    return sendResponse({ success: true, data: templates });
}

function saveNoteTemplate(template) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAMES.NOTES_TEMPLATES);

    // 如果工作表不存在，建立它
    if (!sheet) {
        sheet = createNotesTemplateSheet(ss);
    }

    const id = String(template.id || "").trim();
    const label = String(template.label || "").trim();
    const text = String(template.text || "").trim();

    if (!id || !label) {
        return sendResponse({ success: false, error: "Missing id or label" });
    }

    // 檢查是否已存在（用於更新）
    const lastRow = sheet.getLastRow();
    let existingRow = -1;

    if (lastRow >= 3) {
        const ids = sheet.getRange(3, 1, lastRow - 2, 1).getValues();
        for (let i = 0; i < ids.length; i++) {
            if (String(ids[i][0]).trim() === id) {
                existingRow = i + 3; // 加上標題和欄位名稱的 2 行，再加 1 因為陣列從 0 開始
                break;
            }
        }
    }

    if (existingRow > 0) {
        // 更新現有資料
        sheet.getRange(existingRow, 1, 1, 3).setValues([[id, label, text]]);
    } else {
        // 新增資料
        sheet.appendRow([id, label, text]);
    }

    return sendResponse({ success: true, message: "Note template saved", id: id });
}

function deleteNoteTemplate(template) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.NOTES_TEMPLATES);

    if (!sheet) {
        return sendResponse({ success: true, message: "Sheet not found, nothing to delete" });
    }

    const targetId = String(template.id || "").trim();
    if (!targetId) {
        return sendResponse({ success: false, error: "Missing id" });
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 3) {
        return sendResponse({ success: true, message: "No data to delete" });
    }

    const ids = sheet.getRange(3, 1, lastRow - 2, 1).getValues();
    let deleted = 0;

    // 從後往前刪除
    for (let i = ids.length - 1; i >= 0; i--) {
        if (String(ids[i][0]).trim() === targetId) {
            sheet.deleteRow(i + 3);
            deleted++;
        }
    }

    return sendResponse({ success: true, message: "Deleted", deleted: deleted });
}

function createNotesTemplateSheet(ss) {
    const ws = ss.insertSheet(SHEET_NAMES.NOTES_TEMPLATES);
    ws.setTabColor("#EF4444");

    // 標題列
    ws.getRange("A1:C1").merge()
        .setValue("📋 備註模板 Notes Templates")
        .setFontSize(14).setFontWeight("bold")
        .setBackground("#FEE2E2")
        .setHorizontalAlignment("center").setVerticalAlignment("middle");
    ws.setRowHeight(1, 40);

    // 欄位名稱
    const headers = ["模板ID", "模板名稱", "備註內容"];
    ws.getRange(2, 1, 1, headers.length).setValues([headers])
        .setFontWeight("bold").setFontColor("#FFFFFF")
        .setBackground("#EF4444")
        .setBorder(true, true, true, true, true, true, "#D1D5DB", SpreadsheetApp.BorderStyle.SOLID);

    ws.setColumnWidth(1, 100);
    ws.setColumnWidth(2, 180);
    ws.setColumnWidth(3, 600);
    ws.setFrozenRows(2);

    return ws;
}

// ─── 報價單刪除邏輯 (維持原有) ───

function deleteQuoteAndRelatedData(quoteId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const quoteSheet = ss.getSheetByName(SHEET_NAMES.QUOTES);
    const itemSheet = ss.getSheetByName(SHEET_NAMES.ITEMS);
    const msSheet = ss.getSheetByName(SHEET_NAMES.MILESTONES);
    const deletedCounts = { quote: 0, items: 0, milestones: 0 };

    const targetId = String(quoteId).trim();

    if (quoteSheet) {
        deleteRowsByColumnValue(quoteSheet, 0, targetId, (count) => deletedCounts.quote = count);
    }
    if (itemSheet) {
        deleteRowsByColumnValue(itemSheet, 0, targetId, (count) => deletedCounts.items = count);
    }
    if (msSheet) {
        deleteRowsByColumnValue(msSheet, 0, targetId, (count) => deletedCounts.milestones = count);
    }

    return deletedCounts;
}

function deleteRowsByColumnValue(sheet, columnIndex, value, callback) {
    if (!sheet) return;
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    const data = sheet.getRange(1, columnIndex + 1, lastRow, 1).getValues();
    let deleted = 0;

    for (let i = data.length - 1; i >= 1; i--) {
        const cellValue = String(data[i][0]).trim();
        if (cellValue === value) {
            sheet.deleteRow(i + 1);
            deleted++;
        }
    }

    if (callback) callback(deleted);
}

function sendResponse(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

// ─── 資料庫建置邏輯 (維持不變) ───
function setupQuotationDatabase() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const defaultSheet = ss.getSheetByName("工作表1") || ss.getSheetByName("Sheet1");

    createCustomerSheet(ss);
    createQuotationSheet(ss);
    createItemsSheet(ss);
    createMilestonesSheet(ss);
    createNotesTemplateSheet(ss);
    createBankInfoSheet(ss);

    if (defaultSheet && ss.getSheets().length > 1) {
        ss.deleteSheet(defaultSheet);
    }

    ss.rename("ZN Studio 報價管理系統");
    ss.setActiveSheet(ss.getSheets()[0]);
    SpreadsheetApp.getUi().alert("✅ ZN Studio 報價管理系統 建置完成！");
}

function createCustomerSheet(ss) {
    if (ss.getSheetByName("客戶資料")) return;
    const ws = ss.insertSheet("客戶資料");
    ws.setTabColor("#059669");
    ws.getRange("A1:I1").merge().setValue("📋 客戶資料 Customer Database").setFontSize(14).setFontWeight("bold").setBackground("#D1FAE5").setHorizontalAlignment("center").setVerticalAlignment("middle");
    ws.setRowHeight(1, 40);
    const headers = ["客戶編號", "公司名稱", "聯絡人", "電話", "Email", "地址", "統一編號", "備註", "建立日期"];
    ws.getRange(2, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setFontColor("#FFFFFF").setBackground("#059669").setBorder(true, true, true, true, true, true, "#D1D5DB", SpreadsheetApp.BorderStyle.SOLID);
    ws.setFrozenRows(2);
}

function createQuotationSheet(ss) {
    if (ss.getSheetByName("報價單")) return;
    const ws = ss.insertSheet("報價單");
    ws.setTabColor("#3B82F6");
    ws.getRange("A1:O1").merge().setValue("📋 報價單 Quotations").setFontSize(14).setFontWeight("bold").setBackground("#DBEAFE").setHorizontalAlignment("center").setVerticalAlignment("middle");
    ws.setRowHeight(1, 40);
    const headers = ["報價單號", "客戶編號", "客戶名稱", "聯絡人", "電話", "Email", "地址", "專案名稱", "專案類型", "稅率(%)", "狀態", "建立日期", "有效期限", "付款條件", "備註"];
    ws.getRange(2, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setFontColor("#FFFFFF").setBackground("#3B82F6").setBorder(true, true, true, true, true, true, "#D1D5DB", SpreadsheetApp.BorderStyle.SOLID);
    ws.setFrozenRows(2);
}

function createItemsSheet(ss) {
    if (ss.getSheetByName("報價項目")) return;
    const ws = ss.insertSheet("報價項目");
    ws.setTabColor("#F59E0B");
    ws.getRange("A1:G1").merge().setValue("📋 報價項目 Quotation Items").setFontSize(14).setFontWeight("bold").setBackground("#FEF3C7").setHorizontalAlignment("center").setVerticalAlignment("middle");
    ws.setRowHeight(1, 40);
    const headers = ["報價單號", "項目名稱", "說明", "數量", "單位", "單價", "小計"];
    ws.getRange(2, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setFontColor("#FFFFFF").setBackground("#F59E0B").setBorder(true, true, true, true, true, true, "#D1D5DB", SpreadsheetApp.BorderStyle.SOLID);
    ws.setFrozenRows(2);
}

function createMilestonesSheet(ss) {
    if (ss.getSheetByName("期程里程碑")) return;
    const ws = ss.insertSheet("期程里程碑");
    ws.setTabColor("#8B5CF6");
    ws.getRange("A1:D1").merge().setValue("📋 期程里程碑 Project Milestones").setFontSize(14).setFontWeight("bold").setBackground("#EDE9FE").setHorizontalAlignment("center").setVerticalAlignment("middle");
    ws.setRowHeight(1, 40);
    const headers = ["報價單號", "週次", "里程碑標題", "工作項目"];
    ws.getRange(2, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setFontColor("#FFFFFF").setBackground("#8B5CF6").setBorder(true, true, true, true, true, true, "#D1D5DB", SpreadsheetApp.BorderStyle.SOLID);
    ws.setFrozenRows(2);
}

function createBankInfoSheet(ss) {
    if (ss.getSheetByName("匯款資訊")) return;
    const ws = ss.insertSheet("匯款資訊");
    ws.setTabColor("#0EA5E9");
    ws.getRange("A1:D1").merge().setValue("🏦 匯款資訊 Bank Transfer Info").setFontSize(14).setFontWeight("bold").setBackground("#E0F2FE").setHorizontalAlignment("center").setVerticalAlignment("middle");
    ws.setRowHeight(1, 40);
    const labels = [["", "欄位", "值", "說明"], ["1", "銀行名稱", "台新國際商業銀行", ""], ["2", "銀行代碼", "812", ""], ["3", "分行名稱", "板橋分行", ""], ["4", "戶名", "Nick Chang", ""], ["5", "帳號", "", ""]];
    ws.getRange(2, 1, 1, 4).setValues([labels[0]]).setFontWeight("bold").setFontColor("#FFFFFF").setBackground("#0EA5E9");
    ws.setFrozenRows(2);
}

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu("⚡ ZN Studio")
        .addItem("🔄 重新建立所有工作表", "setupQuotationDatabase")
        .addItem("📊 查看報價統計", "showStats")
        .addItem("ℹ️ 關於系統", "showAbout")
        .addToUi();
}

function showStats() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const quotesSheet = ss.getSheetByName("報價單");
    const lastRow = quotesSheet ? quotesSheet.getLastRow() : 0;
    SpreadsheetApp.getUi().alert(`📋 報價單總數：${Math.max(0, lastRow - 2)}`);
}

function showAbout() {
    SpreadsheetApp.getUi().alert("ZN Studio 報價管理系統 v2.3\n\n新增：備註模板雲端同步功能");
}
