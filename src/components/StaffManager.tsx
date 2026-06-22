import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { api } from "../utils/api";

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  dateJoined: string;
  employmentStatus: string;
  employmentRecords?: Array<{
    id: string;
    salaryScale: { name: string; baseSalary: number };
    status: string;
  }>;
}

interface SalaryScale {
  id: string;
  name: string;
  baseSalary: number;
  description?: string;
}

export default function StaffManager() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [salaryScales, setSalaryScales] = useState<SalaryScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    dateJoined: new Date().toISOString().split("T")[0],
    salaryScaleId: "",
    idNumber: "",
    bankAccount: "",
    bankName: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [staff, scales] = await Promise.all([
        api.get("/api/v1/payroll/staff"),
        api.get("/api/v1/payroll/salary-scales"),
      ]);
      setStaffList(staff || []);
      setSalaryScales(scales || []);
    } catch (err) {
      console.error("Failed to load staff data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!formData.firstName || !formData.lastName || !formData.salaryScaleId) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || null,
        phone: formData.phone || null,
        position: formData.position || null,
        department: formData.department || null,
        dateJoined: formData.dateJoined,
        idNumber: formData.idNumber || null,
        bankAccount: formData.bankAccount || null,
        bankName: formData.bankName || null,
        salaryScaleId: formData.salaryScaleId,
      };

      await api.post("/api/v1/payroll/staff", payload);
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        dateJoined: new Date().toISOString().split("T")[0],
        salaryScaleId: "",
        idNumber: "",
        bankAccount: "",
        bankName: "",
      });
      setShowForm(false);
      
      // Reload data
      await loadData();
    } catch (err) {
      console.error("Failed to create staff:", err);
      alert("Error creating staff member");
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      await api.delete(`/api/v1/payroll/staff/${id}`);
      await loadData();
    } catch (err) {
      console.error("Failed to delete staff:", err);
      alert("Error deleting staff member");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl animate-skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-48 rounded-xl animate-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="staff-manager" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-gold" />
            Staff Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage staff records</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest text-white rounded-lg hover:bg-forest/90 transition font-semibold text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-gray-900">New Staff Member</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@school.zm"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+260977..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Position
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Teacher"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Academic"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Date Joined
              </label>
              <input
                type="date"
                value={formData.dateJoined}
                onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Salary Scale *
              </label>
              <select
                value={formData.salaryScaleId}
                onChange={(e) => setFormData({ ...formData, salaryScaleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <option value="">Select salary scale</option>
                {salaryScales.map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.name} (ZMW {scale.baseSalary.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                ID Number
              </label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="NRC / Passport"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Bank Account
              </label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                placeholder="Account number"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="Bank name"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateStaff}
              className="px-4 py-2 bg-gold text-forest rounded-lg hover:bg-gold/90 transition text-sm font-semibold flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Create Staff
            </button>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="space-y-3">
        {staffList.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No staff members yet</p>
            <p className="text-sm text-gray-400">Create your first staff record to get started</p>
          </div>
        ) : (
          staffList.map((staff) => (
            <div
              key={staff.id}
              className="bg-white p-4 rounded-xl border border-gray-100 hover:border-gold/30 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-serif font-bold text-gray-900">
                    {staff.firstName} {staff.lastName}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {staff.position && <span>{staff.position}</span>}
                    {staff.position && staff.department && <span> • </span>}
                    {staff.department && <span>{staff.department}</span>}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                    {staff.email && (
                      <span>
                        <span className="text-gray-400">Email:</span> {staff.email}
                      </span>
                    )}
                    {staff.phone && (
                      <span>
                        <span className="text-gray-400">Phone:</span> {staff.phone}
                      </span>
                    )}
                  </div>
                  {staff.employmentRecords && staff.employmentRecords.length > 0 && (
                    <div className="mt-2">
                      {staff.employmentRecords.map((emp) => (
                        <span
                          key={emp.id}
                          className="inline-block px-2.5 py-1 bg-gold/10 text-gold text-[11px] font-bold rounded mr-2"
                        >
                          {emp.salaryScale.name} (ZMW {emp.salaryScale.baseSalary.toLocaleString()})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteStaff(staff.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
