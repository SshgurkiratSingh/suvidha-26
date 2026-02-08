import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { adminAPI } from "../components/services/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [summary, setSummary] = useState(null);
  const [kioskUsage, setKioskUsage] = useState(null);
  const [applications, setApplications] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  // const [pendingPayments, setPendingPayments] = useState([]); // Moved to dedicated page

  // Preview States
  const [schemePreview, setSchemePreview] = useState(false);
  const [advisoryPreview, setAdvisoryPreview] = useState(false);

  // Dropdown options
  const departments = [
    "ELECTRICITY",
    "WATER",
    "GAS",
    "SANITATION",
    "MUNICIPAL",
  ];
  const serviceTypes = [
    "NEW_CONNECTION",
    "LOAD_CHANGE",
    "NAME_CHANGE",
    "CONNECTION_REMOVAL",
    "REFILL",
    "GRIEVANCE",
    "SCHEME_APPLICATION",
    "WATER_QUALITY_TEST",
    "BILL_PAYMENT",
  ];

  const [customDepartment, setCustomDepartment] = useState(false);
  const [customServiceType, setCustomServiceType] = useState(false);

  const [schemeForm, setSchemeForm] = useState({
    department: "ELECTRICITY",
    title: "",
    description: "",
    eligibility: "",
  });
  const [advisoryForm, setAdvisoryForm] = useState({
    department: "ELECTRICITY",
    message: "",
    validTill: "",
  });
  const [billForm, setBillForm] = useState({
    mobileNumber: "",
    department: "ELECTRICITY",
    consumerId: "",
    address: "",
    amount: "",
    dueDate: "",
  });
  const [serviceAccountForm, setServiceAccountForm] = useState({
    mobileNumber: "",
    department: "ELECTRICITY",
    consumerId: "",
    address: "",
  });
  const [testDataForm, setTestDataForm] = useState({
    mobileNumber: "",
    department: "ELECTRICITY",
    serviceType: "NEW_CONNECTION",
  });
  const [caseForm, setCaseForm] = useState({
    mobileNumber: "",
    department: "ELECTRICITY",
    serviceType: "NEW_CONNECTION",
    description: "",
    data: "", // JSON string
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [summaryData, kioskData, apps, griev] = await Promise.all([
          adminAPI.getSummary(),
          adminAPI.getKioskUsage(),
          adminAPI.listApplications(),
          adminAPI.listGrievances(),
        ]);
        setSummary(summaryData);
        setKioskUsage(kioskData);
        setApplications(apps.slice(0, 6));
        setGrievances(griev.slice(0, 6));
      } catch (err) {
        error(err.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin, navigate, error]);

  const handleCreateScheme = async () => {
    try {
      const result = await adminAPI.createScheme(schemeForm);
      success(`Scheme created: ${result.title}`);
      setSchemeForm({
        department: schemeForm.department,
        title: "",
        description: "",
        eligibility: "",
      });
    } catch (err) {
      error(err.message || "Failed to create scheme");
    }
  };

  const handleCreateAdvisory = async () => {
    try {
      const result = await adminAPI.createAdvisory(advisoryForm);
      success(`Advisory created for ${result.department}`);
      setAdvisoryForm({
        department: advisoryForm.department,
        message: "",
        validTill: "",
      });
    } catch (err) {
      error(err.message || "Failed to create advisory");
    }
  };

  const handleCreateBill = async () => {
    try {
      const result = await adminAPI.createBill({
        ...billForm,
        amount: Number(billForm.amount),
      });
      success(`Bill created: ${result.id}`);
      setBillForm({
        mobileNumber: billForm.mobileNumber,
        department: billForm.department,
        consumerId: "",
        address: "",
        amount: "",
        dueDate: "",
      });
    } catch (err) {
      error(err.message || "Failed to create bill");
    }
  };

  const handleCreateTestBill = async () => {
    try {
      const result = await adminAPI.createTestBill({
        mobileNumber: billForm.mobileNumber,
        department: billForm.department,
        consumerId: billForm.consumerId,
        address: billForm.address,
        amount: billForm.amount ? Number(billForm.amount) : undefined,
        dueDate: billForm.dueDate || undefined,
      });
      success(`Test bill created: ${result.id}`);
    } catch (err) {
      error(err.message || "Failed to create test bill");
    }
  };

  const handleCreateServiceAccount = async () => {
    try {
      const result = await adminAPI.createServiceAccount(serviceAccountForm);
      success(`Service account created: ${result.id}`);
      setServiceAccountForm({
        mobileNumber: serviceAccountForm.mobileNumber,
        department: serviceAccountForm.department,
        consumerId: "",
        address: "",
      });
    } catch (err) {
      error(err.message || "Failed to create service account");
    }
  };

  const handleCreateTestData = async () => {
    try {
      const result = await adminAPI.createTestData(testDataForm);
      success(`Test data created for ${result.citizenId}`);
    } catch (err) {
      error(err.message || "Failed to create test data");
    }
  };

  const handleCreateApplication = async () => {
    try {
      let parsedData = undefined;
      if (caseForm.data && caseForm.data.trim()) {
        try {
          parsedData = JSON.parse(caseForm.data);
        } catch (e) {
          error("Invalid JSON data format");
          return;
        }
      }

      const result = await adminAPI.createApplication({
        mobileNumber: caseForm.mobileNumber,
        department: caseForm.department,
        serviceType: caseForm.serviceType,
        data: parsedData,
      });
      success(`Application created: ${result.id}`);
    } catch (err) {
      error(err.message || "Failed to create application");
    }
  };

  const handleCreateGrievance = async () => {
    try {
      let parsedData = undefined;
      if (caseForm.data && caseForm.data.trim()) {
        try {
          parsedData = JSON.parse(caseForm.data);
        } catch (e) {
          error("Invalid JSON data format");
          return;
        }
      }

      const result = await adminAPI.createGrievance({
        mobileNumber: caseForm.mobileNumber,
        department: caseForm.department,
        description: caseForm.description,
        data: parsedData,
      });
      success(`Grievance created: ${result.id}`);
    } catch (err) {
      error(err.message || "Failed to create grievance");
    }
  };

  const handleViewApplication = async (app) => {
    setSelectedApplication(app);
    setShowApplicationModal(true);
  };

  const handleViewGrievance = async (griev) => {
    setSelectedGrievance(griev);
    setShowGrievanceModal(true);
  };

  const handleUpdateApplicationStatus = async (status) => {
    if (!selectedApplication) return;
    try {
      await adminAPI.updateApplicationStatus(selectedApplication.id, status);
      success(`Application status updated to ${status}`);
      setShowApplicationModal(false);
      setSelectedApplication(null);
      // Reload applications
      const apps = await adminAPI.listApplications();
      setApplications(apps.slice(0, 6));
    } catch (err) {
      error(err.message || "Failed to update application status");
    }
  };

  const handleUpdateGrievanceStatus = async (status) => {
    if (!selectedGrievance) return;
    try {
      await adminAPI.updateGrievanceStatus(selectedGrievance.id, status);
      success(`Grievance status updated to ${status}`);
      setShowGrievanceModal(false);
      setSelectedGrievance(null);
      // Reload grievances
      const griev = await adminAPI.listGrievances();
      setGrievances(griev.slice(0, 6));
    } catch (err) {
      error(err.message || "Failed to update grievance status");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 text-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Signed in as{" "}
                <span className="font-semibold">
                  {user?.fullName || user?.email}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <button
              className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("/admin/schemes")}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <div className="text-2xl mb-1">📋</div>
                <div className="font-semibold text-sm">Schemes</div>
              </div>
            </button>

            <button
              className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("/admin/scheme-applications")}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <div className="text-2xl mb-1">📝</div>
                <div className="font-semibold text-sm">Applications</div>
              </div>
            </button>

            <button
              className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("/admin/advisories")}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <div className="text-2xl mb-1">📢</div>
                <div className="font-semibold text-sm">Advisories</div>
              </div>
            </button>

            <button
              className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("/admin/policies")}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <div className="text-2xl mb-1">📜</div>
                <div className="font-semibold text-sm">Policies</div>
              </div>
            </button>

            <button
              className="group relative overflow-hidden bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-4 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("/admin/tariffs")}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <div className="text-2xl mb-1">💰</div>
                <div className="font-semibold text-sm">Tariffs</div>
              </div>
            </button>

            <button
              className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("/admin/payments")}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <div className="text-2xl mb-1">✅</div>
                <div className="font-semibold text-sm">Payments</div>
              </div>
            </button>

            <button
              className="group relative overflow-hidden bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-4 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("/admin/bills")}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative text-center">
                <div className="text-2xl mb-1">🧾</div>
                <div className="font-semibold text-sm">Bills</div>
              </div>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading dashboard...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">👥</div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                    TODAY
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">
                  {summary?.citizens ?? 0}
                </div>
                <div className="text-blue-100 text-sm font-medium">
                  New Citizens
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">💳</div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                    TODAY
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">
                  {summary?.payments ?? 0}
                </div>
                <div className="text-emerald-100 text-sm font-medium">
                  Payments
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">📋</div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                    TODAY
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">
                  {summary?.applications ?? 0}
                </div>
                <div className="text-purple-100 text-sm font-medium">
                  Applications
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">📢</div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                    TODAY
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">
                  {summary?.grievances ?? 0}
                </div>
                <div className="text-orange-100 text-sm font-medium">
                  Grievances
                </div>
              </div>
            </section>

            {/* Kiosk Usage */}
            <section className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-2xl">
                  🖥️
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Kiosk Usage
                  </h2>
                  <p className="text-sm text-gray-500">
                    Real-time activity monitoring
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-800 bg-clip-text text-transparent">
                  {kioskUsage?.sessions ?? 0}
                </div>
                <div className="text-gray-600 font-medium">
                  active sessions today
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Applications */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-xl">
                      📝
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        Recent Applications
                      </h2>
                      <p className="text-xs text-gray-500">
                        Latest 6 submissions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/admin/applications")}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {applications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">📭</div>
                      <p>No applications yet</p>
                    </div>
                  ) : (
                    applications.map((app) => (
                      <div
                        key={app.id}
                        className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200 group"
                        onClick={() => handleViewApplication(app)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                              {app.department} • {app.serviceType}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              👤 {app.citizen?.fullName || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">
                              📱 {app.citizen?.mobileNumber || "N/A"}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                              app.status === "APPROVED"
                                ? "bg-green-100 text-green-700"
                                : app.status === "REJECTED"
                                  ? "bg-red-100 text-red-700"
                                  : app.status === "UNDER_PROCESS"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Grievances */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-xl">
                      📢
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        Recent Grievances
                      </h2>
                      <p className="text-xs text-gray-500">
                        Latest 6 complaints
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/admin/grievances")}
                    className="text-orange-600 hover:text-orange-700 text-sm font-semibold hover:underline"
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {grievances.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-4xl mb-2">✅</div>
                      <p>No grievances yet</p>
                    </div>
                  ) : (
                    grievances.map((grievance) => (
                      <div
                        key={grievance.id}
                        className="border border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md cursor-pointer transition-all duration-200 group"
                        onClick={() => handleViewGrievance(grievance)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                              {grievance.department}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              👤 {grievance.citizen?.fullName || "N/A"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {grievance.description || "No description"}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                              grievance.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : grievance.status === "REJECTED"
                                  ? "bg-red-100 text-red-700"
                                  : grievance.status === "UNDER_PROCESS"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {grievance.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Create Forms Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-xl">
                    ➕
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Create Scheme
                  </h2>
                </div>
                <input
                  className="gov-input w-full mb-4"
                  placeholder="Title"
                  value={schemeForm.title}
                  onChange={(e) =>
                    setSchemeForm({ ...schemeForm, title: e.target.value })
                  }
                />
                <div>
                  <select
                    className="gov-input"
                    value={schemeForm.department}
                    onChange={(e) => {
                      if (e.target.value === "CUSTOM") {
                        setCustomDepartment(true);
                        setSchemeForm({ ...schemeForm, department: "" });
                      } else {
                        setCustomDepartment(false);
                        setSchemeForm({
                          ...schemeForm,
                          department: e.target.value,
                        });
                      }
                    }}
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                    <option value="CUSTOM">Custom (Enter Manually)</option>
                  </select>
                  {customDepartment && (
                    <input
                      className="gov-input mt-2"
                      placeholder="Enter custom department"
                      value={schemeForm.department}
                      onChange={(e) =>
                        setSchemeForm({
                          ...schemeForm,
                          department: e.target.value,
                        })
                      }
                    />
                  )}
                </div>

                {/* Scheme Description Preview Toggle */}
                <div className="flex justify-end mb-1 space-x-2">
                  <button
                    type="button"
                    onClick={() => setSchemePreview(false)}
                    className={`text-xs px-2 py-1 rounded ${!schemePreview ? "bg-gray-200 font-bold" : "text-gray-500"}`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchemePreview(true)}
                    className={`text-xs px-2 py-1 rounded ${schemePreview ? "bg-gray-200 font-bold" : "text-gray-500"}`}
                  >
                    Preview
                  </button>
                </div>

                {schemePreview ? (
                  <div className="gov-input min-h-[50px] bg-gray-50 text-sm prose prose-sm max-w-none p-2">
                    <ReactMarkdown>
                      {schemeForm.description || "*No content*"}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    className="gov-input"
                    placeholder="Description (Markdown supported)"
                    value={schemeForm.description}
                    onChange={(e) =>
                      setSchemeForm({
                        ...schemeForm,
                        description: e.target.value,
                      })
                    }
                  />
                )}

                <textarea
                  className="gov-input"
                  placeholder="Eligibility"
                  value={schemeForm.eligibility}
                  onChange={(e) =>
                    setSchemeForm({
                      ...schemeForm,
                      eligibility: e.target.value,
                    })
                  }
                />
                <button
                  className="gov-button-primary w-full"
                  onClick={handleCreateScheme}
                >
                  Create Scheme
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow space-y-4">
                <h2 className="text-xl font-semibold">Create Advisory</h2>
                <select
                  className="gov-input"
                  value={advisoryForm.department}
                  onChange={(e) =>
                    setAdvisoryForm({
                      ...advisoryForm,
                      department: e.target.value,
                    })
                  }
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                {/* Advisory Message Preview Toggle */}
                <div className="flex justify-end mb-1 space-x-2">
                  <button
                    type="button"
                    onClick={() => setAdvisoryPreview(false)}
                    className={`text-xs px-2 py-1 rounded ${!advisoryPreview ? "bg-gray-200 font-bold" : "text-gray-500"}`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvisoryPreview(true)}
                    className={`text-xs px-2 py-1 rounded ${advisoryPreview ? "bg-gray-200 font-bold" : "text-gray-500"}`}
                  >
                    Preview
                  </button>
                </div>

                {advisoryPreview ? (
                  <div className="gov-input min-h-[80px] bg-gray-50 text-sm prose prose-sm max-w-none p-2">
                    <ReactMarkdown>
                      {advisoryForm.message || "*No content*"}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    className="gov-input"
                    placeholder="Message (Markdown supported)"
                    rows={3}
                    value={advisoryForm.message}
                    onChange={(e) =>
                      setAdvisoryForm({
                        ...advisoryForm,
                        message: e.target.value,
                      })
                    }
                  />
                )}

                <input
                  type="date"
                  className="gov-input"
                  value={advisoryForm.validTill}
                  onChange={(e) =>
                    setAdvisoryForm({
                      ...advisoryForm,
                      validTill: e.target.value,
                    })
                  }
                />
                <button
                  className="gov-button-primary w-full"
                  onClick={handleCreateAdvisory}
                >
                  Create Advisory
                </button>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow space-y-4">
                <h2 className="text-xl font-semibold">
                  Create Bill for Citizen
                </h2>
                <input
                  className="gov-input"
                  placeholder="Mobile Number"
                  value={billForm.mobileNumber}
                  onChange={(e) =>
                    setBillForm({ ...billForm, mobileNumber: e.target.value })
                  }
                />
                <select
                  className="gov-input"
                  value={billForm.department}
                  onChange={(e) =>
                    setBillForm({ ...billForm, department: e.target.value })
                  }
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <input
                  className="gov-input"
                  placeholder="Consumer ID"
                  value={billForm.consumerId}
                  onChange={(e) =>
                    setBillForm({ ...billForm, consumerId: e.target.value })
                  }
                />
                <input
                  className="gov-input"
                  placeholder="Address"
                  value={billForm.address}
                  onChange={(e) =>
                    setBillForm({ ...billForm, address: e.target.value })
                  }
                />
                <input
                  type="number"
                  className="gov-input"
                  placeholder="Amount"
                  value={billForm.amount}
                  onChange={(e) =>
                    setBillForm({ ...billForm, amount: e.target.value })
                  }
                />
                <input
                  type="date"
                  className="gov-input"
                  value={billForm.dueDate}
                  onChange={(e) =>
                    setBillForm({ ...billForm, dueDate: e.target.value })
                  }
                />
                <button
                  className="gov-button-primary w-full"
                  onClick={handleCreateBill}
                >
                  Create Bill
                </button>
                <button
                  className="gov-button-secondary w-full"
                  onClick={handleCreateTestBill}
                >
                  Create Test Bill
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow space-y-4">
                <h2 className="text-xl font-semibold">Add Service Account</h2>
                <input
                  className="gov-input"
                  placeholder="Mobile Number"
                  value={serviceAccountForm.mobileNumber}
                  onChange={(e) =>
                    setServiceAccountForm({
                      ...serviceAccountForm,
                      mobileNumber: e.target.value,
                    })
                  }
                />
                <select
                  className="gov-input"
                  value={serviceAccountForm.department}
                  onChange={(e) =>
                    setServiceAccountForm({
                      ...serviceAccountForm,
                      department: e.target.value,
                    })
                  }
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <input
                  className="gov-input"
                  placeholder="Consumer ID"
                  value={serviceAccountForm.consumerId}
                  onChange={(e) =>
                    setServiceAccountForm({
                      ...serviceAccountForm,
                      consumerId: e.target.value,
                    })
                  }
                />
                <input
                  className="gov-input"
                  placeholder="Address"
                  value={serviceAccountForm.address}
                  onChange={(e) =>
                    setServiceAccountForm({
                      ...serviceAccountForm,
                      address: e.target.value,
                    })
                  }
                />
                <button
                  className="gov-button-primary w-full"
                  onClick={handleCreateServiceAccount}
                >
                  Create Service Account
                </button>
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">Create Test Data</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  className="gov-input"
                  placeholder="Mobile Number"
                  value={testDataForm.mobileNumber}
                  onChange={(e) =>
                    setTestDataForm({
                      ...testDataForm,
                      mobileNumber: e.target.value,
                    })
                  }
                />
                <select
                  className="gov-input"
                  value={testDataForm.department}
                  onChange={(e) =>
                    setTestDataForm({
                      ...testDataForm,
                      department: e.target.value,
                    })
                  }
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <select
                  className="gov-input"
                  value={testDataForm.serviceType}
                  onChange={(e) =>
                    setTestDataForm({
                      ...testDataForm,
                      serviceType: e.target.value,
                    })
                  }
                >
                  {serviceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="gov-button-primary"
                onClick={handleCreateTestData}
              >
                Generate Test Application & Grievance
              </button>
            </section>

            <section className="bg-white p-6 rounded-xl shadow space-y-4">
              <h2 className="text-xl font-semibold">
                Create Service Request / Complaint
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="gov-input"
                  placeholder="Mobile Number"
                  value={caseForm.mobileNumber}
                  onChange={(e) =>
                    setCaseForm({ ...caseForm, mobileNumber: e.target.value })
                  }
                />
                <div>
                  <select
                    className="gov-input"
                    value={caseForm.department}
                    onChange={(e) => {
                      if (e.target.value === "CUSTOM") {
                        setCustomServiceType(false); // Reset service type custom
                        setCaseForm({
                          ...caseForm,
                          department: "",
                          serviceType: "",
                        });
                      } else {
                        setCaseForm({
                          ...caseForm,
                          department: e.target.value,
                        });
                      }
                    }}
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                    <option value="CUSTOM">Custom (Enter Manually)</option>
                  </select>
                  {caseForm.department === "" && (
                    <input
                      className="gov-input mt-2"
                      placeholder="Enter custom department"
                      value={caseForm.department}
                      onChange={(e) =>
                        setCaseForm({ ...caseForm, department: e.target.value })
                      }
                    />
                  )}
                </div>
                <div>
                  <select
                    className="gov-input"
                    value={customServiceType ? "CUSTOM" : caseForm.serviceType}
                    onChange={(e) => {
                      if (e.target.value === "CUSTOM") {
                        setCustomServiceType(true);
                        setCaseForm({ ...caseForm, serviceType: "" });
                      } else {
                        setCustomServiceType(false);
                        setCaseForm({
                          ...caseForm,
                          serviceType: e.target.value,
                        });
                      }
                    }}
                  >
                    {serviceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                    <option value="CUSTOM">Custom (Enter Manually)</option>
                  </select>
                  {customServiceType && (
                    <input
                      className="gov-input mt-2"
                      placeholder="Enter custom service type"
                      value={caseForm.serviceType}
                      onChange={(e) =>
                        setCaseForm({
                          ...caseForm,
                          serviceType: e.target.value,
                        })
                      }
                    />
                  )}
                </div>
                <input
                  className="gov-input"
                  placeholder="Grievance Description"
                  value={caseForm.description}
                  onChange={(e) =>
                    setCaseForm({ ...caseForm, description: e.target.value })
                  }
                />
                {/* JSON Data Input */}
                <div className="md:col-span-2">
                  <textarea
                    className="gov-input font-mono text-sm"
                    placeholder="Additional JSON Data (Optional) - e.g. { 'ward': '12', 'priority': 'high' }"
                    rows={2}
                    value={caseForm.data}
                    onChange={(e) =>
                      setCaseForm({ ...caseForm, data: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <button
                  className="gov-button-primary"
                  onClick={handleCreateApplication}
                >
                  Create Application
                </button>
                <button
                  className="gov-button-secondary"
                  onClick={handleCreateGrievance}
                >
                  Create Grievance
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Application Modal */}
        {showApplicationModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-2xl font-bold">Application Details</h2>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Application ID</p>
                    <p className="font-semibold">{selectedApplication.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold">
                      {selectedApplication.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-semibold">
                      {selectedApplication.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Service Type</p>
                    <p className="font-semibold">
                      {selectedApplication.serviceType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Citizen Name</p>
                    <p className="font-semibold">
                      {selectedApplication.citizen?.fullName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mobile Number</p>
                    <p className="font-semibold">
                      {selectedApplication.citizen?.mobileNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">
                      {selectedApplication.citizen?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted At</p>
                    <p className="font-semibold">
                      {new Date(
                        selectedApplication.submittedAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Dynamic Data Display */}
                {selectedApplication.data && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-bold text-gray-700 mb-2">
                      Additional Details
                    </p>
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono overflow-auto max-h-40">
                      {typeof selectedApplication.data === "string"
                        ? selectedApplication.data
                        : JSON.stringify(selectedApplication.data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedApplication.documents &&
                  selectedApplication.documents.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Documents</p>
                      <ul className="space-y-1">
                        {selectedApplication.documents.map((doc) => (
                          <li key={doc.id}>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm"
                            >
                              View Document {doc.id.slice(0, 8)}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">Update Status</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        handleUpdateApplicationStatus("UNDER_PROCESS")
                      }
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                    >
                      Under Process
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateApplicationStatus("DEMAND_NOTE_ISSUED")
                      }
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
                    >
                      Demand Note
                    </button>
                    <button
                      onClick={() => handleUpdateApplicationStatus("APPROVED")}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateApplicationStatus("REJECTED")}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateApplicationStatus("DELIVERED")}
                      className="px-3 py-2 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 text-sm"
                    >
                      Delivered
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grievance Modal */}
        {showGrievanceModal && selectedGrievance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-2xl font-bold">Grievance Details</h2>
                <button
                  onClick={() => setShowGrievanceModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Grievance ID</p>
                    <p className="font-semibold">{selectedGrievance.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold">{selectedGrievance.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-semibold">
                      {selectedGrievance.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Citizen Name</p>
                    <p className="font-semibold">
                      {selectedGrievance.citizen?.fullName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Mobile Number</p>
                    <p className="font-semibold">
                      {selectedGrievance.citizen?.mobileNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created At</p>
                    <p className="font-semibold">
                      {new Date(
                        selectedGrievance.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <div className="text-gray-800 bg-gray-50 p-3 rounded prose prose-sm max-w-none">
                    <ReactMarkdown>
                      {selectedGrievance.description ||
                        "No description provided"}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Dynamic Data Display */}
                {selectedGrievance.data && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-bold text-gray-700 mb-2">
                      Additional Details
                    </p>
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono overflow-auto max-h-40">
                      {typeof selectedGrievance.data === "string"
                        ? selectedGrievance.data
                        : JSON.stringify(selectedGrievance.data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedGrievance.documents &&
                  selectedGrievance.documents.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Documents</p>
                      <ul className="space-y-1">
                        {selectedGrievance.documents.map((doc) => (
                          <li key={doc.id}>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm"
                            >
                              View Document {doc.id.slice(0, 8)}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-3">Update Status</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <button
                      onClick={() =>
                        handleUpdateGrievanceStatus("UNDER_PROCESS")
                      }
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                    >
                      Under Process
                    </button>
                    <button
                      onClick={() => handleUpdateGrievanceStatus("APPROVED")}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateGrievanceStatus("REJECTED")}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateGrievanceStatus("DELIVERED")}
                      className="px-3 py-2 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 text-sm"
                    >
                      Delivered
                    </button>
                    <button
                      onClick={() => handleUpdateGrievanceStatus("COMPLETED")}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                    >
                      Completed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
