import React, { useEffect, useState } from "react";
import { Plus, Download, AlertCircle, TrendingUp, DollarSign, FileText } from "lucide-react";
import { api } from "../utils/api";

interface Invoice {
  id: string;
  invoiceNumber: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    class: { name: string };
  };
  amountDue: number;
  amountPaid: number;
  status: string;
  issueDate: string;
  dueDate: string;
  academicTerm: { name: string };
}

interface InvoiceSummary {
  totalOutstanding: number;
  totalInvoices: number;
  issuedCount: number;
  partialCount: number;
  overdueCount: number;
  invoices: Invoice[];
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: { id: string; name: string };
}

interface Class {
  id: string;
  name: string;
  schoolLevel: string;
}

interface AcademicTerm {
  id: string;
  name: string;
  isActive: boolean;
}

export default function BursarFinanceSystem() {
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [activeTerm, setActiveTerm] = useState<AcademicTerm | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [successMessage, setSuccessMessage] = useState("");

  // Invoice generation form states
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("Term Fees");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Payment form states
  const [paymentStudent, setPaymentStudent] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [postingPayment, setPostingPayment] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [summaryData, studentsData, classesData, termsData] = await Promise.all([
        api.get("/api/v1/invoices/summary/all").catch(() => null),
        api.get("/api/v1/students").catch(() => []),
        api.get("/api/v1/classes").catch(() => []),
        api.get("/api/v1/terms").catch(() => []),
      ]);

      setSummary(summaryData);
      setStudents(studentsData);
      setClasses(classesData);
      setTerms(termsData);
      setActiveTerm(termsData.find((t: AcademicTerm) => t.isActive) || null);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSingleInvoice = async () => {
    if (!selectedStudent || !invoiceAmount || !activeTerm) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setGeneratingInvoice(true);
      const response = await api.post("/api/v1/invoices", {
        studentId: selectedStudent,
        termId: activeTerm.id,
        amountDue: Number(invoiceAmount),
        dueDate: invoiceDueDate,
        description: invoiceDescription,
      });

      setSuccessMessage(`✅ Invoice ${response.invoiceNumber} created for ${response.student.firstName} ${response.student.lastName}`);
      setSelectedStudent("");
      setInvoiceAmount("");
      setInvoiceDueDate("");
      setInvoiceDescription("Term Fees");

      // Refresh data
      await fetchAllData();

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleGenerateBulkInvoices = async () => {
    if (!selectedClass || !invoiceAmount || !activeTerm) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setGeneratingInvoice(true);
      const response = await api.post("/api/v1/invoices/bulk", {
        classId: selectedClass,
        termId: activeTerm.id,
        amountDue: Number(invoiceAmount),
        dueDate: invoiceDueDate,
        description: invoiceDescription,
      });

      setSuccessMessage(`✅ ${response.invoices.length} invoices created for ${response.invoices[0]?.student.class.name}`);
      setSelectedClass("");
      setInvoiceAmount("");
      setInvoiceDueDate("");
      setInvoiceDescription("Term Fees");

      await fetchAllData();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handlePostPayment = async () => {
    if (!paymentStudent || !paymentAmount) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setPostingPayment(true);
      await api.post("/api/v1/finance/payments", {
        studentId: paymentStudent,
        amount: Number(paymentAmount),
        method: paymentMethod,
        reference: paymentReference,
        category: "TUITION",
      });

      setSuccessMessage("✅ Payment recorded successfully");
      setPaymentStudent("");
      setPaymentAmount("");
      setPaymentMethod("CASH");
      setPaymentReference("");

      await fetchAllData();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setPostingPayment(false);
    }
  };

  const downloadInvoicePDF = (invoiceId: string, invoiceNumber: string) => {
    const token = localStorage.getItem("rsms_token");
    window.open(`/api/v1/invoices/${invoiceId}/pdf?token=${token}`, "_blank");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ISSUED":
        return "text-red-600 bg-red-50";
      case "PARTIAL":
        return "text-yellow-600 bg-yellow-50";
      case "OVERDUE":
        return "text-orange-600 bg-orange-50";
      case "PAID":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading finance system...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <DollarSign className="w-8 h-8 text-amber-600" />
          Bursary & Student Billing Portals
        </h1>
        <p className="text-gray-600">Post payments, generate invoices, and manage student billing</p>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="text-lg">✓</span>
          {successMessage}
        </div>
      )}

      {/* SECTION TABS */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection("dashboard")}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
            activeSection === "dashboard"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setActiveSection("generate")}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
            activeSection === "generate"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          📄 Generate Invoices
        </button>
        <button
          onClick={() => setActiveSection("payment")}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition ${
            activeSection === "payment"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          💰 Receive Payment
        </button>
      </div>

      {/* DASHBOARD SECTION */}
      {activeSection === "dashboard" && (
        <div className="space-y-6">
          {/* SUMMARY CARDS */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Total Outstanding</p>
                <p className="text-4xl font-bold text-red-600">
                  K {summary.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-2">Across {summary.totalInvoices} invoices</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Issued</p>
                <p className="text-4xl font-bold text-red-600">{summary.issuedCount}</p>
                <p className="text-xs text-gray-500 mt-2">Not yet paid</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Partial</p>
                <p className="text-4xl font-bold text-yellow-600">{summary.partialCount}</p>
                <p className="text-xs text-gray-500 mt-2">Partially paid</p>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Overdue</p>
                <p className="text-4xl font-bold text-orange-600">{summary.overdueCount}</p>
                <p className="text-xs text-gray-500 mt-2">Past due date</p>
              </div>
            </div>
          )}

          {/* INVOICES TABLE */}
          {summary && summary.invoices.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Outstanding Invoices</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Class</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Amount Due</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Paid</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Outstanding</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.invoices.map((inv, idx) => (
                      <tr key={inv.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 text-sm font-mono text-gray-900">{inv.invoiceNumber}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">
                            {inv.student.firstName} {inv.student.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{inv.student.admissionNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{inv.student.class.name}</td>
                        <td className="px-6 py-4 text-sm text-right font-medium">
                          K {inv.amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                          K {inv.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-red-600">
                          K {(inv.amountDue - inv.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => downloadInvoicePDF(inv.id, inv.invoiceNumber)}
                            className="text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GENERATE INVOICES SECTION */}
      {activeSection === "generate" && (
        <div className="space-y-6">
          {/* SINGLE STUDENT */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Invoice Single Student
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="">Select a student...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Due (K)</label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder="e.g. 6200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateSingleInvoice}
              disabled={generatingInvoice}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {generatingInvoice ? "Generating..." : "Generate Invoice"}
            </button>
          </div>

          {/* BULK CLASS */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Invoice Entire Class
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                >
                  <option value="">Select a class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Per Student (K)</label>
                <input
                  type="number"
                  placeholder="e.g. 6200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateBulkInvoices}
              disabled={generatingInvoice}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              {generatingInvoice ? "Generating..." : "Generate Class Invoices"}
            </button>
          </div>
        </div>
      )}

      {/* PAYMENT SECTION */}
      {activeSection === "payment" && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            Receive Payment
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <select
                value={paymentStudent}
                onChange={(e) => setPaymentStudent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="">Select a student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.admissionNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (K)</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="e.g. 3000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Receipt #</label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. TXN123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <button
            onClick={handlePostPayment}
            disabled={postingPayment}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition disabled:opacity-50"
          >
            {postingPayment ? "Recording..." : "Record Payment"}
          </button>
        </div>
      )}
    </div>
  );
}
