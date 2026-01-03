
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layout, 
  Trophy, 
  PlusCircle, 
  FileSpreadsheet, 
  Users, 
  Settings, 
  LogOut, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  Download,
  Search,
  Menu,
  X,
  TrendingUp
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// --- TYPES ---

type Role = 'ADMIN' | 'DUTY_TEACHER' | 'TEACHER';

interface User {
  email: string;
  name: string;
  role: Role;
}

interface ClassModel {
  id: string;
  name: string;
  grade: number;
}

interface Fault {
  id: string;
  name: string;
  point: number; // Negative or positive
  type: 'MINUS' | 'PLUS';
}

interface Week {
  id: string;
  name: string;
  monthId: string;
}

interface ScoreEntry {
  id: string;
  weekId: string;
  classId: string;
  faultId: string;
  pointChange: number;
  note: string;
  createdAt: string;
  createdBy: string;
}

interface AppState {
  activeYear: string | null;
  classes: ClassModel[];
  weeks: Week[];
  faults: Fault[];
  entries: ScoreEntry[];
  currentUser: User;
}

// --- MOCK DATA (SEED) ---

const MOCK_USER: User = { email: 'admin@school.edu.vn', name: 'Admin User', role: 'ADMIN' };

const SEED_CLASSES: ClassModel[] = [
  { id: 'C_6A', name: '6A', grade: 6 },
  { id: 'C_6B', name: '6B', grade: 6 },
  { id: 'C_7A', name: '7A', grade: 7 },
  { id: 'C_8A', name: '8A', grade: 8 },
  { id: 'C_9A', name: '9A', grade: 9 },
];

const SEED_WEEKS: Week[] = [
  { id: 'W_01', name: 'Tuần 1', monthId: 'M_09' },
  { id: 'W_02', name: 'Tuần 2', monthId: 'M_09' },
  { id: 'W_03', name: 'Tuần 3', monthId: 'M_09' },
  { id: 'W_04', name: 'Tuần 4', monthId: 'M_10' },
];

const SEED_FAULTS: Fault[] = [
  { id: 'F_01', name: 'Đi học muộn', point: -2, type: 'MINUS' },
  { id: 'F_02', name: 'Không đồng phục', point: -2, type: 'MINUS' },
  { id: 'F_03', name: 'Vệ sinh bẩn', point: -5, type: 'MINUS' },
  { id: 'F_04', name: 'Nói chuyện riêng', point: -1, type: 'MINUS' },
  { id: 'F_05', name: 'Đạt điểm tốt (Cả lớp)', point: 5, type: 'PLUS' },
  { id: 'F_06', name: 'Tham gia phong trào', point: 10, type: 'PLUS' },
];

// --- GAS BACKEND CODE (TO COPY) ---

const GAS_CODE = `
/**
 * CODE.GS - GOOGLE APPS SCRIPT BACKEND
 * Copy toàn bộ nội dung này vào file Code.gs trên script.google.com
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Quản Lý Thi Đua')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* --- API DISPATCHER --- */
function apiDispatch(action, payload) {
  try {
    const userEmail = Session.getActiveUser().getEmail();
    const props = PropertiesService.getScriptProperties();
    const activeId = props.getProperty('ACTIVE_YEAR_ID');
    
    // Context object
    const ctx = { email: userEmail, sheetId: activeId, payload: payload };

    if (action !== 'createYear' && action !== 'getInitData' && !activeId) {
       return { success: false, error: "Chưa có năm học nào được kích hoạt." };
    }

    switch (action) {
      case 'getInitData': return AppService.getInitData(ctx);
      case 'createYear': return AppService.createYear(ctx);
      case 'saveScore': return ScoreService.saveScore(ctx);
      case 'exportExcel': return ExportService.exportExcel(ctx);
      default: return { success: false, error: "Action not found" };
    }
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/* --- SERVICES --- */
const SheetHelper = {
  open: (id) => SpreadsheetApp.openById(id),
  getData: (sheet) => {
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    return data.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
  },
  generateUUID: () => Utilities.getUuid()
};

const AppService = {
  getInitData: (ctx) => {
    // Logic lấy dữ liệu khởi tạo, phân quyền
    // Trả về { user, role, classes, weeks, faults, entries... }
    // (Chi tiết xem thiết kế trong phần trả lời của AI)
    return { success: true, data: { user: ctx.email, role: 'ADMIN' } }; 
  },
  createYear: (ctx) => {
    const ss = SpreadsheetApp.create("ThiDua_" + ctx.payload.yearName);
    // Tạo các sheet CONFIG, CLASSES, MEMBERS, FAULTS, WEEKS, SCORE_ENTRIES
    // Lưu ID vào PropertiesService
    PropertiesService.getScriptProperties().setProperty('ACTIVE_YEAR_ID', ss.getId());
    return { success: true };
  }
};

const ScoreService = {
  saveScore: (ctx) => {
    const ss = SheetHelper.open(ctx.sheetId);
    const sheet = ss.getSheetByName('SCORE_ENTRIES');
    // Append row
    return { success: true };
  }
};

const ExportService = {
  exportExcel: (ctx) => {
    // Tạo sheet tạm, fill data, convert blob, return base64
    return { success: true, base64: "..." };
  }
};
`;

