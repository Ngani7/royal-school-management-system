import { useState, useEffect } from "react";
import { DollarSign, Play, Download, Trash2, Check } from "lucide-react";
import { api } from "../utils/api";

interface Payroll {
  id: string;
  staffId: string;
  staff: {
    firstName: string;
    lastName: string;
    employmentRecords: Array<{
      salaryScale: { baseSalary: number; name: string };
    }>;
  };
  paymentMonth: string;
  baseSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  deductions?: Array<{
    id: string;
    deductionType: { name: string; code: string; type: string; rate?: number };
    amount: number;
  }>;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  employmentRecords?: Array<{
    salaryScale: { baseSalary: number; name: string };
  }>;
}

export default function PayrollManager() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [processMonth, setProcessMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payrollData, staffData] = await Promise.all([
        api.get(`/api/v1/payroll/payrolls?month=${processMonth}`),
        api.get("/api/v1/payroll/staff"),
      ]);
      setPayrolls(payrollData || []);
      setStaffList(staffData || []);
    } catch (err) {
      console.error("Failed to load payroll data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async () => {
    if (!processMonth) {
      alert("Please select a month");
      return;
    }

    try {
      setProcessing(true);
      await api.post("/api/v1/payroll/process", {
        paymentMonth: processMonth,
      });
      await loadData();
      alert("Payroll processed successfully!");
    } catch (err) {
      console.error("Failed to process payroll:", err);
      alert("Error processing payroll");
    } finally {
      setProcessing(false);
    }
  };

  const handleApprovePayroll = async (id: string) => {
    try {
      await api.patch(`/api/v1/payroll/payrolls/${id}`, {
        status: "PROCESSED",
      });
      await loadData();
    } catch (err) {
      console.error("Failed to approve payroll:", err);
      alert("Error approving payroll");
    }
  };

  const handleDeletePayroll = async (id: string) => {
    if (!confirm("Delete this payroll? This cannot be undone.")) return;

    try {
      await api.delete(`/api/v1/payroll/payrolls/${id}`);
      await loadData();
    } catch (err) {
      console.error("Failed to delete payroll:", err);
      alert("Error deleting payroll");
    }
  };

  const calculatePayroll = (staff: Staff) => {
    const baseSalary = staff.employmentRecords?.[0]?.salaryScale?.baseSalary || 0;
    const grossSalary = baseSalary;

    // Calculate deductions
    const napsa = grossSalary * 0.05; // 5%
    const nhima = grossSalary * 0.02; // 2%
    // Simplified PAYE calculation (Zambian tax brackets)
    let paye = 0;
    if (grossSalary > 3000) {
      paye = (grossSalary - 3000) * 0.2; // 20% on amount above 3000
    }

    const totalDeductions = napsa + nhima + paye;
    const netSalary = grossSalary - totalDeductions;

    return { baseSalary, grossSalary, totalDeductions, netSalary, napsa, nhima, paye };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl animate-skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-xl animate-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  const unprocessedCount = staffList.length - (payrolls.filter(p => p.paymentMonth === processMonth).length || 0);

  return (
    <div id="payroll-manager" className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-gold" />
          Payroll Management
        </h2>
        <p className="text-sm text-gray-500 mt-1">Process and manage staff salaries</p>
      </div>

      {/* Process Controls */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
              Payment Month
            </label>
            <input
              type="month"
              value={processMonth}
              onChange={(e) => setProcessMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div className="flex-1">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
              Status
            </p>
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 font-semibold">
              {unprocessedCount} staff pending
            </div>
          </div>

          <button
            onClick={handleProcessPayroll}
            disabled={processing || unprocessedCount === 0}
            className="px-6 py-2.5 bg-forest text-white rounded-lg hover:bg-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-sm flex items-center gap-2 h-fit"
          >
            <Play className="h-4 w-4" />
            {processing ? "Processing..." : "Process Payroll"}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Staff Count</p>
          <p className="text-3xl font-serif font-bold text-forest mt-2">{staffList.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Processed This Month</p>
          <p className="text-3xl font-serif font-bold text-gold mt-2">
            {payrolls.filter((p) => p.paymentMonth === processMonth).length}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total Net Payroll</p>
          <p className="text-2xl font-serif font-bold text-emerald-600 mt-2">
            ZMW{" "}
            {payrolls
              .filter((p) => p.paymentMonth === processMonth)
              .reduce((sum, p) => sum + p.netSalary, 0)
              .toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Payroll List */}
      <div className="space-y-3">
        <h3 className="font-serif font-bold text-gray-900">Payroll for {processMonth}</h3>

        {payrolls.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No payroll processed yet</p>
            <p className="text-sm text-gray-400">Click "Process Payroll" to generate payroll for all staff</p>
          </div>
        ) : (
          payrolls
            .filter((p) => p.paymentMonth === processMonth)
            .map((payroll) => (
              <div
                key={payroll.id}
                className="bg-white p-5 rounded-xl border border-gray-100 hover:border-gold/30 transition"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h4 className="font-serif font-bold text-gray-900">
                      {payroll.staff.firstName} {payroll.staff.lastName}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {payroll.staff.employmentRecords?.[0]?.salaryScale?.name}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      payroll.status === "PROCESSED"
                        ? "bg-emerald-100 text-emerald-700"
                        : payroll.status === "PAID"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {payroll.status}
                  </span>
                </div>

                {/* Deduction Details */}
                {payroll.deductions && payroll.deductions.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-100">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                      Deductions
                    </p>
                    <div className="space-y-1 text-xs">
                      {payroll.deductions.map((ded) => (
                        <div key={ded.id} className="flex justify-between">
                          <span className="text-gray-600">{ded.deductionType.name}</span>
                          <span className="font-semibold text-gray-900">
                            ZMW {ded.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salary Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-[10px] text-blue-600 font-bold uppercase">Gross</p>
                    <p className="text-lg font-serif font-bold text-blue-900 mt-1">
                      ZMW {Math.round(payroll.grossSalary).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-[10px] text-red-600 font-bold uppercase">Deductions</p>
                    <p className="text-lg font-serif font-bold text-red-900 mt-1">
                      ZMW {Math.round(payroll.totalDeductions).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg md:col-span-2">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Net Pay</p>
                    <p className="text-2xl font-serif font-bold text-emerald-900 mt-1">
                      ZMW {Math.round(payroll.netSalary).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                  {payroll.status === "DRAFT" && (
                    <button
                      onClick={() => handleApprovePayroll(payroll.id)}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePayroll(payroll.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
