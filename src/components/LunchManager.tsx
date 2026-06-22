import React, { useState, useEffect } from "react";
import { Utensils, Plus, CheckCircle, Trash2, ShieldAlert, Sandwich, HelpCircle, Loader2 } from "lucide-react";
import { LunchPlan, Student } from "../types";
import { api } from "../utils/api";

export default function LunchManager() {
  const [plans, setPlans] = useState<LunchPlan[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [planModal, setPlanModal] = useState(false);
  const [subModal, setSubModal] = useState(false);

  // Form states - Plan
  const [name, setName] = useState("");
  const [cost, setCost] = useState(1200);
  const [description, setDescription] = useState("");

  // Form states - Sub
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const loadLunchData = async () => {
    try {
      setLoading(true);
      const p = await api.get("/api/v1/services/lunch/plans");
      const s = await api.get("/api/v1/students?status=ACTIVE");
      setPlans(p);
      setStudents(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLunchData();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || cost <= 0) {
      setError("Lunch plan name and term cost parameters are mandatory.");
      return;
    }

    try {
      await api.post("/api/v1/services/lunch/plans", { name, cost, description });
      setPlanModal(false);
      setName("");
      setDescription("");
      loadLunchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this catering plan permanently?")) return;
    try {
      await api.delete(`/api/v1/services/lunch/plans/${id}`);
      loadLunchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubscribeMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!selectedPlanId || !selectedStudentId) {
      setError("Please choose both student and target meal plan.");
      setSaving(false);
      return;
    }

    try {
      await api.post(`/api/v1/services/lunch/plans/${selectedPlanId}/subscribe`, {
        studentId: selectedStudentId,
      });

      setSubModal(false);
      loadLunchData();
      setMsg("Purchased menu subscription has been issued and linked to pupil billing.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeMeal = async (studentId: string, planId: string) => {
    if (!confirm("Cancel this pupil's lunch plan subscription?")) return;
    try {
      await api.delete(`/api/v1/services/lunch/plans/${planId}/students/${studentId}`);
      loadLunchData();
      setMsg("Pupil menu subscription canceled.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div id="rsms-lunch-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-950 inline-flex items-center gap-2">
            <Utensils className="h-5.5 w-5.5 text-forest" />
            Catering & School Meal Plans
          </h2>
          <p className="text-xs text-gray-500">Configure pupil menus with dietary parameters, manage subscription packages, and auto-bill bursa statement logs</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setPlanModal(true)}
            className="border border-gray-255 hover:bg-gray-50 text-gray-700 bg-white text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5"
          >
            Create Catering Plan
          </button>
          <button
            onClick={() => {
              setError("");
              setSubModal(true);
            }}
            className="bg-forest hover:bg-[#06150d] text-white text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <Plus className="h-4 w-4" />
            Subscribe pupil
          </button>
        </div>
      </div>

      {msg && <p className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-100 font-semibold">{msg}</p>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-44 bg-gray-150 rounded-xl" />
          <div className="h-44 bg-gray-150 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* LUNCH PLANS MATRIX LISTING LEFT */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-serif font-bold text-sm text-gray-900 uppercase tracking-wide">Accredited Meal Plans</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {plans.length === 0 ? (
                <div className="p-8 text-center text-gray-400 bg-white border border-gray-100 rounded-xl col-span-full">
                  No meal plans configured. Save plans using the menu buttons above.
                </div>
              ) : (
                plans.map((pl) => (
                  <div key={pl.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                    <div className="border-t-4 border-gold" />
                    <div className="p-5 space-y-4">
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif font-bold text-base text-forest inline-flex items-center gap-1">
                            <Sandwich className="h-4.5 w-4.5 text-gold" />
                            {pl.name}
                          </h4>
                          <span className="block text-[10px] text-emerald-800 uppercase font-black bg-emerald-50 max-w-fit px-2 py-0.5 rounded mt-1.5 font-sans">
                            Cost rate: K {pl.cost} / term
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeletePlan(pl.id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-gray-500 italic leading-relaxed text-[11px]">"{pl.description || 'Dietary guidelines specified by the kitchen department.'}"</p>

                      <div className="pt-2 border-t border-gray-55 flex justify-between items-center text-gray-500 font-medium">
                        <span>Roster Subscribers</span>
                        <span className="font-bold text-gray-800">{pl.enrollments?.length || 0} active students</span>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SUBSCRIBERS STATUS LOGS RIGHT */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 h-fit">
            <div className="border-b border-gray-150 pb-3">
              <h3 className="font-serif font-bold text-sm text-forest">Catering Subscribers</h3>
              <p className="text-xs text-gray-405 mt-1">Status logs of pupils registered on active menus</p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {plans.length === 0 ? (
                <p className="text-center text-gray-400 py-6">Subscriptions list is clean.</p>
              ) : (
                plans.map(pl => 
                  pl.enrollments?.map((en) => (
                    <div key={en.id} className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-semibold text-gray-900 block font-serif">
                          {en.student.firstName} {en.student.lastName}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Plan: <strong className="text-forest underline">{pl.name}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleUnsubscribeMeal(en.studentId, pl.id)}
                        className="text-[10px] font-bold text-red-500 hover:underline shrink-0"
                      >
                        Cancel Plan
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE CATERING MENU MODAL */}
      {planModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-gold overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-gray-900">Define Catering Package Plan</h3>
              <p className="text-xs text-gray-500 mt-1">Input meal parameters and nutritional constraints</p>
            </div>

            <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
              {error && <p className="text-xs text-red-650 bg-red-50 p-2 text-center rounded">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Catering Menu Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Hot Lunches / Pre-School Diet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Catering Fee per Term (ZMW)</label>
                <input
                  type="number"
                  required
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Diet Description</label>
                <textarea
                  placeholder="e.g. Vegetarian, allergen guidelines, meat options"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setPlanModal(false)} className="flex-1 text-xs py-2 text-gray-500 font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-forest text-white text-xs font-bold py-2 rounded-lg">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENROLL CATERING MEALS SUBLIMIT PASS MODAL */}
      {subModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-gold overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-105">
              <h3 className="text-lg font-serif font-bold text-gray-900">Subscribe Pupil to Menu</h3>
              <p className="text-xs text-gray-500 mt-1">Links pupil diet choice and auto-bills their ledger invoice</p>
            </div>

            <form onSubmit={handleSubscribeMeal} className="p-6 space-y-4">
              {error && <p className="text-xs text-red-650 p-2.5 bg-red-50 text-center rounded-lg">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Select Student</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 text-sm text-gray-700 bg-white rounded-lg animate-fade-in"
                >
                  <option value="">-- Choose Pupil --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1"> Cereal & Meal Pack</label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 text-sm text-gray-700 bg-white rounded-lg animate-fade-in"
                >
                  <option value="">-- Choose Meal Plan --</option>
                  {plans.map(pl => <option key={pl.id} value={pl.id}>{pl.name} (K {pl.cost})</option>)}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] leading-relaxed select-none">
                Billing Rule: Lunch programs are billed seamlessly once per active term. Subscribing now updates fees instantly.
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setSubModal(false)} className="flex-1 text-xs py-2 text-gray-500 font-bold">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-forest text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center">
                  {saving ? "Deploying..." : "Enable Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
