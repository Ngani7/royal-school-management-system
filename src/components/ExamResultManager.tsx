import React, { useState, useEffect } from "react";
import { Plus, FileSpreadsheet, Layers, Award, Save, RefreshCw, Trash2, ChartBar, Loader2 } from "lucide-react";
import { Class, Subject, Exam, Student, AcademicTerm } from "../types";
import { api } from "../utils/api";

export default function ExamResultManager() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeTerm, setActiveTerm] = useState<AcademicTerm | null>(null);

  // Selector state
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [gradesMap, setGradesMap] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"enter" | "list">("enter");

  // Create Exam Form state
  const [examModal, setExamModal] = useState(false);
  const [examName, setExamName] = useState("");
  const [examType, setExamType] = useState<"TEST" | "MIDTERM" | "FINAL">("TEST");
  const [examDate, setExamDate] = useState(new Date().toISOString().split("T")[0]);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const calculateGrade = (score: number): string => {
    if (score >= 85) return "A";
    if (score >= 75) return "B";
    if (score >= 65) return "C";
    if (score >= 50) return "D";
    return "F";
  };

  const calculateGradeColor = (g: string) => {
    switch (g) {
      case "A": return "text-emerald-700 bg-emerald-50 border-emerald-100";
      case "B": return "text-blue-700 bg-blue-50 border-blue-100";
      case "C": return "text-indigo-700 bg-indigo-50 border-indigo-100";
      case "D": return "text-amber-700 bg-amber-50 border-amber-100";
      default: return "text-red-700 bg-red-50 border-red-100";
    }
  };

  const loadBaseData = async () => {
    try {
      setLoading(true);
      const terms = await api.get("/api/v1/terms");
      const activeT = terms.find((t: any) => t.isActive) || null;
      setActiveTerm(activeT);

      const c = await api.get("/api/v1/classes");
      const sub = await api.get("/api/v1/subjects");
      setClasses(c);
      setSubjects(sub);

      if (c.length > 0) {
        setSelectedClassId(c[0].id);
      }
      if (sub.length > 0) {
        setSelectedSubjectId(sub[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadExamsList = async () => {
    try {
      const data = await api.get("/api/v1/exams");
      setExams(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBaseData();
    loadExamsList();
  }, []);

  // Sync Students Roster when target Grade is altered
  useEffect(() => {
    if (!selectedClassId) return;
    async function getStudents() {
      try {
        const roster = await api.get(`/api/v1/students?classId=${selectedClassId}`);
        setStudents(roster);
      } catch (err) {
        console.error(err);
      }
    }
    getStudents();
  }, [selectedClassId]);

  // Refetch results when target Exam or Course modifies
  useEffect(() => {
    if (!selectedExamId) {
      setGradesMap({});
      return;
    }

    const matchedE = exams.find(e => e.id === selectedExamId);
    if (matchedE) {
      const existingMarks: Record<string, number> = {};
      matchedE.results?.forEach((res) => {
        existingMarks[res.studentId] = res.marks;
      });
      setGradesMap(existingMarks);
    }
  }, [selectedExamId, exams]);

  const handleScoreChange = (studentId: string, val: string) => {
    const num = Math.min(100, Math.max(0, Number(val)));
    setGradesMap(prev => ({
      ...prev,
      [studentId]: num,
    }));
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!activeTerm) {
      setErr("Outstanding term session validation warning.");
      return;
    }

    try {
      await api.post("/api/v1/exams", {
        name: examName,
        type: examType,
        termId: activeTerm.id,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        date: examDate,
      });

      setExamModal(false);
      setExamName("");
      loadExamsList();
    } catch (err: any) {
      setErr(err.message);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this examination paper?")) return;
    try {
      await api.delete(`/api/v1/exams/${id}`);
      loadExamsList();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedExamId) {
      setErr("Configure Target Exam paper first.");
      return;
    }

    setSaving(true);
    setMsg("");
    setErr("");

    const results = Object.entries(gradesMap).map(([studentId, marks]) => ({
      studentId,
      marks,
    }));

    try {
      await api.post(`/api/v1/exams/${selectedExamId}/results`, { results });
      setMsg("Gradebook results compiled successfully.");
      loadExamsList();
    } catch (error: any) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  const currentClassExams = exams.filter(e => e.classId === selectedClassId && e.subjectId === selectedSubjectId);

  // Grade Distribution Counts for Dynamic SVG Metric Bars
  const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  Object.values(gradesMap).forEach(marks => {
    const g = calculateGrade(marks as number);
    distribution[g as keyof typeof distribution]++;
  });

  return (
    <div id="rsms-exam-result-view" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-950 inline-flex items-center gap-2">
            <FileSpreadsheet className="h-5.5 w-5.5 text-forest" />
            Exams & Performance Gradebook
          </h2>
          <p className="text-xs text-gray-500">Schedule assessments, input marks via grids, and view aggregated grade matrices</p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200 shrink-0">
          <button
            onClick={() => setTab("enter")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
              tab === "enter" ? "bg-forest text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Enter Result Matrix
          </button>
          <button
            onClick={() => setTab("list")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
              tab === "list" ? "bg-forest text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Schedules Registry
          </button>
        </div>
      </div>

      {msg && <p className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-100 font-semibold">{msg}</p>}
      {err && <p className="p-3 bg-red-50 text-red-800 text-xs rounded-lg border border-red-100 font-semibold">{err}</p>}

      {tab === "enter" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CONFIGURATION COLUMN LEFT */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm h-fit space-y-4">
            <h3 className="font-serif font-bold text-sm text-forest border-b border-gray-50 pb-2 uppercase tracking-wide">
              Result Ledger Config
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Target Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedExamId("");
                }}
                className="w-full px-3 py-2 border border-gray-250 text-xs rounded-lg text-gray-700 bg-white"
              >
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Target Course Unit</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedExamId("");
                }}
                className="w-full px-3 py-2 border border-gray-250 text-xs rounded-lg text-gray-700 bg-white"
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Active Scheduled Exam</label>
                <button
                  type="button"
                  onClick={() => setExamModal(true)}
                  className="text-[10px] font-bold text-forest hover:underline"
                >
                  + schedule exam
                </button>
              </div>

              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-250 text-xs rounded-lg text-gray-700 bg-white"
              >
                <option value="">-- Choose Exam Scheduling --</option>
                {currentClassExams.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                ))}
              </select>
            </div>

            {/* SYST GRADEBOUNDS INFO */}
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs space-y-1 text-gray-500">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wide block">Scale Grade Bounds</span>
              <p>A (Distinctive): 85% to 100%</p>
              <p>B (Merit Standard): 75% to 84%</p>
              <p>C (Clear Pass): 65% to 74%</p>
              <p>D (Marginal Pass): 50% to 64%</p>
              <p>F (Fail/Retake): Below 50%</p>
            </div>

            {/* DISTRIBUTIONS CHARTS GRAPHICAL METRIC */}
            {selectedExamId && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide font-bold block">Grade Distribution Summary</span>
                <div className="space-y-1.5 text-xs">
                  {Object.entries(distribution).map(([grade, count]) => {
                    const totalCount = students.length || 1;
                    const percent = Math.round((count / totalCount) * 100);
                    return (
                      <div key={grade} className="flex items-center gap-3">
                        <span className="w-4 font-bold text-gray-600">{grade}</span>
                        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-forest h-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-12 text-right text-[10px] text-gray-400">{count} pupils</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* GRID OF MARKS MIDDLE/RIGHT */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
            <div className="border-t-4 border-gold" />
            <div className="p-4 border-b border-gray-100 bg-gray-50/20">
              <h3 className="font-serif font-bold text-forest">Marks Grid Entry</h3>
              <p className="text-xs text-gray-500 mt-1">Direct single student tabular mark logbook sheets</p>
            </div>

            <div className="overflow-x-auto">
              {!selectedExamId ? (
                <div className="p-12 text-center text-gray-400 text-sm">
                  Please select an active scheduled exam on the left panel to display the gradebook marks sheets.
                </div>
              ) : students.length === 0 ? (
                <p className="p-12 text-center text-gray-400 text-sm">No active students enrolled under this Grade level.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                      <th className="p-4">Admission Number</th>
                      <th className="p-4">Student Full Name</th>
                      <th className="p-4 shrink-0" style={{ width: "120px" }}>Enter Marks (0-100)</th>
                      <th className="p-4">Assessed Letter Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => {
                      const score = gradesMap[student.id];
                      return (
                        <tr key={student.id} className="hover:bg-gray-50/50">
                          <td className="p-4 font-mono font-bold text-gray-800">{student.admissionNumber}</td>
                          <td className="p-4 font-serif font-bold text-forest text-sm">{student.firstName} {student.lastName}</td>
                          <td className="p-4">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={score !== undefined ? score : ""}
                              onChange={(e) => handleScoreChange(student.id, e.target.value)}
                              placeholder="e.g. 85"
                              className="w-20 px-2 py-1.5 border border-gray-200 rounded font-mono text-xs focus:ring-2 focus:ring-forest text-center"
                            />
                          </td>
                          <td className="p-4">
                            {score !== undefined ? (
                              <span className={`px-2.5 py-1 rounded text-[11px] font-bold border ${calculateGradeColor(calculateGrade(score))}`}>
                                Grade {calculateGrade(score)}
                              </span>
                            ) : (
                              <span className="text-gray-300 font-medium font-mono">Unrated</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {selectedExamId && students.length > 0 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  id="btn-save-marks"
                  onClick={handleSaveMarks}
                  disabled={saving}
                  className="bg-forest hover:bg-[#06150d] text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Posting Marks..." : "Commit Grading Ledger"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SCHEDULED EXAMS LISTS VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="border-t-4 border-gold" />
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-serif font-bold text-forest">Historical Scheduled Exams Logs</h3>
          </div>

          <div className="overflow-x-auto text-xs">
            {exams.length === 0 ? (
              <p className="p-12 text-center text-gray-400">No scheduled exam tracks created.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Exam Paper Item</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Grade</th>
                    <th className="p-4">Instruction subject</th>
                    <th className="p-4">Examining Date</th>
                    <th className="p-4 text-right">Delete Track</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {exams.map((ex) => (
                    <tr key={ex.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-serif font-bold text-forest text-sm">{ex.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-gray-200 rounded font-bold uppercase text-[10px]">
                          {ex.type}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-gray-600">{ex.class.name}</td>
                      <td className="p-4 font-semibold text-gray-600">{ex.subject.name}</td>
                      <td className="p-4 font-mono font-bold">{ex.date}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteExam(ex.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 text-right"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* CREATE EXAM PAPER MODAL */}
      {examModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-gold overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-gray-900">Schedule Examination Track</h3>
              <p className="text-xs text-gray-500 mt-1">Bind this paper to active curriculum courses</p>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4">
              {err && <p className="text-xs text-red-600 bg-red-50 p-2 text-center rounded">{err}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Examination Name / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End of Term Midterm"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Exam Type Structure
                  </label>
                  <select
                    value={examType}
                    onChange={(e: any) => setExamType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg bg-white"
                  >
                    <option value="TEST">TEST</option>
                    <option value="MIDTERM">MIDTERM</option>
                    <option value="FINAL">FINAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-250 text-sm rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-forest text-white/90 rounded-lg text-xs leading-relaxed font-serif">
                Currently bound Term session: <strong className="text-gold">{activeTerm ? activeTerm.name : "None Scheduled"}</strong>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setExamModal(false)} className="flex-1 text-xs py-2 text-gray-500 font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-forest text-white text-xs font-bold py-2 rounded-lg">Schedule Paper</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
