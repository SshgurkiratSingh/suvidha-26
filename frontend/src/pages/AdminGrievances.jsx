import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { adminAPI } from "../components/services/api";
import { Search } from "lucide-react";

const AdminGrievances = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error } = useNotification();

  const [grievances, setGrievances] = useState([]);
  const [filteredGrievances, setFilteredGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDepartment, setFilterDepartment] = useState("ALL");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
      return;
    }

    loadGrievances();
  }, [isAdmin, navigate]);

  useEffect(() => {
    let filtered = grievances;

    if (searchTerm) {
      filtered = filtered.filter(
        (griev) =>
          griev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          griev.citizen?.fullName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          griev.citizen?.mobileNumber?.includes(searchTerm) ||
          griev.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "ALL") {
      filtered = filtered.filter((griev) => griev.status === filterStatus);
    }

    if (filterDepartment !== "ALL") {
      filtered = filtered.filter(
        (griev) => griev.department === filterDepartment
      );
    }

    setFilteredGrievances(filtered);
  }, [searchTerm, filterStatus, filterDepartment, grievances]);

  const loadGrievances = async () => {
    setLoading(true);
    try {
      const griev = await adminAPI.listGrievances();
      setGrievances(griev);
      setFilteredGrievances(griev);
    } catch (err) {
      error(err.message || "Failed to load grievances");
    } finally {
      setLoading(false);
    }
  };

  const handleViewGrievance = (griev) => {
    setSelectedGrievance(griev);
    setShowModal(true);
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedGrievance) return;
    try {
      await adminAPI.updateGrievanceStatus(selectedGrievance.id, status);
      success(`Grievance status updated to ${status}`);
      setShowModal(false);
      setSelectedGrievance(null);
      await loadGrievances();
    } catch (err) {
      error(err.message || "Failed to update status");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            All Grievances
          </h1>
          <p className="text-gray-600">
            Manage citizen complaints and grievances
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID, name, mobile, or description..."
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
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_PROCESS">Under Process</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
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
        </div>

        {/* Grievances Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Loading grievances...</div>
          ) : filteredGrievances.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No grievances found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grievance ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Citizen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGrievances.map((griev) => (
                    <tr key={griev.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {griev.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {griev.citizen?.fullName || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {griev.citizen?.mobileNumber || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {griev.department}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {griev.description || "No description"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            griev.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : griev.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : griev.status === "UNDER_PROCESS"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {griev.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(griev.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewGrievance(griev)}
                          className="text-primary hover:underline"
                        >
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

        {/* Modal */}
        {showModal && selectedGrievance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-2xl font-bold">Grievance Details</h2>
                <button
                  onClick={() => setShowModal(false)}
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
                        selectedGrievance.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded">
                    {selectedGrievance.description || "No description provided"}
                  </p>
                </div>

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
                      onClick={() => handleUpdateStatus("UNDER_PROCESS")}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                    >
                      Under Process
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("APPROVED")}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("REJECTED")}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("DELIVERED")}
                      className="px-3 py-2 bg-teal-100 text-teal-700 rounded hover:bg-teal-200 text-sm"
                    >
                      Delivered
                    </button>
                    <button
                      onClick={() => handleUpdateStatus("COMPLETED")}
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

export default AdminGrievances;
