import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  FileText,
  Download,
  CheckSquare,
  Square,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../context/NotificationContext";
import { billsAPI, paymentsAPI } from "../components/services/api";
import { formatCurrency, formatDate, getBillStatus } from "../utils/helpers";
import StatusBadge from "../components/common/StatusBadge";
import ReceiptModal from "../components/common/ReceiptModal";

const AllBills = () => {
  const { t } = useLanguage();
  const { error, success } = useNotification();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBills, setSelectedBills] = useState([]);
  const [processing, setProcessing] = useState(false);

  // New State for Receipt
  const [receiptBill, setReceiptBill] = useState(null);

  // New State for Payment Mode Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadBills();
  }, [error]);

  const loadBills = async () => {
    setLoading(true);
    try {
      const result = await billsAPI.list();
      // DEMO LOGIC: Check localStorage for any "Pending Approval" bills and override status
      const pendingData = JSON.parse(
        localStorage.getItem("pending_approval_bills") || "[]",
      );
      const pendingIds = pendingData.map((p) =>
        typeof p === "object" && p !== null ? p.id : p,
      );

      const approvedIds = JSON.parse(
        localStorage.getItem("approved_bills_demo") || "[]",
      );

      const enhancedBills = result.map((b) => {
        // If admin approved in demo, mark as paid
        if (approvedIds.includes(b.id)) {
          return {
            ...b,
            isPaid: true,
            status: "PAID",
            isPendingApproval: false,
          };
        }
        return {
          ...b,
          status: pendingIds.includes(b.id)
            ? "PENDING_APPROVAL"
            : b.isPaid
              ? "PAID"
              : "PENDING",
          isPendingApproval: pendingIds.includes(b.id),
        };
      });

      setBills(enhancedBills);
      setSelectedBills([]);
    } catch (err) {
      error(err.message || "Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (billId) => {
    const bill = bills.find((b) => b.id === billId);
    if (bill?.isPendingApproval) {
      error("This bill is awaiting admin approval.");
      return;
    }

    setSelectedBills((prev) =>
      prev.includes(billId)
        ? prev.filter((id) => id !== billId)
        : [...prev, billId],
    );
  };

  const toggleSelectAll = () => {
    const unpaidBills = bills.filter((b) => !b.isPaid && !b.isPendingApproval);
    if (selectedBills.length === unpaidBills.length) {
      setSelectedBills([]);
    } else {
      setSelectedBills(unpaidBills.map((b) => b.id));
    }
  };

  const handlePaymentRequest = async () => {
    // Demo Logic: "Send for Approval"
    setProcessing(true);

    // Simulate network delay
    setTimeout(() => {
      const pendingData = JSON.parse(
        localStorage.getItem("pending_approval_bills") || "[]",
      );

      // Create full objects for the new requests
      const newRequests = bills
        .filter((b) => selectedBills.includes(b.id))
        .map((b) => ({
          id: b.id,
          amount: b.amount,
          consumerId: b.serviceAccount?.consumerId || "N/A",
          department: b.serviceAccount?.department || "UTILITY",
          requestedAt: new Date().toISOString(),
          status: "PENDING",
        }));

      // Merge keeping objects
      const existingIds = new Set(
        pendingData.map((p) => (typeof p === "object" ? p.id : p)),
      );
      const uniqueNewRequests = newRequests.filter(
        (req) => !existingIds.has(req.id),
      );
      const finalPending = [...pendingData, ...uniqueNewRequests];

      localStorage.setItem(
        "pending_approval_bills",
        JSON.stringify(finalPending),
      );

      setProcessing(false);
      setShowPaymentModal(false);
      success("Payment request sent to Admin for approval.");
      loadBills();
    }, 1500);
  };

  const handleBulkPay = async () => {
    if (selectedBills.length === 0) return;
    setShowPaymentModal(true);
  };

  // ... rest of existing derived state ...
  const unpaidBills = bills.filter((b) => !b.isPaid);
  const totalAmount = bills
    .filter((b) => selectedBills.includes(b.id))
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen flex flex-col bg-neutral pb-24">
      <Header />

      {/* Kiosk Floating Action Bar for Payment */}
      <AnimatePresence>
        {selectedBills.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-30 p-4 md:p-6"
          >
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-gray-500 text-sm font-medium">
                  Total Payable Amount
                </p>
                <div className="flex items-baseline gap-2 justify-center md:justify-start">
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(totalAmount)}
                  </p>
                  <span className="text-sm text-gray-400">
                    for {selectedBills.length} Bill
                    {selectedBills.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <button
                onClick={handleBulkPay}
                disabled={processing}
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-4 px-12 rounded-2xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-3"
              >
                {processing ? (
                  <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    PAY NOW
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-4xl font-bold text-primary">{t("allBills")}</h1>

            {unpaidBills.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-primary font-bold rounded-xl hover:bg-blue-100 transition-colors text-lg"
              >
                {selectedBills.length === unpaidBills.length ? (
                  <CheckSquare size={24} />
                ) : (
                  <Square size={24} />
                )}
                {selectedBills.length === unpaidBills.length
                  ? "Deselect All"
                  : "Quick Pay All"}
              </button>
            )}
          </div>

          {/* Bills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && (
              <div className="col-span-full text-center py-20 text-gray-400">
                Loading bills...
              </div>
            )}
            {!loading && bills.length === 0 && (
              <div className="col-span-full bg-white rounded-xl shadow-md p-10 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-700">
                  No Bills Found
                </h3>
                <p className="text-gray-500">
                  You don't have any pending bills.
                </p>
              </div>
            )}
            {bills.map((bill, index) => {
              const isSelected = selectedBills.includes(bill.id);
              const isPayable = !bill.isPaid && !bill.isPendingApproval;

              return (
                <motion.div
                  key={bill.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => isPayable && toggleSelection(bill.id)}
                  className={`relative rounded-xl shadow-md p-6 transition-all cursor-pointer border-2 ${
                    isSelected
                      ? "bg-blue-50 border-primary ring-2 ring-primary/20 scale-[1.02]"
                      : "bg-white border-transparent hover:border-gray-200"
                  } ${!isPayable && "opacity-75 cursor-default bg-gray-50"}`}
                >
                  {/* Selection Checkbox Overlay */}
                  {isPayable && (
                    <div className="absolute top-4 right-4 z-10">
                      {isSelected ? (
                        <div className="bg-primary text-white p-2 rounded-full shadow-lg scale-110 transition-transform">
                          <CheckSquare size={24} />
                        </div>
                      ) : (
                        <div className="text-gray-300 hover:text-primary transition-colors">
                          <Square size={28} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 pr-12">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm ${
                          bill.isPaid
                            ? "bg-green-100"
                            : bill.isPendingApproval
                              ? "bg-orange-100"
                              : "bg-white"
                        }`}
                      >
                        <FileText
                          className={`w-8 h-8 ${bill.isPaid ? "text-green-600" : bill.isPendingApproval ? "text-orange-600" : "text-primary"}`}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 capitalize text-lg leading-tight">
                          {bill.serviceAccount?.department || "Utility"} Bill
                        </h3>
                        <p className="text-xs text-gray-400 font-mono mt-1">
                          {bill.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Consumer ID</span>
                      <span className="font-semibold text-gray-900">
                        {bill.serviceAccount?.consumerId || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Due Date</span>
                      <span
                        className={`font-semibold ${
                          new Date(bill.dueDate) < new Date() && !bill.isPaid
                            ? "text-red-500"
                            : ""
                        }`}
                      >
                        {formatDate(bill.dueDate)}
                      </span>
                    </div>
                    {/* Status Badge integrated */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                      <span className="text-gray-500 text-sm">Status</span>
                      {bill.isPendingApproval ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600 border border-orange-200">
                          PENDING APPROVAL
                        </span>
                      ) : (
                        <StatusBadge
                          status={getBillStatus(bill.dueDate, bill.isPaid)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Amount Footer */}
                  <div className="flex items-end justify-between mt-auto">
                    <div>
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Amount Due
                      </span>
                      <div className="text-3xl font-bold text-gray-900">
                        {formatCurrency(bill.amount)}
                      </div>
                    </div>
                    {bill.isPaid ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReceiptBill(bill);
                        }}
                        className="p-2 mb-1 text-primary hover:bg-primary/5 rounded-lg transition-colors group"
                        title="Download Receipt"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium hidden group-hover:block">
                            Receipt
                          </span>
                          <Download size={24} />
                        </div>
                      </button>
                    ) : (
                      <div
                        className={`px-4 py-2 rounded-lg text-sm font-bold ${
                          bill.isPendingApproval
                            ? "bg-orange-100 text-orange-400"
                            : isSelected
                              ? "bg-primary text-white"
                              : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {bill.isPendingApproval
                          ? "WAITING"
                          : isSelected
                            ? "SELECTED"
                            : "SELECT"}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>

      {/* Payment Method Modal Overlay */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-primary to-blue-600 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 transform rotate-12 scale-150"></div>
              <h3 className="text-2xl font-bold relative z-10">
                Select Payment Method
              </h3>
              <p className="opacity-90 mt-2 relative z-10 font-mono bg-white/20 inline-block px-3 py-1 rounded-full text-sm">
                Total:{" "}
                {formatCurrency(
                  bills
                    .filter((b) => selectedBills.includes(b.id))
                    .reduce((sum, b) => sum + b.amount, 0),
                )}
              </p>
            </div>

            <div className="p-6 space-y-3">
              {processing ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-500 font-medium">
                    Processing request...
                  </p>
                </div>
              ) : (
                <>
                  {/* Option 1: Cash/Cheque (Demo Approval) */}
                  <button
                    onClick={handlePaymentRequest}
                    className="w-full flex items-center p-4 border-2 border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left shadow-sm hover:shadow-md"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4 group-hover:scale-110 transition-transform flex-shrink-0">
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">
                        Cash / Cheque via Agent
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Submit request for admin approval
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Mock UPI */}
                  <button
                    disabled
                    className="w-full flex items-center p-4 border-2 border-gray-100 rounded-xl opacity-60 cursor-not-allowed grayscale"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4 flex-shrink-0">
                      <ShoppingBag size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">
                        UPI / QR Code
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Make instant digital payment
                      </div>
                    </div>
                    <div className="ml-auto text-xs font-bold bg-gray-200 px-2 py-1 rounded text-gray-500">
                      COMING SOON
                    </div>
                  </button>

                  <div className="pt-2">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="w-full py-3 text-gray-400 font-medium hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel Transaction
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick View Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptBill}
        bill={receiptBill}
        onClose={() => setReceiptBill(null)}
      />

      <Footer />
    </div>
  );
};

export default AllBills;
