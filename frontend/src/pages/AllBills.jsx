import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../context/NotificationContext";
import { billsAPI } from "../components/services/api";
import { formatCurrency, formatDate, getBillStatus } from "../utils/helpers";
import StatusBadge from "../components/common/StatusBadge";
import { FileText, Download, CreditCard } from "lucide-react";

const AllBills = () => {
  const { t } = useLanguage();
  const { error } = useNotification();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBills = async () => {
      try {
        const result = await billsAPI.list();
        setBills(result);
      } catch (err) {
        error(err.message || "Failed to load bills");
      } finally {
        setLoading(false);
      }
    };

    loadBills();
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-primary mb-8">
            {t("allBills")}
          </h1>

          {/* Bills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading && (
              <div className="bg-white rounded-xl shadow-md p-6">
                Loading bills...
              </div>
            )}
            {!loading && bills.length === 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                No bills available.
              </div>
            )}
            {bills.map((bill, index) => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 capitalize">
                        {bill.serviceAccount?.department || "Utility"} Bill
                      </h3>
                      <p className="text-sm text-gray-500">{bill.id}</p>
                    </div>
                  </div>
                  <StatusBadge
                    status={getBillStatus(bill.dueDate, bill.isPaid)}
                  />
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consumer ID:</span>
                    <span className="font-semibold">
                      {bill.serviceAccount?.consumerId || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-semibold">
                      {formatDate(bill.dueDate)}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">
                      Total Amount:
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition-colors">
                    <CreditCard className="w-5 h-5" />
                    Pay Now
                  </button>
                  <button className="px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default AllBills;
