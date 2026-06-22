import React, { useState, useEffect } from "react";
import { Megaphone, Plus, Calendar, User, UserCheck, Trash2, Send, AlertCircle, Loader2 } from "lucide-react";
import { Announcement, UserRole } from "../types";
import { api } from "../utils/api";

interface AnnouncementsProps {
  role: UserRole;
  userName: string;
}

export default function AnnouncementsManager({ role, userName }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState<"ALL" | "TEACHERS" | "PARENTS" | "STUDENTS">("ALL");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await api.get("/api/v1/announcements");
      setAnnouncements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!title || !content) {
      setError("Bulletin Title and Content Body are mandatory.");
      setSaving(false);
      return;
    }

    try {
      await api.post("/api/v1/announcements", {
        title,
        content,
        targetAudience,
      });

      setModalOpen(false);
      setTitle("");
      setContent("");
      setTargetAudience("ALL");
      loadAnnouncements();
      setMsg("Bulletin successfully broadcasted globally.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bulletin notice permanently?")) return;
    try {
      await api.delete(`/api/v1/announcements/${id}`);
      loadAnnouncements();
      setMsg("Bulletin deleted.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Check if current user role can broadcast. Allowed: ADMIN, FINANCE, TEACHER
  const canPost = role === "ADMIN" || role === "FINANCE" || role === "TEACHER";

  return (
    <div id="rsms-announcements-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-950 inline-flex items-center gap-2">
            <Megaphone className="h-5.5 w-5.5 text-forest" />
            School Notices & Bulletins Board
          </h2>
          <p className="text-xs text-gray-500">Read and post administrative notice circulars, curriculum updates and security bulletins</p>
        </div>

        {canPost && (
          <button
            id="btn-add-notice"
            onClick={() => {
              setError("");
              setModalOpen(true);
            }}
            className="bg-forest hover:bg-[#06150d] text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            Post New Circular Notice
          </button>
        )}
      </div>

      {msg && <p className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-100 font-semibold">{msg}</p>}

      {/* ANNOUNCEMENT BOARD CARDS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 rounded-xl animate-skeleton" />
            <div className="h-28 rounded-xl animate-skeleton" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white p-12 text-center text-gray-400 border border-gray-100 rounded-2xl">
            No bulletins found on the Royal School notice board. Check back later for academic circulars.
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
              <div className="border-t-4 border-gold" />
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-base text-forest inline-flex items-center gap-1.5">{ann.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 font-medium">
                      <span className="flex items-center gap-0.5">
                        <User className="h-3.5 w-3.5 text-gold" />
                        Author: <strong>{ann.createdBy}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Calendar className="h-3.5 w-3.5 text-gold" />
                        Date: <strong>{ann.createdAt.split("T")[0]}</strong>
                      </span>
                      <span>•</span>
                      <span className="inline-block px-1.5 py-0.5 bg-gold/15 text-gold border border-gold/20 font-sans uppercase font-bold rounded text-[8px]">
                        Audience: {ann.targetAudience}
                      </span>
                    </div>
                  </div>

                  {canPost && (
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="text-gray-400 hover:text-red-550 p-1 rounded bg-gray-50 hover:bg-red-50 transition"
                      title="Delete Announcement"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div 
                  id="announcement-content"
                  className="text-xs text-gray-600 leading-relaxed max-w-4xl whitespace-pre-wrap"
                >
                  {ann.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative border-t-4 border-gold overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-serif font-bold text-gray-900">Publish News Circular Notice</h3>
              <p className="text-xs text-gray-500 mt-1">Broadcast real-time feeds to student, parents or teachers portals</p>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex items-center gap-1.5 animate-pulse">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Notice header Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. End of Term Reporting Day Guidance"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e: any) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg bg-white"
                  >
                    <option value="ALL">Everyone (ALL)</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="PARENTS">Parents Only</option>
                    <option value="STUDENTS">Students Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Notice Body Message content</label>
                <textarea
                  required
                  placeholder="Draft your announcement message clearly here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 text-xs py-2 text-gray-500 font-bold">Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-forest hover:bg-[#06150d] text-white py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Broadcast Notice
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
