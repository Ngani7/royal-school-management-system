import { useState } from "react";
import { Award, Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { api } from "../utils/api";
import { User } from "./types";

interface Props {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function Login({ onLoginSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/v1/auth/login", {
        username,
        password,
      });

      const { user, token } = response;
      localStorage.setItem("rsms_token", token);
      onLoginSuccess(user, token);
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest via-forest/95 to-forest/90 flex items-center justify-center p-4">
      {/* LEFT SIDE - BRANDING */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-start text-white px-12">
        <div className="mb-12">
          <div className="h-16 w-16 rounded-full bg-gold/20 flex items-center justify-center mb-6 border-2 border-gold/30">
            <Award className="h-8 w-8 text-gold" />
          </div>
          <h1 className="text-5xl font-serif font-bold leading-tight mb-4">Royal Academy</h1>
          <h2 className="text-4xl font-serif font-bold text-gold mb-6">Zambian ERP</h2>
          <p className="text-lg text-white/80 leading-relaxed max-w-md">
            Comprehensive school management system for academic excellence, student administration, and financial operations.
          </p>
        </div>

        <div className="space-y-4 mt-12">
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-2 h-2 bg-gold rounded-full"></div>
            <span>Student & Academic Management</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-2 h-2 bg-gold rounded-full"></div>
            <span>Attendance & Performance Tracking</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-2 h-2 bg-gold rounded-full"></div>
            <span>Billing & Invoicing System</span>
          </div>
          <div className="flex items-center gap-3 text-white/90">
            <div className="w-2 h-2 bg-gold rounded-full"></div>
            <span>Payroll & Staff Administration</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center lg:justify-start lg:pl-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10">
            {/* HEADER */}
            <div className="mb-8">
              <div className="lg:hidden h-12 w-12 rounded-full bg-forest/10 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-forest" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-forest mb-2">Welcome Back</h3>
              <p className="text-gray-600 text-sm">Sign in to your school management account</p>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* USERNAME */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-transparent transition text-gray-900"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-transparent transition text-gray-900"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full bg-forest hover:bg-forest/90 disabled:bg-gray-400 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-6"
              >
                <LogIn className="h-4 w-4" />
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* FOOTER INFO */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-center text-xs text-gray-500">
                🔒 Secure access for authorized staff and administrators only
              </p>
            </div>

            {/* TEST CREDENTIALS INFO (OPTIONAL) */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-2">📝 Default Test Credentials:</p>
              <div className="space-y-1 text-xs text-blue-800 font-mono">
                <p>👤 <span className="font-bold">admin</span> / <span className="font-bold">admin123</span></p>
                <p>💰 <span className="font-bold">finance</span> / <span className="font-bold">finance123</span></p>
              </div>
              <p className="text-xs text-blue-700 mt-2">⚠️ Change these in production!</p>
            </div>
          </div>

          {/* MOBILE BRANDING */}
          <div className="lg:hidden mt-8 text-center text-white/70 text-xs">
            <p>Royal Academy Zambian ERP System</p>
          </div>
        </div>
      </div>
    </div>
  );
}
