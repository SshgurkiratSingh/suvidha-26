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
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

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
                  bill.amount
                )} immediately to avoid disconnection`
              : `Bill amount: ${formatCurrency(
                  bill.amount
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
    },
    {
      title: t("allUsage"),
      icon: History,
      path: "/all-usage",
    },
    {
      title: "My Applications",
      icon: FolderOpen,
      path: "/my-applications",
    },
    {
      title: t("myGrievances"),
      icon: MessageSquare,
      path: "/grievances",
    },
    {
      title: "Profile",
      icon: User,
      path: "/profile",
    },
  ];

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

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.path)}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all"
              >
                <action.icon className="w-8 h-8 text-primary mb-3 mx-auto" />
                <p className="font-semibold text-gray-800 text-sm">
                  {action.title}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Main Services */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Core Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
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
        </div>

        {/* Notifications Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-gray-800">
              Recent Notifications
            </h3>
          </div>

          {loadingNotifications ? (
            <div className="text-gray-500 text-sm">
              Loading notifications...
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    notif.isOverdue ? "bg-yellow-50" : "bg-blue-50"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      notif.isOverdue ? "bg-yellow-500" : "bg-blue-500"
                    }`}
                  ></div>
                  <div>
                    <p className="font-semibold text-gray-800">{notif.title}</p>
                    <p className="text-sm text-gray-600">{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">No new notifications</div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};
export default Dashboard;
