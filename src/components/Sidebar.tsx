import { useState } from "react";
import {
  Award,
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  CheckSquare,
  BarChart3,
  Banknote,
  Truck,
  UtensilsCrossed,
  Megaphone,
  Settings,
  LogOut,
  ChevronDown,
  Users2,
  TrendingUp,
  FileText,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  role: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userName: string;
}

export default function Sidebar({
  role,
  activeTab,
  onTabChange,
  onLogout,
  userName,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "FINANCE", "TEACHER", "STUDENT", "PARENT"] },
    { id: "terms", label: "Term Manager", icon: Calendar, roles: ["ADMIN"] },
    { id: "classes", label: "Classes & Subjects", icon: BookOpen, roles: ["ADMIN", "TEACHER", "FINANCE"] },
    { id: "assign-class", label: "Assign to Class", icon: Users, roles: ["ADMIN", "TEACHER", "FINANCE"] },
    { id: "students", label: "Student Records", icon: Users, roles: ["ADMIN", "TEACHER"] },
    { id: "attendance", label: "Attendance", icon: CheckSquare, roles: ["ADMIN", "TEACHER"] },
    { id: "exams", label: "Exams & Results", icon: BarChart3, roles: ["ADMIN", "TEACHER"] },
    { id: "finance", label: "Bursary Portal", icon: Banknote, roles: ["ADMIN", "FINANCE"] },
    { id: "transport", label: "Transport", icon: Truck, roles: ["ADMIN"] },
    { id: "lunch", label: "Lunch Management", icon: UtensilsCrossed, roles: ["ADMIN"] },
    { id: "announcements", label: "Announcements", icon: Megaphone, roles: ["ADMIN", "TEACHER"] },
    { id: "staff", label: "Staff Management", icon: Users2, roles: ["ADMIN"] },
    { id: "payroll", label: "Payroll", icon: TrendingUp, roles: ["ADMIN", "FINANCE"] },
  ];

  const reportItems = [
    { id: "reports", label: "All Reports", icon: FileText },
  ];

  const settingsItems = [
    { id: "settings", label: "Settings", icon: Settings, roles: ["ADMIN", "FINANCE", "TEACHER"] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));
  const filteredSettingsItems = settingsItems.filter((item) => item.roles.includes(role));

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* MOBILE TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-forest text-white p-2 rounded-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:relative
          top-0 left-0 h-screen w-64
          bg-forest text-white
          overflow-y-auto
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          z-40 md:z-auto
          flex flex-col
        `}
      >
        {/* LOGO */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center border border-gold/30">
              <Award className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-sm font-serif font-bold">Royal Academy</p>
              <p className="text-xs text-gold">Management System</p>
            </div>
          </div>
        </div>

        {/* USER INFO */}
        <div className="p-4 border-b border-white/10">
          <p className="text-xs text-white/60 uppercase mb-1">Logged in as</p>
          <p className="text-sm font-bold truncate">{userName}</p>
          <p className="text-xs text-gold uppercase font-bold mt-1">{role}</p>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* MAIN ITEMS */}
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg transition
                  flex items-center gap-3 text-sm font-medium
                  ${
                    isActive
                      ? "bg-gold/20 text-gold border-l-2 border-gold"
                      : "text-white/80 hover:bg-white/5"
                  }
                `}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </button>
            );
          })}

          {/* REPORTS SECTION */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="px-4 text-xs font-bold text-gold uppercase mb-3">📊 Reports</p>
            <button
              onClick={() => handleTabChange("reports")}
              className={`
                w-full text-left px-4 py-3 rounded-lg transition
                flex items-center gap-3 text-sm font-medium
                ${
                  activeTab === "reports"
                    ? "bg-gold/20 text-gold border-l-2 border-gold"
                    : "text-white/80 hover:bg-white/5"
                }
              `}
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
              Reports & Print Lists
            </button>
          </div>

          {/* SETTINGS SECTION */}
          <div className="mt-6 pt-6 border-t border-white/10">
            {filteredSettingsItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg transition
                    flex items-center gap-3 text-sm font-medium
                    ${
                      isActive
                        ? "bg-gold/20 text-gold border-l-2 border-gold"
                        : "text-white/80 hover:bg-white/5"
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
