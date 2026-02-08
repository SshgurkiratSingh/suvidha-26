import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { API_BASE_URL } from "../utils/apiConfig";
import { Search, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

const AdminSchemeApplications = () => {
  const navigate = useNavigate();
  const { isAdmin, adminToken } = useAuth();
  const { success, error } = useNotification();

  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDepartment, setFilterDepartment] = useState("ALL");
  const [remarks, setRemarks] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
      return;
    }
    loadApplications();
  }, [isAdmin, navigate]);

  useEffect(() => {
    let filtered = applications;

    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.applicationNumber
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          app.citizen?.fullName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          app.citizen?.mobileNumber?.includes(searchTerm) ||
          app.scheme?.title?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterStatus !== "ALL") {
      filtered = filtered.filter((app) => app.status === filterStatus);
    }

    if (filterDepartment !== "ALL") {
      filtered = filtered.filter(
        (app) => app.scheme?.department === filterDepartment,
      );
    }

    setFilteredApplications(filtered);
  }, [searchTerm, filterStatus, filterDepartment, applications]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/scheme-applications`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to load applications");
      const data = await response.json();
      setApplications(data);
      setFilteredApplications(data);
    } catch (err) {
      error(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = async (app) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/scheme-applications/${app.id}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to load application details");
      const data = await response.json();
      setSelectedApplication(data);
      setRemarks(data.remarks || "");
      setRejectionReason(data.rejectionReason || "");
      setShowModal(true);
    } catch (err) {
      error(err.message || "Failed to load application details");
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedApplication) return;

    try {
      const payload = { status };
      if (remarks) payload.remarks = remarks;
      if (status === "REJECTED" && rejectionReason) {
        payload.rejectionReason = rejectionReason;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/scheme-applications/${selectedApplication.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error("Failed to update status");

      success(`Application status updated to ${status}`);
      setShowModal(false);
      setSelectedApplication(null);
      setRemarks("");
      setRejectionReason("");
      await loadApplications();
    } catch (err) {
      error(err.message || "Failed to update status");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: "bg-gray-100 text-gray-800",
      SUBMITTED: "bg-blue-100 text-blue-800",
      UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
      DOCUMENTS_REQUIRED: "bg-orange-100 text-orange-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      WITHDRAWN: "bg-gray-100 text-gray-600",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getEligibilityBadge = (status) => {
    const badges = {
      ELIGIBLE: "bg-green-100 text-green-800",
      PARTIALLY_ELIGIBLE: "bg-yellow-100 text-yellow-800",
      NOT_ELIGIBLE: "bg-red-100 text-red-800",
      PENDING_REVIEW: "bg-blue-100 text-blue-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Scheme Applications
            </h1>
            <p className="text-gray-600">
              Manage citizen scheme applications with eligibility data
            </p>
          </div>
          <button
            className="gov-button-secondary"
            onClick={() => navigate("/admin/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by number, name, scheme..."
                className="gov-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="gov-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="DOCUMENTS_REQUIRED">Documents Required</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
            <select
              className="gov-input"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              <option value="ELECTRICITY">Electricity</option>
              <option value="WATER">Water</option>
              <option value="GAS">Gas</option>
              <option value="SANITATION">Sanitation</option>
              <option value="MUNICIPAL">Municipal</option>
            </select>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredApplications.length} of {applications.length}{" "}
            applications
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Loading applications...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No applications found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Citizen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eligibility
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.applicationNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {app.citizen?.fullName || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {app.citizen?.mobileNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {app.scheme?.title || "Unknown Scheme"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {app.scheme?.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEligibilityBadge(
                            app.eligibilityStatus,
                          )}`}
                        >
                          {app.eligibilityStatus || "N/A"}
                        </span>
                        {app.eligibilityScore !== null && (
                          <div className="text-xs text-gray-500 mt-1">
                            Score: {app.eligibilityScore?.toFixed(1)}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                            app.status,
                          )}`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.submittedAt
                          ? new Date(app.submittedAt).toLocaleDateString()
                          : "Not submitted"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewApplication(app)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold">Application Details</h2>
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
                  <label className="text-sm font-semibold text-gray-500">
                    Application Number
                  </label>
                  <div className="text-lg font-medium">
                    {selectedApplication.applicationNumber}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-500">
                    Status
                  </label>
                  <div>
                    <span
                      className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusBadge(selectedApplication.status)}`}
                    >
                      {selectedApplication.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Citizen Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">
                  Citizen Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <div className="font-medium">
                      {selectedApplication.citizen?.fullName}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Mobile</label>
                    <div className="font-medium">
                      {selectedApplication.citizen?.mobileNumber}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <div className="font-medium">
                      {selectedApplication.citizen?.email || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scheme Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">
                  Scheme Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Scheme Name</label>
                    <div className="font-medium">
                      {selectedApplication.scheme?.title}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Department</label>
                    <div className="font-medium">
                      {selectedApplication.scheme?.department}
                    </div>
                  </div>
                </div>
              </div>

              {/* Eligibility Data */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">
                  Eligibility Assessment
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-500">
                      Eligibility Status
                    </label>
                    <div>
                      <span
                        className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getEligibilityBadge(selectedApplication.eligibilityStatus)}`}
                      >
                        {selectedApplication.eligibilityStatus}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">
                      Eligibility Score
                    </label>
                    <div className="font-medium">
                      {selectedApplication.eligibilityScore?.toFixed(1)}%
                    </div>
                  </div>
                </div>
                {selectedApplication.eligibilityAnswers &&
                  Object.keys(selectedApplication.eligibilityAnswers).length >
                    0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Survey Answers</h4>
                      <pre className="text-sm overflow-auto max-h-40">
                        {JSON.stringify(
                          selectedApplication.eligibilityAnswers,
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )}
              </div>

              {/* Form Data */}
              {selectedApplication.formData && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Application Form Data
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm overflow-auto max-h-60">
                      {JSON.stringify(selectedApplication.formData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Documents */}
              {selectedApplication.documents &&
                selectedApplication.documents.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">
                      Uploaded Documents
                    </h3>
                    <div className="space-y-2">
                      {selectedApplication.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <div>
                              <div className="font-medium">
                                {doc.documentName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(doc.fileSize / 1024).toFixed(2)} KB •{" "}
                                {doc.mimeType}
                              </div>
                            </div>
                          </div>
                          <a
                            href={`${API_BASE_URL}${doc.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Remarks */}
              <div className="border-t pt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Remarks
                </label>
                <textarea
                  className="gov-input w-full"
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add remarks..."
                />
              </div>

              {/* Rejection Reason (if rejecting) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rejection Reason (if applicable)
                </label>
                <textarea
                  className="gov-input w-full"
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Required if rejecting application..."
                />
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-4 flex flex-wrap gap-3">
                {selectedApplication.status === "SUBMITTED" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus("UNDER_REVIEW")}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Clock className="w-4 h-4" />
                      Move to Review
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("DOCUMENTS_REQUIRED")}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      <FileText className="w-4 h-4" />
                      Request Documents
                    </button>
                  </>
                )}
                {(selectedApplication.status === "UNDER_REVIEW" ||
                  selectedApplication.status === "DOCUMENTS_REQUIRED") && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus("APPROVED")}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        if (!rejectionReason) {
                          error("Please provide rejection reason");
                          return;
                        }
                        handleUpdateStatus("REJECTED");
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="ml-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminSchemeApplications;
