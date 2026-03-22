import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Database, Download, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

// 舊的 n8n API Webhooks (用於抓取資料) - HARDCODED FOR MIGRATION
const OLD_WEBHOOKS = {
    readQuotes: "https://nickleo9.zeabur.app/webhook/read-quotes",
    readCustomers: "https://nickleo9.zeabur.app/webhook/read-customers",
    readServices: "https://nickleo9.zeabur.app/webhook/read-services",
    readNotesTemplates: "https://nickleo9.zeabur.app/webhook/read-notes-templates",
};

const COLLECTIONS = {
    QUOTES: 'quotations',
    CUSTOMERS: 'customers',
    SERVICES: 'services',
    NOTES_TEMPLATES: 'notesTemplates',
};

const DataMigration = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string, details?: string }
    const [progress, setProgress] = useState("");

    const runMigration = async () => {
        if (!window.confirm("確定要開始遷移資料嗎？\n這將從 Google Sheets 下載資料並覆寫到 Firebase。")) return;

        setLoading(true);
        setStatus(null);
        setProgress("正在連線舊系統...");

        try {
            const batch = writeBatch(db);
            let count = 0;

            // 1. 客戶資料
            setProgress("正在下載客戶資料...");
            const resC = await fetch(OLD_WEBHOOKS.readCustomers);
            const dataC = await resC.json();
            const customers = dataC.success ? dataC.data : [];

            customers.forEach(c => {
                if (!c.id) return;
                const ref = doc(db, COLLECTIONS.CUSTOMERS, c.id);
                batch.set(ref, {
                    ...c,
                    migratedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                count++;
            });
            setProgress(`已準備 ${customers.length} 筆客戶資料...`);

            // 2. 服務資料
            setProgress("正在下載服務資料...");
            const resS = await fetch(OLD_WEBHOOKS.readServices);
            const dataS = await resS.json();
            const services = dataS.success ? dataS.data : [];

            services.forEach(s => {
                if (!s.id) return;
                const ref = doc(db, COLLECTIONS.SERVICES, s.id);
                batch.set(ref, {
                    ...s,
                    price: Number(s.price) || 0,
                    migratedAt: serverTimestamp()
                });
                count++;
            });
            setProgress(`已準備 ${services.length} 筆服務資料...`);

            // 3. 備註模板
            setProgress("正在下載備註模板...");
            const resN = await fetch(OLD_WEBHOOKS.readNotesTemplates);
            const dataN = await resN.json();
            const templates = dataN.success ? dataN.data : [];

            templates.forEach(t => {
                if (!t.id) return;
                const ref = doc(db, COLLECTIONS.NOTES_TEMPLATES, t.id);
                batch.set(ref, { ...t, migratedAt: serverTimestamp() });
                count++;
            });
            setProgress(`已準備 ${templates.length} 筆備註模板...`);

            // 4. 報價單 (最重要)
            setProgress("正在下載報價單...");
            const resQ = await fetch(OLD_WEBHOOKS.readQuotes);
            const dataQ = await resQ.json();
            const quotes = dataQ.success ? dataQ.data : [];

            // 注意：單次 Batch 上限 500，若資料量大需分批 (這裡暫設簡單版)
            quotes.forEach(q => {
                if (!q.id) return;
                const ref = doc(db, COLLECTIONS.QUOTES, q.id);

                // 修正資料型別
                const fixedItems = (q.items || []).map(i => ({
                    ...i,
                    price: Number(i.price) || 0,
                    qty: Number(i.qty) || 0,
                }));

                batch.set(ref, {
                    ...q,
                    items: fixedItems,
                    taxRate: Number(q.taxRate) || 5,
                    migratedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                count++;
            });
            setProgress(`已準備 ${quotes.length} 筆報價單...`);

            // 5. 提交寫入
            setProgress(`正在寫入 ${count} 筆資料到 Firebase... (請勿關閉視窗)`);
            await batch.commit();

            setStatus({
                type: 'success',
                message: '遷移成功！',
                details: `共匯入 ${count} 筆資料：\n客戶: ${customers.length}\n服務: ${services.length}\n模板: ${templates.length}\n報價單: ${quotes.length}`
            });
            setProgress("");

        } catch (err) {
            console.error("Migration Failed:", err);
            setStatus({
                type: 'error',
                message: '遷移失敗',
                details: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6 mb-8">
            <div className="flex items-start gap-4">
                <div className="bg-indigo-100 p-3 rounded-xl">
                    <Database className="text-indigo-600" size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">資料遷移工具 (Migration Tool)</h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        此工具將從 Google Sheets (透過舊 n8n) 讀取所有資料，並匯入至 Firebase 資料庫。<br />
                        <span className="text-indigo-600 font-medium">適用於：剛切換到 Firebase 但想保留舊資料的情況。</span>
                    </p>

                    {status && (
                        <div className={`p-4 rounded-xl mb-4 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                            }`}>
                            <div className="flex items-center gap-2 font-bold mb-1">
                                {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                {status.message}
                            </div>
                            <pre className="whitespace-pre-wrap font-mono text-xs opacity-80 mt-1">{status.details}</pre>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <button
                            onClick={runMigration}
                            disabled={loading}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white shadow-sm transition-all
                ${loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0'
                                }`}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                            {loading ? progress || '處理中...' : '開始資料匯入 (Import)'}
                        </button>
                        {loading && <span className="text-xs text-indigo-600 font-mono animate-pulse">{progress}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataMigration;
