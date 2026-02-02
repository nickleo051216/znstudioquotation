# ZN Studio 報價系統

> 一套完整的 SaaS 風格報價管理系統，專為 ZN Studio AI 自動化顧問服務設計。

![ZN Studio](https://img.shields.io/badge/ZN%20Studio-報價系統-059669?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwindcss)

## 🌐 線上網址

**https://znstudioquotation.zeabur.app/**

---

## 📊 專案進度

| Phase | 任務 | 工具 | 狀態 |
|-------|------|------|------|
| **Phase 1** | Google Sheets 資料庫 | GAS | ✅ 完成 |
| **Phase 2** | n8n Webhook API | n8n v2.2.5 | ✅ 完成 |
| **Phase 3** | Zeabur 部署 | Vite + React | ✅ 完成 |
| **Phase 4** | LINE Bot 整合 | n8n + LINE OA | ⏳ 待開發 |

---

## ✨ 功能特色

### 📊 儀表板
- 總報價單數、成交金額、待確認金額、成交率
- 月度趨勢圖（Recharts）
- 狀態分佈圓餅圖

### 📋 報價單管理
- CRUD 操作（建立/讀取/編輯/刪除）
- 動態新增報價項目
- 自動計算小計 + 稅額 + 總計
- 專案期程里程碑

### 👁️ 報價單預覽
- 專業版面設計（ZN Studio 品牌綠色漸層 header）
- 客戶/報價資訊 + 項目表格 + 付款條件 + 簽章區
- 支援列印 / PDF

### 👥 客戶管理
- 新增/編輯/搜尋客戶
- 建立報價時可直接選擇客戶自動帶入

### ⚙️ 系統設定
- 預設匯款資訊設定
- 備註模板管理（8 組常用備註）
- n8n Webhook URL 顯示

---

## 🔗 API 整合

### n8n Webhook URL

| 功能 | Method | URL |
|------|--------|-----|
| 讀取報價單 | GET | `https://nickleo9.zeabur.app/webhook/read-quotes` |
| 寫入報價單 | POST | `https://nickleo9.zeabur.app/webhook/write-quote` |
| 讀取客戶 | GET | `https://nickleo9.zeabur.app/webhook/read-customers` |
| 寫入客戶 | POST | `https://nickleo9.zeabur.app/webhook/write-customer` |
| 寄送報價單 | POST | `https://nickleo9.zeabur.app/webhook/send-email` |
| 統編查詢 | GET | `https://nickleo9.zeabur.app/webhook/lookup-taxid` |

### Google Sheets

- **Sheets ID**: `1Pq_VC4zCot3vcVNo0eeZdKxfD-DkTLlYKAJd8am-Zfs`
- **工作表**: 客戶資料、報價單、報價項目、期程里程碑、備註模板、匯款資訊

---

## 🛠️ 技術棧

- **Frontend**: React 18 + Vite 6
- **Styling**: Tailwind CSS 3
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: n8n Webhook → Google Sheets
- **Hosting**: Zeabur

---

## 🚀 開發

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 建置
npm run build

# 預覽
npm run preview
```

---

## 📁 專案結構

```
zn-quotation-system/
├── src/
│   ├── App.jsx          # 報價系統主程式 (1070 行)
│   ├── main.jsx         # React 入口
│   └── index.css        # Tailwind + 自訂樣式
├── public/vite.svg      # ZN Studio favicon
├── index.html           # HTML 入口
├── package.json         # 依賴設定
├── vite.config.js       # Vite 設定
├── tailwind.config.js   # Tailwind 設定
├── zbpack.json          # Zeabur 部署設定
└── README.md            # 說明文件
```

---

## 👤 作者

**Nick Chang | ZN Studio**

- 📧 Email: nickleo051216@gmail.com
- 📱 Phone: 0932-684-051
- 🌐 Website: https://portaly.cc/zn.studio
- 💬 Threads: @nickai216
- 👥 LINE 社群: https://reurl.cc/1OZNAY

---

## 📄 License

MIT © 2026 ZN Studio
