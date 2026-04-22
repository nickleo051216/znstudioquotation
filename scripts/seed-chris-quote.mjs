import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, query, orderBy, limit, setDoc, serverTimestamp } from 'firebase/firestore';

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
    { id: "I5", name: "上線啟用與交接 briefing", desc: "線上 1 小時 Google Sheets 填表教學（行程提醒、成員對照表維護）；系統由 ZN Studio 全程代管，業主僅需維護資料內容", qty: 1, unit: "小時", price: 2500 },
  ],
  taxRate: 5,
  notes: "• 系統正式上線後提供 14 天密集保固期，此期間內的 Bug 修正完全免費。\n• 另收系統代管維護月費 NT$3,500/月（含主機分攤、AI API 成本、無限筆行程發送、每月一般修改調整、24 小時內優先回應）。\n• 綁約 12 個月一次付款享 9 折優惠：NT$37,800/年（原價 NT$42,000）。\n• 大型改動（新增 workflow、整合其他服務）另案報價。\n• 系統由 ZN Studio 全程代管，業主僅需維護 Google Sheets 資料內容。n8n 工作流程、GAS 原始碼、Flex 訊息版型歸 ZN Studio 所有，不隨建置交付。\n• 若服務終止，ZN Studio 將協助移交 LINE OA 憑證與 Google Sheets 資料（CSV 匯出），確保業主業務不中斷。\n• 若業主未來需要完整程式碼，可另案加購「原始碼轉移包」NT$8,000（含 n8n workflow JSON、GAS 腳本、技術文件）。\n• 本報價單自發出日起 30 天內有效，逾期需重新報價。",
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

const isCompleteBank = (b) =>
  b && b.bankName && b.bankCode && b.accountNumber;

let liveBank = null;
let bankSource = "";

console.log("Step 1/2: reading latest existing quote for bankInfo...");
try {
  const qs = await getDocs(
    query(collection(db, "quotations"), orderBy("createdAt", "desc"), limit(10))
  );
  for (const d of qs.docs) {
    if (d.id === "ZN-2026-004") continue;
    const data = d.data();
    if (isCompleteBank(data.bankInfo)) {
      liveBank = data.bankInfo;
      bankSource = `quotations/${d.id}`;
      break;
    }
  }
} catch (e) {
  console.log("  (failed to read quotations:", e.message, ")");
}

if (!liveBank) {
  console.log("Step 2/2: fallback to settings/global...");
  const settingsSnap = await getDoc(doc(db, "settings", "global"));
  if (settingsSnap.exists() && isCompleteBank(settingsSnap.data().bankInfo)) {
    liveBank = settingsSnap.data().bankInfo;
    bankSource = "settings/global";
  }
}

if (!liveBank) {
  liveBank = DEFAULT_BANK;
  bankSource = "DEFAULT_BANK (hardcoded fallback)";
}

console.log("bankInfo source:", bankSource);
console.log("bankInfo:", liveBank);

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
