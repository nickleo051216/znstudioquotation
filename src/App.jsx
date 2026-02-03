import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  FileText, Users, LayoutDashboard, Settings, Plus, Search, Eye, Edit3,
  Trash2, Send, Copy, ChevronDown, ChevronRight, X, Check, AlertCircle,
  Download, Printer, Phone, Mail, Globe, MessageCircle, ArrowLeft,
  TrendingUp, DollarSign, Clock, CheckCircle, XCircle, Filter, MoreVertical,
  Building2, Hash, MapPin, Calendar, CreditCard, Zap, ExternalLink,
  Landmark, Milestone, BookOpen, ChevronUp, StickyNote
} from "lucide-react";

// ─── Brand Config ───
const BRAND = {
  name: "ZN Studio",
  owner: "Nick Chang",
  email: "nickleo051216@gmail.com",
  phone: "0932-684-051",
  website: "https://znstudio216.com/",
  websiteDisplay: "znstudio216.com",
  threads: "https://www.threads.com/@nickai216",
  threadsHandle: "@nickai216",
  lineGroup: "https://reurl.cc/1OZNAY",
  lineOA: "https://lin.ee/Faz0doj",
  prefix: "ZN",
};

// ─── API Config ───
const API_BASE = "https://nickleo9.zeabur.app/webhook";
const WEBHOOKS = {
  readQuotes: `${API_BASE}/read-quotes`,
  writeQuote: `${API_BASE}/write-quote`,
  readCustomers: `${API_BASE}/read-customers`,
  writeCustomer: `${API_BASE}/write-customer`,
  sendEmail: `${API_BASE}/send-email`,
  lookupTaxId: `${API_BASE}/lookup-taxid`,
};

// ─── API Functions ───
const api = {
  async fetchQuotes() {
    try {
      const res = await fetch(WEBHOOKS.readQuotes);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error("Failed to fetch quotes:", err);
      return [];
    }
  },
  async saveQuote(quote) {
    try {
      const res = await fetch(WEBHOOKS.writeQuote, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quote),
      });
      return await res.json();
    } catch (err) {
      console.error("Failed to save quote:", err);
      return { success: false, error: err.message };
    }
  },
  async fetchCustomers() {
    try {
      const res = await fetch(WEBHOOKS.readCustomers);
      const data = await res.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      return [];
    }
  },
  async saveCustomer(customer) {
    try {
      const res = await fetch(WEBHOOKS.writeCustomer, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });
      return await res.json();
    } catch (err) {
      console.error("Failed to save customer:", err);
      return { success: false, error: err.message };
    }
  },
  async sendQuoteEmail(quote) {
    try {
      const res = await fetch(WEBHOOKS.sendEmail, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quote),
      });
      return await res.json();
    } catch (err) {
      console.error("Failed to send email:", err);
      return { success: false, error: err.message };
    }
  },
  async lookupTaxId(taxId) {
    try {
      const res = await fetch(`${WEBHOOKS.lookupTaxId}?taxId=${taxId}`);
      return await res.json();
    } catch (err) {
      console.error("Failed to lookup taxId:", err);
      return { success: false, error: err.message };
    }
  },
};

// ─── Default Bank Info ───
const DEFAULT_BANK = {
  bankName: "台新國際商業銀行",
  bankCode: "812",
  branchName: "板橋分行",
  accountNumber: "",
  accountName: "Nick Chang",
};

