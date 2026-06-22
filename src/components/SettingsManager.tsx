import React, { useState } from "react";
import { Settings, ShieldCheck, Key, UserCheck, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { User } from "../types";
import { api } from "../utils/api";

interface SettingsProps {
  user: User;
}

export default function SettingsManager({ user }: SettingsProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setSaving(true);

    if (newPassword !== confirmPassword) {
      setErr("Confirm password confirmation match failure.");
      setSaving(false);
      return;
    }

    try {
      await api.post("/api/v1/auth/change-password", {
        oldPassword,
        newPassword,
      });

      setMsg("Auth password modified successfully. Use your new secret credentials on next sign-in sessions.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setErr(error.message || "Failed to update security parameters.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="rsms-settings-view" className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl font-serif font-bold text-gray-950 inline-flex items-center gap-2">
          <Settings className="h-5.5 w-5.5 text-forest" />
          Profile Settings & Credentials security
        </h2>
        <p className="text-xs text-gray-500">Edit account metrics, change credentials of your account and review system permissions</p>
      </div>

      {msg && <p className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-100 font-semibold">{msg}</p>}
      {err && <p className="p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-100 font-semibold">{err}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* PROFILE CRIDENTIAL CARD LEFT */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
            <div className="h-10 w-10 rounded-full bg-forest text-gold font-bold font-serif text-sm flex items-center justify-center">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-forest">{user.name}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Role: {user.role}</p>
            </div>
          </div>

          <div className="space-y-3 font-medium text-gray-500">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block">Unique Username</span>
              <span className="font-mono text-gray-800 mt-1 block">{user.username}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block">Department Class Mapping</span>
              <span className="text-gray-800 mt-1 block">Royal School Principal Office</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 block">Accredited Authority Status</span>
              <span className="inline-flex mt-1 items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-full uppercase">
                <ShieldCheck className="h-3 w-3" /> Fully Verified
              </span>
            </div>
          </div>
        </div>

        {/* PASSWORD EDIT CARD MIDDLE / RIGHT */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm md:col-span-2 overflow-hidden">
          <div className="border-t-4 border-gold" />
          <div className="p-5 border-b border-gray-50">
            <h3 className="font-serif font-bold text-sm text-forest inline-flex items-center gap-1.5">
              <Key className="h-4.5 w-4.5 text-gold" />
              Change System Password
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Reset your unique credentials signature</p>
          </div>

          <form onSubmit={handleChangePassword} className="p-5 space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Original Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">New Target Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Confirm Target Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-50">
              <button
                type="submit"
                disabled={saving}
                className="bg-forest hover:bg-[#06150d] text-white px-5 py-2.5 rounded-lg text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Update Password parameters"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
