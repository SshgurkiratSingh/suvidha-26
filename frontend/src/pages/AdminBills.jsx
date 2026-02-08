import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { adminAPI } from "../components/services/api";
import {
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils/helpers";

const DEPARTMENTS = ["ELECTRICITY", "WATER", "GAS", "SANITATION", "MUNICIPAL"];

const AdminBills = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState("");

  const [formData, setFormData] = useState({
    mobileNumber: "",
    department: "ELECTRICITY",
    consumerId: "",
    address: "",
    amount: "",
    dueDate: "",
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
      return;
    }
    loadBills();
  }, [isAdmin, navigate]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.listBills();
      setBills(data);
    } catch (err) {
      error(err.message || "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createBill({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      success("Bill created successfully");
      setShowCreateModal(false);
      setFormData({
        mobileNumber: "",
        department: "ELECTRICITY",
        consumerId: "",
        address: "",
        amount: "",
        dueDate: "",
      });
      loadBills();
    } catch (err) {
      error(err.message || "Failed to create bill");
    }
  };

  const handleMarkPaid = async (bill) => {
    if (bill.isPaid) return;
    if (
      !window.confirm(
        `Mark bill for ${bill.serviceAccount?.consumerId} as PAID manually?`,
      )
    )
      return;
    try {
      await adminAPI.updateBill(bill.id, { isPaid: true });
      success("Bill marked as paid");
      loadBills();
    } catch (err) {
      error(err.message || "Failed to update bill");
    }
  };

  const handleDelete = async (bill) => {
    if (
      !window.confirm(
        `Are you sure you want to delete this bill for ${formatCurrency(bill.amount)}? This cannot be undone.`,
      )
    )
      return;
    try {
      await adminAPI.deleteBill(bill.id);
      success("Bill deleted successfully");
      loadBills();
    } catch (err) {
      error(err.message || "Failed to delete bill");
    }
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.serviceAccount?.consumerId
        ?.toLowerCase()
        .includes(filter.toLowerCase()) ||
      bill.serviceAccount?.citizen?.mobileNumber?.includes(filter),
  );

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Manage Bills</h1>
            <p className="text-gray-600">
              Create and view utility bills for citizens
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="gov-button flex items-center gap-2"
            >
              <Plus size={20} />
              Create New Bill
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center gap-4">
          <Search className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by Consumer ID or Mobile Number..."
            className="flex-1 outline-none text-gray-700"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {/* Bills List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Consumer ID</th>
                <th className="p-4 font-semibold text-gray-600">Department</th>
                <th className="p-4 font-semibold text-gray-600">Citizen</th>
                <th className="p-4 font-semibold text-gray-600">Amount</th>
                <th className="p-4 font-semibold text-gray-600">Due Date</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    Loading bills...
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    No bills found.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-800 font-medium">
                      {bill.serviceAccount?.consumerId}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">
                        {bill.serviceAccount?.department}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div>
                        {bill.serviceAccount?.citizen?.fullName || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-400">
                        {bill.serviceAccount?.citizen?.mobileNumber}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      {formatCurrency(bill.amount)}
                    </td>
                    <td className="p-4 text-gray-600">
                      {formatDate(bill.dueDate)}
                    </td>
                    <td className="p-4">
                      {bill.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold">
                          <CheckCircle size={14} /> PAID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold">
                          <AlertCircle size={14} /> UNPAID
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex gap-2">
                      {!bill.isPaid && (
                        <button
                          onClick={() => handleMarkPaid(bill)}
                          title="Mark as Paid"
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(bill)}
                        title="Delete Bill"
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <FileText className="text-primary w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Generate New Bill
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    required
                    maxLength="10"
                    placeholder="e.g. 9876543210"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                  />
                  <p className="mt-1 text-xs text-gray-500 italic flex items-center gap-1">
                    <AlertCircle size={12} />
                    Enter the registered 10-digit mobile number for the citizen.
                  </p>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Department
                  </label>
                  <select
                    name="department"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={formData.department}
                    onChange={handleInputChange}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 italic flex items-center gap-1">
                    <AlertCircle size={12} />
                    Select the utility department (e.g. Electricity, Water).
                  </p>
                </div>

                {/* Consumer ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consumer / Connection ID
                  </label>
                  <input
                    type="text"
                    name="consumerId"
                    required
                    placeholder="e.g. 100020304"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={formData.consumerId}
                    onChange={handleInputChange}
                  />
                  <p className="mt-1 text-xs text-gray-500 italic flex items-center gap-1">
                    <AlertCircle size={12} />
                    Unique ID found on the service connection or physical bill.
                  </p>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="e.g. 123, Gandhi Nagar"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                  <p className="mt-1 text-xs text-gray-500 italic flex items-center gap-1">
                    <AlertCircle size={12} />
                    Location where the utility service is provided.
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-500 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="amount"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      value={formData.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 italic flex items-center gap-1">
                    <AlertCircle size={12} />
                    Total amount payable for this billing cycle.
                  </p>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                  />
                  <p className="mt-1 text-xs text-gray-500 italic flex items-center gap-1">
                    <AlertCircle size={12} />
                    Date by which payment should be made to avoid penalties.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="gov-button">
                  Generate Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminBills;
