import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Upload, 
  GraduationCap, 
  Loader2,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Student, Class } from "../types";
import { api } from "../utils/api";
import StudentImporter from "./StudentImporter";

export default function StudentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [promoteModal, setPromoteModal] = useState(false);

  // Form State - Single Student
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("M");
  const [dob, setDob] = useState("2015-01-01");
  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState("2026");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [address, setAddress] = useState("");
  const [admissionNum, setAdmissionNum] = useState("");

  // Form State - Promotion
  const [promoteClassId, setPromoteClassId] = useState("");

  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let query = `?status=${statusFilter}`;
      if (search) query += `&search=${search}`;
      if (classFilter) query += `&classId=${classFilter}`;

      const data = await api.get(`/api/v1/students${query}`);
      setStudents(data);
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const data = await api.get("/api/v1/classes");
      setClasses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, classFilter, statusFilter]);

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPosting(true);

    if (!firstName || !lastName || !classId) {
      setError("Please fill in student names and assign a class.");
      setPosting(false);
      return;
    }

    const matchedC = classes.find(c => c.id === classId);

    try {
      await api.post("/api/v1/students", {
        firstName,
        lastName,
        gender,
        dateOfBirth: dob,
        schoolLevel: matchedC ? matchedC.schoolLevel : "PRIMARY",
        classId,
        academicYear,
        parentGuardianName: parentName,
        parentGuardianPhone: parentPhone,
        residentialAddress: address,
        admissionNumber: admissionNum || undefined,
      });

      setAddModal(false);
      setSuccess("✓ Student created successfully!");
      setTimeout(() => setSuccess(""), 3000);
      
      setFirstName("");
      setLastName("");
      setParentName("");
      setParentPhone("");
      setAddress("");
      setAdmissionNum("");
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const loadUserProfile = async (id: string) => {
    try {
      const fullProf = await api.get(`/api/v1/students/${id}`);
      setSelectedStudent(fullProf);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromoteStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setPosting(true);
    setError("");

    try {
      await api.post(`/api/v1/students/${selectedStudent.id}/promote`, {
        targetClassId: promoteClassId || undefined,
        academicYear: "2026",
      });
      setPromoteModal(false);
      loadUserProfile(selectedStudent.id);
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            Student Records
          </h1>
          <p className="text-gray-600 mt-1">Manage and enroll learners</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setImportModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            <Upload className="w-4 h-4" />
            Import Students
          </button>
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Search</label>
            <input
              type="text"
              placeholder="Name, admission #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="">All</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">Total Count</label>
            <div className="px-3 py-2 bg-gray-100 rounded-lg font-bold text-gray-900">{students.length} pupils</div>
          </div>
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Admission #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student, idx) => (
                <tr key={student.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">{student.admissionNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{student.firstName} {student.lastName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.class?.name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.gender}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => loadUserProfile(student.id)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                    >
                      View <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
      {addModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-blue-600 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-serif font-bold text-gray-900">Add New Student</h3>
              <p className="text-xs text-gray-500 mt-1">Enroll a single learner</p>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Gender *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">DOB</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Class *</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Parent/Guardian</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setAddModal(false)} className="flex-1 text-xs py-2 text-gray-500 font-bold">Cancel</button>
                <button type="submit" disabled={posting} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg">
                  {posting ? "Creating..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT MODAL - NEW COMPONENT */}
      {importModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden border-t-4 border-blue-600">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Import Students</h3>
              <p className="text-xs text-gray-500 mt-1">Excel (.xlsx) format</p>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6">
                <StudentImporter onClose={() => {
                  setImportModal(false);
                  fetchStudents();
                }} />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setImportModal(false)}
                className="px-4 py-2 text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMOTION DIALOG MODAL */}
      {promoteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-blue-600 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-serif font-bold text-gray-900">Pupil Promotion / Transfer</h3>
              <p className="text-xs text-gray-500 mt-1">Relocate pupil to next class</p>
            </div>

            <form onSubmit={handlePromoteStudent} className="p-6 space-y-4">
              {error && <p className="text-xs text-red-600 bg-red-50 p-2 text-center rounded">{error}</p>}

              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                <span className="text-gray-400 block tracking-wide font-bold uppercase text-[9px]">Currently Enrolled</span>
                <p className="font-bold text-gray-900 font-serif mt-0.5">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p className="text-gray-600 mt-1">Class: <strong className="text-gray-800">{selectedStudent.class?.name}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Promotion Target Grade
                </label>
                <select
                  required
                  value={promoteClassId}
                  onChange={(e) => setPromoteClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 text-sm rounded-lg bg-white"
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.schoolLevel})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setPromoteModal(false)} className="flex-1 text-xs py-2 text-gray-500 font-bold">Cancel</button>
                <button type="submit" disabled={posting} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg">
                  {posting ? "Promoting..." : "Promote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT DETAILS MODAL */}
      {selectedStudent && !promoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative border-t-4 border-blue-600 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-serif font-bold text-gray-900">Student Profile</h3>
            </div>

            <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Name</p>
                <p className="text-gray-900 font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Admission #</p>
                <p className="text-gray-900 font-mono">{selectedStudent.admissionNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Class</p>
                <p className="text-gray-900">{selectedStudent.class?.name || "Not assigned"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Gender</p>
                <p className="text-gray-900">{selectedStudent.gender}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="flex-1 text-xs py-2 text-gray-500 font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setPromoteModal(true);
                }}
                className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg"
              >
                Promote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
