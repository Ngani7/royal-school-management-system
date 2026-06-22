import React, { useState, useEffect } from "react";
import { Search, Loader, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "../utils/api";

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  classId?: string;
  class?: { name: string };
}

interface Class {
  id: string;
  name: string;
  streams?: Stream[];
}

interface Stream {
  id: string;
  name: string;
}

export default function StudentClassAssignment() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Fetch unassigned students
  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/api/v1/students?status=ACTIVE");
      console.log("Full response:", res);
      
      // Handle response - api might return res.data or res directly
      const studentData = res.data || res;
      console.log("Student data:", studentData);
      
      // Ensure it's an array
      const studentArray = Array.isArray(studentData) ? studentData : [];
      
      // Filter students without classes
      const unassigned = studentArray.filter((s: Student) => !s.classId);
      console.log("Unassigned students:", unassigned);
      setStudents(unassigned);
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setMessage("Error loading students: " + (err.message || "Unknown error"));
      setMessageType("error");
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get("/api/v1/classes");
      console.log("Classes response:", res);
      
      const classData = res.data || res;
      const classArray = Array.isArray(classData) ? classData : [];
      console.log("Classes:", classArray);
      setClasses(classArray);
    } catch (err: any) {
      console.error("Error fetching classes:", err);
      setMessage("Error loading classes: " + (err.message || "Unknown error"));
      setMessageType("error");
    }
  };

  const handleAssign = async () => {
    if (!selectedStudent || !selectedClass) {
      setMessage("Please select a student and class");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    
    try {
      const payload: any = { classId: selectedClass };
      if (selectedStream) {
        payload.streamId = selectedStream;
      }

      console.log("Sending payload:", payload);
      console.log("To endpoint: /api/v1/students/" + selectedStudent.id + "/assign-class");

      const response = await api.post(
        `/api/v1/students/${selectedStudent.id}/assign-class`,
        payload
      );

      console.log("Response:", response);

      setMessage(
        `✅ ${selectedStudent.firstName} ${selectedStudent.lastName} assigned to ${
          classes.find((c) => c.id === selectedClass)?.name
        }`
      );
      setMessageType("success");

      // Reset form
      setSelectedStudent(null);
      setSelectedClass("");
      setSelectedStream("");
      setSearchTerm("");

      // Refresh students list
      fetchStudents();
    } catch (err: any) {
      console.error("Full error:", err);
      console.error("Error response:", err.response?.data);
      
      const errorMsg = err.response?.data?.error || err.message || "Unknown error";
      setMessage("❌ Error: " + errorMsg);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber.includes(searchTerm)
  );

  const currentClass = classes.find((c) => c.id === selectedClass);
  const streams = currentClass?.streams || [];

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-900">Assign Students to Classes</h2>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            messageType === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {messageType === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <p
            className={`text-sm font-medium ${
              messageType === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {message}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Student Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Student ({filteredStudents.length} unassigned)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Name or Admission Number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No unassigned students found</div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-3 border-b cursor-pointer transition ${
                    selectedStudent?.id === student.id
                      ? "bg-blue-100 border-blue-300"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{student.admissionNumber}</p>
                </div>
              ))
            )}
          </div>

          {selectedStudent && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">Selected:</p>
              <p className="font-bold text-blue-900">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </p>
              <p className="text-sm text-blue-700">{selectedStudent.admissionNumber}</p>
            </div>
          )}
        </div>

        {/* Right: Class & Stream Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class *
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStream(""); // Reset stream when class changes
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Choose a class --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {streams.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Stream (Optional)
              </label>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- No specific stream --</option>
                {streams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedClass && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900">Selected Class:</p>
              <p className="font-bold text-green-900">
                {classes.find((c) => c.id === selectedClass)?.name}
              </p>
              {selectedStream && (
                <>
                  <p className="text-sm font-medium text-green-900 mt-2">Selected Stream:</p>
                  <p className="font-bold text-green-900">
                    {streams.find((s) => s.id === selectedStream)?.name}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assign Button */}
      <div className="flex gap-3">
        <button
          onClick={handleAssign}
          disabled={!selectedStudent || !selectedClass || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
        >
          {loading && <Loader className="h-4 w-4 animate-spin" />}
          {loading ? "Assigning..." : "Assign Student"}
        </button>
        <button
          onClick={() => {
            setSelectedStudent(null);
            setSelectedClass("");
            setSelectedStream("");
            setSearchTerm("");
            setMessage("");
          }}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium"
        >
          Clear
        </button>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          📊 <span className="font-medium">{filteredStudents.length}</span> students waiting to be assigned
        </p>
      </div>
    </div>
  );
}
