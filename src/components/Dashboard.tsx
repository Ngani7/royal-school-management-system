import { useEffect, useState } from "react";
import { ArrowRight, DollarSign } from "lucide-react";
import { User } from "./types";
import { api } from "../utils/api";

interface InvoiceSummary {
  totalOutstanding: number;
  totalInvoices: number;
  issuedCount: number;
  partialCount: number;
  overdueCount: number;
}

interface Props {
  user: User;
  onTabChange: (tab: string) => void;
}

export default function Dashboard({ user, onTabChange }: Props) {
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoiceSummary();
  }, []);

  const fetchInvoiceSummary = async () => {
    try {
      setLoading(true);
      const data = await api.get("/api/v1/invoices/summary/all").catch(() => null);
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch invoice summary:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Welcome, {user.name}! 👋</h1>
          <p className="text-gray-600 mt-2">Here's your financial overview for this term</p>
        </div>
        {user.role === "ADMIN" || user.role === "FINANCE" ? (
          <button
            onClick={() => onTabChange("finance")}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-6 py-3 rounded-lg transition flex items-center gap-2"
          >
            <DollarSign className="w-5 h-5" />
            Open Bursary Portal
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* BURSARY & FEES SUMMARY DASHBOARD */}
      {summary && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">💰 Bursary & Fees Summary Dashboard</h2>
            <p className="text-gray-600 text-sm mt-1">Academic Term Statement tracker for financial targets</p>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* TOTAL OUTSTANDING */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-red-50 to-red-100/50">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">💰 OUTSTANDING BALANCE DUE</p>
              <p className="text-4xl font-bold text-red-700">
                K {summary.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-red-600 mt-2">⚠️ Billed collection pending</p>
            </div>

            {/* ISSUED INVOICES */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100/50">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">📄 ISSUED INVOICES</p>
              <p className="text-4xl font-bold text-blue-700">{summary.issuedCount}</p>
              <p className="text-xs text-blue-600 mt-2">Invoices not yet paid</p>
            </div>

            {/* TOTAL INVOICES */}
            <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-green-50 to-green-100/50">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">✓ TOTAL INVOICES ACTIVE</p>
              <p className="text-4xl font-bold text-green-700">{summary.totalInvoices}</p>
              <p className="text-xs text-green-600 mt-2">Across all students</p>
            </div>
          </div>

          {/* COLLECTION STATUS */}
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Status Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-3xl font-bold text-red-600">{summary.issuedCount}</div>
                <div>
                  <p className="font-medium text-gray-900">Issued</p>
                  <p className="text-sm text-gray-600">Not yet paid</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">{summary.partialCount}</div>
                <div>
                  <p className="font-medium text-gray-900">Partial</p>
                  <p className="text-sm text-gray-600">Partially paid</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA BUTTON */}
          <div className="border-t border-gray-200 pt-8 mt-8 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">View detailed invoices, post payments, and manage billing</p>
            </div>
            <button
              onClick={() => onTabChange("finance")}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-8 py-3 rounded-lg transition inline-flex items-center gap-2"
            >
              Go to Bursary Portal
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          Loading financial summary...
        </div>
      )}
    </div>
  );
}
