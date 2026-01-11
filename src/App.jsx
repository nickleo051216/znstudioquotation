import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
  initializeFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, serverTimestamp, where, getDocs, orderBy, limit,
  enableIndexedDbPersistence, persistentLocalCache, persistentMultipleTabManager
} from 'firebase/firestore';
import {
  Plus, Trash2, FileText, Users, Printer, Save, Copy, ArrowLeft, Package,
  CheckCircle, ListPlus, X, Search, Edit, RotateCcw, ChevronDown, ChevronRight
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBs0RgULlWdJBf3c2VHRNPkYTSr-XLSv2M",
  authDomain: "znstudioquotation.firebaseapp.com",
  projectId: "znstudioquotation",
  storageBucket: "znstudioquotation.firebasestorage.app",
  messagingSenderId: "615767113104",
  appId: "1:615767113104:web:05b0fd038a8be5c9758715",
  measurementId: "G-9SWV7KXYKM"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);

// 初始化 Firestore 並開啟快取
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

const appId = 'znstudio-prod';

// --- Company Info ---
const COMPANY_INFO = {
  name: 'ZN Studio',
  owner: 'Nick Chang',
  email: 'nickleo051216@gmail.com',
  phone: '0932-684-051',
  address: '新北市永和區竹林路179巷10號7樓',
  website: 'https://portaly.cc/zn.studio',
  threads: '@nickai216',
  line: 'https://lin.ee/Faz0doj'
};

// --- Constants ---
const PAYMENT_METHODS = ['匯款', '現金', '支票', 'Line Pay'];
const PAYMENT_TERMS = [
  '驗收後 7 天內付款',
  '驗收後 14 天內付款',
  '驗收後 30 天內付款',
  '50% 訂金，完成後付清'
];

const NOTE_TEMPLATES = [
  {
    label: '一般報價',
    content: '一、本報價單有效期為 30 天。\n二、確認合作後，請回覆確認。\n三、本報價單未含稅，如需開立發票另加 5% 稅金。'
  },
  {
    label: '專案開發',
    content: '一、本報價單有效期為 14 天。\n二、請確認需求內容後回覆。\n三、款項分期支付：50% 訂金，50% 尾款。\n四、未含稅，開立發票需另加 5% 稅金。'
  }
];

// --- Utilities ---
const generateQuoteNumber = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `ZN-${yy}${mm}-${seq}`;
};

