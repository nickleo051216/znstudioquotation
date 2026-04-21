import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBs0RgULlWdJBf3c2VHRNPkYTSr-XLSv2M",
  authDomain: "znstudioquotation.firebaseapp.com",
  projectId: "znstudioquotation",
  storageBucket: "znstudioquotation.firebasestorage.app",
  messagingSenderId: "615767113104",
  appId: "1:615767113104:web:05b0fd038a8be5c9758715",
  measurementId: "G-9SWV7KXYKM",
};

const DEFAULT_BANK = {
  bankName: "台新國際商業銀行",
  bankCode: "812",
  branchName: "板橋分行",
  accountNumber: "",
  accountName: "張惟荏",
};

const customer = {
  id: "C004",
  name: "CHRIS 影音",
  contact: "CHRIS",
  phone: "",
  email: "",
  address: "",
  taxId: "",
  notes: "短影音自媒體策略；LINE 設備提醒自動化系統",
  createdAt: "2026-04-21",
};

const buildQuote = (bankInfo) => ({
  id: "ZN-2026-004",
  quoteNumber: "ZN-2026-004",
  customerId: "C004",
  clientName: "CHRIS 影音",
  clientContact: "CHRIS",
  clientPhone: "",
  clientEmail: "",
  clientAddress: "",
  projectName: "LINE 設備提醒自動化系統",
  projectType: "n8n 自動化流程建置",
  items: [
    { id: "I1", name: "需求訪談與系統架構設計", desc: "流程盤點、欄位規劃、通知時機設計（前一天 / 一週前）", qty: 1, unit: "式", price: 3000 },
    { id: "I2", name: "Google Sheets + GAS 資料庫建置", desc: "行程提醒 / 成員對照表雙分頁、選單工具、假資料 seed、日期自動重排、狀態重置", qty: 1, unit: "式", price: 3500 },
    { id: "I3", name: "n8n 自動化流程開發", desc: "排程觸發、Sheets 讀取、AI 訊息生成（GPT-4o mini）、LINE textV2 群組 @ 標記、Flex 訊息卡片、狀態回寫", qty: 1, unit: "式", price: 8000 },
    { id: "I4", name: "LINE OA 整合設定", desc: "Channel Access Token 設定、成員 userId 收集、群組標記測試與除錯", qty: 1, unit: "式", price: 3000 },
    { id: "I5", name: "教育訓練 + 操作手冊", desc: "線上 1 小時操作訓練，提供 Sheets 維護手冊與 n8n 工作流程原始檔（JSON）", qty: 1, unit: "小時", price: 2500 },
  ],
  taxRate: 5,
  notes: "• 系統正式上線後提供 14 天密集保固期，此期間內的 Bug 修正完全免費。\n• 另收系統代管維護月費 NT$3,800/月（含主機分攤、AI API 成本、無限筆行程發送、每月一般修改調整、24 小時內優先回應）。\n• 綁約 12 個月一次付款享 9 折優惠：NT$41,040/年（原價 NT$45,600）。\n• 大型改動（新增 workflow、整合其他服務）另案報價。\n• 本報價單自發出日起 30 天內有效，逾期需重新報價。\n• 專案完成後，所有客製化開發之程式碼與工作流程歸業主所有。",
  status: "draft",
  createdAt: "2026-04-21",
  validUntil: "2026-05-21",
  paymentTerms: "簽約 50% / 完成 50%",
  bankInfo,
});

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Signing in anonymously...");
await signInAnonymously(auth);
console.log("Signed in.");

console.log("Reading settings/global for live bankInfo...");
const settingsSnap = await getDoc(doc(db, "settings", "global"));
const liveBank = settingsSnap.exists() && settingsSnap.data().bankInfo
  ? settingsSnap.data().bankInfo
  : DEFAULT_BANK;
console.log("Using bankInfo:", liveBank);

const quote = buildQuote(liveBank);

console.log("Writing customer C004 (CHRIS 影音)...");
await setDoc(doc(db, "customers", "C004"), {
  ...customer,
  updatedAt: serverTimestamp(),
});
console.log("Customer written.");

console.log("Writing quote ZN-2026-004 (CHRIS LINE 設備提醒自動化系統)...");
await setDoc(doc(db, "quotations", "ZN-2026-004"), {
  ...quote,
  createdAt: quote.createdAt,
  updatedAt: serverTimestamp(),
});
console.log("Quote written.");

console.log("\nDone! Firestore now has:");
console.log("  customers/C004");
console.log("  quotations/ZN-2026-004");
process.exit(0);
