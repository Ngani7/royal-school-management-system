import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, AlertCircle, Download } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  student: { id: string; firstName: string; lastName: string; admissionNumber: string; class: { name: string } };
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

interface User {
  id: string;
  username: string;
  role: string;
}

export const BursarInvoiceDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInvoiceSummary();
  }, []);

  const fetchInvoiceSummary = async () => {
    try {
      const token = localStorage.getItem("rsms_token");
      const response = await fetch("/api/v1/invoices/summary/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load invoice summary");

      const data: InvoiceSummary = await response.json();
      setSummary(data);
      setError("");
    } catch (err: any) {
      setError(err.message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ISSUED":
        return "text-red-600";
      case "PARTIAL":
        return "text-yellow-600";
      case "OVERDUE":
        return "text-orange-600";
      case "PAID":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "ISSUED":
        return "bg-red-50";
      case "PARTIAL":
        return "bg-yellow-50";
      case "OVERDUE":
        return "bg-orange-50";
      case "PAID":
        return "bg-green-50";
      default:
        return "bg-gray-50";
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading invoice summary...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  if (!summary) {
    return <div className="p-8 text-center text-gray-500">No invoice data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">📊 Outstanding Invoices Dashboard</h2>
        <p className="text-gray-600">Track all pending student invoices and collection status</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">TOTAL OUTSTANDING</span>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">
            K {summary.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-gray-500 mt-2">Across {summary.totalInvoices} invoices</p>
        </div>

        {/* Issued Count */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">ISSUED</span>
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">{summary.issuedCount}</div>
          <p className="text-xs text-gray-500 mt-2">Not yet paid</p>
        </div>

        {/* Partial Count */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">PARTIAL</span>
            <TrendingUp className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-yellow-600">{summary.partialCount}</div>
          <p className="text-xs text-gray-500 mt-2">Partially paid</p>
        </div>

        {/* Overdue Count */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 uppercase">OVERDUE</span>
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-600">{summary.overdueCount}</div>
          <p className="text-xs text-gray-500 mt-2">Past due date</p>
        </div>
      </div>

      {/* INVOICES TABLE */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {summary.invoices.map((invoice, idx) => (
                <tr key={invoice.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">
                      {invoice.student.firstName} {invoice.student.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{invoice.student.admissionNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{invoice.student.class.name}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                    K {invoice.amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                    K {invoice.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-red-600">
                    K {(invoice.amountDue - invoice.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBg(invoice.status)} ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{invoice.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {summary.invoices.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No outstanding invoices found
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={fetchInvoiceSummary}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default BursarInvoiceDashboard;
