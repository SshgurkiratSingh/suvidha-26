import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useNotification } from "../context/NotificationContext";
import { publicAPI } from "../components/services/api";
import { FileText, Filter } from "lucide-react";

const Tariffs = () => {
  const { error } = useNotification();
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");

  const departments = [
    "ALL",
    "ELECTRICITY",
    "WATER",
    "GAS",
    "SANITATION",
    "MUNICIPAL",
  ];

  useEffect(() => {
    fetchTariffs();
  }, [selectedDepartment]);

  const fetchTariffs = async () => {
    try {
      setLoading(true);
      const data = await publicAPI.getTariffs(
        selectedDepartment === "ALL" ? null : selectedDepartment,
      );
      setTariffs(Array.isArray(data) ? data : []);
    } catch (err) {
      error(err.message || "Failed to fetch tariffs");
      setTariffs([]);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentColor = (dept) => {
    const colors = {
      ELECTRICITY: "bg-yellow-100 text-yellow-800",
      WATER: "bg-blue-100 text-blue-800",
      GAS: "bg-orange-100 text-orange-800",
      SANITATION: "bg-green-100 text-green-800",
      MUNICIPAL: "bg-purple-100 text-purple-800",
    };
    return colors[dept] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white p-8 rounded-2xl shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Service Tariffs
              </h1>
              <p className="text-xl text-gray-600">
                View current tariff rates for all departments
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-full">
              <FileText className="w-16 h-16 text-blue-600" />
            </div>
          </div>
        </motion.div>

        {/* Department Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex items-center gap-2">
              <Filter className="w-8 h-8 text-gray-600" />
              <span className="text-xl font-bold text-gray-700 whitespace-nowrap">
                Filter by Department:
              </span>
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-6 py-4 rounded-xl text-lg font-bold transition-all active:scale-95 ${
                    selectedDepartment === dept
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tariffs List */}
        {loading ? (
          <LoadingSpinner />
        ) : tariffs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-md p-10 text-center"
          >
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <p className="text-gray-600 text-2xl font-medium">
              No tariffs found for the selected department.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tariffs.map((tariff, index) => (
              <motion.div
                key={tariff.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full"
              >
                <div className="p-8 flex-grow">
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {tariff.name}
                      </h3>
                      <span
                        className={`inline-block px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide ${getDepartmentColor(tariff.department)}`}
                      >
                        {tariff.department}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-extrabold text-blue-600">
                        ₹{tariff.rate}
                      </div>
                      <div className="text-lg text-gray-500 font-medium">
                        per {tariff.unit || "unit"}
                      </div>
                    </div>
                  </div>

                  {tariff.description && (
                    <p className="text-gray-600 text-lg mb-4">
                      {tariff.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 mt-auto">
                    {tariff.category && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                        <span className="text-sm font-semibold text-gray-500">
                          Category:
                        </span>
                        <span className="text-base font-bold text-gray-700">
                          {tariff.category}
                        </span>
                      </div>
                    )}
                    {tariff.effectiveFrom && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                        <span className="text-sm font-semibold text-gray-500">
                          Effective:
                        </span>
                        <span className="text-base font-bold text-gray-700">
                          {new Date(tariff.effectiveFrom).toLocaleDateString()}
                        </span>
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

export default Tariffs;
