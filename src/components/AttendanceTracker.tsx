import { useState, useEffect } from "react";
import { Calendar, Users, Check, X, Clock } from "lucide-react";
import { api } from "../utils/api";

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  class: { name: string };
}

interface Stream {
  id: string;
  name: string;
  classId: string;
  class: { name: string };
}

interface Class {
  id: string;
  name: string;
}

interface AttendanceRecord {
  studentId: string;
  status: "P" | "A" | "L" | "E"; // Present, Absent, Late, Excused
}

export default function AttendanceTracker() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord["status"]>>({});

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Load classes
  useEffect(() => {
    fetchClasses();
  }, []);

  // Load streams when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStreams(selectedClass);
    } else {
      setStreams([]);
      setSelectedStream("");
      setStudents([]);
    }
  }, [selectedClass]);

  // Load students when stream is selected
  useEffect(() => {
    if (selectedStream && selectedClass) {
      fetchStudents(selectedClass, selectedStream);
    } else {
      setStudents([]);
    }
  }, [selectedStream, selectedClass]);

  const fetchClasses = async () => {
    try {
      const data = await api.get("/api/v1/classes");
      setClasses(data);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  };

  const fetchStreams = async (classId: string) => {
    try {
      const data = await api.get("/api/v1/classes");
      const selectedClassData = data.find((c: any) => c.id === classId);
      
      if (selectedClassData && selectedClassData.streams) {
        setStreams(selectedClassData.streams);
      } else {
        setStreams([]);
      }
    } catch (err) {
      console.error("Failed to fetch streams:", err);
      setStreams([]);
    }
  };

  const fetchStudents = async (classId: string, streamId: string) => {
    try {
      setLoading(true);
      const allStudents = await api.get("/api/v1/students");
      
      // Filter students by class and stream
      const filteredStudents = allStudents.filter((student: Student) => 
        student.class.id === classId && student.streamId === streamId
      );
      
      setStudents(filteredStudents);
      setError("");
      
      // Initialize attendance records
      const initialAttendance: Record<string, AttendanceRecord["status"]> = {};
      filteredStudents.forEach((student: Student) => {
        initialAttendance[student.id] = "P"; // Default to Present
      });
      setAttendance(initialAttendance);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError("Failed to load student roster");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceRecord["status"]) => {
    setAttendance({
      ...attendance,
      [studentId]: status,
    });
  };

  const handleSubmit = async () => {
    if (!selectedStream || !selectedDate) {
      setError("Please select class, stream, and date");
      return;
    }

    if (students.length === 0) {
      setError("No students to mark attendance");
      return;
    }

    try {
      setLoading(true);
      
      // Create attendance record
      const attendanceData = {
        streamId: selectedStream,
        date: selectedDate,
        markedBy: "Admin",
        records: students.map((student) => ({
          studentId: student.id,
          status: attendance[student.id] || "P",
        })),
      };

      await api.post("/api/v1/attendance", attendanceData);
      
      setSuccess(`✓ Attendance marked for ${students.length} students on ${selectedDate}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  const getStreamName = (streamId: string) => {
    const stream = streams.find(s => s.id === streamId);
    return stream ? stream.name : "Stream";
  };

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || "Class";

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Calendar className="w-8 h-8 text-blue-600" />
          Attendance Tracker
        </h1>
        <p className="text-gray-600">Mark student attendance by class and stream</p>
      </div>

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* FILTERS */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* CLASS SELECTOR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Select Class --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* STREAM SELECTOR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stream</label>
            <select
              value={selectedStream}
              onChange={(e) => setSelectedStream(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-gray-100"
            >
              <option value="">-- Select Stream --</option>
              {streams.map((stream) => (
                <option key={stream.id} value={stream.id}>
                  {stream.name}
                </option>
              ))}
            </select>
          </div>

          {/* DATE SELECTOR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* STUDENT COUNT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Students</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-lg font-bold text-gray-900">{students.length}</span>
              <span className="text-sm text-gray-600">pupils</span>
            </div>
          </div>
        </div>
      </div>

      {/* ATTENDANCE ROSTER */}
      {selectedStream && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              📋 {selectedClassName} - {getStreamName(selectedStream)} Roster
            </h2>
            <p className="text-sm text-gray-600 mt-1">{selectedDate}</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading roster...</div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No students found in this stream</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Admission #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Student Name</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Present</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Absent</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Late</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Excused</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => (
                      <tr key={student.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{idx + 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono">{student.admissionNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{student.firstName} {student.lastName}</td>
                        
                        <td className="px-6 py-4 text-center">
                          <input
                            type="radio"
                            name={`attendance-${student.id}`}
                            value="P"
                            checked={attendance[student.id] === "P"}
                            onChange={() => handleAttendanceChange(student.id, "P")}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <input
                            type="radio"
                            name={`attendance-${student.id}`}
                            value="A"
                            checked={attendance[student.id] === "A"}
                            onChange={() => handleAttendanceChange(student.id, "A")}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <input
                            type="radio"
                            name={`attendance-${student.id}`}
                            value="L"
                            checked={attendance[student.id] === "L"}
                            onChange={() => handleAttendanceChange(student.id, "L")}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <input
                            type="radio"
                            name={`attendance-${student.id}`}
                            value="E"
                            checked={attendance[student.id] === "E"}
                            onChange={() => handleAttendanceChange(student.id, "E")}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={loading || students.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-8 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {loading ? "Saving..." : `Mark Attendance (${students.length} pupils)`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* INFO BOX */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Legend:</strong> P = Present | A = Absent | L = Late | E = Excused
        </p>
      </div>
    </div>
  );
}