// ─── Status Config ───
const STATUS_CONFIG = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-700", dot: "bg-gray-400", icon: FileText },
  sent: { label: "已寄出", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500", icon: Send },
  accepted: { label: "已接受", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle },
  rejected: { label: "已拒絕", color: "bg-red-100 text-red-700", dot: "bg-red-500", icon: XCircle },
  expired: { label: "已過期", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500", icon: Clock },
};

const PROJECT_TYPES = [
  "LINE OA 智慧客服系統",
  "n8n 自動化流程建置",
  "AI 聊天機器人開發",
  "Google Sheets 自動化",
  "社群自動化管理",
  "教育訓練課程",
  "系統維護方案",
  "客製化開發",
];

const UNITS = ["式", "套", "組", "小時", "天", "月", "堂", "人"];

// ─── Default Notes Templates (備註資料庫) ───
const DEFAULT_NOTES_TEMPLATES = [
  { id: "n1", label: "第三方費用自付", text: "第三方費用（LINE OA 月費、Zeabur 託管費、AI API 費用）由業主信用卡實報實銷，不包含於上述報價中。" },
  { id: "n2", label: "維護免費期", text: "系統正式上線後提供 14 天密集保固期，此期間內的 Bug 修正完全免費。前 3 個月免費維護期（已包含在建置費中），第 4 個月起開始收取月費。" },
  { id: "n3", label: "超時計費", text: "超過每月 2 小時技術支援時數，每小時加收 $2,000。新功能開發需另外評估報價。" },
  { id: "n4", label: "驗收條件", text: "系統交付後 7 個工作日內完成驗收。若甲方於交付後 7 個工作日內未提出異議，視同驗收通過。" },
  { id: "n5", label: "變更單說明", text: "未列於本報價單的功能需求，將視為「新功能開發」，需另外簽署變更單並重新報價。" },
  { id: "n6", label: "教育訓練", text: "含 2 小時線上或實體教育訓練，以及系統操作手冊（PDF 格式）。n8n 工作流程原始檔將完整交付給業主。" },
  { id: "n7", label: "報價有效期", text: "本報價單自發出日起 30 天內有效，逾期需重新報價。" },
  { id: "n8", label: "智慧財產權", text: "專案完成後，所有客製化開發之程式碼與工作流程歸業主所有。ZN Studio 保留將通用技術方案用於其他專案之權利。" },
];

// ─── Sample Data ───
const SAMPLE_CUSTOMERS = [
  { id: "C001", name: "蔬食8", contact: "王老闆", phone: "0912-345-678", email: "veg8@example.com", address: "台北市信義區信義路五段7號", taxId: "12345678", notes: "素食品牌，LINE OA 專案", createdAt: "2026-01-15" },
  { id: "C002", name: "好日子花藝", contact: "林小姐", phone: "0923-456-789", email: "flora@example.com", address: "台北市大安區忠孝東路四段", taxId: "23456789", notes: "花藝工作室", createdAt: "2026-01-20" },
  { id: "C003", name: "晨光咖啡", contact: "陳先生", phone: "0934-567-890", email: "dawn@example.com", address: "新北市板橋區文化路一段", taxId: "34567890", notes: "連鎖咖啡品牌", createdAt: "2026-01-25" },
];

const SAMPLE_QUOTES = [
  {
    id: "Q001", quoteNumber: "ZN-2026-001", customerId: "C001", clientName: "蔬食8", clientContact: "王老闆",
    clientPhone: "0912-345-678", clientEmail: "veg8@example.com", clientAddress: "台北市信義區信義路五段7號",
    projectName: "LINE OA 智慧客服系統", projectType: "LINE OA 智慧客服系統",
    items: [
      { id: "I1", name: "系統架構設計", desc: "含需求分析、流程設計、技術規劃", qty: 1, unit: "式", price: 15000 },
      { id: "I2", name: "n8n 自動化流程開發", desc: "LINE Webhook、AI Agent、訂單管理流程", qty: 1, unit: "式", price: 25000 },
      { id: "I3", name: "AI 知識庫訓練", desc: "Prompt Engineering、商品資料庫、防幻覺機制", qty: 1, unit: "式", price: 15000 },
      { id: "I4", name: "教育訓練", desc: "2小時線上或實體教育訓練", qty: 2, unit: "小時", price: 5000 },
    ],
    milestones: [
      { id: "m1", week: "Week 1", title: "需求確認與環境設定", tasks: "深度需求訪談、LINE OA 環境設定、商品資料庫建立" },
      { id: "m2", week: "Week 2", title: "AI 訓練與流程開發", tasks: "Prompt 設計、意圖識別建置、n8n 流程開發" },
      { id: "m3", week: "Week 3", title: "功能整合與測試", tasks: "訂單系統串接、真人客服轉接、壓力測試" },
      { id: "m4", week: "Week 4", title: "驗收、上線與教學", tasks: "UAT 測試、正式上線、操作手冊交付" },
    ],
    taxRate: 5,
    notes: "第三方費用（LINE OA 月費、Zeabur 託管費、AI API 費用）由業主信用卡實報實銷，不包含於上述報價中。",
    status: "sent",
    createdAt: "2026-02-02", validUntil: "2026-03-02",
    paymentTerms: "簽約 40% / 驗收 30% / 上線 30%",
    bankInfo: { ...DEFAULT_BANK },
  },
  {
    id: "Q002", quoteNumber: "ZN-2026-002", customerId: "C002", clientName: "好日子花藝", clientContact: "林小姐",
    clientPhone: "0923-456-789", clientEmail: "flora@example.com", clientAddress: "台北市大安區忠孝東路四段",
    projectName: "LINE OA 訂花機器人", projectType: "AI 聊天機器人開發",
    items: [
      { id: "I1", name: "LINE OA 機器人開發", desc: "自動接單、花束推薦、預約系統", qty: 1, unit: "套", price: 35000 },
      { id: "I2", name: "Google Sheets 訂單系統", desc: "自動記錄訂單、庫存管理", qty: 1, unit: "式", price: 12000 },
    ],
    milestones: [
      { id: "m1", week: "Week 1", title: "需求訪談與架構設計", tasks: "功能確認、花束品項整理" },
      { id: "m2", week: "Week 2", title: "開發與測試", tasks: "機器人開發、訂單系統串接" },
      { id: "m3", week: "Week 3", title: "驗收上線", tasks: "UAT、正式上線、教育訓練" },
    ],
    taxRate: 5, notes: "", status: "accepted",
    createdAt: "2026-01-20", validUntil: "2026-02-20",
    paymentTerms: "簽約 50% / 完成 50%",
    bankInfo: { ...DEFAULT_BANK },
  },
  {
    id: "Q003", quoteNumber: "ZN-2026-003", customerId: "C003", clientName: "晨光咖啡", clientContact: "陳先生",
    clientPhone: "0934-567-890", clientEmail: "dawn@example.com", clientAddress: "新北市板橋區文化路一段",
    projectName: "多分店自動化管理", projectType: "n8n 自動化流程建置",
    items: [
      { id: "I1", name: "n8n 自動化流程", desc: "庫存警示、排班通知、營收日報", qty: 1, unit: "套", price: 45000 },
      { id: "I2", name: "LINE OA 串接", desc: "員工通知、客戶行銷", qty: 1, unit: "式", price: 18000 },
      { id: "I3", name: "月維護方案", desc: "系統監控、Bug 修復、每月報告", qty: 3, unit: "月", price: 8000 },
    ],
    milestones: [],
    taxRate: 5, notes: "含 3 個月免費維護", status: "draft",
    createdAt: "2026-02-01", validUntil: "2026-03-01",
    paymentTerms: "簽約 40% / 驗收 30% / 上線 30%",
    bankInfo: { ...DEFAULT_BANK },
  },
];

// ─── Utilities ───
const fmt = (n) => new Intl.NumberFormat("zh-TW").format(n);
const calcSubtotal = (items) => items.reduce((s, i) => s + i.qty * i.price, 0);
const calcTax = (sub, rate) => Math.round(sub * rate / 100);
const calcTotal = (items, rate) => { const s = calcSubtotal(items); return s + calcTax(s, rate); };
const genId = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().split("T")[0];

const genQuoteNumber = (quotes) => {
  const year = new Date().getFullYear();
  const existing = quotes.filter(q => q.quoteNumber.includes(`${year}`));
  const num = String(existing.length + 1).padStart(3, "0");
  return `${BRAND.prefix}-${year}-${num}`;
};

// ─── Shared Components ───

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const StatusDropdown = ({ currentStatus, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" style={{ zIndex: open ? 9999 : 'auto' }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1.5 group no-print">
        <StatusBadge status={currentStatus} />
        <ChevronDown size={12} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[140px]" style={{ zIndex: 9999 }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <button key={key}
                onClick={(e) => { e.stopPropagation(); onChange(key); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${currentStatus === key ? "bg-gray-50 font-semibold" : ""}`}>
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className="text-gray-700">{cfg.label}</span>
                {currentStatus === key && <Check size={12} className="ml-auto text-emerald-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color = "emerald" }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-50`}>
        <Icon size={20} className={`text-${color}-600`} />
      </div>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, desc, action, onAction }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
      <Icon size={28} className="text-gray-300" />
    </div>
    <h3 className="text-lg font-semibold text-gray-600 mb-1">{title}</h3>
    <p className="text-sm text-gray-400 mb-4 max-w-xs">{desc}</p>
    {action && (
      <button onClick={onAction} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">{action}</button>
    )}
  </div>
);

// ─── Sidebar ───
const Sidebar = ({ page, setPage, quoteCount }) => {
  const nav = [
    { id: "dashboard", icon: LayoutDashboard, label: "儀表板" },
    { id: "quotes", icon: FileText, label: "報價單", badge: quoteCount },
    { id: "customers", icon: Users, label: "客戶管理" },
    { id: "settings", icon: Settings, label: "系統設定" },
  ];
  return (
    <aside className="w-64 min-h-screen flex flex-col print:hidden" style={{ background: "linear-gradient(180deg, #0c1222 0%, #162032 100%)" }}>
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base" style={{ background: "linear-gradient(135deg, #059669, #34d399)", color: "#fff" }}>ZN</div>
          <div>
            <div className="text-white font-bold text-base tracking-wide">ZN Studio</div>
            <div className="text-emerald-400/70 text-xs">報價管理系統 v2.1</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${page === n.id || (n.id === "quotes" && (page === "new-quote" || page === "preview"))
              ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}>
            <n.icon size={18} />
            <span className="flex-1 text-left">{n.label}</span>
            {n.badge > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300">{n.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center text-emerald-400 text-xs font-bold">NC</div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{BRAND.owner}</div>
            <div className="text-gray-500 text-xs truncate">{BRAND.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

// ─── Dashboard ───
const Dashboard = ({ quotes, setPage, setEditingQuote, setPreviewQuote }) => {
  const totalRevenue = quotes.filter(q => q.status === "accepted").reduce((s, q) => s + calcTotal(q.items, q.taxRate), 0);
  const pendingRevenue = quotes.filter(q => q.status === "sent").reduce((s, q) => s + calcTotal(q.items, q.taxRate), 0);
  const statusData = Object.entries(STATUS_CONFIG).map(([k, v]) => ({ name: v.label, value: quotes.filter(q => q.status === k).length })).filter(d => d.value > 0);
  const COLORS = ["#9ca3af", "#3b82f6", "#059669", "#ef4444", "#f59e0b"];
  const monthlyData = useMemo(() => {
    const months = ["1月", "2月", "3月"];
    return months.map((m, i) => ({ name: m, 報價金額: quotes.filter(q => new Date(q.createdAt).getMonth() === i).reduce((s, q) => s + calcTotal(q.items, q.taxRate), 0) }));
  }, [quotes]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-gray-900">儀表板</h1><p className="text-sm text-gray-500 mt-1">歡迎回來，{BRAND.owner}</p></div>
        <button onClick={() => { setEditingQuote(null); setPage("new-quote"); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg" style={{ background: "linear-gradient(135deg, #059669, #34d399)" }}><Plus size={16} /> 新增報價單</button>
      </div>
      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard icon={FileText} label="總報價單" value={quotes.length} sub="所有報價單" />
        <StatCard icon={DollarSign} label="已成交金額" value={`$${fmt(totalRevenue)}`} sub="已接受的報價" color="emerald" />
        <StatCard icon={Clock} label="待確認金額" value={`$${fmt(pendingRevenue)}`} sub="已寄出待回覆" color="blue" />
        <StatCard icon={TrendingUp} label="成交率" value={quotes.length ? `${Math.round(quotes.filter(q => q.status === "accepted").length / quotes.length * 100)}%` : "0%"} sub="接受 / 總數" color="amber" />
      </div>
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">月度報價金額趨勢</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} /><Tooltip formatter={v => `$${fmt(v)}`} /><Bar dataKey="報價金額" fill="#059669" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">狀態分佈</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={4}>{statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">{statusData.map((d, i) => (<div key={i} className="flex items-center gap-2 text-xs"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span className="text-gray-600">{d.name}</span><span className="ml-auto font-semibold text-gray-800">{d.value}</span></div>))}</div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-700">最近報價單</h3><button onClick={() => setPage("quotes")} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">查看全部 →</button></div>
        <div className="divide-y divide-gray-50">
          {quotes.slice(0, 5).map(q => (
            <div key={q.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => { setPreviewQuote(q); setPage("preview"); }}>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center"><FileText size={16} className="text-emerald-600" /></div>
              <div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-900 truncate">{q.projectName}</div><div className="text-xs text-gray-400">{q.quoteNumber} · {q.clientName}</div></div>
              <div className="text-right"><div className="text-sm font-bold text-gray-900 mb-1">${fmt(calcTotal(q.items, q.taxRate))}</div><StatusBadge status={q.status} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Quote List ───
const QuoteList = ({ quotes, setPage, setEditingQuote, setPreviewQuote, deleteQuote, updateQuoteStatus }) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const filtered = quotes.filter(q => {
    const ms = !search || q.projectName.includes(search) || q.clientName.includes(search) || q.quoteNumber.includes(search);
    const mst = filterStatus === "all" || q.status === filterStatus;
    return ms && mst;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">報價單管理</h1>
        <button onClick={() => { setEditingQuote(null); setPage("new-quote"); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #059669, #34d399)" }}><Plus size={16} /> 新增報價單</button>
      </div>
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋報價單號、客戶名稱、專案名稱..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" /></div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"><option value="all">全部狀態</option>{Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="尚無報價單" desc="建立第一張報價單開始使用系統" action="新增報價單" onAction={() => { setEditingQuote(null); setPage("new-quote"); }} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">報價單號</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">客戶 / 專案</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">金額</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">狀態 <span className="text-gray-400 text-[10px]">點擊可改</span></th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">日期</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(q => (
                <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5"><span className="text-sm font-mono font-semibold text-emerald-600">{q.quoteNumber}</span></td>
                  <td className="px-5 py-3.5"><div className="text-sm font-medium text-gray-900">{q.clientName}</div><div className="text-xs text-gray-400">{q.projectName}</div></td>
                  <td className="px-5 py-3.5"><span className="text-sm font-bold text-gray-900">${fmt(calcTotal(q.items, q.taxRate))}</span></td>
                  <td className="px-5 py-3.5"><StatusDropdown currentStatus={q.status} onChange={(s) => updateQuoteStatus(q.id, s)} /></td>
                  <td className="px-5 py-3.5"><span className="text-xs text-gray-500">{q.createdAt}</span></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setPreviewQuote(q); setPage("preview"); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-emerald-600" title="預覽"><Eye size={15} /></button>
                      <button onClick={() => { setEditingQuote(q); setPage("new-quote"); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="編輯"><Edit3 size={15} /></button>
                      <button onClick={() => deleteQuote(q.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500" title="刪除"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Notes Template Picker ───
const NotesTemplatePicker = ({ notesTemplates, onSelect, onClose }) => (
  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 max-h-64 overflow-y-auto" style={{ minWidth: 320 }}>
    <div className="px-3 py-2 border-b border-gray-100 sticky top-0 bg-white flex items-center justify-between">
      <span className="text-xs font-bold text-gray-600">📚 常用備註模板</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
    </div>
    {notesTemplates.map(t => (
      <button key={t.id} onClick={() => { onSelect(t.text); onClose(); }} className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0">
        <div className="text-xs font-semibold text-emerald-700 mb-0.5">{t.label}</div>
        <div className="text-xs text-gray-500 line-clamp-2">{t.text}</div>
      </button>
    ))}
  </div>
);

// ─── Quote Form ───
const QuoteForm = ({ editing, customers, quotes, notesTemplates, bankInfo, onSave, onCancel }) => {
  const [form, setForm] = useState(() => editing || {
    id: genId(), quoteNumber: genQuoteNumber(quotes), customerId: "", clientName: "", clientContact: "",
    clientPhone: "", clientEmail: "", clientAddress: "", projectName: "", projectType: PROJECT_TYPES[0],
    items: [{ id: genId(), name: "", desc: "", qty: 1, unit: "式", price: 0 }],
    milestones: [],
    taxRate: 5, notes: "", status: "draft", createdAt: today(), validUntil: "",
    paymentTerms: "簽約 40% / 驗收 30% / 上線 30%",
    bankInfo: { ...bankInfo },
  });
  const [showNotesPicker, setShowNotesPicker] = useState(false);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setBankField = (k, v) => setForm(prev => ({ ...prev, bankInfo: { ...prev.bankInfo, [k]: v } }));

  const selectCustomer = (cid) => {
    const c = customers.find(x => x.id === cid);
    if (c) setForm(prev => ({ ...prev, customerId: c.id, clientName: c.name, clientContact: c.contact, clientPhone: c.phone, clientEmail: c.email, clientAddress: c.address }));
  };

  const updateItem = (idx, k, v) => { const items = [...form.items]; items[idx] = { ...items[idx], [k]: v }; setForm(prev => ({ ...prev, items })); };
  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { id: genId(), name: "", desc: "", qty: 1, unit: "式", price: 0 }] }));
  const removeItem = (idx) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const updateMilestone = (idx, k, v) => { const ms = [...form.milestones]; ms[idx] = { ...ms[idx], [k]: v }; setForm(prev => ({ ...prev, milestones: ms })); };
  const addMilestone = () => setForm(prev => ({ ...prev, milestones: [...prev.milestones, { id: genId(), week: `Week ${prev.milestones.length + 1}`, title: "", tasks: "" }] }));
  const removeMilestone = (idx) => setForm(prev => ({ ...prev, milestones: prev.milestones.filter((_, i) => i !== idx) }));

  const appendNote = (text) => setForm(prev => ({ ...prev, notes: prev.notes ? prev.notes + "\n" + text : text }));

  const subtotal = calcSubtotal(form.items);
  const tax = calcTax(subtotal, form.taxRate);
  const total = subtotal + tax;

  const handleSave = (asDraft) => onSave({ ...form, status: asDraft ? "draft" : form.status === "draft" ? "sent" : form.status });

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={18} /></button>
        <h1 className="text-2xl font-bold text-gray-900">{editing ? "編輯報價單" : "建立報價單"}</h1>
        <span className="ml-2 font-mono text-emerald-600 text-sm font-semibold bg-emerald-50 px-2 py-0.5 rounded">{form.quoteNumber}</span>
      </div>

      {/* Client */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={16} className="text-emerald-600" /> 客戶資訊</h2>
        <div className="mb-4"><label className={labelCls}>選擇現有客戶</label><select value={form.customerId} onChange={e => selectCustomer(e.target.value)} className={inputCls}><option value="">— 手動輸入或選擇客戶 —</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.contact})</option>)}</select></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>公司/客戶名稱</label><input value={form.clientName} onChange={e => setField("clientName", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>聯絡人</label><input value={form.clientContact} onChange={e => setField("clientContact", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>電話</label><input value={form.clientPhone} onChange={e => setField("clientPhone", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Email</label><input value={form.clientEmail} onChange={e => setField("clientEmail", e.target.value)} className={inputCls} /></div>
          <div className="col-span-2"><label className={labelCls}>地址</label><input value={form.clientAddress} onChange={e => setField("clientAddress", e.target.value)} className={inputCls} /></div>
        </div>
      </div>

      {/* Project */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Zap size={16} className="text-emerald-600" /> 專案資訊</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>專案名稱</label><input value={form.projectName} onChange={e => setField("projectName", e.target.value)} className={inputCls} placeholder="例：LINE OA 智慧客服系統" /></div>
          <div><label className={labelCls}>專案類型</label><select value={form.projectType} onChange={e => setField("projectType", e.target.value)} className={inputCls}>{PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className={labelCls}>建立日期</label><input type="date" value={form.createdAt} onChange={e => setField("createdAt", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>報價有效至</label><input type="date" value={form.validUntil} onChange={e => setField("validUntil", e.target.value)} className={inputCls} /></div>
          <div className="col-span-2"><label className={labelCls}>付款條件</label><input value={form.paymentTerms} onChange={e => setField("paymentTerms", e.target.value)} className={inputCls} /></div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2"><FileText size={16} className="text-emerald-600" /> 報價項目</h2>
          <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100"><Plus size={14} /> 新增項目</button>
        </div>
        <div className="space-y-3">
          {form.items.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-3 rounded-xl bg-gray-50/70 border border-gray-100">
              <div className="col-span-3"><label className="text-xs text-gray-400 mb-1 block">項目名稱</label><input value={item.name} onChange={e => updateItem(idx, "name", e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" /></div>
              <div className="col-span-3"><label className="text-xs text-gray-400 mb-1 block">規格描述/備註</label><textarea value={item.desc} onChange={e => updateItem(idx, "desc", e.target.value)} rows={2} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-y min-h-[38px]" placeholder="可輸入多行說明..." /></div>
              <div className="col-span-1"><label className="text-xs text-gray-400 mb-1 block">數量</label><input type="number" min="1" value={item.qty} onChange={e => updateItem(idx, "qty", Number(e.target.value) || 1)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-400" /></div>
              <div className="col-span-1"><label className="text-xs text-gray-400 mb-1 block">單位</label><select value={item.unit} onChange={e => updateItem(idx, "unit", e.target.value)} className="w-full px-1 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400">{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
              <div className="col-span-2"><label className="text-xs text-gray-400 mb-1 block">單價</label><input type="number" min="0" value={item.price} onChange={e => updateItem(idx, "price", Number(e.target.value) || 0)} className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-400" /></div>
              <div className="col-span-1 text-right"><label className="text-xs text-gray-400 mb-1 block">小計</label><div className="py-1.5 text-sm font-semibold text-gray-800">${fmt(item.qty * item.price)}</div></div>
              <div className="col-span-1 flex items-end justify-center pb-0.5">{form.items.length > 1 && <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400"><X size={15} /></button>}</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>小計</span><span className="font-semibold">${fmt(subtotal)}</span></div>
            <div className="flex items-center justify-between text-gray-600"><span className="flex items-center gap-1">營業稅 <input type="number" min="0" max="100" value={form.taxRate} onChange={e => setField("taxRate", Number(e.target.value) || 0)} className="w-12 px-1 py-0.5 rounded border text-center text-xs" />%</span><span className="font-semibold">${fmt(tax)}</span></div>
            <div className="flex justify-between text-lg font-bold text-emerald-700 border-t border-gray-200 pt-2"><span>總計</span><span>${fmt(total)}</span></div>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Milestone size={16} className="text-emerald-600" /> 專案期程</h2>
          <button onClick={addMilestone} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100"><Plus size={14} /> 新增里程碑</button>
        </div>
        {form.milestones.length === 0 ? <div className="text-center py-6 text-sm text-gray-400">尚未新增期程，點擊「新增里程碑」來規劃專案時程</div> : (
          <div className="space-y-3">
            {form.milestones.map((ms, idx) => (
              <div key={ms.id} className="flex gap-3 items-start p-3 rounded-xl bg-gray-50/70 border border-gray-100">
                <div className="w-20 flex-shrink-0"><label className="text-xs text-gray-400 mb-1 block">週次</label><input value={ms.week} onChange={e => updateMilestone(idx, "week", e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center font-semibold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-400" /></div>
                <div className="flex-1"><label className="text-xs text-gray-400 mb-1 block">里程碑標題</label><input value={ms.title} onChange={e => updateMilestone(idx, "title", e.target.value)} placeholder="例：需求確認與環境設定" className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" /></div>
                <div className="flex-1"><label className="text-xs text-gray-400 mb-1 block">工作項目（逗號分隔）</label><input value={ms.tasks} onChange={e => updateMilestone(idx, "tasks", e.target.value)} placeholder="例：需求訪談、LINE OA 設定" className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" /></div>
                <div className="flex items-end pb-0.5"><button onClick={() => removeMilestone(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400"><X size={15} /></button></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bank Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Landmark size={16} className="text-emerald-600" /> 匯款資訊</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>銀行名稱</label><input value={form.bankInfo?.bankName || ""} onChange={e => setBankField("bankName", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>銀行代碼</label><input value={form.bankInfo?.bankCode || ""} onChange={e => setBankField("bankCode", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>分行名稱</label><input value={form.bankInfo?.branchName || ""} onChange={e => setBankField("branchName", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>戶名</label><input value={form.bankInfo?.accountName || ""} onChange={e => setBankField("accountName", e.target.value)} className={inputCls} /></div>
          <div className="col-span-2"><label className={labelCls}>帳號</label><input value={form.bankInfo?.accountNumber || ""} onChange={e => setBankField("accountNumber", e.target.value)} className={inputCls} placeholder="輸入匯款帳號" /></div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2"><StickyNote size={16} className="text-emerald-600" /> 備註說明</h2>
          <div className="relative">
            <button onClick={() => setShowNotesPicker(!showNotesPicker)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100"><BookOpen size={14} /> 從模板插入 <ChevronDown size={12} /></button>
            {showNotesPicker && <NotesTemplatePicker notesTemplates={notesTemplates} onSelect={appendNote} onClose={() => setShowNotesPicker(false)} />}
          </div>
        </div>
        <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={4} className={inputCls} placeholder="可手動輸入，或點擊「從模板插入」快速帶入常用備註..." />
        <p className="text-xs text-gray-400 mt-1.5">💡 可多次插入不同模板，會自動換行疊加</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
        <button onClick={() => handleSave(true)} className="px-5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">儲存草稿</button>
        <button onClick={() => handleSave(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #059669, #34d399)" }}>{editing ? "儲存變更" : "建立並寄出"}</button>
      </div>
    </div>
  );
};

// ─── Quote Preview ───
const QuotePreview = ({ quote, onBack, updateQuoteStatus }) => {
  if (!quote) return null;
  const subtotal = calcSubtotal(quote.items);
  const tax = calcTax(subtotal, quote.taxRate);
  const total = subtotal + tax;
  const bank = quote.bankInfo || DEFAULT_BANK;

  return (
    <div className="p-8">
      {/* Controls - hidden when printing */}
      <div className="flex items-center justify-between mb-5 print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> 返回列表</button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border"><span className="text-xs text-gray-500">狀態：</span><StatusDropdown currentStatus={quote.status} onChange={(s) => updateQuoteStatus(quote.id, s)} /></div>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"><Printer size={15} /> 列印 / PDF</button>
        </div>
      </div>

      {/* Printable Quote Container */}
      <div id="printable-quote" className="quote-container bg-white rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto overflow-hidden">

        {/* ═══════════ Print Header Bar (only visible when printing) ═══════════ */}
        <div className="print-only hidden print:flex items-center justify-between px-6 py-3 border-b border-gray-200" style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm bg-white/20 text-white">ZN</div>
            <span className="text-white font-bold text-sm">{BRAND.name}</span>
          </div>
          <div className="flex items-center gap-4 text-white text-xs">
            <span>報價單號：<strong className="font-mono">{quote.quoteNumber}</strong></span>
            <span>{quote.createdAt}</span>
            <span className="px-2 py-1 bg-white/20 rounded font-bold">NT$ {fmt(total)}</span>
          </div>
        </div>

        {/* Main Header */}
        <div className="p-8 pb-6" style={{ background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)" }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg bg-white/20 text-white backdrop-blur-sm">ZN</div>
              <div><h1 className="text-white text-xl font-bold">{BRAND.name}</h1><p className="text-emerald-200 text-xs">AI Automation Consulting</p></div>
            </div>
            <div className="text-right"><h2 className="text-white text-2xl font-bold tracking-wide mb-1">報 價 單</h2><p className="text-emerald-200 text-xs">QUOTATION</p></div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">客戶資訊 Client</h3>
              <p className="text-base font-bold text-gray-900 mb-1">{quote.clientName}</p>
              <p className="text-sm text-gray-600">{quote.clientContact}</p>
              {quote.clientPhone && <p className="text-sm text-gray-500">{quote.clientPhone}</p>}
              {quote.clientEmail && <p className="text-sm text-gray-500">{quote.clientEmail}</p>}
              {quote.clientAddress && <p className="text-sm text-gray-500 mt-1">{quote.clientAddress}</p>}
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">報價資訊 Details</h3>
              <div className="space-y-1 text-sm">
                <div><span className="text-gray-500">報價單號：</span><span className="font-mono font-bold text-gray-900">{quote.quoteNumber}</span></div>
                <div><span className="text-gray-500">專案名稱：</span><span className="font-semibold text-gray-900">{quote.projectName}</span></div>
                <div><span className="text-gray-500">報價日期：</span><span>{quote.createdAt}</span></div>
                {quote.validUntil && <div><span className="text-gray-500">有效期限：</span><span>{quote.validUntil}</span></div>}
                {/* Status Badge - hidden when printing */}
                <div className="mt-2 print:hidden"><StatusBadge status={quote.status} /></div>
              </div>
            </div>
          </div>

          <table className="w-full mb-6 avoid-break" style={{ borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f0fdf4" }}>
              <th className="text-left px-4 py-3 text-xs font-bold text-emerald-800 border-b-2 border-emerald-200" style={{ width: "5%" }}>#</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-emerald-800 border-b-2 border-emerald-200" style={{ width: "28%" }}>項目名稱</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-emerald-800 border-b-2 border-emerald-200" style={{ width: "25%" }}>說明</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-emerald-800 border-b-2 border-emerald-200" style={{ width: "8%" }}>數量</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-emerald-800 border-b-2 border-emerald-200" style={{ width: "7%" }}>單位</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-emerald-800 border-b-2 border-emerald-200" style={{ width: "12%" }}>單價</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-emerald-800 border-b-2 border-emerald-200" style={{ width: "15%" }}>小計</th>
            </tr></thead>
            <tbody>
              {quote.items.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.desc}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700">{item.qty}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700">{item.unit}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">${fmt(item.price)}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">${fmt(item.qty * item.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-72">
              <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-100"><span>小計 Subtotal</span><span className="font-semibold">${fmt(subtotal)}</span></div>
              <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-100"><span>營業稅 Tax ({quote.taxRate}%)</span><span className="font-semibold">${fmt(tax)}</span></div>
              <div className="flex justify-between py-3 text-lg font-bold" style={{ color: "#059669" }}><span>總計 Total</span><span>${fmt(total)}</span></div>
            </div>
          </div>

          {/* Milestones */}
          {quote.milestones && quote.milestones.length > 0 && (
            <div className="mb-8 avoid-break">
              <h3 className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4"><Calendar size={14} /> 專案期程 Project Timeline</h3>
              <div className="relative">
                <div className="absolute left-[39px] top-2 bottom-2 w-0.5 bg-emerald-200 rounded-full" />
                <div className="space-y-4">
                  {quote.milestones.map((ms) => (
                    <div key={ms.id} className="flex gap-4 items-start">
                      <div className="w-20 flex-shrink-0 text-right"><span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{ms.week}</span></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm mt-1 flex-shrink-0 relative z-10" />
                      <div className="flex-1 pb-2">
                        <p className="text-sm font-semibold text-gray-900">{ms.title}</p>
                        {ms.tasks && <div className="flex flex-wrap gap-1.5 mt-1.5">{ms.tasks.split(/[,、，]/).map((task, ti) => <span key={ti} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">✓ {task.trim()}</span>)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payment */}
          {quote.paymentTerms && (
            <div className="rounded-xl p-4 mb-4 avoid-break" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div className="flex items-center gap-2 mb-1"><CreditCard size={14} className="text-emerald-600" /><span className="text-xs font-bold text-emerald-800">付款條件 Payment Terms</span></div>
              <p className="text-sm text-emerald-700">{quote.paymentTerms}</p>
            </div>
          )}

          {/* Bank */}
          {bank.bankName && (
            <div className="rounded-xl p-4 mb-4 avoid-break" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <div className="flex items-center gap-2 mb-2"><Landmark size={14} className="text-blue-600" /><span className="text-xs font-bold text-blue-800">匯款資訊 Bank Transfer Info</span></div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <div><span className="text-blue-500">銀行名稱：</span><span className="font-semibold text-blue-900">{bank.bankName}</span></div>
                <div><span className="text-blue-500">銀行代碼：</span><span className="font-semibold text-blue-900">{bank.bankCode}</span></div>
                <div><span className="text-blue-500">分行名稱：</span><span className="font-semibold text-blue-900">{bank.branchName}</span></div>
                <div><span className="text-blue-500">戶　　名：</span><span className="font-semibold text-blue-900">{bank.accountName}</span></div>
                {bank.accountNumber && <div className="col-span-2"><span className="text-blue-500">匯款帳號：</span><span className="font-mono font-bold text-blue-900 text-base tracking-wider">{bank.accountNumber}</span></div>}
              </div>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="rounded-xl p-4 mb-6 avoid-break" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
              <div className="flex items-center gap-2 mb-1"><AlertCircle size={14} className="text-amber-600" /><span className="text-xs font-bold text-amber-800">備註 Notes</span></div>
              <div className="text-sm text-amber-700 whitespace-pre-line">{quote.notes}</div>
            </div>
          )}

          {/* Footer - Signature Section */}
          <div className="border-t border-gray-200 pt-6 mt-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">提案單位</h4>
                <p className="text-sm font-bold text-gray-900">{BRAND.owner} | {BRAND.name}</p>
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <p>📧 {BRAND.email}</p><p>📱 {BRAND.phone}</p><p>🌐 {BRAND.website}</p>
                  <p className="print:hidden">💬 Threads: {BRAND.threadsHandle}</p><p className="print:hidden">👥 LINE 社群: {BRAND.lineGroup}</p><p className="print:hidden">💼 LINE: {BRAND.lineOA}</p>
                </div>
              </div>
              <div><h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">客戶簽章</h4><div className="border-b-2 border-gray-300 mt-16 mb-2" /><p className="text-xs text-gray-400">簽名 / 日期</p></div>
            </div>
          </div>
        </div>

        {/* ═══════════ Print Footer Bar (only visible when printing) ═══════════ */}
        <div className="print-only hidden print:flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
          <a href={BRAND.website} className="text-emerald-700 font-semibold">{BRAND.websiteDisplay}</a>
          <span>{BRAND.name}</span>
          <span className="font-mono font-semibold">{quote.quoteNumber}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Customer List ───
const CustomerList = ({ customers, setCustomers }) => {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const filtered = customers.filter(c => !search || c.name.includes(search) || c.contact.includes(search) || c.phone.includes(search));

  const handleSave = (c) => {
    if (editingCustomer) setCustomers(prev => prev.map(x => x.id === c.id ? c : x));
    else setCustomers(prev => [...prev, { ...c, id: `C${String(prev.length + 1).padStart(3, "0")}`, createdAt: today() }]);
    setShowForm(false); setEditingCustomer(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
        <button onClick={() => { setEditingCustomer(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #059669, #34d399)" }}><Plus size={16} /> 新增客戶</button>
      </div>
      <div className="relative mb-5"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋客戶名稱、聯絡人、電話..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" /></div>
      {showForm && <CustomerForm customer={editingCustomer} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingCustomer(null); }} />}
      {filtered.length === 0 ? <EmptyState icon={Users} title="尚無客戶" desc="新增你的第一位客戶" action="新增客戶" onAction={() => setShowForm(true)} /> : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Building2 size={18} className="text-emerald-600" /></div>
                  <div><h3 className="text-sm font-bold text-gray-900">{c.name}</h3><p className="text-xs text-gray-400">{c.id} · {c.contact}</p></div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingCustomer(c); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Edit3 size={14} /></button>
                  <button onClick={() => setCustomers(prev => prev.filter(x => x.id !== c.id))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500">
                {c.phone && <div className="flex items-center gap-2"><Phone size={12} /> {c.phone}</div>}
                {c.email && <div className="flex items-center gap-2"><Mail size={12} /> {c.email}</div>}
                {c.address && <div className="flex items-center gap-2"><MapPin size={12} /> {c.address}</div>}
                {c.taxId && <div className="flex items-center gap-2"><Hash size={12} /> 統編：{c.taxId}</div>}
              </div>
              {c.notes && <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-50">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CustomerForm = ({ customer, onSave, onCancel }) => {
  const [form, setForm] = useState(customer || { name: "", contact: "", phone: "", email: "", address: "", taxId: "", notes: "" });
  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400";
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
      <h3 className="text-sm font-bold text-gray-800 mb-4">{customer ? "編輯客戶" : "新增客戶"}</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="公司/客戶名稱 *" className={inputCls} />
        <input value={form.contact} onChange={e => setF("contact", e.target.value)} placeholder="聯絡人" className={inputCls} />
        <input value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="電話" className={inputCls} />
        <input value={form.email} onChange={e => setF("email", e.target.value)} placeholder="Email" className={inputCls} />
        <input value={form.taxId} onChange={e => setF("taxId", e.target.value)} placeholder="統一編號" className={inputCls} />
        <input value={form.address} onChange={e => setF("address", e.target.value)} placeholder="地址" className={inputCls} />
        <input value={form.notes} onChange={e => setF("notes", e.target.value)} placeholder="備註" className={`${inputCls} col-span-2`} />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50">取消</button>
        <button onClick={() => form.name && onSave(form)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">儲存</button>
      </div>
    </div>
  );
};

// ─── Settings ───
const SettingsPage = ({ bankInfo, setBankInfo, notesTemplates, setNotesTemplates }) => {
  const [newNote, setNewNote] = useState({ label: "", text: "" });
  const addNoteTemplate = () => { if (newNote.label && newNote.text) { setNotesTemplates(prev => [...prev, { id: genId(), ...newNote }]); setNewNote({ label: "", text: "" }); } };
  const inputClsN = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400";

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">系統設定</h1>
      <p className="text-sm text-gray-500 mb-8">管理匯款資訊、備註模板與 n8n Webhook 連接</p>

      {/* Bank */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2"><Landmark size={16} className="text-emerald-600" /> 預設匯款資訊</h2>
        <p className="text-xs text-gray-400 mb-5">新建報價單時會自動帶入這組預設匯款資訊</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">銀行名稱</label><input value={bankInfo.bankName} onChange={e => setBankInfo(p => ({ ...p, bankName: e.target.value }))} className={inputClsN} /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">銀行代碼</label><input value={bankInfo.bankCode} onChange={e => setBankInfo(p => ({ ...p, bankCode: e.target.value }))} className={inputClsN} /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">分行名稱</label><input value={bankInfo.branchName} onChange={e => setBankInfo(p => ({ ...p, branchName: e.target.value }))} className={inputClsN} /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">戶名</label><input value={bankInfo.accountName} onChange={e => setBankInfo(p => ({ ...p, accountName: e.target.value }))} className={inputClsN} /></div>
          <div className="col-span-2"><label className="block text-xs font-semibold text-gray-600 mb-1">帳號</label><input value={bankInfo.accountNumber} onChange={e => setBankInfo(p => ({ ...p, accountNumber: e.target.value }))} className={inputClsN} placeholder="輸入匯款帳號" /></div>
        </div>
      </div>

      {/* Notes Templates */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2"><BookOpen size={16} className="text-emerald-600" /> 備註模板資料庫</h2>
        <p className="text-xs text-gray-400 mb-5">管理常用備註，在建立報價單時可快速帶入</p>
        <div className="space-y-2 mb-5 max-h-72 overflow-y-auto">
          {notesTemplates.map(t => (
            <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex-1 min-w-0"><div className="text-xs font-bold text-emerald-700">{t.label}</div><div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.text}</div></div>
              <button onClick={() => setNotesTemplates(prev => prev.filter(n => n.id !== t.id))} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 flex-shrink-0"><X size={14} /></button>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">新增備註模板</h4>
          <div className="flex gap-2 mb-2">
            <input value={newNote.label} onChange={e => setNewNote(p => ({ ...p, label: e.target.value }))} placeholder="模板名稱" className={`${inputClsN} w-28 flex-shrink-0`} />
            <textarea value={newNote.text} onChange={e => setNewNote(p => ({ ...p, text: e.target.value }))} placeholder="備註內容（可多行）" rows={2} className={`${inputClsN} flex-1 resize-y min-h-[40px]`} />
            <button onClick={addNoteTemplate} disabled={!newNote.label || !newNote.text} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 flex-shrink-0 self-start"><Plus size={14} /></button>
          </div>
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2"><Zap size={16} className="text-emerald-600" /> n8n Webhook 設定</h2>
        <p className="text-xs text-gray-400 mb-2">已連接至 <span className="font-mono text-emerald-600">{API_BASE}</span></p>
        <div className="flex items-center gap-2 mb-5">
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 已連線
          </span>
          <a href="https://nickleo9.zeabur.app" target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            開啟 n8n <ExternalLink size={10} />
          </a>
        </div>
        <div className="space-y-3">
          {[
            { key: "readQuotes", label: "讀取報價單", method: "GET", url: WEBHOOKS.readQuotes },
            { key: "writeQuote", label: "寫入報價單", method: "POST", url: WEBHOOKS.writeQuote },
            { key: "readCustomers", label: "讀取客戶", method: "GET", url: WEBHOOKS.readCustomers },
            { key: "writeCustomer", label: "寫入客戶", method: "POST", url: WEBHOOKS.writeCustomer },
            { key: "sendEmail", label: "寄送報價單", method: "POST", url: WEBHOOKS.sendEmail },
            { key: "lookupTaxId", label: "統編查詢", method: "GET", url: WEBHOOKS.lookupTaxId },
          ].map(item => (
            <div key={item.key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.method === "GET" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{item.method}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800">{item.label}</div>
                <div className="text-xs text-gray-400 font-mono truncate">{item.url}</div>
              </div>
              <button onClick={() => navigator.clipboard.writeText(item.url)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600" title="複製 URL"><Copy size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Sheets Schema */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText size={16} className="text-emerald-600" /> Google Sheets 資料表結構</h2>
        <div className="space-y-4 text-sm">
          {[
            { t: "📋 Sheet 1：客戶資料", s: "客戶編號 | 公司名稱 | 聯絡人 | 電話 | Email | 地址 | 統編 | 備註 | 建立日期" },
            { t: "📋 Sheet 2：報價單", s: "報價單號 | 客戶編號 | 專案名稱 | 專案類型 | 稅率 | 狀態 | 建立日期 | 有效期限 | 付款條件 | 備註" },
            { t: "📋 Sheet 3：報價項目", s: "報價單號 | 項目名稱 | 說明 | 數量 | 單位 | 單價" },
            { t: "📋 Sheet 4：期程里程碑", s: "報價單號 | 週次 | 標題 | 工作項目" },
            { t: "📋 Sheet 5：備註模板", s: "模板ID | 模板名稱 | 備註內容" },
            { t: "📋 Sheet 6：匯款資訊", s: "銀行名稱 | 銀行代碼 | 分行名稱 | 戶名 | 帳號" },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100"><h4 className="font-bold text-gray-800 mb-2">{s.t}</h4><code className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{s.s}</code></div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><MessageCircle size={16} className="text-emerald-600" /> 聯絡資訊</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2"><p><span className="text-gray-500">負責人：</span><span className="font-semibold">{BRAND.owner}</span></p><p><span className="text-gray-500">Email：</span>{BRAND.email}</p><p><span className="text-gray-500">電話：</span>{BRAND.phone}</p></div>
          <div className="space-y-2"><p><span className="text-gray-500">網站：</span><a href={BRAND.website} className="text-emerald-600 hover:underline" target="_blank" rel="noreferrer">{BRAND.website}</a></p><p><span className="text-gray-500">Threads：</span><a href={BRAND.threads} className="text-emerald-600 hover:underline" target="_blank" rel="noreferrer">{BRAND.threadsHandle}</a></p><p><span className="text-gray-500">LINE 社群：</span><a href={BRAND.lineGroup} className="text-emerald-600 hover:underline" target="_blank" rel="noreferrer">加入社群</a></p></div>
        </div>
      </div>
    </div>
  );
};

// ─── Main App ───
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editingQuote, setEditingQuote] = useState(null);
  const [previewQuote, setPreviewQuote] = useState(null);
  const [bankInfo, setBankInfo] = useState({ ...DEFAULT_BANK });
  const [notesTemplates, setNotesTemplates] = useState(DEFAULT_NOTES_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // 初始載入資料
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [quotesData, customersData] = await Promise.all([
          api.fetchQuotes(),
          api.fetchCustomers(),
        ]);
        setQuotes(quotesData.length > 0 ? quotesData : SAMPLE_QUOTES);
        setCustomers(customersData.length > 0 ? customersData : SAMPLE_CUSTOMERS);
      } catch (err) {
        console.error("Failed to load data:", err);
        // 使用 sample data 作為 fallback
        setQuotes(SAMPLE_QUOTES);
        setCustomers(SAMPLE_CUSTOMERS);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const saveQuote = async (quote) => {
    setSyncing(true);
    try {
      // 本地更新
      setQuotes(prev => {
        const exists = prev.find(q => q.id === quote.id);
        return exists ? prev.map(q => q.id === quote.id ? quote : q) : [...prev, quote];
      });
      // 同步到 n8n
      await api.saveQuote(quote);
    } catch (err) {
      console.error("Failed to save quote:", err);
    } finally {
      setSyncing(false);
      setPage("quotes");
    }
  };

  const deleteQuote = (id) => setQuotes(prev => prev.filter(q => q.id !== id));

  const updateQuoteStatus = async (id, newStatus) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
    if (previewQuote && previewQuote.id === id) setPreviewQuote(prev => ({ ...prev, status: newStatus }));
    // 同步狀態變更到 n8n
    const quote = quotes.find(q => q.id === id);
    if (quote) {
      await api.saveQuote({ ...quote, status: newStatus });
    }
  };

  const handleSendEmail = async (quote) => {
    setSyncing(true);
    try {
      const result = await api.sendQuoteEmail(quote);
      if (result.success) {
        alert(`報價單已寄送至 ${quote.clientEmail}`);
        // 更新狀態為 sent
        updateQuoteStatus(quote.id, "sent");
      } else {
        alert("寄送失敗：" + (result.error || "未知錯誤"));
      }
    } catch (err) {
      alert("寄送失敗：" + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard quotes={quotes} setPage={setPage} setEditingQuote={setEditingQuote} setPreviewQuote={setPreviewQuote} />;
      case "quotes": return <QuoteList quotes={quotes} setPage={setPage} setEditingQuote={setEditingQuote} setPreviewQuote={setPreviewQuote} deleteQuote={deleteQuote} updateQuoteStatus={updateQuoteStatus} />;
      case "new-quote": return <QuoteForm editing={editingQuote} customers={customers} quotes={quotes} notesTemplates={notesTemplates} bankInfo={bankInfo} onSave={saveQuote} onCancel={() => setPage("quotes")} />;
      case "preview": return <QuotePreview quote={previewQuote} onBack={() => setPage("quotes")} updateQuoteStatus={updateQuoteStatus} />;
      case "customers": return <CustomerList customers={customers} setCustomers={setCustomers} />;
      case "settings": return <SettingsPage bankInfo={bankInfo} setBankInfo={setBankInfo} notesTemplates={notesTemplates} setNotesTemplates={setNotesTemplates} />;
      default: return <Dashboard quotes={quotes} setPage={setPage} setEditingQuote={setEditingQuote} setPreviewQuote={setPreviewQuote} />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50" style={{ fontFamily: "'Noto Sans TC', -apple-system, sans-serif" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mx-auto mb-4" style={{ background: "linear-gradient(135deg, #059669, #34d399)", color: "#fff" }}>ZN</div>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <p className="text-sm text-gray-500 mt-3">正在載入資料...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white" style={{ fontFamily: "'Noto Sans TC', -apple-system, sans-serif" }}>
      <Sidebar page={page} setPage={setPage} quoteCount={quotes.length} />
      <main className="flex-1 overflow-y-auto relative print:overflow-visible print:w-full">
        {renderPage()}
        {/* Syncing 指示器 */}
        {syncing && (
          <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-200 z-50 print:hidden">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">同步中...</span>
          </div>
        )}
      </main>
    </div>
  );
}
