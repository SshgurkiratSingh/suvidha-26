import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { billsAPI } from "../components/services/api";
import { formatCurrency, formatDate } from "../utils/helpers";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import ServiceCard from "../components/common/ServiceCard";
import {
  Zap,
  Droplet,
  Flame,
  Trash2,
  Sun,
  FileText,
  MessageSquare,
  User,
  Bell,
  History,
  FolderOpen,
  DollarSign,
  Shield,
  Search,
  TrendingUp,
  AlertTriangle,
  Gift,
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin/dashboard");
      return;
    }

    const fetchNotifications = async () => {
      try {
        const bills = await billsAPI.list();
        const newNotifications = [];

        // Filter for unpaid bills
        const unpaidBills = bills.filter((b) => !b.isPaid);

        // Sort: Overdue first, then by due date
        unpaidBills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        unpaidBills.forEach((bill) => {
          const dueDate = new Date(bill.dueDate);
          const today = new Date();
          const isOverdue = dueDate < today;
          const dept = bill.serviceAccount?.department
            ? bill.serviceAccount.department.charAt(0) +
              bill.serviceAccount.department.slice(1).toLowerCase()
            : "Utility";

          newNotifications.push({
            id: bill.id,
            type: isOverdue ? "overdue" : "due",
            title: isOverdue
              ? `${dept} bill overdue`
              : `Your ${dept.toLowerCase()} bill is ready`,
            message: isOverdue
              ? `Please pay ${formatCurrency(
                  bill.amount,
                )} immediately to avoid disconnection`
              : `Bill amount: ${formatCurrency(
                  bill.amount,
                )} | Due: ${formatDate(bill.dueDate)}`,
            isOverdue,
          });
        });

        setNotifications(newNotifications.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [isAdmin, navigate]);

  const services = [
    {
      title: t("electricity"),
      icon: Zap,
      description: "Manage electricity connections, bills & payments",
      path: "/electricity",
      isSpecial: false,
    },
    {
      title: t("water"),
      icon: Droplet,
      description: "Water connections, quality tests & billing",
      path: "/water",
      isSpecial: false,
    },
    {
      title: t("gas"),
      icon: Flame,
      description: "LPG refills, new connections & payments",
      path: "/gas",
      isSpecial: false,
    },
    {
      title: t("sanitation"),
      icon: Trash2,
      description: "Waste management & sanitation services",
      path: "/sanitation",
      isSpecial: false,
    },
    {
      title: t("solar"),
      icon: Sun,
      description: "PM Surya Ghar - Solar rooftop subsidy",
      path: "/solar",
      isSpecial: true, // X-Factor!
    },
  ];

  const quickActions = [
    {
      title: t("allBills"),
      icon: FileText,
      path: "/all-bills",
      category: "billing",
      color: "blue",
    },
    {
      title: t("allUsage"),
      icon: History,
      path: "/all-usage",
      category: "billing",
      color: "purple",
    },
    {
      title: "My Applications",
      icon: FolderOpen,
      path: "/my-applications",
      category: "tracking",
      color: "green",
    },
    {
      title: t("myGrievances"),
      icon: MessageSquare,
      path: "/grievances",
      category: "support",
      color: "orange",
    },
    {
      title: "Track Status",
      icon: TrendingUp,
      path: "/track-status",
      category: "tracking",
      color: "indigo",
    },
    {
      title: "Tariffs",
      icon: DollarSign,
      path: "/tariffs",
      category: "info",
      color: "teal",
    },
    {
      title: "Policies",
      icon: Shield,
      path: "/policies",
      category: "info",
      color: "cyan",
    },
    {
      title: "Schemes",
      icon: Gift,
      path: "/schemes",
      category: "info",
      color: "pink",
    },
    {
      title: "Profile",
      icon: User,
      path: "/profile",
      category: "account",
      color: "gray",
    },
  ];

  const categories = [
    { id: "all", label: "All", icon: null },
    { id: "billing", label: "Billing & Payments", icon: FileText },
    { id: "tracking", label: "Applications & Tracking", icon: FolderOpen },
    { id: "support", label: "Support", icon: MessageSquare },
    { id: "info", label: "Information", icon: Shield },
    { id: "account", label: "Account", icon: User },
  ];

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredQuickActions = quickActions.filter((action) => {
    const matchesSearch = action.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || action.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600 hover:bg-blue-200",
      purple: "bg-purple-100 text-purple-600 hover:bg-purple-200",
      green: "bg-green-100 text-green-600 hover:bg-green-200",
      orange: "bg-orange-100 text-orange-600 hover:bg-orange-200",
      indigo: "bg-indigo-100 text-indigo-600 hover:bg-indigo-200",
      teal: "bg-teal-100 text-teal-600 hover:bg-teal-200",
      cyan: "bg-cyan-100 text-cyan-600 hover:bg-cyan-200",
      gray: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary to-primary-hover text-white rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome, {user?.fullName || user?.name || "Citizen"}! 👋
              </h1>
              <p className="text-white/80 text-lg">
                {isAdmin
                  ? "Admin Dashboard"
                  : "Your one-stop solution for all civic services"}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
                <User className="w-16 h-16" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="text"
                placeholder="Search services and actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 text-xl border border-gray-300 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-orange-50 border-l-8 border-orange-500 rounded-2xl p-8 mb-10 shadow-sm"
          >
            <div className="flex items-start gap-6">
              <div className="bg-orange-100 p-4 rounded-full">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-orange-900 mb-4">
                  {notifications.filter((n) => n.isOverdue).length > 0
                    ? "⚠️ Urgent Attention Required"
                    : "📋 Pending Actions"}
                </h3>
                <div className="space-y-4">
                  {notifications.slice(0, 3).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-5 rounded-xl border flex justify-between items-center ${notif.isOverdue ? "bg-red-50 border-red-100" : "bg-white border-orange-100"}`}
                    >
                      <div>
                        <p className="font-bold text-lg text-gray-800">
                          {notif.title}
                        </p>
                        <p className="text-gray-600 text-base mt-1">
                          {notif.message}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("/all-bills")}
                        className="px-6 py-2 bg-white border border-gray-200 shadow-sm rounded-lg font-bold text-primary hover:bg-gray-50 uppercase tracking-wide text-sm"
                      >
                        Action
                      </button>
                    </div>
                  ))}
                </div>
                {notifications.length > 3 && (
                  <button
                    onClick={() => navigate("/all-bills")}
                    className="mt-4 text-lg text-orange-700 font-bold hover:underline flex items-center gap-2"
                  >
                    View all {notifications.length} notifications{" "}
                    <TrendingUp size={20} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h2 className="text-3xl font-bold text-gray-800">Quick Actions</h2>
            <div className="flex gap-3 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-3 rounded-xl text-lg font-medium transition-all transform active:scale-95 ${
                    activeCategory === cat.id
                      ? "bg-primary text-white shadow-lg"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  {cat.icon && (
                    <cat.icon className="inline-block w-5 h-5 mr-2 -mt-1" />
                  )}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredQuickActions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.path)}
                className={`flex flex-col items-center justify-center p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border-2 border-transparent ${getColorClasses(action.color)}`}
              >
                <div className="bg-white/80 p-4 rounded-full mb-4 shadow-sm">
                  <action.icon className="w-10 h-10" />
                </div>
                <p className="font-bold text-xl text-center leading-tight">
                  {action.title}
                </p>
              </motion.button>
            ))}
          </div>
          {filteredQuickActions.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-lg">
              No actions found matching your search
            </div>
          )}
        </div>

        {/* Main Services */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Core Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <ServiceCard
                  title={service.title}
                  icon={service.icon}
                  description={service.description}
                  onClick={() => navigate(service.path)}
                  isSpecial={service.isSpecial}
                />
              </motion.div>
            ))}
          </div>
          {filteredServices.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No services found matching your search</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default Dashboard;
