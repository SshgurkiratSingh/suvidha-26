import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useLanguage } from "../context/LanguageContext";
import { billsAPI } from "../components/services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Zap, Droplet, Flame } from "lucide-react";
import { useNotification } from "../context/NotificationContext";

const AllUsage = () => {
  const { t } = useLanguage();
  const { error } = useNotification();
  const [usageData, setUsageData] = useState({
    ELECTRICITY: [],
    WATER: [],
    GAS: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const bills = await billsAPI.list();

        // Group bills by department and format for chart
        const grouped = {
          ELECTRICITY: [],
          WATER: [],
          GAS: [],
        };

        bills.forEach((bill) => {
          const dept = bill.serviceAccount?.department;
          if (dept && grouped[dept]) {
            const date = new Date(bill.createdAt);
            const month = date.toLocaleString("default", { month: "short" });

            // Check if we already have an entry for this month
            const existing = grouped[dept].find((d) => d.month === month);
            if (existing) {
              existing.amount += bill.amount;
            } else {
              grouped[dept].push({
                month,
                amount: bill.amount,
                date: date,
              });
            }
          }
        });

        // Sort by date (we attached date object for sorting) and remove it before setting state
        Object.keys(grouped).forEach((key) => {
          grouped[key].sort((a, b) => a.date - b.date);
        });

        setUsageData(grouped);
      } catch (err) {
        console.error(err);
        error("Failed to load usage data");
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
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
            {t("allUsage")}
          </h1>

          {loading ? (
            <div className="text-center py-10">Loading usage history...</div>
          ) : (
            /* Usage Charts */
            <div className="space-y-8">
              {/* Electricity */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Electricity Billing History
                    </h3>
                    <p className="text-gray-600">Bill amounts over time (₹)</p>
                  </div>
                </div>
                {usageData.ELECTRICITY.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usageData.ELECTRICITY}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Legend />
                      <Bar dataKey="amount" fill="#0A3D62" name="Amount (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 italic">
                    No electricity bills found.
                  </p>
                )}
              </div>

              {/* Water */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Droplet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Water Billing History
                    </h3>
                    <p className="text-gray-600">Bill amounts over time (₹)</p>
                  </div>
                </div>
                {usageData.WATER.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usageData.WATER}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Legend />
                      <Bar dataKey="amount" fill="#138808" name="Amount (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 italic">No water bills found.</p>
                )}
              </div>

              {/* Gas */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Flame className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      Gas Billing History
                    </h3>
                    <p className="text-gray-600">Bill amounts over time (₹)</p>
                  </div>
                </div>
                {usageData.GAS.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usageData.GAS}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Legend />
                      <Bar dataKey="amount" fill="#FF9933" name="Amount (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 italic">No gas bills found.</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default AllUsage;