// --- COMPONENTS ---

export default function App() {
  const [view, setView] = useState<'DASHBOARD' | 'INPUT' | 'RANKING' | 'ADMIN' | 'DEPLOY'>('DASHBOARD');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  
  // App State
  const [state, setState] = useState<AppState>({
    activeYear: '2025-2026',
    classes: SEED_CLASSES,
    weeks: SEED_WEEKS,
    faults: SEED_FAULTS,
    entries: [],
    currentUser: MOCK_USER
  });

  // Derived State: Rankings
  const rankings = useMemo(() => {
    const baseScore = 100;
    const map = new Map<string, {
      classModel: ClassModel, 
      plus: number, 
      minus: number, 
      total: number
    }>();

    // Init map
    state.classes.forEach(c => {
      map.set(c.id, { classModel: c, plus: 0, minus: 0, total: baseScore });
    });

    // Calculate
    state.entries.forEach(e => {
      const current = map.get(e.classId);
      if (current) {
        if (e.pointChange < 0) current.minus += e.pointChange;
        else current.plus += e.pointChange;
        current.total += e.pointChange;
      }
    });

    // Sort
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .map((item, index) => ({ ...item, rank: index + 1 }));

  }, [state.classes, state.entries]);

  // Actions
  const handleSaveScore = (entry: Omit<ScoreEntry, 'id' | 'createdAt' | 'createdBy'>) => {
    setLoading(true);
    setTimeout(() => {
      const newEntry: ScoreEntry = {
        ...entry,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser.email
      };
      setState(prev => ({ ...prev, entries: [...prev.entries, newEntry] }));
      setLoading(false);
      showToast('Đã lưu điểm thành công!', 'success');
    }, 600);
  };

  const handleExport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Đã xuất file Excel (Mô phỏng)!', 'success');
    }, 1000);
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const switchRole = (role: Role) => {
    setState(prev => ({...prev, currentUser: {...prev.currentUser, role}}));
    showToast(`Đã chuyển quyền sang: ${role}`, 'success');
  };

  return (
    <div className="font-sans text-gray-800 bg-gray-50 min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-blue-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-yellow-300" />
            <span className="text-xl font-bold tracking-tight">ThiDua App</span>
            {state.activeYear && (
              <span className="bg-blue-600 text-xs px-2 py-1 rounded-full border border-blue-500">
                {state.activeYear}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">{state.currentUser.name}</span>
              <span className="text-xs text-blue-200">{state.currentUser.role}</span>
            </div>
            {/* Dev tool to switch roles */}
            <select 
              className="text-black text-xs p-1 rounded bg-blue-100 border-none outline-none"
              value={state.currentUser.role}
              onChange={(e) => switchRole(e.target.value as Role)}
            >
              <option value="ADMIN">Admin View</option>
              <option value="DUTY_TEACHER">GV Trực tuần</option>
              <option value="TEACHER">Giáo viên</option>
            </select>
          </div>
        </div>
        
        {/* NAV BAR */}
        <div className="container mx-auto px-4 mt-2">
          <nav className="flex space-x-1 overflow-x-auto pb-0">
            <NavButton active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} icon={Layout}>Tổng quan</NavButton>
            {(state.currentUser.role === 'ADMIN' || state.currentUser.role === 'DUTY_TEACHER') && (
              <NavButton active={view === 'INPUT'} onClick={() => setView('INPUT')} icon={PlusCircle}>Nhập điểm</NavButton>
            )}
            <NavButton active={view === 'RANKING'} onClick={() => setView('RANKING')} icon={FileSpreadsheet}>Xếp hạng</NavButton>
            {state.currentUser.role === 'ADMIN' && (
              <NavButton active={view === 'ADMIN'} onClick={() => setView('ADMIN')} icon={Settings}>Quản trị</NavButton>
            )}
             <NavButton active={view === 'DEPLOY'} onClick={() => setView('DEPLOY')} icon={Download}>Hướng dẫn & Deploy</NavButton>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {loading && (
          <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-4 rounded-lg shadow-xl flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
              <span className="font-medium text-gray-700">Đang xử lý...</span>
            </div>
          </div>
        )}

        {view === 'DASHBOARD' && <DashboardView rankings={rankings} entries={state.entries} weeks={state.weeks} toRanking={() => setView('RANKING')} />}
        {view === 'INPUT' && <InputScoreView weeks={state.weeks} classes={state.classes} faults={state.faults} onSave={handleSaveScore} />}
        {view === 'RANKING' && <RankingView rankings={rankings} weeks={state.weeks} onExport={handleExport} />}
        {view === 'ADMIN' && <AdminView data={state} />}
        {view === 'DEPLOY' && <DeployGuide code={GAS_CODE} />}

      </main>

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded shadow-lg text-white transform transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function NavButton({ active, onClick, children, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
        active 
          ? 'border-white text-white font-semibold' 
          : 'border-transparent text-blue-200 hover:text-white hover:border-blue-300'
      }`}
    >
      <Icon size={18} />
      <span>{children}</span>
    </button>
  );
}

function DashboardView({ rankings, entries, weeks, toRanking }: any) {
  const top3 = rankings.slice(0, 3);

  // Prepare Chart Data: Top 5 classes cumulative scores over weeks
  const chartData = useMemo(() => {
    // 1. Identify Top 5 Classes
    const top5Classes = rankings.slice(0, 5).map((r: any) => r.classModel);
    
    // 2. Map weeks to data points
    // Assume weeks are sorted. For each week, calculate cumulative score for these classes.
    // Start with 100 base score.
    const classScores: Record<string, number> = {};
    top5Classes.forEach((c: ClassModel) => classScores[c.id] = 100);

    return weeks.map((w: Week) => {
      const dataPoint: any = { name: w.name };
      
      // Calculate changes for this week
      const entriesForWeek = entries.filter((e: ScoreEntry) => e.weekId === w.id);
      
      top5Classes.forEach((c: ClassModel) => {
         const classEntries = entriesForWeek.filter((e: ScoreEntry) => e.classId === c.id);
         const change = classEntries.reduce((sum: number, e: ScoreEntry) => sum + e.pointChange, 0);
         classScores[c.id] += change;
         dataPoint[c.name] = classScores[c.id];
      });

      return dataPoint;
    });
  }, [rankings, entries, weeks]);

  const top5Classes = rankings.slice(0, 5).map((r: any) => r.classModel);
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Hero Stats */}
      <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Xin chào!</h2>
        <p className="opacity-90 mb-4">Hệ thống quản lý thi đua trực tuyến.</p>
        <div className="flex space-x-8">
          <div>
            <span className="block text-3xl font-bold">{rankings.length}</span>
            <span className="text-sm opacity-75">Lớp tham gia</span>
          </div>
          <div>
            <span className="block text-3xl font-bold">{entries.length}</span>
            <span className="text-sm opacity-75">Lượt nhập điểm</span>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="col-span-1 md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
           <TrendingUp className="text-blue-500" size={20}/> Biểu đồ thi đua (Top 5)
        </h3>
        <div className="h-[300px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
               <XAxis dataKey="name" style={{ fontSize: '12px' }} />
               <YAxis style={{ fontSize: '12px' }} domain={['auto', 'auto']} />
               <Tooltip 
                 contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                 itemStyle={{ fontSize: '12px' }}
               />
               <Legend wrapperStyle={{ paddingTop: '10px' }}/>
               {top5Classes.map((c: ClassModel, idx: number) => (
                 <Line 
                   key={c.id}
                   type="monotone" 
                   dataKey={c.name} 
                   stroke={colors[idx % colors.length]} 
                   strokeWidth={2}
                   dot={{ r: 4 }}
                   activeDot={{ r: 6 }}
                 />
               ))}
             </LineChart>
           </ResponsiveContainer>
        </div>
      </div>

      {/* Top Ranking Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20}/> Top Tuần
          </h3>
          <button onClick={toRanking} className="text-sm text-blue-600 hover:underline">Xem tất cả</button>
        </div>
        <div className="space-y-3">
          {top3.map((r: any, i: number) => (
            <div key={r.classModel.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${i===0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
                  {r.rank}
                </span>
                <span className="font-medium text-gray-800">Lớp {r.classModel.name}</span>
              </div>
              <span className="font-bold text-blue-600">{r.total} đ</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
           <Calendar className="text-blue-500" size={20}/> Hoạt động gần đây
        </h3>
        <div className="text-sm text-gray-500 space-y-3">
            {entries.length === 0 ? (
                <p className="text-center py-4 italic">Chưa có dữ liệu mới.</p>
            ) : (
                entries.slice(-3).reverse().map((e: any) => (
                    <div key={e.id} className="border-b border-gray-100 pb-2 last:border-0">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-800">Lớp {e.classId.replace('C_','')}</span>
                            <span className={e.pointChange < 0 ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                                {e.pointChange > 0 ? '+' : ''}{e.pointChange}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{e.note}</p>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}

function InputScoreView({ weeks, classes, faults, onSave }: any) {
  const [form, setForm] = useState({
    weekId: weeks[0]?.id || '',
    classId: classes[0]?.id || '',
    faultId: '',
    point: 0,
    note: ''
  });

  const handleFaultChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fid = e.target.value;
    const fault = faults.find((f: Fault) => f.id === fid);
    setForm(prev => ({
      ...prev,
      faultId: fid,
      point: fault ? fault.point : 0,
      note: fault ? fault.name : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.faultId) return alert('Vui lòng chọn lỗi');
    onSave({
      weekId: form.weekId,
      classId: form.classId,
      faultId: form.faultId,
      pointChange: Number(form.point),
      note: form.note
    });
    // Reset basic fields
    setForm(prev => ({ ...prev, faultId: '', point: 0, note: '' }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Nhập điểm thi đua</h2>
          <p className="text-sm text-gray-500">Chọn tuần, lớp và lỗi vi phạm để ghi nhận.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tuần học</label>
              <select 
                className="w-full rounded border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.weekId}
                onChange={e => setForm({...form, weekId: e.target.value})}
              >
                {weeks.map((w: Week) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
              <select 
                className="w-full rounded border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.classId}
                onChange={e => setForm({...form, classId: e.target.value})}
              >
                {classes.map((c: ClassModel) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lỗi / Thành tích</label>
            <select 
              className="w-full rounded border-gray-300 border px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.faultId}
              onChange={handleFaultChange}
            >
              <option value="">-- Chọn danh mục --</option>
              {faults.map((f: Fault) => (
                <option key={f.id} value={f.id} className={f.type === 'PLUS' ? 'text-green-600' : 'text-red-600'}>
                   {f.name} ({f.point > 0 ? '+' : ''}{f.point}đ)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Điểm (+/-)</label>
               <input 
                 type="number" 
                 step="0.1"
                 className={`w-full rounded border-gray-300 border px-3 py-2 font-bold outline-none ${form.point < 0 ? 'text-red-600' : 'text-green-600'}`}
                 value={form.point}
                 onChange={e => setForm({...form, point: Number(e.target.value)})}
               />
            </div>
            <div className="col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú chi tiết</label>
               <input 
                 type="text" 
                 className="w-full rounded border-gray-300 border px-3 py-2 text-gray-700 outline-none"
                 value={form.note}
                 onChange={e => setForm({...form, note: e.target.value})}
                 placeholder="VD: Nguyễn Văn A..."
               />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition-colors flex justify-center items-center gap-2"
            >
              <PlusCircle size={20} /> Lưu Kết Quả
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RankingView({ rankings, weeks, onExport }: any) {
  const [filterWeek, setFilterWeek] = useState(weeks[0]?.id || '');
  
  // In a real app, we would filter 'rankings' based on the selected week here.
  // For this mock, 'rankings' is global, but let's assume it's "Current View".
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">Bảng Xếp Hạng</h2>
          <select 
            className="rounded border-gray-300 border px-3 py-1.5 text-sm text-gray-700 outline-none bg-gray-50"
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
          >
            {weeks.map((w: Week) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
        >
          <Download size={16} /> Xuất Excel
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold border-b text-center w-16">Hạng</th>
              <th className="p-4 font-semibold border-b">Lớp</th>
              <th className="p-4 font-semibold border-b text-right">Điểm Đầu</th>
              <th className="p-4 font-semibold border-b text-right text-green-600">Điểm Cộng</th>
              <th className="p-4 font-semibold border-b text-right text-red-600">Điểm Trừ</th>
              <th className="p-4 font-semibold border-b text-right">Tổng Kết</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {rankings.map((r: any) => (
              <tr key={r.classModel.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 text-center">
                  <span className={`inline-block w-6 h-6 rounded-full leading-6 font-bold text-xs 
                    ${r.rank === 1 ? 'bg-yellow-100 text-yellow-700' : 
                      r.rank === 2 ? 'bg-gray-200 text-gray-700' : 
                      r.rank === 3 ? 'bg-orange-100 text-orange-800' : 'text-gray-500'}`}>
                    {r.rank}
                  </span>
                </td>
                <td className="p-4 font-medium text-gray-800">{r.classModel.name}</td>
                <td className="p-4 text-right text-gray-500">100</td>
                <td className="p-4 text-right text-green-600 font-medium">+{parseFloat(r.plus.toFixed(2))}</td>
                <td className="p-4 text-right text-red-600 font-medium">{parseFloat(r.minus.toFixed(2))}</td>
                <td className="p-4 text-right font-bold text-blue-700 text-base">{parseFloat(r.total.toFixed(2))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminView({ data }: { data: AppState }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Danh sách lớp học</h3>
        <div className="h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500"><th>Mã</th><th>Tên</th><th>Khối</th></tr>
            </thead>
            <tbody>
              {data.classes.map(c => (
                <tr key={c.id} className="border-b last:border-0 h-10">
                  <td>{c.id}</td>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="mt-4 w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded hover:bg-gray-50 text-sm">
          + Thêm lớp mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Danh mục lỗi / điểm</h3>
        <div className="h-64 overflow-y-auto">
           <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500"><th>Tên lỗi</th><th className="text-right">Điểm</th></tr>
            </thead>
            <tbody>
              {data.faults.map(f => (
                <tr key={f.id} className="border-b last:border-0 h-10">
                  <td className="truncate max-w-[200px]">{f.name}</td>
                  <td className={`text-right font-bold ${f.point < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {f.point}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="mt-4 w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded hover:bg-gray-50 text-sm">
          + Thêm danh mục
        </button>
      </div>
    </div>
  );
}

function DeployGuide({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Hướng dẫn cài đặt & Triển khai</h2>
      
      <div className="space-y-6">
        <section>
          <h3 className="font-bold text-lg text-blue-700 mb-2">Bước 1: Tạo Google Apps Script</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm">
            <li>Truy cập <a href="https://script.google.com" target="_blank" className="text-blue-500 underline">script.google.com</a> và tạo dự án mới.</li>
            <li>Copy toàn bộ mã nguồn bên dưới vào file <code>Code.gs</code>.</li>
            <li>Tạo file <code>index.html</code> trong dự án Script và copy toàn bộ nội dung file HTML (Sau khi build React). 
              <br/><em className="text-xs text-gray-500">(Trong môi trường thực tế, bạn sẽ dùng 'clasp' để push code build lên)</em>
            </li>
          </ol>
        </section>

        <section>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg text-blue-700">Mã nguồn Backend (Code.gs)</h3>
            <button 
              onClick={handleCopy}
              className={`text-xs px-3 py-1 rounded border ${copied ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
            >
              {copied ? 'Đã copy!' : 'Copy Code'}
            </button>
          </div>
          <div className="relative">
            <textarea 
              readOnly 
              className="w-full h-64 p-4 font-mono text-xs bg-gray-800 text-gray-200 rounded-lg outline-none resize-y"
              value={code}
            />
          </div>
        </section>

        <section>
            <h3 className="font-bold text-lg text-blue-700 mb-2">Bước 2: Triển khai (Deploy)</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
                <li>Nhấn nút <strong>Deploy</strong> &rarr; <strong>New Deployment</strong>.</li>
                <li>Chọn loại: <strong>Web App</strong>.</li>
                <li>Execute as: <strong>Me</strong> (Để script có quyền tạo/ghi file vào Drive của bạn).</li>
                <li>Who has access: <strong>Anyone within [Your Domain]</strong> hoặc <strong>Anyone with Google Account</strong>.</li>
            </ul>
        </section>
      </div>
    </div>
  );
}