const formatDate = (dateObj) => {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  return d.toISOString().split('T')[0];
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// --- Notification ---
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
    info: 'bg-cyan-600 border-cyan-500'
  };

  return (
    <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-2xl border-l-4 text-white z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300 ${colors[type] || colors.info}`}>
      <div className="flex items-center space-x-3">
        {type === 'success' && <CheckCircle className="w-5 h-5" />}
        {type === 'error' && <X className="w-5 h-5" />}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [printMode, setPrintMode] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (message, type = 'success') => setNotification({ message, type });

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  if (!user) return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-cyan-400">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mb-4"></div>
      <p className="font-bold tracking-widest animate-pulse text-lg">ZN STUDIO 載入中...</p>
    </div>
  );

  return (
    <div className={`min-h-screen w-full bg-gray-900 text-gray-100 font-sans transition-colors duration-300 ${printMode ? 'bg-white text-gray-900' : ''}`}>
      {!printMode && (
        <nav className="bg-gray-800/80 backdrop-blur-md border-b border-cyan-500/20 shadow-xl sticky top-0 z-50">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center cursor-pointer group space-x-3" onClick={() => setView('dashboard')}>
                <div className="bg-cyan-600 text-white font-black text-2xl w-10 h-10 flex items-center justify-center rounded-lg shadow-lg group-hover:scale-110 transition-transform">ZN</div>
                <span className="font-bold text-xl text-white hidden sm:block tracking-tight">Studio 報價系統</span>
              </div>
              <div className="flex space-x-1">
                {[
                  { id: 'dashboard', label: '報價單', icon: FileText },
                  { id: 'customers', label: '客戶', icon: Users },
                  { id: 'products', label: '項目', icon: Package },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all
                      ${view === item.id
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/25'
                        : 'hover:bg-gray-700 text-gray-300'}`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className={`w-full ${printMode ? 'p-0' : 'py-6 px-4 sm:px-6 lg:px-8'}`}>
        {view === 'dashboard' && (
          <Dashboard
            onEdit={(id) => { setActiveQuoteId(id); setView('editor'); }}
            onCreate={() => { setActiveQuoteId(null); setView('editor'); }}
            notify={notify}
          />
        )}
        {view === 'customers' && <CustomerManager notify={notify} />}
        {view === 'products' && <ProductManager notify={notify} />}
        {view === 'editor' && (
          <QuoteEditor
            quoteId={activeQuoteId}
            setActiveQuoteId={setActiveQuoteId}
            onBack={() => setView('dashboard')}
            onPrintToggle={setPrintMode}
            isPrintMode={printMode}
            notify={notify}
          />
        )}
      </main>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

// --- Dashboard ---
const Dashboard = ({ onEdit, onCreate, notify }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    document.title = "ZN Studio 報價系統";
    // 優化查詢：直接在伺服器端排序，並限制載入最近的 100 筆
    const q = query(
      collection(db, 'artifacts', appId, 'public', 'data', 'quotations'),
      orderBy('updatedAt', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // 由於伺服器端已經排序，這裡只需做簡單對齊
      setQuotes(docs);
      setLoading(false);
    }, (err) => {
      console.error(err);
      if (err.code === 'failed-precondition') {
        notify('索引尚未建立，將自動切換為本地排序', 'info');
        // 退回不排序查詢（待索引建立）
        const fallbackQ = query(collection(db, 'artifacts', appId, 'public', 'data', 'quotations'));
        onSnapshot(fallbackQ, s => {
          const fallbackDocs = s.docs.map(d => ({ id: d.id, ...d.data() }));
          fallbackDocs.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
          setQuotes(fallbackDocs);
          setLoading(false);
        });
      } else {
        notify('載入資料失敗，請檢查權限', 'error');
      }
    });
    return () => unsub();
  }, [notify]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (confirm('確定要刪除此報價單嗎？')) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'quotations', id));
        notify('已成功刪除報價單');
      } catch (e) {
        notify('刪除失敗', 'error');
      }
    }
  };

  // ... (use filteredQuotes and stats logic)
  const filteredQuotes = useMemo(() => {
    if (!searchTerm) return quotes;
    const lower = searchTerm.toLowerCase();
    return quotes.filter(q =>
      String(q.quoteNumber || '').toLowerCase().includes(lower) ||
      String(q.clientName || '').toLowerCase().includes(lower) ||
      String(q.projectName || '').toLowerCase().includes(lower)
    );
  }, [quotes, searchTerm]);

  const stats = useMemo(() => ({
    total: quotes.length,
    totalAmount: quotes.reduce((sum, q) => sum + (q.grandTotal || 0), 0)
  }), [quotes]);

  const statusConfig = {
    draft: { label: '草稿', color: 'bg-gray-600' },
    sent: { label: '已發送', color: 'bg-blue-600' },
    confirmed: { label: '已確認', color: 'bg-green-600' },
    cancelled: { label: '已取消', color: 'bg-red-600' },
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      <p className="text-gray-500 text-sm animate-pulse">載入清單中...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-white border-l-4 border-cyan-500 pl-3">報價單管理</h2>
        <button
          onClick={onCreate}
          className="flex items-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 shadow-lg shadow-cyan-500/25 transition-all"
        >
          <Plus className="w-5 h-5 mr-1" /> 新增報價單
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">報價單數量</p>
          <p className="text-2xl font-bold text-white">{stats.total} 筆</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-cyan-500/30">
          <p className="text-sm text-cyan-400">總報價金額</p>
          <p className="text-2xl font-bold text-cyan-400">NT$ {stats.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="搜尋報價單..."
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
      </div>

      {/* List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">編號 / 專案</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">客戶</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase">狀態</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase">金額</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredQuotes.map((quote) => {
              const status = statusConfig[quote.status] || statusConfig.draft;
              return (
                <tr key={quote.id} onClick={() => onEdit(quote.id)} className="hover:bg-gray-750 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-bold text-cyan-400">{quote.quoteNumber}</div>
                    <div className="text-sm text-gray-300">{quote.projectName || '未命名專案'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-200">{quote.clientName}</div>
                    <div className="text-xs text-gray-500">{formatTimestamp(quote.updatedAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${status.color}`}>{status.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-white">
                    NT$ {quote.grandTotal?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={(e) => handleDelete(e, quote.id)} className="text-gray-500 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredQuotes.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? '沒有符合的報價單' : '尚無報價單，點擊「新增報價單」開始'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Quote Editor ---
const QuoteEditor = ({ quoteId, setActiveQuoteId, onBack, onPrintToggle, isPrintMode, notify }) => {
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    quoteNumber: generateQuoteNumber(),
    projectName: '',
    status: 'draft',
    date: formatDate(new Date()),
    validUntil: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    clientName: '',
    clientContact: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    items: [{ id: Date.now(), name: '', spec: '', unit: '式', price: 0, qty: 1 }],
    paymentMethod: '匯款',
    paymentTerms: '驗收後 7 天內付款',
    notes: NOTE_TEMPLATES[0].content
  });

  useEffect(() => {
    const unsubC = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), s =>
      setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubP = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), s =>
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubC(); unsubP(); };
  }, []);

  useEffect(() => {
    if (quoteId) {
      const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'quotations', quoteId), (doc) => {
        if (doc.exists()) setFormData(prev => ({ ...prev, ...doc.data() }));
      });
      return () => unsub();
    }
  }, [quoteId]);

  const subtotal = useMemo(() => formData.items.reduce((sum, item) => sum + (item.price * item.qty), 0), [formData.items]);
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + tax;

  const handleItemChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = (product = null) => {
    const newItem = product
      ? { id: Date.now(), name: product.name, spec: product.spec || '', unit: product.unit || '式', price: product.price || 0, qty: 1 }
      : { id: Date.now(), name: '', spec: '', unit: '式', price: 0, qty: 1 };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleClientSelect = (e) => {
    const c = customers.find(x => x.id === e.target.value);
    if (c) {
      setFormData(prev => ({
        ...prev,
        clientName: c.name,
        clientContact: c.contact || '',
        clientPhone: c.phone || '',
        clientEmail: c.email || '',
        clientAddress: c.address || ''
      }));
      notify(`已載入客戶：${c.name}`);
    }
  };


  const save = async () => {
    if (saving) return;
    setSaving(true);
    const payload = { ...formData, subtotal, tax, grandTotal, updatedAt: serverTimestamp() };
    try {
      if (quoteId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'quotations', quoteId), payload);
        notify('報價單已儲存 (更新)');
      } else {
        const ref = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'quotations'), {
          ...payload, createdAt: serverTimestamp()
        });
        setActiveQuoteId(ref.id);
        notify('報價單已成功新增');
      }
    } catch (e) {
      console.error(e);
      notify('儲存失敗，請檢查權限或聯絡支援', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    onPrintToggle(true);
    setTimeout(() => window.print(), 100);
  };

  if (isPrintMode) {
    return (
      <div className="bg-white text-gray-900 p-8 max-w-4xl mx-auto print:p-4">
        <button onClick={() => onPrintToggle(false)} className="no-print fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded">
          關閉預覽
        </button>

        {/* Print Header */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-cyan-500 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-cyan-600">ZN Studio</h1>
            <h2 className="text-lg text-gray-600">專案報價單</h2>
            <div className="mt-2 text-sm text-gray-500">
              <p>{COMPANY_INFO.address}</p>
              <p>電話：{COMPANY_INFO.phone}</p>
              <p>Email：{COMPANY_INFO.email}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">報價編號</p>
            <p className="text-xl font-bold text-cyan-600">{formData.quoteNumber}</p>
            <p className="text-sm text-gray-500 mt-2">報價日期：{formData.date}</p>
            <p className="text-sm text-gray-500">有效期限：{formData.validUntil}</p>
          </div>
        </div>

        {/* Project Name */}
        <div className="bg-cyan-50 p-3 rounded mb-4">
          <span className="text-xs text-cyan-600 font-bold">專案名稱</span>
          <p className="text-lg font-medium">{formData.projectName || '未命名專案'}</p>
        </div>

        {/* Client Info */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-700 border-b pb-1 mb-2">客戶資料</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p><span className="text-gray-500">客戶名稱：</span>{formData.clientName}</p>
            <p><span className="text-gray-500">聯絡人：</span>{formData.clientContact}</p>
            <p><span className="text-gray-500">電話：</span>{formData.clientPhone}</p>
            <p><span className="text-gray-500">Email：</span>{formData.clientEmail}</p>
            <p className="col-span-2"><span className="text-gray-500">地址：</span>{formData.clientAddress}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left text-sm">No.</th>
              <th className="border p-2 text-left text-sm">項目名稱</th>
              <th className="border p-2 text-left text-sm">規格說明</th>
              <th className="border p-2 text-center text-sm">單位</th>
              <th className="border p-2 text-right text-sm">數量</th>
              <th className="border p-2 text-right text-sm">單價</th>
              <th className="border p-2 text-right text-sm">小計</th>
            </tr>
          </thead>
          <tbody>
            {formData.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="border p-2 text-sm">{idx + 1}</td>
                <td className="border p-2 text-sm font-medium">{item.name}</td>
                <td className="border p-2 text-sm text-gray-600">{item.spec}</td>
                <td className="border p-2 text-sm text-center">{item.unit}</td>
                <td className="border p-2 text-sm text-right">{item.qty}</td>
                <td className="border p-2 text-sm text-right">{item.price?.toLocaleString()}</td>
                <td className="border p-2 text-sm text-right font-medium">{(item.price * item.qty).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-4">
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-sm"><span>小計</span><span>NT$ {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span>稅額 (5%)</span><span>NT$ {tax.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-1">
              <span>總計</span><span className="text-cyan-600">NT$ {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment & Notes */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <p className="text-sm"><span className="text-gray-500">付款方式：</span>{formData.paymentMethod}</p>
            <p className="text-sm"><span className="text-gray-500">付款條件：</span>{formData.paymentTerms}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">備註</p>
            <p className="text-sm whitespace-pre-wrap">{formData.notes}</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex gap-8 mt-16">
          <div className="flex-1 text-center">
            <div className="border-b border-gray-400 pb-2 mb-2"></div>
            <p className="text-sm text-gray-600">ZN Studio (簽章)</p>
          </div>
          <div className="flex-1 text-center">
            <div className="border-b border-gray-400 pb-2 mb-2"></div>
            <p className="text-sm text-gray-600">客戶簽名確認</p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          {COMPANY_INFO.website} | {COMPANY_INFO.email}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700">
        <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回
        </button>
        <div className="flex gap-2">
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="bg-gray-700 border-gray-600 rounded text-sm text-white px-2 py-1"
          >
            <option value="draft">草稿</option>
            <option value="sent">已發送</option>
            <option value="confirmed">已確認</option>
            <option value="cancelled">已取消</option>
          </select>
          <button onClick={handlePrint} className="flex items-center px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600">
            <Printer className="w-4 h-4 mr-1" /> 列印
          </button>
          <button onClick={save} disabled={saving} className="flex items-center px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700">
            <Save className="w-4 h-4 mr-1" /> {saving ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quote Info */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
          <h3 className="font-bold text-cyan-400 border-b border-gray-700 pb-2">報價單資訊</h3>
          <div>
            <label className="text-xs text-gray-400">報價編號</label>
            <input className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" value={formData.quoteNumber} readOnly />
          </div>
          <div>
            <label className="text-xs text-gray-400">專案名稱</label>
            <input
              className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              placeholder="請輸入專案名稱"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">報價日期</label>
              <input type="date" className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white"
                value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-400">有效期限</label>
              <input type="date" className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white"
                value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Middle Column - Client Info */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <h3 className="font-bold text-cyan-400">客戶資料</h3>
            <select onChange={handleClientSelect} className="bg-gray-700 text-xs text-gray-300 rounded px-2 py-1" defaultValue="">
              <option value="" disabled>選擇現有客戶</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <input className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="客戶名稱"
            value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} />
          <input className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="聯絡人"
            value={formData.clientContact} onChange={(e) => setFormData({ ...formData, clientContact: e.target.value })} />
          <input className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="電話"
            value={formData.clientPhone} onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })} />
          <input className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="Email"
            value={formData.clientEmail} onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })} />
          <input className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="地址"
            value={formData.clientAddress} onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })} />
        </div>

        {/* Right Column - Payment */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
          <h3 className="font-bold text-cyan-400 border-b border-gray-700 pb-2">付款資訊</h3>
          <div>
            <label className="text-xs text-gray-400">付款方式</label>
            <select className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white"
              value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">付款條件</label>
            <select className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white"
              value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}>
              {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400">備註</label>
            <textarea className="w-full bg-gray-700 border-gray-600 rounded px-3 py-2 text-white h-24"
              value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-cyan-400">報價項目</h3>
          <div className="flex gap-2">
            <button onClick={() => addItem()} className="flex items-center text-sm text-cyan-400 hover:text-cyan-300">
              <Plus className="w-4 h-4 mr-1" /> 新增項目
            </button>
            <select onChange={(e) => { const p = products.find(x => x.id === e.target.value); if (p) addItem(p); e.target.value = ''; }}
              className="bg-gray-700 text-xs text-gray-300 rounded px-2 py-1" defaultValue="">
              <option value="" disabled>從項目庫新增</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-3 py-2 text-left text-xs text-gray-400 w-8">#</th>
              <th className="px-3 py-2 text-left text-xs text-gray-400">項目名稱</th>
              <th className="px-3 py-2 text-left text-xs text-gray-400">規格說明</th>
              <th className="px-3 py-2 text-center text-xs text-gray-400 w-20">單位</th>
              <th className="px-3 py-2 text-right text-xs text-gray-400 w-20">數量</th>
              <th className="px-3 py-2 text-right text-xs text-gray-400 w-28">單價</th>
              <th className="px-3 py-2 text-right text-xs text-gray-400 w-28">小計</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {formData.items.map((item, idx) => (
              <tr key={item.id}>
                <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                <td className="px-3 py-2">
                  <input className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1 text-white text-sm"
                    value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} placeholder="項目名稱" />
                </td>
                <td className="px-3 py-2">
                  <input className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1 text-white text-sm"
                    value={item.spec} onChange={(e) => handleItemChange(item.id, 'spec', e.target.value)} placeholder="規格說明" />
                </td>
                <td className="px-3 py-2">
                  <input className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1 text-white text-sm text-center"
                    value={item.unit} onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1 text-white text-sm text-right"
                    value={item.qty} onChange={(e) => handleItemChange(item.id, 'qty', Number(e.target.value))} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1 text-white text-sm text-right"
                    value={item.price} onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))} />
                </td>
                <td className="px-3 py-2 text-right text-white font-medium">{(item.price * item.qty).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <button onClick={() => setFormData(p => ({ ...p, items: p.items.filter(i => i.id !== item.id) }))}
                    className="text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="p-4 border-t border-gray-700 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-400"><span>小計</span><span>NT$ {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-gray-400"><span>稅額 (5%)</span><span>NT$ {tax.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-lg text-white border-t border-gray-600 pt-2">
              <span>總計</span><span className="text-cyan-400">NT$ {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Customer Manager ---
const CustomerManager = ({ notify }) => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '', address: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), (s) => {
      setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      notify('請輸入客戶名稱', 'info');
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', editingId), form);
        setEditingId(null);
        notify('客戶資料已更新');
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), form);
        notify('已新增客戶');
      }
      setForm({ name: '', contact: '', phone: '', email: '', address: '' });
    } catch (e) {
      notify('操作失敗', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('確定刪除此客戶？')) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', id));
        notify('客戶已刪除');
      } catch (e) {
        notify('刪除失敗', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white border-l-4 border-cyan-500 pl-3">客戶管理</h2>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="客戶名稱 *"
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="聯絡人"
          value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
        <input className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="電話"
          value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <input className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="Email"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white md:col-span-2" placeholder="地址"
          value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        <button className={`px-4 py-2 rounded text-white ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}>
          {editingId ? '更新客戶' : '新增客戶'}
        </button>
      </form>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-400">客戶名稱</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400">聯絡資訊</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-750">
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.address}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  <div>{c.contact} / {c.phone}</div>
                  <div className="text-cyan-400">{c.email}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setForm(c); setEditingId(c.id); }} className="text-gray-500 hover:text-orange-500 p-1">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-gray-500 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Product Manager ---
const ProductManager = ({ notify }) => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', spec: '', unit: '式', price: 0 });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), (s) => {
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      notify('請輸入項目名稱', 'info');
      return;
    }
    const payload = { ...form, price: Number(form.price) };
    try {
      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', editingId), payload);
        setEditingId(null);
        notify('項目資料已更新');
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), payload);
        notify('已新增項目');
      }
      setForm({ name: '', spec: '', unit: '式', price: 0 });
    } catch (e) {
      notify('操作失敗', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('確定刪除此項目？')) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
        notify('項目已刪除');
      } catch (e) {
        notify('刪除失敗', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white border-l-4 border-cyan-500 pl-3">項目管理</h2>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-5 gap-4">
        <input className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white md:col-span-2" placeholder="項目名稱 *"
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="規格說明"
          value={form.spec} onChange={e => setForm({ ...form, spec: e.target.value })} />
        <input className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="單位"
          value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
        <input type="number" className="bg-gray-700 border-gray-600 rounded px-3 py-2 text-white" placeholder="單價"
          value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        <button className={`px-4 py-2 rounded text-white md:col-span-5 ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}>
          {editingId ? '更新項目' : '新增項目'}
        </button>
      </form>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-400">項目名稱</th>
              <th className="px-4 py-3 text-left text-xs text-gray-400">規格</th>
              <th className="px-4 py-3 text-right text-xs text-gray-400">單價/單位</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-750">
                <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{p.spec || '-'}</td>
                <td className="px-4 py-3 text-right text-cyan-400">NT$ {p.price?.toLocaleString()} / {p.unit}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setForm(p); setEditingId(p.id); }} className="text-gray-500 hover:text-orange-500 p-1">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-gray-500 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
