import { useState, useEffect } from "react";
import { Award, Bell, Loader2, LogOut, Landmark, Calendar, UserCheck } from "lucide-react";
import { User, AcademicTerm } from "./types";
import { api } from "./utils/api";

// Component imports
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import TermManager from "./components/TermManager";
import ClassSubjectManager from "./components/ClassSubjectManager";
import StudentManager from "./components/StudentManager";
import AttendanceTracker from "./components/AttendanceTracker";
import ExamResultManager from "./components/ExamResultManager";
import BursarFinanceSystem from "./components/BursarFinanceSystem";
import TransportManager from "./components/TransportManager";
import LunchManager from "./components/LunchManager";
import AnnouncementsManager from "./components/AnnouncementsManager";
import SettingsManager from "./components/SettingsManager";
import StaffManager from "./components/StaffManager";
import PayrollManager from "./components/PayrollManager";
import ReportsManager from "./components/ReportsManager";
import StudentClassAssignment from "./components/StudentClassAssignment";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("rsms_token"));
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Academic term info
  const [activeTerm, setActiveTerm] = useState<AcademicTerm | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNoticeDropdown, setShowNoticeDropdown] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);

  // Authenticate session on boot
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setCheckingSession(false);
        return;
      }
      try {
        const data = await api.get("/api/v1/auth/me");
        setUser(data);
        
        // Fetch notice boards & terms
        const terms = await api.get("/api/v1/terms");
        setActiveTerm(terms.find((t: any) => t.isActive) || null);

        const anns = await api.get("/api/v1/announcements");
        setNotices(anns.slice(0, 5));
        setUnreadCount(anns.length);

      } catch (err) {
        console.warn("Stale token or server disconnected:", err);
        localStorage.removeItem("rsms_token");
        setUser(null);
        setToken(null);
      } finally {
        setCheckingSession(false);
      }
    }
    verifySession();
  }, [token]);

  const handleLoginSuccess = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("rsms_token");
    setUser(null);
    setToken(null);
  };

  if (checkingSession) {
    return (
      <div id="rsms-boot-loader" className="min-h-screen bg-[#f4f7f5] flex flex-col justify-center items-center font-sans gap-3">
        <div className="h-14 w-14 rounded-full border-2 border-gold flex items-center justify-center bg-forest animate-pulse shadow-md">
          <Award className="h-6 w-6 text-gold" />
        </div>
        <p className="text-sm font-serif font-bold text-forest tracking-wider uppercase animate-pulse">
          Royal School Management System
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
          Securing administrative session...
        </div>
      </div>
    );
  }

  // Not authenticated? Show split login view
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Define tab pages
  const renderTabPage = () => {
  switch (activeTab) {
    case "dashboard":
      return <Dashboard user={user} onTabChange={setActiveTab} />;
    case "terms":
      return <TermManager />;
    case "classes":
      return <ClassSubjectManager />;
    case "students":
      return <StudentManager />;
    case "assign-class":
      return <StudentClassAssignment />;
    case "attendance":
      return <AttendanceTracker />;
    case "exams":
      return <ExamResultManager />;
    case "finance":
      return <BursarFinanceSystem />;
    case "transport":
      return <TransportManager />;
    case "lunch":
      return <LunchManager />;
    case "reports":
      return <ReportsManager />;
    case "announcements":
      return <AnnouncementsManager role={user.role} userName={user.name} />;
    case "staff":
      return <StaffManager />;
    case "payroll":
      return <PayrollManager />;
    case "settings":
      return <SettingsManager user={user} />;
    default:
      return <Dashboard user={user} onTabChange={setActiveTab} />;
  }
};

  return (
    <div id="rsms-core-workspace" className="min-h-screen flex flex-col md:flex-row bg-[#f4f7f5] text-[#333333] font-sans antialiased overflow-hidden font-sans">
      
      {/* 1. FOREST-GREEN ROYAL SIDEBAR */}
      <Sidebar 
        role={user.role} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout}
        userName={user.name}
      />

      {/* 2. CORE CONTAINER WITH TOPBAR */}
      <div 
        id="rsms-main-viewport"
        className="flex-1 flex flex-col h-screen overflow-y-auto"
      >
        {/* TOPBAR PANEL */}
        <header 
          id="topbar-panel"
          className="bg-white border-b border-gray-100 h-16 px-6 flex items-center justify-between shrink-0 shadow-xs relative z-30"
        >
          {/* Active Level Title */}
          <div className="flex items-center space-x-3 text-xs pr-4 truncate">
            <div className="h-8 w-8 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
              <Landmark className="h-4.5 w-4.5 text-forest" />
            </div>
            <div className="truncate">
              <div className="font-serif font-extrabold text-forest text-sm truncate">Royal Academy Zambian ERP</div>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 inline-flex items-center gap-1 scale-95 origin-left">
                <Calendar className="h-3 w-3 text-gold" />
                Active Term bounds: <span className="text-gray-700 font-extrabold">{activeTerm ? activeTerm.name : "None Activated"}</span>
              </div>
            </div>
          </div>

          {/* Top-Right Notification items and Profile dropdown */}
          <div className="flex items-center gap-4">
            
            {/* Notification drop indicator */}
            <div className="relative">
              <button
                id="header-notification-button"
                onClick={() => {
                  setShowNoticeDropdown(!showNoticeDropdown);
                  if (unreadCount > 0) setUnreadCount(0);
                }}
                className="h-10 w-10 hover:bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 text-gray-500 relative transition"
              >
                <Bell className="h-4.5 w-4.5 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white font-extrabold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center animate-bounce min-w-fit">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification drop panel */}
              {showNoticeDropdown && (
                <div 
                  id="notifications-board-dropdown"
                  className="absolute right-0 mt-2 bg-white rounded-xl border border-gray-150 shadow-2xl w-80 text-xs py-2 z-50 animate-fade-in"
                >
                  <div className="px-4 py-2 border-b border-gray-100 font-serif font-bold text-forest text-sm flex justify-between items-center bg-gray-50/50">
                    <span>Recent Broadcast Bulletins</span>
                    <span className="text-[9px] uppercase font-bold text-gold">Notice Board</span>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                    {notices.length === 0 ? (
                      <p className="p-4 text-center text-gray-400">Notice Bulletin is currently clean.</p>
                    ) : (
                      notices.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            setActiveTab("announcements");
                            setShowNoticeDropdown(false);
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer block text-left"
                        >
                          <p className="font-bold text-gray-800 font-serif leading-tight">{n.title}</p>
                          <p className="text-[9px] text-gray-400 mt-1">Author: {n.createdBy} | {n.createdAt.split("T")[0]}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-100 text-center bg-gray-50/20">
                    <button
                      onClick={() => {
                        setActiveTab("announcements");
                        setShowNoticeDropdown(false);
                      }}
                      className="text-forest font-bold text-[10px] hover:underline uppercase"
                    >
                      Maximize notice board
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick self credentials tag */}
            <div className="hidden sm:flex items-center gap-2 border-l border-gray-100 pl-4">
              <div className="h-8 w-8 rounded-full bg-[#0a1f14] text-[#c9a84c] text-xs font-serif font-extrabold flex items-center justify-center border border-white shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-serif font-extrabold text-forest line-clamp-1 leading-snug">{user.name}</p>
                <span className="text-[9px] uppercase font-bold text-gold tracking-widest">{user.role}</span>
              </div>
            </div>

          </div>
        </header>

        {/* 3. SCROLLABLE TAB CHASSIS */}
        <main 
          id="rsms-viewport-content"
          className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto"
        >
          {renderTabPage()}
        </main>
      </div>
    </div>
  );
}
