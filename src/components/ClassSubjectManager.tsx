import React, { useState, useEffect } from "react";
import { Plus, BookOpen, Layers, Users, Trash2, ShieldPlus, Loader2, RefreshCw, X, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Class, Subject, Stream, Student } from "../types";
import { api } from "../utils/api";

interface StudentWithPayment extends Student {
  payments?: Array<{
    id: string;
    amount: number;
    feesPaid: number;
    balance: number;
    academicTermId: string;
  }>;
}

export default function ClassSubjectManager() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"classes" | "subjects">("classes");

  // Modals Info
  const [classModal, setClassModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [streamModal, setStreamModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [classDetailModal, setClassDetailModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [classStudents, setClassStudents] = useState<StudentWithPayment[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Form State - Class
  const [className, setClassName] = useState("");
  const [schoolLevel, setSchoolLevel] = useState<"ECE" | "PRIMARY" | "SECONDARY">("PRIMARY");
  const [classTeacher, setClassTeacher] = useState("");
  const [capacity, setCapacity] = useState(40);
  const [academicYear, setAcademicYear] = useState("2026");

  // Form State - Subject
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  // Form State - Stream
  const [selectedClassId, setSelectedClassId] = useState("");
  const [streamName, setStreamName] = useState("");
  const [streamTeacher, setStreamTeacher] = useState("");

  // Form State - Assignment
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [assignClassId, setAssignClassId] = useState("");

  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const c = await api.get("/api/v1/classes");
      const s = await api.get("/api/v1/subjects");
      setClasses(c);
      setSubjects(s);
    } catch (err) {
      console.error("Failed to load academic records:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassStudents = async (classId: string) => {
    try {
      setLoadingStudents(true);
      const students = await api.get(`/api/v1/students?classId=${classId}`);
      setClassStudents(students || []);
    } catch (err) {
      console.error("Failed to load class students:", err);
      setClassStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewClass = async (classData: Class) => {
    setSelectedClass(classData);
    setClassDetailModal(true);
    await loadClassStudents(classData.id);
  };

  const getPaymentStatus = (student: StudentWithPayment) => {
    if (!student.payments || student.payments.length === 0) {
      return { status: "NOT_PAID", label: "Not Paid", color: "bg-red-100 text-red-700", icon: AlertCircle };
    }

    const totalFeesPaid = student.payments.reduce((sum, p) => sum + p.feesPaid, 0);
    const totalBalance = student.payments.reduce((sum, p) => sum + p.balance, 0);

    if (totalBalance === 0) {
      return { status: "PAID", label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle };
    } else if (totalFeesPaid > 0) {
      return { status: "PARTIAL", label: "Partial", color: "bg-yellow-100 text-yellow-700", icon: Clock };
    } else {
      return { status: "NOT_PAID", label: "Not Paid", color: "bg-red-100 text-red-700", icon: AlertCircle };
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPosting(true);

    if (!className || !schoolLevel) {
      setError("Class Name and School Level are mandatory.");
      setPosting(false);
      return;
    }

    try {
      await api.post("/api/v1/classes", {
        name: className,
        schoolLevel,
        classTeacher,
        capacity,
        academicYear,
      });
      setClassModal(false);
      setClassName("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class? This will expunge all linked streams and students relations!")) return;
    try {
      await api.delete(`/api/v1/classes/${id}`);
      loadData();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPosting(true);

    if (!subjectName || !subjectCode) {
      setError("Subject Name and Code are mandatory.");
      setPosting(false);
      return;
    }

    try {
      await api.post("/api/v1/subjects", { name: subjectName, code: subjectCode });
      setSubjectModal(false);
      setSubjectName("");
      setSubjectCode("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Delete this subject globally?")) return;
    try {
      await api.delete(`/api/v1/subjects/${id}`);
      loadData();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleAddStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPosting(true);

    if (!streamName || !selectedClassId) {
      setError("Stream Name is required.");
      setPosting(false);
      return;
    }

    try {
      await api.post(`/api/v1/classes/${selectedClassId}/streams`, {
        name: streamName,
        teacher: streamTeacher,
      });
      setStreamModal(false);
      setStreamName("");
      setStreamTeacher("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteStream = async (classId: string, streamId: string) => {
    if (!confirm("Delete this stream?")) return;
    try {
      await api.delete(`/api/v1/classes/${classId}/streams/${streamId}`);
      loadData();
    } catch (err: any) {
      alert("Failed to delete stream: " + err.message);
    }
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPosting(true);

    if (!selectedSubjectId || !assignClassId) {
      setError("Please select both class and subject.");
      setPosting(false);
      return;
    }

    try {
      await api.post(`/api/v1/subjects/${selectedSubjectId}/assign`, {
        classId: assignClassId,
      });
      setAssignModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleUnassignSubject = async (subjectId: string, classId: string) => {
    if (!confirm("Are you sure you want to unassign this subject from this grade?")) return;
    try {
      await api.delete(`/api/v1/subjects/${subjectId}/assign/${classId}`);
      loadData();
    } catch (err: any) {
      alert("Failed to unassign: " + err.message);
    }
  };

  return (
    <div id="rsms-class-subject-manager" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-gray-950 inline-flex items-center gap-2">
            <BookOpen className="h-5.5 w-5.5 text-forest" />
            Classes & Curriculum Settings
          </h2>
          <p className="text-xs text-gray-500">Configure classrooms, assign subjects, add student streams, and manage secondary grades</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSubTab("classes")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition ${
              subTab === "classes"
                ? "bg-forest border-forest text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Syllabus (Classes/Streams)
          </button>
          <button
            onClick={() => setSubTab("subjects")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition ${
              subTab === "subjects"
                ? "bg-forest border-forest text-white shadow-sm"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Subject Catalogues
          </button>
        </div>
      </div>

      {subTab === "classes" ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="text-xs font-serif font-bold text-gray-800">Available Classrooms at Royal School</span>
            <button
              id="btn-add-class"
              onClick={() => {
                setError("");
                setClassModal(true);
              }}
              className="bg-forest hover:bg-[#06150d] text-white text-[11px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Class / Grade
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-48 rounded-xl animate-skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-white border border-gray-100 rounded-xl col-span-full">
                  No classes found. Register classes using the green class button above.
                </div>
              ) : (
                classes.map((c) => (
                  <div 
                    key={c.id} 
                    onClick={() => handleViewClass(c)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group cursor-pointer hover:shadow-md hover:border-gold/30 transition-all"
                  >
                    <div className="border-t-4 border-gold" />
                    <div className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif font-bold text-lg text-forest leading-tight">{c.name}</h3>
                          <span className="inline-block mt-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                            {c.schoolLevel} Department
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(c.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded bg-gray-50 hover:bg-red-50 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t border-gray-50">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide block">Teacher Room</span>
                          <span className="font-semibold text-gray-800">{c.classTeacher}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide block">Max Capacity</span>
                          <span className="font-semibold text-gray-800">{c.capacity} Students</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400">
                          <span>Active Streams / Sections</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setError("");
                              setSelectedClassId(c.id);
                              setStreamModal(true);
                            }}
                            className="text-[9px] hover:text-forest flex items-center gap-0.5 text-gold border border-gold/40 px-1 rounded hover:bg-gold/10"
                          >
                            <Plus className="h-2 w-2" /> stream
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {c.streams.length === 0 ? (
                            <span className="text-xs text-gray-400 font-medium">None added</span>
                          ) : (
                            c.streams.map((s) => (
                              <span 
                                key={s.id}
                                className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded-lg group"
                              >
                                {s.name}
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteStream(c.id, s.id);
                                  }}
                                  className="text-gray-400 hover:text-red-600 ml-1 scale-0 group-hover:scale-100 transition-all origin-center"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Subjects Catalogue Column Left */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm md:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-md text-forest">Course Curriculum Catalogues</h3>
                <p className="text-xs text-gray-500">List of course structures available with national accreditation code codes</p>
              </div>
              <button
                id="btn-add-subject"
                onClick={() => {
                  setError("");
                  setSubjectModal(true);
                }}
                className="bg-forest hover:bg-[#06150d] text-white text-[11px] font-bold px-3 py-1.5 rounded"
              >
                Create Global Subject
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {subjects.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No registerable subjects catalogued yet.</p>
              ) : (
                subjects.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between hover:bg-gray-50/40 px-2 rounded-lg">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-gray-900">{sub.name}</h4>
                      <p className="text-xs text-gold font-mono tracking-wider font-bold mt-0.5">{sub.code}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide block">Assigned Count</span>
                        <span className="font-bold text-gray-700">{sub.classSubjects?.length || 0} classes</span>
                      </div>
                      <button
                        onClick={() => handleDeleteSubject(sub.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded bg-gray-50/50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Relations Assignment Right */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <h3 className="font-serif font-bold text-md text-forest">Subject Room Assignment</h3>
              <button
                onClick={() => {
                  setError("");
                  setAssignModal(true);
                }}
                className="text-[10px] font-bold text-forest bg-gold/20 hover:bg-gold/30 px-2.5 py-1 rounded"
              >
                Assign Subject
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-500">Currently mapped grade-level course connections:</p>

              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {subjects.map(s => (
                  s.classSubjects?.map(cs => (
                    <div key={cs.id} className="p-2.5 bg-gray-50/70 rounded-lg border border-gray-100 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-bold text-forest">{s.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block mt-0.5">Assigned Class: {cs.class?.name}</span>
                      </div>
                      <button
                        onClick={() => handleUnassignSubject(s.id, cs.classId)}
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                        Unmap
                      </button>
                    </div>
                  ))
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLASS DETAIL VIEW MODAL WITH STUDENTS & FEE STATUS */}
      {classDetailModal && selectedClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl relative border-t-4 border-gold overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-serif font-bold text-gray-900">{selectedClass.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedClass.schoolLevel} Level - {selectedClass.academicYear}</p>
              </div>
              <button
                onClick={() => setClassDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Class Information */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Class Teacher</p>
                  <p className="text-sm font-semibold text-gray-900 mt-2">{selectedClass.classTeacher || "Not assigned"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Max Capacity</p>
                  <p className="text-sm font-semibold text-gray-900 mt-2">{selectedClass.capacity} Students</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-[10px] text-blue-600 uppercase tracking-widest font-bold">Enrolled Students</p>
                  <p className="text-2xl font-serif font-bold text-blue-900 mt-2">{classStudents.length}</p>
                </div>
              </div>

              {/* Streams */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-serif font-bold text-gray-900">Streams / Sections</h4>
                  <button
                    onClick={() => {
                      setError("");
                      setSelectedClassId(selectedClass.id);
                      setStreamModal(true);
                      setClassDetailModal(false);
                    }}
                    className="text-[10px] font-bold text-forest bg-gold/20 hover:bg-gold/30 px-2.5 py-1 rounded flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Stream
                  </button>
                </div>

                {selectedClass.streams.length === 0 ? (
                  <p className="text-sm text-gray-500">No streams added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedClass.streams.map((stream) => (
                      <div key={stream.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="font-semibold text-gray-900">{stream.name}</p>
                          <p className="text-xs text-gray-500">Teacher: {stream.teacher || "Not assigned"}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteStream(selectedClass.id, stream.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enrolled Students & Fee Status */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-serif font-bold text-gray-900 mb-4">Enrolled Students & Fee Status</h4>

                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-gold animate-spin" />
                  </div>
                ) : classStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No students enrolled in this class yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left px-4 py-2 font-semibold text-gray-900">Admission #</th>
                          <th className="text-left px-4 py-2 font-semibold text-gray-900">Student Name</th>
                          <th className="text-left px-4 py-2 font-semibold text-gray-900">Gender</th>
                          <th className="text-left px-4 py-2 font-semibold text-gray-900">Fee Status</th>
                          <th className="text-right px-4 py-2 font-semibold text-gray-900">Amount Paid</th>
                          <th className="text-right px-4 py-2 font-semibold text-gray-900">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((student) => {
                          const paymentStatus = getPaymentStatus(student);
                          const totalFeesPaid = student.payments?.reduce((sum, p) => sum + p.feesPaid, 0) || 0;
                          const totalBalance = student.payments?.reduce((sum, p) => sum + p.balance, 0) || 0;
                          const StatusIcon = paymentStatus.icon;

                          return (
                            <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-800 font-mono font-semibold text-xs">{student.admissionNumber}</td>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{student.gender === "M" ? "Male" : "Female"}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${paymentStatus.color}`}>
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  {paymentStatus.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                                ZMW {totalFeesPaid.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </td>
                              <td className={`px-4 py-3 text-right font-semibold ${totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ZMW {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              {classStudents.length > 0 && (
                <div className="border-t border-gray-100 pt-4 grid grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <p className="text-[10px] text-green-600 font-bold uppercase">Fully Paid</p>
                    <p className="text-2xl font-serif font-bold text-green-900 mt-2">
                      {classStudents.filter(s => {
                        const totalBalance = s.payments?.reduce((sum, p) => sum + p.balance, 0) || 0;
                        return totalBalance === 0 && s.payments && s.payments.length > 0;
                      }).length}
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-[10px] text-yellow-600 font-bold uppercase">Partial Payment</p>
                    <p className="text-2xl font-serif font-bold text-yellow-900 mt-2">
                      {classStudents.filter(s => {
                        const totalFeesPaid = s.payments?.reduce((sum, p) => sum + p.feesPaid, 0) || 0;
                        const totalBalance = s.payments?.reduce((sum, p) => sum + p.balance, 0) || 0;
                        return totalFeesPaid > 0 && totalBalance > 0;
                      }).length}
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-[10px] text-red-600 font-bold uppercase">Outstanding</p>
                    <p className="text-2xl font-serif font-bold text-red-900 mt-2">
                      {classStudents.filter(s => {
                        const totalFeesPaid = s.payments?.reduce((sum, p) => sum + p.feesPaid, 0) || 0;
                        return totalFeesPaid === 0 || !s.payments || s.payments.length === 0;
                      }).length}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 flex gap-3">
              <button
                onClick={() => setClassDetailModal(false)}
                className="flex-1 text-xs font-bold py-2 text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLASROOM CREATION MODAL */}
      {classModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-gold overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-gray-900 font-serif">Create Grade / Class Slot</h3>
              <p className="text-xs text-gray-500 mt-1">Configure class capacity and national program parameters</p>
            </div>

            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-100">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baby Class, Grade 1, Grade 10"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">School Level</label>
                  <select
                    value={schoolLevel}
                    onChange={(e: any) => setSchoolLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="ECE">ECE (Baby to Recep)</option>
                    <option value="PRIMARY">PRIMARY (Gr 1 to 7)</option>
                    <option value="SECONDARY">SECONDARY (Form 1 to Gr 12)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Class Teacher</label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Chileshe Mulenga"
                    value={classTeacher}
                    onChange={(e) => setClassTeacher(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Syllabus Year</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Class Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setClassModal(false)} className="flex-1 text-xs py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                <button type="submit" className="flex-1 bg-forest text-white font-bold py-2 text-xs rounded-lg">Save Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLASROOM STREAM ADD MODAL */}
      {streamModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-gold overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-gray-900">Add Stream Branch</h3>
              <p className="text-xs text-gray-500 mt-1">Configure section codes</p>
            </div>

            <form onSubmit={handleAddStream} className="p-6 space-y-4">
              {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-100">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Stream Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stream A, Stream B, North, West"
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Stream Lead Teacher</label>
                <input
                  type="text"
                  placeholder="e.g. Mrs. Mwansa Banda"
                  value={streamTeacher}
                  onChange={(e) => setStreamTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setStreamModal(false)} className="flex-1 text-xs py-2 text-gray-500 font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-forest text-white text-xs font-bold py-2 rounded-lg">Add Stream</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GLOBAL COURSE CREATION MODAL */}
      {subjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-gold overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-gray-900">Create Global Curriculum subject</h3>
              <p className="text-xs text-gray-500 mt-1">Enroll subject title and course identification codes</p>
            </div>

            <form onSubmit={handleCreateSubject} className="p-6 space-y-4">
              {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Course subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics, Bemba, English Language"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Course subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MATH-101, BEMB-SEC"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setSubjectModal(false)} className="flex-1 text-xs py-2 text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 bg-forest text-white text-xs font-bold py-2 rounded-lg">Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RELATION MAPPING ASSIGN MODAL */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-gold overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-gray-900">Assign Subject to Grade</h3>
              <p className="text-xs text-gray-500 mt-1">Bind course registration configurations</p>
            </div>

            <form onSubmit={handleAssignSubject} className="p-6 space-y-4">
              {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded">{error}</p>}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Choose Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg bg-white"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Choose Target Grade / Class</label>
                <select
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg bg-white"
                >
                  <option value="">-- Choose Target Grade --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setAssignModal(false)} className="flex-1 text-xs py-2 text-gray-500">Cancel</button>
                <button type="submit" className="flex-1 bg-forest text-white text-xs font-bold py-2 rounded-lg">Save Mapping</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
