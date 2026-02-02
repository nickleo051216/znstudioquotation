# ZN Studio 報價系統

一套完整的 SaaS 風格報價管理系統，專為 ZN Studio AI 自動化顧問服務設計。

## 功能特色

- 📊 **儀表板** — 總報價單數、成交金額、月度趨勢圖、狀態分佈圓餅圖
- 📋 **報價單管理** — CRUD、動態項目計算、專案期程里程碑
- 👁️ **報價單預覽** — 專業版面設計，支援列印/PDF
- 👥 **客戶管理** — 新增/編輯客戶，建立報價時自動帶入
- ⚙️ **API 整合** — n8n Webhook 串接 Google Sheets

## 技術棧

- React 18 + Vite
- Tailwind CSS
- Recharts (圖表)
- Lucide React (圖示)

## 開發

```bash
npm install
npm run dev
```

## 部署

本專案已設定 Zeabur 自動部署：

1. Push 到 GitHub
2. 在 Zeabur 建立新服務
3. 選擇 GitHub 儲存庫
4. 自動偵測並部署

## n8n Webhook URL

| 功能 | URL |
|------|-----|
| 讀取報價單 | `/webhook/read-quotes` |
| 寫入報價單 | `/webhook/write-quote` |
| 讀取客戶 | `/webhook/read-customers` |
| 寫入客戶 | `/webhook/write-customer` |
| 寄送報價單 | `/webhook/send-email` |
| 統編查詢 | `/webhook/lookup-taxid` |

## 作者

Nick Chang | ZN Studio
- Email: nickleo051216@gmail.com
- Website: https://portaly.cc/zn.studio
