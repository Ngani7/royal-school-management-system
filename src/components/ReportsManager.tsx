import React, { useEffect, useState } from "react";
import { FileText, Download, Printer, DollarSign, Users, Truck, BookOpen } from "lucide-react";
import { api } from "../utils/api";

interface ReportData {
  invoices: any[];
  students: any[];
  classes: any[];
  transports: any[];
  activeTerm: any;
}

export default function ReportsManager() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [invoices, students, classes, transports, terms] = await Promise.all([
        api.get("/api/v1/invoices").catch(() => []),
        api.get("/api/v1/students").catch(() => []),
        api.get("/api/v1/classes").catch(() => []),
        api.get("/api/v1/transport/routes").catch(() => []),
        api.get("/api/v1/terms").catch(() => []),
      ]);

      setData({
        invoices,
        students,
        classes,
        transports,
        activeTerm: terms.find((t: any) => t.isActive),
      });

      // Set first class as default
      if (classes.length > 0) {
        setSelectedClassId(classes[0].id);
      }
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  };

  const printReport = (html: string, title: string) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #0a1f14; border-bottom: 3px solid #c9a84c; padding-bottom: 10px; }
              h2 { color: #0a1f14; margin-top: 30px; font-size: 18px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #0a1f14; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .header { text-align: center; margin-bottom: 30px; }
              .school-name { font-size: 24px; font-weight: bold; color: #0a1f14; }
              .report-title { font-size: 18px; color: #666; margin-top: 10px; }
              .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="school-name">ROYAL ACADEMY - LUSAKA</div>
              <div class="report-title">${title}</div>
              <div style="color: #666; font-size: 12px; margin-top: 10px;">Generated on ${new Date().toLocaleDateString()}</div>
            </div>
            ${html}
            <div class="footer">
              <p>This is an official report from Royal Academy Lusaka. For inquiries, contact the school administration.</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  // SCHOOL FEES REPORT
  const generateFeesReport = () => {
    if (!data) return;

    const studentsByClass: { [key: string]: typeof data.students } = {};
    data.students.forEach((student: any) => {
      if (!studentsByClass[student.class.name]) {
        studentsByClass[student.class.name] = [];
      }
      studentsByClass[student.class.name].push(student);
    });

    let html = "";

    Object.entries(studentsByClass).forEach(([className, students]) => {
      const classInvoices = data.invoices.filter((inv: any) =>
        students.some((s: any) => s.id === inv.studentId)
      );

      const totalDue = classInvoices.reduce((sum: number, inv: any) => sum + inv.amountDue, 0);
      const totalPaid = classInvoices.reduce((sum: number, inv: any) => sum + inv.amountPaid, 0);
      const outstanding = totalDue - totalPaid;

      html += `
        <h2>${className}</h2>
        <table>
          <thead>
            <tr>
              <th>Admission #</th>
              <th>Student Name</th>
              <th>Amount Due</th>
              <th>Amount Paid</th>
              <th>Outstanding</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      students.forEach((student: any) => {
        const studentInvoices = classInvoices.filter((inv: any) => inv.studentId === student.id);
        const studentDue = studentInvoices.reduce((sum: number, inv: any) => sum + inv.amountDue, 0);
        const studentPaid = studentInvoices.reduce((sum: number, inv: any) => sum + inv.amountPaid, 0);
        const studentOutstanding = studentDue - studentPaid;
        const status =
          studentOutstanding === 0 ? "PAID" : studentPaid > 0 ? "PARTIAL" : "OUTSTANDING";

        html += `
          <tr>
            <td>${student.admissionNumber}</td>
            <td>${student.firstName} ${student.lastName}</td>
            <td>K ${studentDue.toLocaleString()}</td>
            <td>K ${studentPaid.toLocaleString()}</td>
            <td>K ${studentOutstanding.toLocaleString()}</td>
            <td>${status}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
          <tfoot>
            <tr style="background-color: #f0f0f0; font-weight: bold;">
              <td colspan="2">Class Total</td>
              <td>K ${totalDue.toLocaleString()}</td>
              <td>K ${totalPaid.toLocaleString()}</td>
              <td>K ${outstanding.toLocaleString()}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      `;
    });

    printReport(html, "School Fees Report - All Classes");
  };

  // CLASS LIST REPORT - SINGLE CLASS
  const generateClassListReport = (classId: string) => {
    if (!data) return;

    const selectedClass = data.classes.find((c: any) => c.id === classId);
    const classStudents = data.students.filter((s: any) => s.classId === classId);

    if (!selectedClass) {
      alert("Please select a class");
      return;
    }

    let html = `
      <h2>${selectedClass.name} (${selectedClass.schoolLevel})</h2>
      <p style="color: #666; margin-bottom: 20px; font-size: 14px;">
        <strong>Total Students:</strong> ${classStudents.length} | 
        <strong>Class Capacity:</strong> ${selectedClass.capacity}
      </p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Admission #</th>
            <th>Full Name</th>
            <th>Gender</th>
            <th>Date of Birth</th>
            <th>Guardian</th>
            <th>Contact</th>
          </tr>
        </thead>
        <tbody>
    `;

    classStudents.forEach((student: any, idx: number) => {
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td>${student.admissionNumber}</td>
          <td>${student.firstName} ${student.lastName}</td>
          <td>${student.gender}</td>
          <td>${student.dateOfBirth}</td>
          <td>${student.parentGuardianName}</td>
          <td>${student.parentGuardianPhone}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    printReport(html, `Class List - ${selectedClass.name}`);
  };

  // TRANSPORT REPORT
  const generateTransportReport = () => {
    if (!data) return;

    let html = `
      <h2>Transport Enrollment Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Route Zone</th>
            <th>Monthly Fee (K)</th>
            <th>One-Way Fee (K)</th>
            <th>Enrolled Students</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.transports.forEach((route: any) => {
      const enrolledCount = data.students.filter((s: any) => 
        s.transportEnrollment?.routeId === route.id
      ).length;

      html += `
        <tr>
          <td>${route.zoneName}</td>
          <td>K ${route.monthlyFee.toLocaleString()}</td>
          <td>K ${route.oneWayFee.toLocaleString()}</td>
          <td>${enrolledCount}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>

      <h2>Student Transport Details</h2>
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Admission #</th>
            <th>Class</th>
            <th>Route Zone</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.students
      .filter((s: any) => s.transportEnrollment)
      .forEach((student: any) => {
        const route = data.transports.find(
          (r: any) => r.id === student.transportEnrollment?.routeId
        );

        html += `
          <tr>
            <td>${student.firstName} ${student.lastName}</td>
            <td>${student.admissionNumber}</td>
            <td>${student.class.name}</td>
            <td>${route?.zoneName || "N/A"}</td>
            <td>${student.transportEnrollment?.type}</td>
            <td>${student.transportEnrollment?.active ? "Active" : "Inactive"}</td>
          </tr>
        `;
      });

    html += `
        </tbody>
      </table>
    `;

    printReport(html, "Transport Report");
  };

  // STUDENT SUMMARY REPORT
  const generateStudentSummaryReport = () => {
    if (!data) return;

    const schoolLevels: { [key: string]: number } = {};
    const genderCount = { M: 0, F: 0 };

    data.students.forEach((student: any) => {
      schoolLevels[student.schoolLevel] = (schoolLevels[student.schoolLevel] || 0) + 1;
      genderCount[student.gender as keyof typeof genderCount]++;
    });

    let html = `
      <h2>Student Population Summary</h2>
      <table>
        <thead>
          <tr>
            <th>School Level</th>
            <th>Total Students</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
    `;

    Object.entries(schoolLevels).forEach(([level, count]) => {
      const percentage = ((count / data.students.length) * 100).toFixed(1);
      html += `
        <tr>
          <td>${level}</td>
          <td>${count}</td>
          <td>${percentage}%</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>

      <h2>Gender Distribution</h2>
      <table>
        <thead>
          <tr>
            <th>Gender</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Male</td>
            <td>${genderCount.M}</td>
            <td>${((genderCount.M / data.students.length) * 100).toFixed(1)}%</td>
          </tr>
          <tr>
            <td>Female</td>
            <td>${genderCount.F}</td>
            <td>${((genderCount.F / data.students.length) * 100).toFixed(1)}%</td>
          </tr>
        </tbody>
      </table>

      <h2>Enrollment by Class</h2>
      <table>
        <thead>
          <tr>
            <th>Class</th>
            <th>Students</th>
            <th>Capacity</th>
            <th>Occupancy %</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.classes.forEach((cls: any) => {
      const enrolled = data.students.filter((s: any) => s.classId === cls.id).length;
      const occupancy = ((enrolled / cls.capacity) * 100).toFixed(1);

      html += `
        <tr>
          <td>${cls.name}</td>
          <td>${enrolled}</td>
          <td>${cls.capacity}</td>
          <td>${occupancy}%</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    printReport(html, "Student Summary Report");
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <FileText className="w-8 h-8 text-blue-600" />
          Reports & Print Lists
        </h1>
        <p className="text-gray-600">Generate and print important school reports</p>
      </div>

      {/* REPORTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SCHOOL FEES REPORT */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-red-600" />
                School Fees Report
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                View all students' fee status, amounts due, and payment summary by class
              </p>
            </div>
          </div>
          <button
            onClick={generateFeesReport}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>

        {/* CLASS LISTS REPORT */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Class List Report
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Print a single class roster with complete student details
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">-- Select a class --</option>
                {data?.classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.schoolLevel})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => generateClassListReport(selectedClassId)}
              disabled={!selectedClassId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Class List
            </button>
          </div>
        </div>

        {/* TRANSPORT REPORT */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-600" />
                Transport Report
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                View transport routes, enrolled students, and active enrollments
              </p>
            </div>
          </div>
          <button
            onClick={generateTransportReport}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>

        {/* STUDENT SUMMARY REPORT */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Student Summary Report
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Statistics on school population, demographics, and enrollment by level
              </p>
            </div>
          </div>
          <button
            onClick={generateStudentSummaryReport}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* INFO BOX */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Use your browser's print function to save reports as PDF or print directly to your printer.
        </p>
      </div>
    </div>
  );
}
