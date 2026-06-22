import React, { useState, useEffect } from "react";
import { Plus, Calendar, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { AcademicTerm } from "../types";
import { api } from "../utils/api";

export default function TermManager() {
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(false);
  
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const loadTerms = async () => {
    try {
      setLoading(true);
      const data = await api.get("/api/v1/terms");
      setTerms(data);
    } catch (err: any) {
      console.error("Failed to load academic terms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPosting(true);

    if (!name || !startDate || !endDate) {
      setError("Please fill in all academic term parameters.");
      setPosting(false);
      return;
    }

    try {
      await api.post("/api/v1/terms", { name, startDate, endDate, isActive });
      setModalOpen(false);
      // Reset form
      setName("");
      setStartDate("");
      setEndDate("");
      setIsActive(false);
      loadTerms();
    } catch (err: any) {
      setError(err.message || "Failed to create term.");
    } finally {
      setPosting(false);
    }
  };

  const handleActivateTerm = async (id: string) => {
    try {
      await api.patch(`/api/v1/terms/${id}/activate`, {});
      loadTerms();
    } catch (err: any) {
      alert("Error activating term: " + err.message);
    }
  };

  return (
    <div id="rsms-term-manager" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-950 inline-flex items-center gap-2">
            <Calendar className="h-5.5 w-5.5 text-forest" />
            Academic Term Manager
          </h2>
          <p className="text-xs text-gray-500">Configure academic quarters, activate terms, and control system billing bounds</p>
        </div>
        <button
          id="btn-create-term"
          onClick={() => {
            setError("");
            setModalOpen(true);
          }}
          className="bg-forest hover:bg-[#06150d] text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Academic Term
        </button>
      </div>

      {/* Terms list table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-t-4 border-gold" />
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              <div className="h-10 rounded animate-skeleton" />
              <div className="h-10 rounded animate-skeleton" />
              <div className="h-10 rounded animate-skeleton" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Term Title</th>
                  <th className="p-4">Starts Date</th>
                  <th className="p-4">Ends Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {terms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No academic terms found. Create a term to begin.
                    </td>
                  </tr>
                ) : (
                  terms.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-serif font-bold text-forest">{t.name}</td>
                      <td className="p-4 text-gray-600">{t.startDate}</td>
                      <td className="p-4 text-gray-600">{t.endDate}</td>
                      <td className="p-4">
                        {t.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-100">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            ACTIVE TERM
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-gray-400 font-medium">
                            Inactive / Historical
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!t.isActive && (
                          <button
                            id={`activate-term-${t.id}`}
                            onClick={() => handleActivateTerm(t.id)}
                            className="text-xs font-bold text-forest bg-gold/15 hover:bg-gold/30 px-3 py-1 rounded transition-colors"
                          >
                            Set As Active Term
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-gold overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-gray-900">Create Academic Term</h3>
              <p className="text-xs text-gray-500 mt-1">Initialize dates and set status</p>
            </div>

            <form onSubmit={handleCreateTerm} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Term Title / Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Term 1 - 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest focus:border-forest"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-forest focus:ring-forest"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-medium text-gray-700 select-none">
                  Activate this term immediately (Deactivates current active term)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="flex-1 bg-forest hover:bg-[#06150d] text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                >
                  {posting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Save Term"
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
