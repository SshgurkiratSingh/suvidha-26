import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { applicationsAPI } from "../components/services/api";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from "lucide-react";

const MyApplications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: showError } = useNotification();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadApplications();
  }, [user, navigate]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const apps = await applicationsAPI.list();
      setApplications(apps);
    } catch (err) {
      showError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      SUBMITTED: "bg-blue-100 text-blue-700",
      UNDER_PROCESS: "bg-yellow-100 text-yellow-700",
      DEMAND_NOTE_ISSUED: "bg-purple-100 text-purple-700",
      PAYMENT_PENDING: "bg-orange-100 text-orange-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      DELIVERED: "bg-teal-100 text-teal-700",
      COMPLETED: "bg-green-100 text-green-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "SUBMITTED":
        return <Clock className="w-5 h-5" />;
      case "APPROVED":
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5" />;
      case "UNDER_PROCESS":
      case "DEMAND_NOTE_ISSUED":
      case "PAYMENT_PENDING":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const formatStatus = (status) => {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">
              My Applications
            </h1>
            <p className="text-gray-600">
              Track and manage your service applications
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="animate-pulse">Loading applications...</div>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Applications Found
              </h3>
              <p className="text-gray-500 mb-6">
                You haven't submitted any applications yet.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="gov-button-primary"
              >
                Browse Services
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {applications.map((app, index) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          {getStatusIcon(app.status)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 capitalize">
                            {app.department?.toLowerCase()} -{" "}
                            {app.serviceType?.replace(/_/g, " ").toLowerCase()}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Application ID:{" "}
                            <span className="font-mono">
                              {app.id.slice(0, 12)}...
                            </span>
                          </p>
                          <p className="text-sm text-gray-500">
                            Submitted:{" "}
                            {new Date(app.submittedAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {formatStatus(app.status)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleViewDetails(app)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            [
                              "SUBMITTED",
                              "UNDER_PROCESS",
                              "DEMAND_NOTE_ISSUED",
                              "PAYMENT_PENDING",
                              "APPROVED",
                              "DELIVERED",
                              "COMPLETED",
                            ].includes(app.status)
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span className="text-gray-600">Submitted</span>
                      </div>
                      <div className="flex-1 h-1 bg-gray-200 mx-2">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{
                            width: [
                              "UNDER_PROCESS",
                              "DEMAND_NOTE_ISSUED",
                              "PAYMENT_PENDING",
                              "APPROVED",
                              "DELIVERED",
                              "COMPLETED",
                            ].includes(app.status)
                              ? "50%"
                              : "0%",
                          }}
                        ></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            [
                              "UNDER_PROCESS",
                              "DEMAND_NOTE_ISSUED",
                              "PAYMENT_PENDING",
                              "APPROVED",
                              "DELIVERED",
                              "COMPLETED",
                            ].includes(app.status)
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span className="text-gray-600">Processing</span>
                      </div>
                      <div className="flex-1 h-1 bg-gray-200 mx-2">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{
                            width: [
                              "APPROVED",
                              "DELIVERED",
                              "COMPLETED",
                            ].includes(app.status)
                              ? "100%"
                              : "0%",
                          }}
                        ></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            ["APPROVED", "DELIVERED", "COMPLETED"].includes(
                              app.status
                            )
                              ? "bg-green-500"
                              : app.status === "REJECTED"
                              ? "bg-red-500"
                              : "bg-gray-300"
                          }`}
                        ></div>
                        <span className="text-gray-600">
                          {app.status === "REJECTED" ? "Rejected" : "Completed"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Details Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-800">
                Application Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Application Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Application ID</p>
                  <p className="font-semibold font-mono text-sm break-all">
                    {selectedApp.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      selectedApp.status
                    )}`}
                  >
                    {formatStatus(selectedApp.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-semibold">{selectedApp.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Service Type</p>
                  <p className="font-semibold">
                    {formatStatus(selectedApp.serviceType)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted Date</p>
                  <p className="font-semibold">
                    {new Date(selectedApp.submittedAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-semibold">
                    {new Date(selectedApp.updatedAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>

              {/* Documents */}
              {selectedApp.documents && selectedApp.documents.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2 font-semibold">
                    Uploaded Documents
                  </p>
                  <ul className="space-y-2">
                    {selectedApp.documents.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          Document {doc.id.slice(0, 8)}...
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Status Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  {selectedApp.status === "SUBMITTED" &&
                    "Your application has been received and is awaiting review."}
                  {selectedApp.status === "UNDER_PROCESS" &&
                    "Your application is currently being processed by our team."}
                  {selectedApp.status === "DEMAND_NOTE_ISSUED" &&
                    "A demand note has been issued. Please check your notifications."}
                  {selectedApp.status === "PAYMENT_PENDING" &&
                    "Payment is pending. Please complete the payment to proceed."}
                  {selectedApp.status === "APPROVED" &&
                    "Congratulations! Your application has been approved."}
                  {selectedApp.status === "REJECTED" &&
                    "Unfortunately, your application has been rejected. Please contact support for details."}
                  {selectedApp.status === "DELIVERED" &&
                    "Your request has been delivered/completed."}
                  {selectedApp.status === "COMPLETED" &&
                    "Your application process is now complete."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedApp.status === "PAYMENT_PENDING" && (
                  <button
                    onClick={() => {
                      setShowModal(false);
                      navigate("/all-bills");
                    }}
                    className="gov-button-primary flex-1"
                  >
                    Make Payment
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="gov-button-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyApplications;
