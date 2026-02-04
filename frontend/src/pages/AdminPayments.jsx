import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import {
  Check,
  X,
  Bell,
  DollarSign,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils/helpers";

const AdminPayments = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error } = useNotification();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
      return;
    }

    // Initial Load
    loadData();

    // Poll for new requests (Demo purpose)
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [isAdmin, navigate]);

  const loadData = () => {
    const pData = JSON.parse(
      localStorage.getItem("pending_approval_bills") || "[]",
    );
    // Filter out malformed entries (strings from old version) or convert on fly if we wanted,
    // but for now let's just assume we only render the valid objects.
    // As we just patched AllBills to save objects, any NEW request will be an object.
    const validRequests = pData.filter(
      (item) => typeof item === "object" && item !== null,
    );

    // Sort by date desc
    validRequests.sort(
      (a, b) => new Date(b.requestedAt) - new Date(a.requestedAt),
    );

    setPendingRequests(validRequests);
  };

  const handleApprove = (id) => {
    const approvedIds = JSON.parse(
      localStorage.getItem("approved_bills_demo") || "[]",
    );
    if (!approvedIds.includes(id)) {
      approvedIds.push(id);
      localStorage.setItem("approved_bills_demo", JSON.stringify(approvedIds));
    }

    // Remove from pending
    const pData = JSON.parse(
      localStorage.getItem("pending_approval_bills") || "[]",
    );
    const newPending = pData.filter(
      (item) => (typeof item === "object" ? item.id : item) !== id,
    );
    localStorage.setItem("pending_approval_bills", JSON.stringify(newPending));

    success("Payment approved successfully");
    loadData();
  };

  const handleReject = (id) => {
    // Just remove from pending
    const pData = JSON.parse(
      localStorage.getItem("pending_approval_bills") || "[]",
    );
    const newPending = pData.filter(
      (item) => (typeof item === "object" ? item.id : item) !== id,
    );
    localStorage.setItem("pending_approval_bills", JSON.stringify(newPending));

    success("Payment request rejected");
    loadData();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Payment Approvals
            </h1>
            <p className="text-gray-600">
              Review and approve offline payment requests
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm text-gray-500 font-medium">
              Pending Requests:{" "}
            </span>
            <span className="text-lg font-bold text-orange-600">
              {pendingRequests.length}
            </span>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border-dashed border-2 border-gray-200">
            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-500 w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">All Caught Up!</h3>
            <p className="text-gray-500">
              No pending payment approvals at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      req.department === "ELECTRICITY"
                        ? "bg-yellow-100 text-yellow-600"
                        : req.department === "WATER"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {req.department || "Utility"} Bill
                    </h4>
                    <p className="text-sm text-gray-500 font-mono">
                      ID: {req.id}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 items-center text-sm w-full md:w-auto">
                  <div>
                    <span className="block text-gray-400 text-xs uppercase tracking-wider">
                      Amount
                    </span>
                    <span className="font-bold text-gray-800 text-lg">
                      {formatCurrency(req.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-xs uppercase tracking-wider">
                      Consumer ID
                    </span>
                    <span className="font-medium text-gray-700">
                      {req.consumerId}
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-400 text-xs uppercase tracking-wider">
                      Requested
                    </span>
                    <span className="font-medium text-gray-700">
                      {formatDate(req.requestedAt)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleReject(req.id)}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-semibold transition-colors flex items-center gap-2"
                  >
                    <X size={18} /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2"
                  >
                    <Check size={18} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminPayments;
