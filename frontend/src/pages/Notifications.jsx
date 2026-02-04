import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { publicAPI, billsAPI } from "../components/services/api";
import { useNotification } from "../context/NotificationContext";
import {
  Bell,
  FileText,
  ShieldAlert,
  Zap,
  Droplets,
  Flame,
  Trash2,
  Building2,
  Info,
  Calendar,
  AlertTriangle 
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDateTime, formatDate } from "../utils/helpers";

const Notifications = () => {
  const { error } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL, ADVISORY, SCHEME, POLICY

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [advisoriesData, schemesData, policiesData, billsData] = await Promise.all([
        publicAPI.getAdvisories(),
        publicAPI.getSchemes(),
        publicAPI.getPolicies(),
        billsAPI.list().catch(() => []), 
      ]);

      const advisoryList = Array.isArray(advisoriesData)
        ? advisoriesData
        : advisoriesData?.advisories || [];
      const schemeList = Array.isArray(schemesData)
        ? schemesData
        : schemesData?.schemes || [];
      const policyList = Array.isArray(policiesData)
        ? policiesData
        : policiesData?.policies || [];

      // Filter unpaid bills for urgent attention
      const unpaidBills = Array.isArray(billsData) ? billsData.filter(b => !b.isPaid) : [];
      const urgentBills = unpaidBills.map(bill => ({
        id: `bill-${bill.id}`,
        type: "URGENT",
        department: bill.serviceAccount?.department || 'UTILITY',
        title: `⚠️ Urgent Attention Required: ${bill.serviceAccount?.department || 'Utility'} Bill`,
        description: `You have a pending bill of **₹${bill.amount}** due on **${new Date(bill.dueDate).toLocaleDateString()}**.  \nPlease pay immediately to avoid service interruption.`,
        date: bill.dueDate,
        isUrgent: true
      }));

      const advisories = advisoryList.map((item) => ({
        ...item,
        type: "ADVISORY",
        date: item.validTill, // using validTill as a proxy for relevance
        isAdvisory: true,
      }));

      const schemes = schemeList.map((item) => ({
        ...item,
        type: "SCHEME",
        // Schemes trigger on creating, so let's default to now if no date, or just push them
      }));

      const policies = policyList.map((item) => ({
        ...item,
        type: "POLICY",
        date: item.createdAt,
      }));

      // Merge and shuffle or sort. 
      // Put Urgent Bills first, then Advisories, then Policies, then Schemes.
      const combined = [...urgentBills, ...advisories, ...policies, ...schemes];
      setNotifications(combined);
    } catch (err) {
      console.error(err);
      error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type, department) => {
    if (type === "URGENT")
      return <AlertTriangle className="text-red-600 w-6 h-6" />;
    if (type === "ADVISORY")
      return <ShieldAlert className="text-red-500 w-6 h-6" />;

    // Department icons for others
    switch (department) {
      case "ELECTRICITY":
        return <Zap className="text-yellow-500 w-6 h-6" />;
      case "WATER":
        return <Droplets className="text-blue-500 w-6 h-6" />;
      case "GAS":
        return <Flame className="text-orange-500 w-6 h-6" />;
      case "SANITATION":
        return <Trash2 className="text-green-500 w-6 h-6" />;
      case "MUNICIPAL":
        return <Building2 className="text-purple-500 w-6 h-6" />;
      default:
        return <Bell className="text-primary w-6 h-6" />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case "URGENT":
        return "bg-red-500 text-white border-red-600";
      case "ADVISORY":
        return "bg-red-100 text-red-700 border-red-200";
      case "SCHEME":
        return "bg-green-100 text-green-700 border-green-200";
      case "POLICY":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredNotifications =
    filter === "ALL"
      ? notifications
      : notifications.filter((n) => n.type === filter);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              Notifications & Updates
            </h1>
            <p className="text-gray-600 mt-1">
              Stay informed about the latest schemes, advisories, and policies.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "ALL", label: "All Updates" },
            { id: "URGENT", label: "Urgent" },
            { id: "ADVISORY", label: "Advisories" },
            { id: "SCHEME", label: "Schemes" },
            { id: "POLICY", label: "Policies" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                filter === f.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-gray-400 w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No notifications found
            </h3>
            <p className="text-gray-500">
              There are no updates in this category.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((item, index) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden ${item.type === 'URGENT' ? 'ring-2 ring-red-100' : ''}`}
              >
                {/* Left accent border for Advisories or Urgent */}
                {(item.type === "ADVISORY" || item.type === "URGENT") && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === 'URGENT' ? 'bg-red-600' : 'bg-red-500'}`} />
                )}

                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full flex-shrink-0 ${
                      item.type === "ADVISORY" || item.type === "URGENT" ? "bg-red-50" : "bg-gray-50"
                    }`}
                  >
                    {getIcon(item.type, item.department)}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${getBadgeColor(item.type)}`}
                        >
                          {item.type}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
                          {item.department}
                        </span>
                      </div>
                      {item.date && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} />
                          {item.type === "URGENT" || item.type === "ADVISORY"
                            ? `Valid till ${formatDate(item.date)}`
                            : formatDate(item.date)}
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {item.title || item.message || item.name}
                    </h3>

                    <div className="text-gray-600 text-sm leading-relaxed mb-3 prose prose-sm max-w-none">
                       <ReactMarkdown>
                         {item.description || item.message || "Use caution and follow safety guidelines."}
                       </ReactMarkdown>
                    </div>

                    {/* Action / Context Info */}
                    {item.type === "SCHEME" && item.eligibility && (
                      <div className="mt-2 text-sm bg-green-50 text-green-800 p-2 rounded-lg border border-green-100 inline-block">
                        <strong>Eligibility:</strong> {item.eligibility}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;
