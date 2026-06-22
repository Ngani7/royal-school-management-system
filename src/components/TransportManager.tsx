import React, { useState, useEffect } from "react";
import { Bus, Plus, UserCheck, Trash2, ShieldCheck, MapPin, Contact, Loader2 } from "lucide-react";
import { TransportRoute, Student } from "../types";
import { api } from "../utils/api";

export default function TransportManager() {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Info
  const [routeModal, setRouteModal] = useState(false);
  const [enrollModal, setEnrollModal] = useState(false);

  // Form State - Route Info
  const [zoneName, setZoneName] = useState("");
  const [fee, setFee] = useState(1500);

  // Form State - Pass Enrollment
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [routeType, setRouteType] = useState<"ONE_WAY" | "ROUND_TRIP">("ROUND_TRIP");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const loadTransportData = async () => {
    try {
      setLoading(true);
      const r = await api.get("/api/v1/services/transport/routes");
      const s = await api.get("/api/v1/students?status=ACTIVE");
      setRoutes(r);
      setStudents(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransportData();
  }, []);

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!zoneName || fee <= 0) {
      setError("Route name and fee are required.");
      return;
    }

    try {
      await api.post("/api/v1/services/transport/routes", { zoneName, fee });
      setRouteModal(false);
      setZoneName("");
      loadTransportData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transport route zone?")) return;
    try {
      await api.delete(`/api/v1/services/transport/routes/${id}`);
      loadTransportData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEnrollPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!selectedRouteId || !selectedStudentId) {
      setError("Please choose both route zone and target student.");
      setSaving(false);
      return;
    }

    try {
      await api.post(`/api/v1/services/transport/routes/${selectedRouteId}/enroll`, {
        studentId: selectedStudentId,
        type: routeType,
      });

      setEnrollModal(false);
      loadTransportData();
      setMsg("Pupil transport bus pass successfully recorded.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeallocatePass = async (studentId: string, routeId: string) => {
    if (!confirm("Deallocate this pupil's shuttle pass?")) return;
    try {
      await api.delete(`/api/v1/services/transport/routes/${routeId}/students/${studentId}`);
      loadTransportData();
      setMsg("Pass deallocated and billed balance recalculated.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div id="rsms-transport-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4 font-sans">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-950 inline-flex items-center gap-2">
            <Bus className="h-5.5 w-5.5 text-forest" />
            Shuttle Logistic & Transit Services
          </h2>
          <p className="text-xs text-gray-500">Establish school shuttle zones, assign bus passes, and audit ridership roster logs</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setRouteModal(true)}
            className="border border-gray-255 hover:bg-gray-50 text-gray-700 bg-white text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5"
          >
            Create Route Zone
          </button>
          <button
            onClick={() => {
              setError("");
              setEnrollModal(true);
            }}
            className="bg-forest hover:bg-[#06150d] text-white text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition"
          >
            <UserCheck className="h-4 w-4" />
            Issue Bus Pass
          </button>
        </div>
      </div>

      {msg && <p className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-100 font-semibold">{msg}</p>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-44 bg-gray-100 rounded-xl" />
          <div className="h-44 bg-gray-100 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* ROUTES BENTO GRID CARDS LEFT */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-serif font-bold text-sm text-gray-900 uppercase tracking-wide">Chartered Shuttle Zones</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {routes.length === 0 ? (
                <div className="p-8 text-center text-gray-400 bg-white border border-gray-100 rounded-xl col-span-full">
                  No transport route zones saved. Create route zones using the buttons above.
                </div>
              ) : (
                routes.map((rt) => (
                  <div key={rt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                    <div className="border-t-4 border-gold" />
                    <div className="p-5 space-y-4">
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif font-bold text-base text-forest inline-flex items-center gap-1">
                            <MapPin className="h-4.5 w-4.5 text-gold" />
                            {rt.zoneName}
                          </h4>
                          <span className="block text-[10px] text-emerald-800 uppercase font-black bg-emerald-50 max-w-fit px-2 py-0.5 rounded mt-1.5">
                            Charge rate: K {rt.fee} / term
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteRoute(rt.id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-gray-50 flex justify-between items-center text-gray-500 font-medium">
                        <span>Allocated Riders</span>
                        <span className="font-bold text-gray-800">{rt.enrollments?.length || 0} active pupils</span>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIDERSHIP LISTING RIGHT */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 h-fit">
            <div className="border-b border-gray-150 pb-3">
              <h3 className="font-serif font-bold text-sm text-forest">Ridership Board</h3>
              <p className="text-xs text-gray-400 mt-1">Pupils scheduled with transit pick-up maps</p>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {routes.length === 0 ? (
                <p className="text-center text-gray-400 py-6">Roster board is clean.</p>
              ) : (
                routes.map(rt => 
                  rt.enrollments?.map((en) => (
                    <div key={en.id} className="p-2.5 bg-gray-50/70 rounded-xl border border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-semibold text-gray-900 block font-serif">
                          {en.student.firstName} {en.student.lastName}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Zone: <strong className="text-forest underline">{rt.zoneName}</strong> | Mode: <strong className="text-gold">{en.type}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeallocatePass(en.studentId, rt.id)}
                        className="text-[10px] font-bold text-red-500 hover:underline shrink-0"
                      >
                        Cancel Pass
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE ROUTE MODAL */}
      {routeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-gold overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-gray-900 font-serif">Configure Transit Route Zone</h3>
              <p className="text-xs text-gray-500 mt-1">Set term charter rates for surrounding areas</p>
            </div>

            <form onSubmit={handleCreateRoute} className="p-6 space-y-4">
              {error && <p className="text-xs text-red-650 bg-red-50 p-2 text-center rounded">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Zone Area Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zone A - Lilayi or Area 10 Roma"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Boarding Fee per Term (ZMW)</label>
                <input
                  type="number"
                  required
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setRouteModal(false)} className="flex-1 text-xs py-2 text-gray-500 font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-forest text-white text-xs font-bold py-2 rounded-lg">Save Route</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENROLL SHUTTLE PASS MODAL */}
      {enrollModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-gold overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-gray-900">Issue Transit Bus Pass</h3>
              <p className="text-xs text-gray-500 mt-1">Allocates student, billing their ledger immediately</p>
            </div>

            <form onSubmit={handleEnrollPass} className="p-6 space-y-4">
              {error && <p className="text-xs text-red-650 p-2.5 bg-red-50 text-center rounded-lg">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Choose Student</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 text-sm text-gray-700 bg-white rounded-lg"
                >
                  <option value="">-- Select Pupil --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNumber})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Target Route Zone</label>
                  <select
                    required
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 text-sm text-gray-700 bg-white rounded-lg"
                  >
                    <option value="">-- Choose Route --</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.zoneName} (K {r.fee})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Transit Type</label>
                  <select
                    value={routeType}
                    onChange={(e: any) => setRouteType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 text-sm text-gray-700 bg-white rounded-lg"
                  >
                    <option value="ROUND_TRIP">Round Trip (Two Ways)</option>
                    <option value="ONE_WAY">One Way Shuttle Only</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] leading-relaxed">
                Billing Rule: Issued passes are auto-integrated into student statement invoices under the assigned term structure.
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEnrollModal(false)} className="flex-1 text-xs py-2 text-gray-500 font-bold">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-forest text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center">
                  {saving ? "Deploying Pass..." : "Enable Pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
